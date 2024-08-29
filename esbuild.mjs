import * as esbuild from 'esbuild';

esbuild.buildSync({
  bundle: true,
  entryPoints: ['./src/index.ts'],
  format: 'cjs',
  minify: false,
  outfile: 'dist/index.js',
  platform: 'node',
});
