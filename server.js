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

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/Build', expressStaticGzip(path.join(__dirname, 'Build'), {
  enableBrotli: true,
  orderPreference: ['br'],
  setHeaders: (res, filePath) => {
    // Lấy tên file (không đường dẫn)
    const basename = path.basename(filePath);
    // Loại bỏ phần mở rộng .br nếu có
    const baseWithoutBr = basename.replace(/\.br$/, '');
    // Xác định Content-Type dựa trên phần mở rộng thực tế (sau khi bỏ .br)
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