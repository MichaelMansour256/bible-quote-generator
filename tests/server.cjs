// Simple static file server for local testing
const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, 'http://localhost:8000');
    let pathname = decodeURIComponent(parsedUrl.pathname);
    if (pathname === '/') pathname = '/index.html';

    const filePath = path.join(process.cwd(), pathname);
    const ext = path.extname(filePath).toLowerCase();

    if (!filePath.startsWith(process.cwd())) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
        } else {
            res.writeHead(200, {
                'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(data);
        }
    });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log('Server running at http://localhost:' + PORT);
});
