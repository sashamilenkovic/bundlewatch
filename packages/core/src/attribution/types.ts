/**
 * Module attribution types
 * Used to identify and categorize modules in bundle analysis
 */

/**
 * Type of module source
 */
export type ModuleType = 'npm' | 'local' | 'framework' | 'workspace' | 'vendor' | 'unknown';

/**
 * Detected framework
 */
export type FrameworkType = 'nuxt' | 'vue' | 'next' | 'react' | 'svelte' | 'angular' | null;

/**
 * Category of local code
 */
export type LocalCategory =
  | 'page'
  | 'component'
  | 'composable'
  | 'hook'
  | 'util'
  | 'store'
  | 'api'
  | 'lib'
  | 'config'
  | 'type'
  | 'other';

/**
 * Result of module attribution
 */
export interface ModuleAttribution {
  /** Display name (e.g., "react", "components/Header", "@myorg/shared") */
  name: string;

  /** Type of module source */
  type: ModuleType;

  /** Confidence score 0-100 */
  confidence: number;

  /** Package version (extracted from pnpm paths when available) */
  version?: string;

  /** Detected framework (for framework-specific modules) */
  framework?: FrameworkType;

  /** Category of local code */
  category?: LocalCategory;

  /** Normalized path for grouping */
  normalizedPath: string;

  /** Original module ID/path */
  originalPath: string;
}

/**
 * Options for attribution
 */
export interface AttributionOptions {
  /** Additional directories to treat as local code (added to defaults) */
  customDirectories?: string[];

  /** Maximum depth for local code paths (default: 3) */
  maxLocalDepth?: number;

  /** Enable framework detection (default: true) */
  frameworkDetection?: boolean;

  /** Extract versions from pnpm paths (default: true) */
  extractVersions?: boolean;

  /** Project root for resolving relative paths */
  projectRoot?: string;
}

/**
 * Default directories that indicate local/app code
 */
export const DEFAULT_LOCAL_DIRECTORIES = [
  'src',
  'app',
  'pages',
  'components',
  'composables',
  'hooks',
  'utils',
  'lib',
  'store',
  'stores',
  'api',
  'services',
  'features',
  'modules',
  'views',
  'layouts',
  'plugins',
  'middleware',
  'server',
  'assets',
  'styles',
];

/**
 * Patterns for framework detection
 */
export const FRAMEWORK_PATTERNS: Record<Exclude<FrameworkType, null>, RegExp[]> = {
  nuxt: [/nuxt\/dist\//, /@nuxt\//, /\.nuxt\//, /nuxt3?\//, /#build\//],
  vue: [/@vue\/runtime/, /@vue\/reactivity/, /vue-router/, /pinia/, /^vue$/],
  next: [/next\/dist\//, /\(app-pages-browser\)/, /\(ssr\)/, /next-server/],
  react: [/^react$/, /^react-dom$/, /@react\//, /react-router/],
  svelte: [/^svelte$/, /@sveltejs\//, /svelte-kit/],
  angular: [/@angular\//, /zone\.js/],
};

/**
 * Patterns for local code categories
 */
export const CATEGORY_PATTERNS: Record<LocalCategory, RegExp[]> = {
  page: [/pages?\//, /routes?\//, /views?\//],
  component: [/components?\//, /ui\//],
  composable: [/composables?\//, /use[A-Z]/],
  hook: [/hooks?\//, /use[A-Z]/],
  util: [/utils?\//, /helpers?\//, /lib\//],
  store: [/stores?\//, /state\//],
  api: [/api\//, /services?\//],
  lib: [/lib\//, /packages?\//],
  config: [/config\//, /\.config\./],
  type: [/types?\//, /\.d\.ts$/],
  other: [],
};
