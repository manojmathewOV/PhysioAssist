#!/usr/bin/env node

/**
 * Simple HTTP server for PhysioAssist web demo
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Parse URL
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // Read and serve file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('🏥 PhysioAssist Live Exercise Simulation');
  console.log('========================================');
  console.log('');
  console.log(`✅ Server running at http://localhost:${PORT}/`);
  console.log('');
  console.log('📊 Available exercises:');
  console.log('   • Shoulder Flexion (Forward Lift)');
  console.log('   • Knee Flexion (Lying Down)');
  console.log('   • Elbow Flexion (Bicep Curl)');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});
