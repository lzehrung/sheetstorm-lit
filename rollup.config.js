const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const babel = require('@rollup/plugin-babel');

exports.default = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'iife',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    terser(),
    babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' }),
  ],
};
