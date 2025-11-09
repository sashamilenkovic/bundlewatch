/**
 * Backfill command - analyze historical commits
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { saveMetrics, getCurrentCommit, getCurrentBranch } from '@milencode/bundlewatch-core';
import { analyzeBuildOutput } from '../utils/analyzer.js';

const execAsync = promisify(exec);

interface BackfillOptions {
  from?: string;
  to?: string;
  last?: number;
  releasesOnly?: boolean;
  buildCommand?: string;
  skipInstall?: boolean;
  sample?: number;
}

interface CommitInfo {
  hash: string;
  date: string;
  message: string;
  tag?: string;
}

/**
 * Get list of commits based on sampling strategy
 */
async function getCommits(options: BackfillOptions, cwd: string): Promise<CommitInfo[]> {
  const commits: CommitInfo[] = [];

  try {
    if (options.releasesOnly) {
      // Get all tagged releases
      const { stdout } = await execAsync(
        'git tag --sort=-version:refname --format="%(refname:short)|%(creatordate:iso)|%(subject)"',
        { cwd }
      );

      for (const line of stdout.trim().split('\n').filter(Boolean)) {
        const [tag, date, message] = line.split('|');
        const { stdout: hash } = await execAsync(`git rev-list -n 1 ${tag}`, { cwd });
        commits.push({
          hash: hash.trim(),
          date,
          message: message || tag,
          tag,
        });
      }
    } else {
      // Get commit range
      let allCommits;

      if (options.last) {
        // For --last N, just get the last N commits without needing a range
        const { stdout } = await execAsync(
          `git log -${options.last} --format="%H|%cI|%s"`,
          { cwd }
        );
        allCommits = stdout.trim().split('\n').filter(Boolean).map(line => {
          const [hash, date, message] = line.split('|');
          return { hash, date, message };
        }).reverse(); // Reverse to process oldest first
        commits.push(...allCommits);
      } else {
        const from = options.from || 'HEAD~100';
        const to = options.to || 'HEAD';
        const range = `${from}..${to}`;

        const { stdout } = await execAsync(
          `git log ${range} --format="%H|%cI|%s" --reverse`,
          { cwd }
        );

        allCommits = stdout.trim().split('\n').filter(Boolean).map(line => {
          const [hash, date, message] = line.split('|');
          return { hash, date, message };
        });

        if (options.sample && options.sample > 0) {
          const step = Math.ceil(allCommits.length / options.sample);
          for (let i = 0; i < allCommits.length; i += step) {
            commits.push(allCommits[i]);
          }
          // Always include the last commit
          if (!commits.includes(allCommits[allCommits.length - 1])) {
            commits.push(allCommits[allCommits.length - 1]);
          }
        } else {
          commits.push(...allCommits);
        }
      }
    }

    return commits;
  } catch (error) {
    throw new Error(`Failed to get commits: ${error}`);
  }
}

/**
 * Analyze a single commit using git worktree
 */
async function analyzeCommit(
  commit: CommitInfo,
  buildCommand: string,
  skipInstall: boolean,
  cwd: string
): Promise<boolean> {
  const worktreePath = await mkdtemp(join(tmpdir(), 'bundlewatch-'));

  try {
    // Create worktree for this commit
    await execAsync(`git worktree add ${worktreePath} ${commit.hash}`, { cwd });

    // Get branch name for this commit
    let branchName = 'unknown';
    try {
      const { stdout } = await execAsync(
        `git branch --contains ${commit.hash} --format='%(refname:short)' | head -1`,
        { cwd }
      );
      branchName = stdout.trim() || 'main';
    } catch {
      branchName = 'main';
    }

    // Install dependencies if needed
    if (!skipInstall) {
      try {
        await execAsync('pnpm install --frozen-lockfile', {
          cwd: worktreePath,
          timeout: 300000 // 5 minute timeout
        });
      } catch (error) {
        // Try without frozen lockfile
        try {
          await execAsync('pnpm install', {
            cwd: worktreePath,
            timeout: 300000
          });
        } catch {
          // If pnpm fails, try npm
          await execAsync('npm install', {
            cwd: worktreePath,
            timeout: 300000
          });
        }
      }
    }

    // Run build command
    const buildStart = Date.now();
    await execAsync(buildCommand, {
      cwd: worktreePath,
      timeout: 600000, // 10 minute timeout
      env: {
        ...process.env,
        CI: 'false', // Prevent CI-specific behaviors
        NODE_ENV: 'production',
      }
    });
    const buildDuration = Date.now() - buildStart;

    // Analyze the build output directly (works with any build tool)
    const metrics = await analyzeBuildOutput(
      worktreePath,
      commit.hash,
      branchName,
      commit.date,
      buildDuration
    );

    // Save metrics to git storage
    await saveMetrics(metrics, {
      workingDir: cwd,
      branch: 'bundlewatch-data',
    });

    return true;
  } catch (error) {
    console.error(chalk.yellow(`  ⚠️  Failed: ${error instanceof Error ? error.message : error}`));
    return false;
  } finally {
    // Clean up worktree
    try {
      await execAsync(`git worktree remove ${worktreePath} --force`, { cwd });
    } catch (error) {
      // If that fails, try removing the directory
      await rm(worktreePath, { recursive: true, force: true });
    }
  }
}

