#!/usr/bin/env node
/**
 * IndexNow submission helper for TiRKiO (https://tirkio.com/)
 *
 * Usage examples:
 *   INDEXNOW_KEY="<your-key>" node scripts/indexnow-submit.js https://tirkio.com/beispiel-url/
 *   INDEXNOW_KEY="<your-key>" INDEXNOW_URLS="https://tirkio.com/a/,https://tirkio.com/b/" node scripts/indexnow-submit.js
 *   node scripts/indexnow-submit.js https://tirkio.com/beispiel-url/ (uses bundled key fallback)
 *
 * Environment variables:
 *   INDEXNOW_KEY  (optional) - overrides the bundled IndexNow key
 *   INDEXNOW_HOST (optional) - defaults to "tirkio.com"
 *   INDEXNOW_URLS (optional) - comma-separated list of URLs if not passed as CLI args
 */

const https = require('https');
const fs = require('fs');

const fallbackKeyPath = `${__dirname}/../9ec41ad1867b4fef9b81dbf85726ccd4.txt`;
const envKey = process.env.INDEXNOW_KEY;
const key = envKey || (fs.existsSync(fallbackKeyPath) ? fs.readFileSync(fallbackKeyPath, 'utf8').trim() : '');
const host = process.env.INDEXNOW_HOST || 'tirkio.com';
const cliUrls = process.argv.slice(2);
const envUrls = (process.env.INDEXNOW_URLS || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);
const urlList = cliUrls.length ? cliUrls : envUrls;

if (!key) {
  console.error('INDEXNOW_KEY is required');
  process.exit(1);
}

if (urlList.length === 0) {
  console.error('Provide at least one URL via CLI args or INDEXNOW_URLS');
  process.exit(1);
}

const payload = JSON.stringify({
  host,
  key,
  keyLocation: `https://${host}/${key}.txt`,
  urlList,
});

const requestOptions = {
  method: 'POST',
  hostname: 'api.indexnow.org',
  path: '/indexnow',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = https.request(requestOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`IndexNow submission succeeded (${res.statusCode})`);
    } else {
      console.error(`IndexNow submission failed (${res.statusCode}): ${data}`);
    }
  });
});

req.on('error', (err) => {
  console.error('IndexNow submission error:', err.message);
});

req.write(payload);
req.end();
