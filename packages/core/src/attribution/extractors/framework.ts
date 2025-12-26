/**
 * Framework extractor
 * Detects framework-specific modules (Nuxt, Vue, Next.js, React, etc.)
 */

import type {
  ModuleAttribution,
  AttributionOptions,
  FrameworkType,
  FRAMEWORK_PATTERNS,
} from '../types.js';

/**
 * Detect which framework a module belongs to
 */
export function detectFramework(
  path: string,
  frameworkPatterns: Record<Exclude<FrameworkType, null>, RegExp[]>,
): FrameworkType {
  const normalizedPath = path.replace(/\\/g, '/');

  for (const [framework, patterns] of Object.entries(frameworkPatterns) as [
    Exclude<FrameworkType, null>,
    RegExp[],
  ][]) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedPath)) {
        return framework;
      }
    }
  }

  return null;
}

/**
 * Check if a path is a framework internal module
 */
export function isFrameworkPath(
  path: string,
  frameworkPatterns: Record<Exclude<FrameworkType, null>, RegExp[]>,
): boolean {
  return detectFramework(path, frameworkPatterns) !== null;
}

/**
 * Get a friendly name for framework modules
 */
export function getFrameworkModuleName(path: string, framework: FrameworkType): string {
  const normalizedPath = path.replace(/\\/g, '/');

  // Extract the specific module within the framework
  switch (framework) {
    case 'nuxt': {
      // Handle Nuxt internal modules
      if (normalizedPath.includes('#build')) {
        return 'nuxt/build';
      }
      if (normalizedPath.includes('.nuxt')) {
        return 'nuxt/generated';
      }
      const nuxtMatch = normalizedPath.match(/@?nuxt[^/]*\/([^/]+)/);
      return nuxtMatch ? `nuxt/${nuxtMatch[1]}` : 'nuxt';
    }

    case 'vue': {
      if (normalizedPath.includes('@vue/runtime-core')) return 'vue/runtime-core';
      if (normalizedPath.includes('@vue/reactivity')) return 'vue/reactivity';
      if (normalizedPath.includes('@vue/compiler')) return 'vue/compiler';
      if (normalizedPath.includes('vue-router')) return 'vue-router';
      if (normalizedPath.includes('pinia')) return 'pinia';
      return 'vue';
    }

    case 'next': {
      if (normalizedPath.includes('(app-pages-browser)')) return 'next/app-router';
      if (normalizedPath.includes('(ssr)')) return 'next/ssr';
      if (normalizedPath.includes('next/dist/client')) return 'next/client';
      if (normalizedPath.includes('next/dist/server')) return 'next/server';
      const nextMatch = normalizedPath.match(/next\/dist\/([^/]+)/);
      return nextMatch ? `next/${nextMatch[1]}` : 'next';
    }

    case 'react': {
      if (normalizedPath.includes('react-dom')) return 'react-dom';
      if (normalizedPath.includes('react-router')) return 'react-router';
      return 'react';
    }

    case 'svelte': {
      if (normalizedPath.includes('@sveltejs/kit')) return 'sveltekit';
      return 'svelte';
    }

    case 'angular': {
      const angularMatch = normalizedPath.match(/@angular\/([^/]+)/);
      return angularMatch ? `angular/${angularMatch[1]}` : 'angular';
    }

    default:
      return 'framework';
  }
}

/**
 * Extract framework module attribution
 */
export function extractFrameworkAttribution(
  path: string,
  options: AttributionOptions = {},
  frameworkPatterns: Record<Exclude<FrameworkType, null>, RegExp[]>,
): ModuleAttribution | null {
  if (!options.frameworkDetection) {
    return null;
  }

  const framework = detectFramework(path, frameworkPatterns);
  if (!framework) {
    return null;
  }

  const name = getFrameworkModuleName(path, framework);

  return {
    name,
    type: 'framework',
    confidence: 90,
    framework,
    normalizedPath: `framework:${name}`,
    originalPath: path,
  };
}
