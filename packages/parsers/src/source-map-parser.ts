/**
 * Source map parser - The holy grail!
 * Maps minified bundle code back to original source files
 */

import type { SourceFileMetrics } from "@milencode/bundlewatch-core";
import type { RawSourceMap } from "source-map";

import { SourceMapConsumer } from "source-map";

/**
 * Parse a source map and attribute bundle size to original source files
 *
 * This analyzes the source map to determine how much of the final bundle
 * each original source file contributes.
 */
export async function parseSourceMap(
  sourceMap: RawSourceMap | string,
  bundleCode: string,
  bundleSize: number,
  chunkName: string
): Promise<SourceFileMetrics[]> {
  const mapObject =
    typeof sourceMap === "string" ? JSON.parse(sourceMap) : sourceMap;

  const consumer = await new SourceMapConsumer(mapObject);

  try {
    return analyzeSourceMapContributions(
      consumer,
      bundleCode,
      bundleSize,
      chunkName
    );
  } finally {
    consumer.destroy();
  }
}

/**
 * Analyze source map to determine size contributions
 */
function analyzeSourceMapContributions(
  consumer: SourceMapConsumer,
  bundleCode: string,
  bundleSize: number,
  chunkName: string
): SourceFileMetrics[] {
  const sourceContributions = new Map<
    string,
    {
      lines: Set<number>;
      estimatedSize: number;
      package: string;
    }
  >();

  // Get all unique sources from the source map
  // @ts-ignore - sources is a getter property
  const sources: string[] = consumer.sources || [];

  // Initialize tracking for each source
  for (const source of sources) {
    if (!source) continue;

    sourceContributions.set(source, {
      lines: new Set(),
      estimatedSize: 0,
      package: extractPackageFromSource(source),
    });
  }

  // Parse the bundle code to analyze mappings
  // We'll sample the bundle to estimate contributions
  const lines = bundleCode.split("\n");

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (!line.trim()) continue;

    // Sample columns in this line
    const samplePoints = Math.min(10, line.length);
    const step = Math.max(1, Math.floor(line.length / samplePoints));

    for (let col = 0; col < line.length; col += step) {
      const originalPosition = consumer.originalPositionFor({
        line: lineIndex + 1,
        column: col,
      });

      if (originalPosition.source) {
        const contribution = sourceContributions.get(originalPosition.source);
        if (contribution && originalPosition.line) {
          contribution.lines.add(originalPosition.line);
        }
      }
    }
  }

  // Calculate estimated sizes based on line coverage
  const totalLines = lines.length;
  const bytesPerLine = bundleSize / totalLines;

  const results: SourceFileMetrics[] = [];

  for (const [source, data] of sourceContributions) {
    if (data.lines.size === 0) continue;

    // Estimate size based on number of lines contributed
    const estimatedSize = Math.round(data.lines.size * bytesPerLine);

    results.push({
      path: cleanSourcePath(source),
      package: data.package,
      size: estimatedSize,
      lines: data.lines.size,
      chunks: [chunkName],
      importedBy: [], // TODO: Could track this from module graph
    });
  }

  // Sort by size descending
  return results.sort((a, b) => b.size - a.size);
}

/**
 * Extract package name from source path
 */
function extractPackageFromSource(source: string): string {
  // Handle node_modules paths
  if (source.includes("node_modules")) {
    const match = source.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
    return match ? match[1] : "unknown";
  }

  // Handle webpack internal modules
  if (source.startsWith("webpack/")) {
    return "webpack-runtime";
  }

  // Everything else is your app
  return "your-app";
}

/**
 * Clean up source path for display
 */
function cleanSourcePath(source: string): string {
  // Remove webpack prefixes
  let cleaned = source.replace(/^webpack:\/\/\//, "");

  // Remove absolute paths, keep relative
  cleaned = cleaned.replace(/^.*\/node_modules\//, "node_modules/");
  cleaned = cleaned.replace(/^.*\/src\//, "src/");

  // Remove query strings
  cleaned = cleaned.split("?")[0];

  return cleaned;
}

/**
 * Alternative approach: Use source content to estimate size
 * This is more accurate but requires source content to be embedded in the map
 */
export async function parseSourceMapWithContent(
  sourceMap: RawSourceMap | string,
  chunkName: string
): Promise<SourceFileMetrics[]> {
  const mapObject =
    typeof sourceMap === "string" ? JSON.parse(sourceMap) : sourceMap;

  const consumer = await new SourceMapConsumer(mapObject);

  try {
    const results: SourceFileMetrics[] = [];

    // @ts-ignore - sources is a getter property
    const sources: string[] = consumer.sources || [];

    for (const source of sources) {
      if (!source) continue;

      const content = consumer.sourceContentFor(source, true);
      if (!content) continue;

      const size = Buffer.from(content).length;
      const lines = content.split("\n").length;

      results.push({
        path: cleanSourcePath(source),
        package: extractPackageFromSource(source),
        size,
        lines,
        chunks: [chunkName],
        importedBy: [],
      });
    }

    return results.sort((a, b) => b.size - a.size);
  } finally {
    consumer.destroy();
  }
}

/**
 * Merge source file metrics from multiple chunks
 */
export function mergeSourceFileMetrics(
  metricsArrays: SourceFileMetrics[][]
): SourceFileMetrics[] {
  const merged = new Map<string, SourceFileMetrics>();

  for (const metrics of metricsArrays) {
    for (const metric of metrics) {
      const existing = merged.get(metric.path);

      if (existing) {
        // Merge data
        existing.size += metric.size;
        existing.chunks = [...new Set([...existing.chunks, ...metric.chunks])];
        if (metric.lines) {
          existing.lines = (existing.lines || 0) + metric.lines;
        }
      } else {
        merged.set(metric.path, { ...metric });
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.size - a.size);
}
