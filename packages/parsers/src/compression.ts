/**
 * Shared compression utilities for real gzip/brotli compression
 * Used by both Vite and Webpack plugins
 */

import { Buffer } from "node:buffer";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

/**
 * Compress content using gzip
 */
export function compressGzip(content: string | Buffer): number {
  const buffer = typeof content === "string" ? Buffer.from(content) : content;
  const compressed = gzipSync(buffer, {
    level: constants.Z_BEST_COMPRESSION,
  });
  return compressed.length;
}

/**
 * Compress content using brotli
 */
export function compressBrotli(content: string | Buffer): number {
  const buffer = typeof content === "string" ? Buffer.from(content) : content;
  const compressed = brotliCompressSync(buffer, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
    },
  });
  return compressed.length;
}

/**
 * Compress content with both gzip and brotli
 */
export function compressBoth(content: string | Buffer): {
  gzip: number;
  brotli: number;
} {
  return {
    gzip: compressGzip(content),
    brotli: compressBrotli(content),
  };
}
