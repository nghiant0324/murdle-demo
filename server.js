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
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 7860;


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

// Keep-alive route cho bot ping (để giữ server không bị sleep)
app.get('/keep-alive', (req, res) => {
  res.status(200).send('OK');
});

// Trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/debug-files', (req, res) => {
  const buildDir = path.join(__dirname, 'Build');
  fs.readdir(buildDir, (err, files) => {
    if (err) return res.status(500).send(err.message);
    res.json(files);
  });
});

// Fallback: nếu request có đuôi file (e.g., .js, .wasm, .data) mà không tìm thấy -> 404
// Nếu không có đuôi file (SPA routes) -> trả về index.html
app.get('*', (req, res) => {
  const ext = path.extname(req.url);
  if (ext) {
    // Request file với đuôi nhưng không có trong static => 404
    console.warn(`[404] File not found: ${req.url}`);
    return res.status(404).send('File not found');
  }
  // SPA fallback: gửi index.html
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});