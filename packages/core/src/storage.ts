/**
 * Git-based storage for build metrics
 * Using functional composition instead of classes
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { BuildMetrics, StorageOptions } from './types.js';

const execAsync = promisify(exec);

export interface GitStorageConfig {
  branch?: string;
  remote?: string;
  workingDir?: string;
}

interface StorageContext {
  branch: string;
  remote: string;
  workingDir: string;
}

/**
 * Create storage context with defaults
 */
function createStorageContext(config: GitStorageConfig = {}): StorageContext {
  return {
    branch: config.branch || 'bundlewatch-data',
    remote: config.remote || 'origin',
    workingDir: config.workingDir || process.cwd(),
  };
}

/**
 * Check if data branch exists
 */
async function branchExists(ctx: StorageContext): Promise<boolean> {
  try {
    await execAsync(`git ls-remote --heads ${ctx.remote} ${ctx.branch}`, {
      cwd: ctx.workingDir,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Write metrics to file
 */
async function writeMetricsFile(ctx: StorageContext, filepath: string, metrics: BuildMetrics): Promise<void> {
  const fullPath = join(ctx.workingDir, filepath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, JSON.stringify(metrics, null, 2));
}

/**
 * Update latest.json symlink/copy
 */
async function updateLatest(ctx: StorageContext, branch: string, metrics: BuildMetrics): Promise<void> {
  const latestPath = join(ctx.workingDir, 'data', branch, 'latest.json');
  await mkdir(dirname(latestPath), { recursive: true });
  await writeFile(latestPath, JSON.stringify(metrics, null, 2));
}

/**
 * Save metrics to git branch
 */
export async function saveMetrics(metrics: BuildMetrics, config: GitStorageConfig = {}): Promise<void> {
  const ctx = createStorageContext(config);
  const timestamp = new Date(metrics.timestamp).getTime();
  const filename = `${timestamp}-${metrics.commit.substring(0, 7)}.json`;
  const filepath = join('data', metrics.branch, filename);

  try {
    // Get current branch to return to it later
    const { stdout: currentBranch } = await execAsync('git branch --show-current', {
      cwd: ctx.workingDir,
    });

    // Check if data branch exists remotely
    const exists = await branchExists(ctx);

    if (!exists) {
      // Create orphan branch for data storage
      await execAsync(`git checkout --orphan ${ctx.branch}`, { cwd: ctx.workingDir });
      await execAsync('git rm -rf .', { cwd: ctx.workingDir }).catch(() => {
        // Ignore errors if no files to remove
      });
      
      // Create initial structure
      await writeMetricsFile(ctx, filepath, metrics);
      await updateLatest(ctx, metrics.branch, metrics);
      
      await execAsync('git add .', { cwd: ctx.workingDir });
      await execAsync('git commit -m "Initialize bundle-watch data"', { cwd: ctx.workingDir });
      
      // Push the new branch
      await execAsync(`git push -u ${ctx.remote} ${ctx.branch}`, { cwd: ctx.workingDir });
    } else {
      // Checkout existing data branch
      await execAsync(`git fetch ${ctx.remote} ${ctx.branch}`, { cwd: ctx.workingDir });
      await execAsync(`git checkout ${ctx.branch}`, { cwd: ctx.workingDir });
      await execAsync(`git pull ${ctx.remote} ${ctx.branch}`, { cwd: ctx.workingDir });

      // Write metrics
      await writeMetricsFile(ctx, filepath, metrics);
      await updateLatest(ctx, metrics.branch, metrics);

      // Commit and push
      await execAsync('git add .', { cwd: ctx.workingDir });
      await execAsync(
        `git commit -m "Add metrics for ${metrics.branch}@${metrics.commit.substring(0, 7)}"`,
        { cwd: ctx.workingDir }
      );
      await execAsync(`git push ${ctx.remote} ${ctx.branch}`, { cwd: ctx.workingDir });
    }

    // Return to original branch
    await execAsync(`git checkout ${currentBranch.trim()}`, { cwd: ctx.workingDir });
  } catch (error) {
    console.error('Error saving metrics to git:', error);
    throw error;
  }
}

/**
 * Load metrics for a specific branch/commit
 */
export async function loadMetrics(
  branch: string,
  commit?: string,
  config: GitStorageConfig = {}
): Promise<BuildMetrics | null> {
  const ctx = createStorageContext(config);
  
  try {
    // Fetch latest data
    await execAsync(`git fetch ${ctx.remote} ${ctx.branch}`, { cwd: ctx.workingDir });

    if (!commit) {
      // Load latest for branch
      const { stdout } = await execAsync(
        `git show ${ctx.remote}/${ctx.branch}:data/${branch}/latest.json`,
        { cwd: ctx.workingDir }
      );
      return JSON.parse(stdout);
    } else {
      // Find specific commit data
      const { stdout } = await execAsync(
        `git show ${ctx.remote}/${ctx.branch}:data/${branch}/`,
        { cwd: ctx.workingDir }
      );
      
      // Parse file list and find matching commit
      const files = stdout.split('\n').filter(f => f.includes(commit.substring(0, 7)));
      if (files.length === 0) {
        return null;
      }

      const filename = files[0];
      const { stdout: content } = await execAsync(
        `git show ${ctx.remote}/${ctx.branch}:data/${branch}/${filename}`,
        { cwd: ctx.workingDir }
      );
      return JSON.parse(content);
    }
  } catch (error) {
    // Branch might not exist yet - this is expected on first run
    return null;
  }
}

/**
 * Get list of all stored metrics for a branch
 */
export async function listMetrics(
  branch: string,
  config: GitStorageConfig = {}
): Promise<BuildMetrics[]> {
  const ctx = createStorageContext(config);
  
  try {
    await execAsync(`git fetch ${ctx.remote} ${ctx.branch}`, { cwd: ctx.workingDir });

    const { stdout } = await execAsync(
      `git ls-tree -r --name-only ${ctx.remote}/${ctx.branch} data/${branch}/`,
      { cwd: ctx.workingDir }
    );

    const files = stdout.split('\n').filter(f => f && f.endsWith('.json') && !f.endsWith('latest.json'));
    
    const metrics: BuildMetrics[] = [];
    for (const file of files) {
      const { stdout: content } = await execAsync(
        `git show ${ctx.remote}/${ctx.branch}:${file}`,
        { cwd: ctx.workingDir }
      );
      metrics.push(JSON.parse(content));
    }

    return metrics.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error listing metrics:', error);
    return [];
  }
}

/**
 * Get current git commit hash
 */
export async function getCurrentCommit(workingDir: string = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execAsync('git rev-parse HEAD', { cwd: workingDir });
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get current git branch
 */
export async function getCurrentBranch(workingDir: string = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execAsync('git branch --show-current', { cwd: workingDir });
    return stdout.trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Legacy class wrapper for backwards compatibility
 * @deprecated Use saveMetrics(), loadMetrics(), etc. functions directly
 */
export class GitStorage {
  private config: GitStorageConfig;

  constructor(config: GitStorageConfig = {}) {
    this.config = config;
  }

  async save(metrics: BuildMetrics): Promise<void> {
    return saveMetrics(metrics, this.config);
  }

  async load(branch: string, commit?: string): Promise<BuildMetrics | null> {
    return loadMetrics(branch, commit, this.config);
  }

  async list(branch: string): Promise<BuildMetrics[]> {
    return listMetrics(branch, this.config);
  }

  static getCurrentCommit = getCurrentCommit;
  static getCurrentBranch = getCurrentBranch;
}
