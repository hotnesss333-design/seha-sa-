import { access, cp, mkdir, rm } from 'node:fs/promises';

// Publish only the browser assets. Netlify deploys server functions separately.
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const publicFiles = [
  'index.html', 'security-unavailable.json', 'css', 'images', 'assets', 'img',
  'googledbcfb73b6979be60.html',
];

// A missing source must fail the deployment instead of publishing a blank page.
for (const file of publicFiles) {
  await access(new URL(file, root));
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of publicFiles) {
  await cp(new URL(file, root), new URL(file, output), { recursive: true });
}

await mkdir(new URL('js/', output), { recursive: true });
for (const file of ['index-mG2x8W2Z.js','components-BJkXymKQ.js','main-B_pRNDV5.js','loading-C49NBcMr.js','seha-dashboard-app.js','security-client.js','site-helpers.js']) {
  await cp(new URL('js/' + file, root), new URL('js/' + file, output));
}
