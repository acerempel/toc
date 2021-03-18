const { pnpPlugin } = require('@yarnpkg/esbuild-plugin-pnp');

const production = process.env.NODE_ENV === 'production';
const watch = process.env.ESBUILD_WATCH === 'true';

require('esbuild').build({
  entryPoints: ["index.ts"],
  bundle: true,
  watch,
  target: ["es2017"],
  outdir: production ? "dist" : "public",
  sourcemap: !production,
  minify: production,
  plugins: [pnpPlugin()],
});
