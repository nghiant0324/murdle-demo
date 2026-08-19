const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression'); // cài: npm install compression
const app = express();
const PORT = process.env.PORT || 7860;

// Bật nén gzip cho tất cả response (giảm dung lượng tải)
app.use(compression({ threshold: 0 }));

// Log request với timestamp và method/url
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware log đường dẫn file static (debug)
app.use('/Build', (req, res, next) => {
  const filePath = path.join(__dirname, 'Build', req.path);
  console.log(`[Static] Requested: ${req.path} -> looking for ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[Static] File NOT FOUND: ${filePath}`);
  }
  next();
});

// Phục vụ file tĩnh với header đúng và ép cache
app.use('/Build', express.static(path.join(__dirname, 'Build'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    
    // Thiết lập Content-Type và Cache-Control cho từng loại
    switch (ext) {
      case '.wasm':
        res.set('Content-Type', 'application/wasm');
        // Cache mạnh 1 năm (không cần xác thực lại)
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.data':
        res.set('Content-Type', 'application/octet-stream');
        // Cache mạnh 1 năm cho file 250MB
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.js':
        res.set('Content-Type', 'application/javascript');
        // Cache 1 ngày cho JS (có thể thay đổi thường xuyên hơn)
        res.set('Cache-Control', 'public, max-age=86400');
        break;
      case '.mem':
      case '.symbols':
        res.set('Content-Type', 'application/octet-stream');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      default:
        // Các file khác (html, css, ...) cache 1 giờ
        res.set('Cache-Control', 'public, max-age=3600');
        break;
    }
    
    // Cho phép chia sẻ tài nguyên cross-origin (nếu cần)
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    // Giữ nguyên ETag mặc định của express.static (vẫn hữu ích nếu có cache validation)
  }
}));

// Keep-alive route cho bot ping
app.get('/keep-alive', (req, res) => {
  res.status(200).send('OK');
});

// Trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Debug: danh sách file trong Build
app.get('/debug-files', (req, res) => {
  const buildDir = path.join(__dirname, 'Build');
  fs.readdir(buildDir, (err, files) => {
    if (err) return res.status(500).send(err.message);
    res.json(files);
  });
});

// Fallback: nếu request có đuôi file (e.g., .js, .wasm, .data) mà không tìm thấy -> 404
app.get('*', (req, res) => {
  const ext = path.extname(req.url);
  if (ext) {
    console.warn(`[404] File not found: ${req.url}`);
    return res.status(404).send('File not found');
  }
  // SPA fallback: gửi index.html
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});