import { describe, it, expect } from 'vitest';
import {
  attributeModule,
  attributeModules,
  groupByAttribution,
  extractPackageName,
  AttributionEngine,
  isNpmPath,
  isLocalPath,
  isFrameworkPath,
  isWorkspacePath,
  detectFramework,
  FRAMEWORK_PATTERNS,
  DEFAULT_LOCAL_DIRECTORIES,
  CATEGORY_PATTERNS,
} from '../src/attribution/index.js';

describe('Attribution System', () => {
  describe('attributeModule', () => {
    describe('NPM packages', () => {
      it('should detect simple npm packages', () => {
        const result = attributeModule('node_modules/react/index.js');
        expect(result.type).toBe('npm');
        expect(result.name).toBe('react');
        expect(result.confidence).toBeGreaterThanOrEqual(80);
      });

      it('should detect scoped npm packages', () => {
        const result = attributeModule('node_modules/@babel/core/lib/index.js');
        expect(result.type).toBe('npm');
        expect(result.name).toBe('@babel/core');
      });

      it('should handle pnpm nested structure', () => {
        const result = attributeModule(
          'node_modules/.pnpm/@sentry+nextjs@8.0.0/node_modules/@sentry/nextjs/dist/index.js'
        );
        expect(result.type).toBe('npm');
        expect(result.name).toBe('@sentry/nextjs');
        expect(result.confidence).toBe(95); // Higher confidence for pnpm
      });

      it('should extract version from pnpm paths', () => {
        const result = attributeModule(
          'node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/index.js',
          { extractVersions: true }
        );
        expect(result.version).toBe('4.17.21');
      });

      it('should handle webpack loader prefixes', () => {
        const result = attributeModule('babel-loader!node_modules/react/index.js');
        expect(result.type).toBe('npm');
        expect(result.name).toBe('react');
      });
    });

    describe('Framework detection', () => {
      it('should detect Nuxt internals', () => {
        const result = attributeModule('node_modules/.nuxt/components.d.ts');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('nuxt');
        expect(result.name).toBe('nuxt/generated');
      });

      it('should detect Nuxt #build paths', () => {
        const result = attributeModule('#build/plugins/router.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('nuxt');
        expect(result.name).toBe('nuxt/build');
      });

      it('should detect @nuxt scoped packages', () => {
        const result = attributeModule('node_modules/@nuxt/kit/dist/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('nuxt');
        expect(result.name).toBe('nuxt/kit');
      });

      it('should detect Next.js client', () => {
        const result = attributeModule('node_modules/next/dist/client/router.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('next');
        expect(result.name).toBe('next/client');
      });

      it('should detect Next.js server', () => {
        const result = attributeModule('node_modules/next/dist/server/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('next');
        expect(result.name).toBe('next/server');
      });

      it('should detect Next.js app-router', () => {
        const result = attributeModule('(app-pages-browser)/page.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('next');
        expect(result.name).toBe('next/app-router');
      });

      it('should detect Next.js ssr', () => {
        const result = attributeModule('(ssr)/component.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('next');
        expect(result.name).toBe('next/ssr');
      });

      it('should detect Next.js dist fallback', () => {
        const result = attributeModule('node_modules/next/dist/shared/lib/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('next');
        expect(result.name).toBe('next/shared');
      });

      it('should detect Vue runtime', () => {
        const result = attributeModule('node_modules/@vue/runtime-core/dist/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('vue');
        expect(result.name).toBe('vue/runtime-core');
      });

      it('should detect Vue reactivity', () => {
        const result = attributeModule('node_modules/@vue/reactivity/dist/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('vue');
        expect(result.name).toBe('vue/reactivity');
      });

      it('should detect vue-router', () => {
        const result = attributeModule('node_modules/vue-router/dist/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('vue');
        expect(result.name).toBe('vue-router');
      });

      it('should detect pinia', () => {
        const result = attributeModule('node_modules/pinia/dist/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('vue');
        expect(result.name).toBe('pinia');
      });

      it('should detect React router', () => {
        const result = attributeModule('node_modules/react-router/dist/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('react');
        expect(result.name).toBe('react-router');
      });

      it('should detect Svelte kit', () => {
        const result = attributeModule('node_modules/@sveltejs/kit/src/runtime/client.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('svelte');
        expect(result.name).toBe('sveltekit');
      });

      it('should detect Angular core', () => {
        const result = attributeModule('node_modules/@angular/core/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('angular');
        expect(result.name).toBe('angular/core');
      });

      it('should detect Angular router', () => {
        const result = attributeModule('node_modules/@angular/router/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('angular');
        expect(result.name).toBe('angular/router');
      });

      it('should skip framework detection when disabled', () => {
        const result = attributeModule('node_modules/@vue/runtime-core/dist/index.js', {
          frameworkDetection: false,
        });
        expect(result.type).toBe('npm');
        expect(result.framework).toBeUndefined();
      });
    });

    describe('Local code', () => {
      it('should detect src directory', () => {
        const result = attributeModule('src/components/Header.tsx');
        expect(result.type).toBe('local');
        expect(result.name).toBe('src/components/Header');
      });

      it('should detect app directory', () => {
        const result = attributeModule('app/pages/dashboard/index.vue');
        expect(result.type).toBe('local');
        expect(result.name).toBe('app/pages/dashboard');
      });

      it('should categorize components', () => {
        const result = attributeModule('src/components/Button.tsx');
        expect(result.category).toBe('component');
      });

      it('should categorize pages', () => {
        const result = attributeModule('src/pages/Home.vue');
        expect(result.category).toBe('page');
      });

      it('should categorize composables', () => {
        const result = attributeModule('src/composables/useAuth.ts');
        expect(result.category).toBe('composable');
      });

      it('should categorize hooks', () => {
        const result = attributeModule('src/hooks/useDebounce.ts');
        expect(result.category).toBe('hook');
      });

      it('should categorize utils', () => {
        const result = attributeModule('src/utils/format.ts');
        expect(result.category).toBe('util');
      });

      it('should categorize stores', () => {
        const result = attributeModule('src/stores/userStore.ts');
        expect(result.category).toBe('store');
      });

      it('should respect maxLocalDepth option', () => {
        const result = attributeModule('src/features/auth/components/LoginForm.tsx', {
          maxLocalDepth: 2,
        });
        expect(result.name).toBe('src/features');
      });

      it('should handle relative paths', () => {
        const result = attributeModule('./components/Header.tsx');
        expect(result.type).toBe('local');
      });

      it('should handle parent relative paths', () => {
        const result = attributeModule('../shared/utils.ts');
        expect(result.type).toBe('local');
      });

      it('should handle absolute paths', () => {
        const result = attributeModule('/home/user/project/src/App.tsx');
        expect(result.type).toBe('local');
      });

      it('should categorize api files', () => {
        const result = attributeModule('src/api/users.ts');
        expect(result.category).toBe('api');
      });

      it('should categorize lib files', () => {
        const result = attributeModule('lib/helpers/format.ts');
        expect(result.category).toBe('util');
      });

      it('should categorize config files', () => {
        const result = attributeModule('src/config/settings.ts');
        expect(result.category).toBe('config');
      });

      it('should categorize type files', () => {
        const result = attributeModule('src/types/user.ts');
        expect(result.category).toBe('type');
      });

      it('should use custom directories', () => {
        const result = attributeModule('custom-src/components/Button.tsx', {
          customDirectories: ['custom-src'],
        });
        expect(result.type).toBe('local');
      });
    });

    describe('Workspace packages', () => {
      it('should detect packages directory', () => {
        const result = attributeModule('packages/shared/utils/format.ts');
        expect(result.type).toBe('workspace');
        expect(result.name).toBe('shared');
      });

      it('should detect apps directory', () => {
        const result = attributeModule('apps/web/components/Button.tsx');
        expect(result.type).toBe('workspace');
        expect(result.name).toBe('web');
      });

      it('should detect libs directory', () => {
        const result = attributeModule('libs/ui/src/Button.tsx');
        expect(result.type).toBe('workspace');
        expect(result.name).toBe('ui');
      });

      it('should detect modules directory', () => {
        const result = attributeModule('modules/auth/src/login.ts');
        expect(result.type).toBe('workspace');
        expect(result.name).toBe('auth');
      });

      it('should detect scoped workspace packages', () => {
        const result = attributeModule('@myorg/shared/utils.ts');
        expect(result.type).toBe('workspace');
        expect(result.name).toBe('@myorg/shared');
      });
    });

    describe('Unknown paths', () => {
      it('should fallback to unknown for unrecognized paths', () => {
        const result = attributeModule('some/random/path.js');
        expect(result.type).toBe('unknown');
        expect(result.confidence).toBe(50);
      });
    });
  });

  describe('attributeModules', () => {
    it('should batch process multiple paths', () => {
      const paths = [
        'node_modules/react/index.js',
        'src/components/Header.tsx',
        'packages/shared/utils.ts',
      ];
      const results = attributeModules(paths);

      expect(results).toHaveLength(3);
      expect(results[0].type).toBe('npm');
      expect(results[1].type).toBe('local');
      expect(results[2].type).toBe('workspace');
    });
  });

  describe('groupByAttribution', () => {
    it('should group modules by normalized path', () => {
      const attributions = [
        attributeModule('node_modules/react/index.js'),
        attributeModule('node_modules/react/jsx-runtime.js'),
        attributeModule('src/components/Header.tsx'),
      ];

      const groups = groupByAttribution(attributions);

      expect(groups.size).toBe(2);
      expect(groups.get('npm:react')).toHaveLength(2);
    });
  });

  describe('extractPackageName', () => {
    it('should return simple name for npm packages', () => {
      expect(extractPackageName('node_modules/lodash/index.js')).toBe('lodash');
    });

    it('should return path for local code', () => {
      expect(extractPackageName('src/components/Header.tsx')).toBe('src/components/Header');
    });

    it('should handle scoped packages', () => {
      expect(extractPackageName('node_modules/@babel/core/index.js')).toBe('@babel/core');
    });
  });

  describe('AttributionEngine class', () => {
    it('should create engine with options', () => {
      const engine = new AttributionEngine({ maxLocalDepth: 2 });
      const result = engine.attribute('src/deep/nested/path/file.ts');
      expect(result.name).toBe('src/deep');
    });

    it('should attribute many paths', () => {
      const engine = new AttributionEngine();
      const results = engine.attributeMany([
        'node_modules/react/index.js',
        'src/App.tsx',
      ]);
      expect(results).toHaveLength(2);
    });

    it('should group attributions', () => {
      const engine = new AttributionEngine();
      const attributions = engine.attributeMany([
        'node_modules/react/index.js',
        'node_modules/react/jsx.js',
      ]);
      const groups = engine.group(attributions);
      expect(groups.size).toBe(1);
    });

    it('should attribute and group in one call', () => {
      const engine = new AttributionEngine();
      const groups = engine.attributeAndGroup([
        'node_modules/react/index.js',
        'src/App.tsx',
      ]);
      expect(groups.size).toBe(2);
    });

    it('should get package name', () => {
      const engine = new AttributionEngine();
      expect(engine.getPackageName('node_modules/lodash/index.js')).toBe('lodash');
    });
  });

  describe('Helper functions', () => {
    describe('isNpmPath', () => {
      it('should return true for node_modules paths', () => {
        expect(isNpmPath('node_modules/react/index.js')).toBe(true);
      });

      it('should return true for .pnpm paths', () => {
        expect(isNpmPath('node_modules/.pnpm/react@18.0.0/node_modules/react/index.js')).toBe(true);
      });

      it('should return false for local paths', () => {
        expect(isNpmPath('src/components/Header.tsx')).toBe(false);
      });
    });

    describe('isLocalPath', () => {
      it('should return true for src paths', () => {
        expect(isLocalPath('src/index.ts', [], DEFAULT_LOCAL_DIRECTORIES)).toBe(true);
      });

      it('should return false for node_modules', () => {
        expect(isLocalPath('node_modules/react/index.js', [], DEFAULT_LOCAL_DIRECTORIES)).toBe(false);
      });

      it('should handle custom directories', () => {
        expect(isLocalPath('custom/file.ts', ['custom'], DEFAULT_LOCAL_DIRECTORIES)).toBe(true);
      });
    });

    describe('isFrameworkPath', () => {
      it('should return true for framework paths', () => {
        expect(isFrameworkPath('node_modules/@vue/runtime-core/index.js', FRAMEWORK_PATTERNS)).toBe(true);
      });

      it('should return false for regular npm paths', () => {
        expect(isFrameworkPath('node_modules/lodash/index.js', FRAMEWORK_PATTERNS)).toBe(false);
      });
    });

    describe('isWorkspacePath', () => {
      it('should return true for packages paths', () => {
        expect(isWorkspacePath('packages/shared/index.ts')).toBe(true);
      });

      it('should return false for node_modules', () => {
        expect(isWorkspacePath('node_modules/react/index.js')).toBe(false);
      });
    });

    describe('detectFramework', () => {
      it('should detect nuxt', () => {
        expect(detectFramework('.nuxt/components.d.ts', FRAMEWORK_PATTERNS)).toBe('nuxt');
      });

      it('should detect next', () => {
        expect(detectFramework('next/dist/client/router.js', FRAMEWORK_PATTERNS)).toBe('next');
      });

      it('should return null for non-framework paths', () => {
        expect(detectFramework('lodash/index.js', FRAMEWORK_PATTERNS)).toBe(null);
      });
    });
  });

  describe('Additional branch coverage', () => {
    describe('NPM extractor edge cases', () => {
      it('should return unknown for packages starting with underscore', () => {
        const result = attributeModule('node_modules/_internal/index.js');
        expect(result.type).toBe('unknown');
      });

      it('should return unknown for packages starting with dot', () => {
        const result = attributeModule('node_modules/.cache/index.js');
        expect(result.type).toBe('unknown');
      });

      it('should handle paths containing .pnpm without node_modules', () => {
        expect(isNpmPath('.pnpm/some-package/index.js')).toBe(true);
      });
    });

    describe('Framework name extraction edge cases', () => {
      it('should detect react-dom as framework', () => {
        const result = attributeModule('node_modules/react-dom/client/index.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('react');
        expect(result.name).toBe('react-dom');
      });

      it('should detect vue compiler', () => {
        const result = attributeModule('node_modules/@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js');
        expect(result.type).toBe('framework');
        expect(result.framework).toBe('vue');
        expect(result.name).toBe('vue/compiler');
      });

      it('should keep base react as npm package', () => {
        const result = attributeModule('node_modules/react/index.js');
        expect(result.type).toBe('npm');
        expect(result.name).toBe('react');
      });

      it('should keep base vue as npm package', () => {
        const result = attributeModule('node_modules/vue/dist/vue.runtime.esm.js');
        expect(result.type).toBe('npm');
        expect(result.name).toBe('vue');
      });

      it('should keep base svelte as npm package', () => {
        const result = attributeModule('node_modules/svelte/internal/index.js');
        expect(result.type).toBe('npm');
        expect(result.name).toBe('svelte');
      });
    });

    describe('Local code edge cases', () => {
      it('should handle mod index files', () => {
        const result = attributeModule('src/utils/mod.ts');
        expect(result.type).toBe('local');
        expect(result.name).toBe('src/utils');
      });

      it('should handle paths with no known source directory', () => {
        const result = attributeModule('./helpers/format.ts');
        expect(result.type).toBe('local');
      });

      it('should handle deeply nested paths with maxLocalDepth', () => {
        const result = attributeModule('src/a/b/c/d/e/f.ts', { maxLocalDepth: 4 });
        expect(result.name).toBe('src/a/b/c');
      });

      it('should handle paths with Windows backslashes', () => {
        const result = attributeModule('src\\components\\Button.tsx');
        expect(result.type).toBe('local');
      });
    });

    describe('Workspace edge cases', () => {
      it('should handle Windows paths in workspaces', () => {
        const result = attributeModule('packages\\core\\src\\index.ts');
        expect(result.type).toBe('workspace');
        expect(result.name).toBe('core');
      });
    });

    describe('Unknown fallback edge cases', () => {
      it('should handle empty path segments in fallback', () => {
        const result = attributeModule('some//weird//path.js');
        expect(result.type).toBe('unknown');
        expect(result.name).not.toBe('');
      });

      it('should handle path with only extension', () => {
        const result = attributeModule('.js');
        expect(result.type).toBe('unknown');
      });
    });
  });
});
