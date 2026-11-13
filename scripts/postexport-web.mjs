// Post-export for the GitHub Pages demo.
// 1. Inject Open Graph tags into dist/index.html. Link-preview crawlers (WhatsApp, Telegram,
//    Slack) do not run JS, so the tags must be static, with absolute URLs.
// 2. Publish the SPA shell at real 200 paths. Crawlers often ignore content served with a 404 status.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SITE = 'https://growlink-project.github.io/growlink-demo';
const TITLE = 'Growlink — find and book lessons near you';
const DESCRIPTION = 'Interactive prototype: book music and other lessons with teachers in Malaysia. Demo data only.';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const tags = [
  ['name', 'description', DESCRIPTION],
  ['property', 'og:type', 'website'],
  ['property', 'og:site_name', 'Growlink'],
  ['property', 'og:title', TITLE],
  ['property', 'og:description', DESCRIPTION],
  ['property', 'og:url', `${SITE}/`],
  ['property', 'og:image', `${SITE}/og.png`],
  ['property', 'og:image:type', 'image/png'],
  ['property', 'og:image:width', '1200'],
  ['property', 'og:image:height', '630'],
  ['name', 'twitter:card', 'summary_large_image'],
  ['name', 'theme-color', '#0F3D2E'],
]
  .map(([k, n, v]) => `<meta ${k}="${n}" content="${esc(v)}"/>`)
  .join('\n    ');

const file = 'dist/index.html';
const html = readFileSync(file, 'utf8');
if (!html.includes('</head>')) throw new Error('dist/index.html has no </head>');
writeFileSync(file, html.replace('</head>', `    ${tags}\n  </head>`));

copyFileSync(file, 'dist/404.html'); // client-side routes not on disk
mkdirSync('dist/welcome', { recursive: true });
copyFileSync(file, 'dist/welcome/index.html'); // shared entry link, served 200
console.log('og tags injected; 404.html and welcome/index.html written');
