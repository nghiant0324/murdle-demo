const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 7860;

// Log request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Phục vụ file tĩnh với header đúng
app.use('/Build', express.static(path.join(__dirname, 'Build'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.wasm':
        res.set('Content-Type', 'application/wasm');
        break;
      case '.data':
        res.set('Content-Type', 'application/octet-stream');
        break;
      case '.js':
        res.set('Content-Type', 'application/javascript');
        break;
      case '.mem':
      case '.symbols':
        res.set('Content-Type', 'application/octet-stream');
        break;
      default:
        break;
    }
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});