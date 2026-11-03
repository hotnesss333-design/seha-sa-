// For API/Identity/database emulation use `netlify dev --port 8889`.
// This static-only preview never exposes repository data, archives or source.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' });
  if (req.path.startsWith('/api/') || req.path.startsWith('/account/') || req.path.startsWith('/Account/') || /\.php$/i.test(req.path)) return res.status(503).json({ message: 'Use Netlify dev for the secure API' });
  next();
});
app.use(express.static(path.join(root, 'dist'), { dotfiles: 'deny', index: 'index.html' }));
app.use((req, res) => res.status(404).end());
app.listen(3000, '0.0.0.0');
