const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 7860;
const expressStaticGzip = require('express-static-gzip');

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use('/Build', expressStaticGzip(path.join(__dirname, 'Build'), {
  enableBrotli: true,
  orderPreference: ['br'],
  setHeaders: (res, filePath) => {
    const basename = path.basename(filePath);
    const baseWithoutBr = basename.replace(/\.br$/, '');
    if (baseWithoutBr.endsWith('.wasm')) res.set('Content-Type', 'application/wasm');
    else if (baseWithoutBr.endsWith('.data')) res.set('Content-Type', 'application/octet-stream');
    else if (baseWithoutBr.endsWith('.js')) res.set('Content-Type', 'application/javascript');
    else res.set('Content-Type', 'application/octet-stream');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.get('/keep-alive', (req, res) => res.status(200).send('OK'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
  const ext = path.extname(req.url);
  if (ext) {
    console.warn(`[404] File not found: ${req.url}`);
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});