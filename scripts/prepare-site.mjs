import { access, cp, mkdir, rm } from 'node:fs/promises';

// Publish only the browser assets. Netlify deploys server functions separately.
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const publicFiles = [
  'index.html', 'css', 'js', 'images', 'assets', 'img', 'robots.txt',
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
