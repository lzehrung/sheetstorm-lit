/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const { terser } = require('@rollup/plugin-terser');
const visualizer = require('rollup-plugin-visualizer').default;

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  input: 'src/index.ts',
  output: {
    format: 'iife',
    file: 'dist/index.js',
    name: 'sheetstorm',
    inlineDynamicImports: true,
    sourcemap: !isProduction,
    globals: {
      papaparse: 'Papa',
      xlsx: 'XLSX',
    },
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    isProduction &&
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log'],
        },
      }),
    isProduction &&
      visualizer({
        filename: 'dist/bundle-size.html',
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  watch: {
    include: 'src/**',
    exclude: 'node_modules/**',
  },
};
