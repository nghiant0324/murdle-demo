// const express = require('express');
// const path = require('path');
// const app = express();
// const PORT = process.env.PORT || 7860;
// const expressStaticGzip = require('express-static-gzip');

// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   next();
// });

// app.use((req, res, next) => {
//   res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
//   res.set('Pragma', 'no-cache');
//   res.set('Expires', '0');
//   next();
// });

// app.use('/Build', expressStaticGzip(path.join(__dirname, 'Build'), {
//   enableBrotli: true,
//   orderPreference: ['br'],
//   setHeaders: (res, filePath) => {
//     const basename = path.basename(filePath);
//     const baseWithoutBr = basename.replace(/\.br$/, '');
//     if (baseWithoutBr.endsWith('.wasm')) res.set('Content-Type', 'application/wasm');
//     else if (baseWithoutBr.endsWith('.data')) res.set('Content-Type', 'application/octet-stream');
//     else if (baseWithoutBr.endsWith('.js')) res.set('Content-Type', 'application/javascript');
//     else res.set('Content-Type', 'application/octet-stream');
//     res.set('Cross-Origin-Resource-Policy', 'cross-origin');
//   }
// }));

// app.get('/keep-alive', (req, res) => res.status(200).send('OK'));

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// app.get('*', (req, res) => {
//   const ext = path.extname(req.url);
//   if (ext) {
//     console.warn(`[404] File not found: ${req.url}`);
//     return res.status(404).send('File not found');
//   }
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });



const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 7860;
const expressStaticGzip = require('express-static-gzip');

// ===== 1. ĐỊNH NGHĨA VERSION (có thể override bằng env) =====
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
console.log(`[Server] APP_VERSION = ${APP_VERSION}`);

// ===== 2. TẮT ETAG (tránh cache dạng 304) =====
app.disable('etag');

// ===== 3. LOGGER + LOG VERSION =====
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | version: ${APP_VERSION}`);
  next();
});

// ===== 4. MIDDLEWARE CHỐNG CACHE TỐI ĐA =====
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  // Xóa ETag trong header (phòng trường hợp vẫn còn)
  res.removeHeader('ETag');
  next();
});

// ===== 5. PHỤC VỤ BUILD (vẫn giữ header chống cache) =====
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
    // Cache-control đã được middleware toàn cục set, không cần thêm
  }
}));

// ===== 6. KEEP-ALIVE =====
app.get('/keep-alive', (req, res) => res.status(200).send('OK'));

// ===== 7. TRANG CHỦ - THÊM QUERY STRING VERSION VÀO CÁC LINK BUILD =====
app.get('/', (req, res) => {
  // Đọc file index.html, thay thế tất cả src/href đến /Build/ bằng ?v=APP_VERSION
  const indexPath = path.join(__dirname, 'index.html');
  const fs = require('fs');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) {
      console.error('Lỗi đọc index.html:', err);
      return res.status(500).send('Internal Server Error');
    }
    // Thay thế các đường dẫn tĩnh đến Build (ví dụ: src="/Build/..." -> src="/Build/...?v=1.0.0")
    const modifiedHtml = html.replace(
      /(src|href)=(["'])(\/Build\/[^"']*?)(\?[^"']*)?(["'])/g,
      (match, attr, quote, urlPath, existingQuery, closingQuote) => {
        // Nếu đã có query string thì thay thế hoặc thêm mới
        const separator = urlPath.includes('?') ? '&' : '?';
        return `${attr}=${quote}${urlPath}${separator}v=${APP_VERSION}${closingQuote}`;
      }
    );
    res.send(modifiedHtml);
  });
});

// ===== 8. FALLBACK CHO SPA =====
app.get('*', (req, res) => {
  const ext = path.extname(req.url);
  if (ext) {
    console.warn(`[404] File not found: ${req.url}`);
    return res.status(404).send('File not found');
  }
  // Nếu fallback cũng là index.html, áp dụng thêm query string version
  const indexPath = path.join(__dirname, 'index.html');
  const fs = require('fs');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) return res.status(500).send('Internal Server Error');
    const modifiedHtml = html.replace(
      /(src|href)=(["'])(\/Build\/[^"']*?)(\?[^"']*)?(["'])/g,
      (match, attr, quote, urlPath, existingQuery, closingQuote) => {
        const separator = urlPath.includes('?') ? '&' : '?';
        return `${attr}=${quote}${urlPath}${separator}v=${APP_VERSION}${closingQuote}`;
      }
    );
    res.send(modifiedHtml);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT} (version ${APP_VERSION})`);
});