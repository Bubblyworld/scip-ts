import { defineConfig } from 'rollup';

export default defineConfig([
  {
    input: 'dist/index.node.js',
    output: {
      file: 'dist/index.node.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['fs', 'path', 'url', 'module'],
  },
  {
    input: 'dist/index.browser.js',
    output: {
      file: 'dist/index.browser.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['fs', 'path', 'url', 'module'],
  },
]);
