const esbuild = require('esbuild');

Promise.all([
 esbuild.build({
  entryPoints: ['src/extension/content.ts'],
  bundle: true,
  outfile: 'dist/extension/content.js',
 }),
 esbuild.build({
  entryPoints: ['src/api.js'],
  bundle: true,
  outfile: 'dist/api.js',
  platform: 'node'
 })
]).then(() => {
 const fs = require('fs');
 const filesToCopy = fs.readdirSync('src/extension/public');
 return Promise.all([...filesToCopy.filter(file => file !== 'manifest.json').map(file => {
  return new Promise(resolve => fs.copyFile(`src/extension/public/${file}`, `dist/extension/${file}`, resolve));
 }), new Promise((resolve) => {
  const manifest = require('./src/extension/public/manifest.json');
  const config = require('./config');

  fs.writeFile('dist/extension/manifest.json', JSON.stringify({
   ...manifest,
   "content_scripts": [
    {
     "matches": config.repos.map(repo => `${repo.url}/-/merge_requests/*`),
     "js": [
      "./content.js"
     ]
    }
   ]
  }, null, 2), resolve)
 })]);
}).catch((e) => {
 console.error(e);
 process.exit(1);
})