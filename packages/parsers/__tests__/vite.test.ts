/**
 * Tests for Vite bundle parser
 */

import { describe, it, expect } from 'vitest';
import { createAnalyzerState, collectModuleInfo, analyzeBundle } from '../src/vite';
import type { OutputBundle, OutputChunk } from 'rollup';

describe('Vite Parser', () => {
  describe('analyzeBundle', () => {
    it('should detect all modules in chunk even if not tracked during moduleParsed', async () => {
      // Create analyzer state with NO modules tracked (simulates skipping node_modules)
      const state = createAnalyzerState({
        branch: 'main',
        commit: 'abc123',
        buildStartTime: Date.now(),
        realCompression: false,
        analyzeGraph: false,
        generateRecommendations: false,
        analyzeSourceMaps: false,
      });

      // Create a mock bundle with a chunk that has node_modules
      const mockBundle: OutputBundle = {
        'index.js': {
          type: 'chunk',
          code: 'console.log("hello")',
          fileName: 'index.js',
          name: 'index',
          facadeModuleId: '/src/main.tsx',
          isEntry: true,
          isDynamicEntry: false,
          imports: [],
          dynamicImports: [],
          implicitlyLoadedBefore: [],
          importedBindings: {},
          moduleIds: ['/src/main.tsx', '/src/App.tsx'],
          exports: [],
          modules: {
            // App code (would be tracked)
            '/src/main.tsx': {
              code: 'import React from "react"; console.log("main")',
              originalLength: 100,
              removedExports: [],
              renderedExports: [],
              renderedLength: 50,
            },
            '/src/App.tsx': {
              code: 'export default function App() { return <div>App</div> }',
              originalLength: 200,
              removedExports: [],
              renderedExports: ['default'],
              renderedLength: 150,
            },
            // React (would NOT be tracked - skipped in moduleParsed)
            '/node_modules/react/index.js': {
              code: '// React code here... '.repeat(1000),
              originalLength: 50000,
              removedExports: [],
              renderedExports: [],
              renderedLength: 45000,
            },
            '/node_modules/react-dom/client.js': {
              code: '// React DOM code... '.repeat(2000),
              originalLength: 100000,
              removedExports: [],
              renderedExports: [],
              renderedLength: 90000,
            },
          },
        } as OutputChunk,
      };

      // Analyze the bundle
      const metrics = await analyzeBundle(state, mockBundle);

      // BEFORE FIX: modules would only have App code (2 modules)
      // AFTER FIX: modules should have ALL 4 modules including React
      expect(metrics.modules).toBeDefined();
      expect(metrics.modules!.length).toBeGreaterThanOrEqual(4);

      // Verify React modules are detected
      const reactModule = metrics.modules!.find(m => m.id.includes('node_modules/react/index.js'));
      const reactDomModule = metrics.modules!.find(m => m.id.includes('node_modules/react-dom/client.js'));

      expect(reactModule).toBeDefined();
      expect(reactDomModule).toBeDefined();

      // Verify type is correctly detected
      expect(reactModule?.type).toBe('npm');
      expect(reactDomModule?.type).toBe('npm');

      // Verify dependency metrics include React
      expect(metrics.detailedDependencies).toBeDefined();
      const reactDep = metrics.detailedDependencies!.find(d => d.name === 'react');
      const reactDomDep = metrics.detailedDependencies!.find(d => d.name === 'react-dom');

      expect(reactDep).toBeDefined();
      expect(reactDomDep).toBeDefined();
    });

    it('should correctly label app code vs npm packages', async () => {
      const state = createAnalyzerState({
        branch: 'main',
        commit: 'abc123',
        realCompression: false,
        analyzeGraph: false,
      });

      const mockBundle: OutputBundle = {
        'index.js': {
          type: 'chunk',
          code: 'code',
          fileName: 'index.js',
          name: 'index',
          facadeModuleId: '/src/main.tsx',
          isEntry: true,
          isDynamicEntry: false,
          imports: [],
          dynamicImports: [],
          implicitlyLoadedBefore: [],
          importedBindings: {},
          moduleIds: ['/src/App.tsx', '/node_modules/react/index.js'],
          exports: [],
          modules: {
            '/src/App.tsx': {
              code: 'app code',
              originalLength: 100,
              removedExports: [],
              renderedExports: [],
              renderedLength: 100,
            },
            '/node_modules/react/index.js': {
              code: 'react code',
              originalLength: 1000,
              removedExports: [],
              renderedExports: [],
              renderedLength: 1000,
            },
          },
        } as OutputChunk,
      };

      const metrics = await analyzeBundle(state, mockBundle);

      const appModule = metrics.modules!.find(m => m.id.includes('/src/App.tsx'));
      const npmModule = metrics.modules!.find(m => m.id.includes('node_modules/react'));

      expect(appModule?.type).toBe('local');
      expect(npmModule?.type).toBe('npm');
    });
  });

  describe('collectModuleInfo', () => {
    it('should track app modules during build', () => {
      let state = createAnalyzerState();

      state = collectModuleInfo(state, {
        id: '/src/App.tsx',
        code: 'export default function App() {}',
        importedIds: ['/src/utils.ts'],
      });

      expect(state.modules.size).toBe(1);
      expect(state.modules.get('/src/App.tsx')).toBeDefined();
      expect(state.modules.get('/src/App.tsx')?.type).toBe('local');
    });
  });
});
