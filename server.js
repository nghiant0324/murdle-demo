// const express = require('express');
// const path = require('path');
// const app = express();
// const PORT = process.env.PORT || 7860;

// // Log request
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// // Phục vụ file tĩnh với header đúng
// app.use('/Build', express.static(path.join(__dirname, 'Build'), {
//   setHeaders: (res, filePath) => {
//     const ext = path.extname(filePath).toLowerCase();
//     switch (ext) {
//       case '.wasm':
//         res.set('Content-Type', 'application/wasm');
//         break;
//       case '.data':
//         res.set('Content-Type', 'application/octet-stream');
//         break;
//       case '.js':
//         res.set('Content-Type', 'application/javascript');
//         break;
//       case '.mem':
//       case '.symbols':
//         res.set('Content-Type', 'application/octet-stream');
//         break;
//       default:
//         break;
//     }
//     res.set('Cross-Origin-Resource-Policy', 'cross-origin');
//   }
// }));

// app.get('/keep-alive', (req, res) => {
//   res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
// });
// // Trang chủ
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// // Fallback
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 7860;
const expressStaticGzip = require('express-static-gzip');

// Log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware phục vụ file nén Brotli
app.use('/Build', expressStaticGzip(path.join(__dirname, 'Build'), {
  enableBrotli: true,           // Bật Brotli
  orderPreference: ['br'],      // Ưu tiên Brotli hơn gzip
  setHeaders: (res, filePath) => {
    // Đặt đúng MIME type dựa trên phần mở rộng của file GỐC
    // (khi file đã giải nén, Unity cần biết loại)
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.wasm') res.set('Content-Type', 'application/wasm');
    else if (ext === '.data') res.set('Content-Type', 'application/octet-stream');
    else if (ext === '.js') res.set('Content-Type', 'application/javascript');
    else if (ext === '.mem' || ext === '.symbols') res.set('Content-Type', 'application/octet-stream');
    // Quan trọng: Cross-Origin
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Keep-alive
app.get('/keep-alive', (req, res) => res.status(200).send('OK'));

// Trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback SPA
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