/**
 * Backfill command implementation
 */
async function backfill(options: BackfillOptions) {
  const cwd = process.cwd();
  const spinner = ora();

  try {
    // Validate we're in a git repo
    await execAsync('git rev-parse --git-dir', { cwd });

    console.log(chalk.bold('\n📊 BundleWatch Backfill\n'));

    // Get current branch to return to it later
    const currentBranch = await getCurrentBranch(cwd);
    const currentCommit = await getCurrentCommit(cwd);

    // Get commits to analyze
    spinner.start('Finding commits to analyze...');
    const commits = await getCommits(options, cwd);
    spinner.succeed(`Found ${chalk.bold(commits.length)} commits to analyze`);

    if (commits.length === 0) {
      console.log(chalk.yellow('\n⚠️  No commits found. Adjust your range or filters.\n'));
      return;
    }

    // Show what we're about to do
    console.log(chalk.dim('\nStrategy:'));
    if (options.releasesOnly) {
      console.log(chalk.dim(`  - Analyzing all tagged releases`));
    } else if (options.last) {
      console.log(chalk.dim(`  - Analyzing last ${options.last} commits`));
    } else if (options.sample) {
      console.log(chalk.dim(`  - Sampling ~${options.sample} commits`));
    } else {
      console.log(chalk.dim(`  - Analyzing range: ${options.from || 'HEAD~100'}..${options.to || 'HEAD'}`));
    }
    console.log(chalk.dim(`  - Build command: ${options.buildCommand || 'pnpm build'}`));
    console.log(chalk.dim(`  - Skip install: ${options.skipInstall ? 'yes' : 'no'}\n`));

    // Process each commit
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const progress = `[${i + 1}/${commits.length}]`;
      const label = commit.tag || commit.hash.substring(0, 7);

      spinner.start(`${progress} Analyzing ${chalk.bold(label)}...`);

      const success = await analyzeCommit(
        commit,
        options.buildCommand || 'pnpm build',
        options.skipInstall || false,
        cwd
      );

      if (success) {
        successCount++;
        spinner.succeed(`${progress} ${chalk.green('✓')} ${label} - ${commit.message.substring(0, 60)}`);
      } else {
        failureCount++;
        spinner.fail(`${progress} ${chalk.red('✗')} ${label} - Build failed`);
      }
    }

    // Return to original branch/commit
    try {
      if (currentBranch && currentBranch !== 'HEAD') {
        await execAsync(`git checkout ${currentBranch}`, { cwd });
      } else {
        await execAsync(`git checkout ${currentCommit}`, { cwd });
      }
    } catch (error) {
      console.warn(chalk.yellow(`\n⚠️  Could not return to original branch. You may need to checkout manually.\n`));
    }

    // Summary
    console.log(chalk.bold('\n📈 Backfill Complete\n'));
    console.log(`  ${chalk.green('✓')} Successful: ${successCount}`);
    if (failureCount > 0) {
      console.log(`  ${chalk.red('✗')} Failed: ${failureCount}`);
    }
    console.log();

  } catch (error) {
    spinner.fail('Backfill failed');
    console.error(chalk.red(`\n❌ Error: ${error}\n`));
    process.exit(1);
  }
}

/**
 * Command definition
 */
export const backfillCommand = new Command('backfill')
  .description('Analyze historical commits to populate bundle metrics')
  .option('--from <ref>', 'Start from this git ref (commit, tag, branch)', 'HEAD~100')
  .option('--to <ref>', 'Analyze up to this git ref', 'HEAD')
  .option('--last <n>', 'Analyze only the last N commits', parseInt)
  .option('--releases-only', 'Only analyze tagged releases')
  .option('--sample <n>', 'Sample approximately N commits from the range', parseInt)
  .option('--build-command <cmd>', 'Command to build the project', 'pnpm build')
  .option('--skip-install', 'Skip dependency installation (faster if deps unchanged)')
  .action(backfill);
