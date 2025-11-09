#!/usr/bin/env node

/**
 * Claude Bridge HTTP/WebSocket Server
 * Provides real-time API for Claude Code CLI to interact with iOS development
 */

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const PORT = process.env.BRIDGE_PORT || 3737;
const BRIDGE_DIR = path.join(__dirname, '../../.claude-bridge');
const STATE_FILE = path.join(BRIDGE_DIR, 'state.json');
const BRIDGE_SCRIPT = path.join(__dirname, 'claude-bridge.sh');

// Ensure bridge directory exists
if (!fs.existsSync(BRIDGE_DIR)) {
  fs.mkdirSync(BRIDGE_DIR, { recursive: true });
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Execute bridge command
async function executeBridge(command, args = []) {
  try {
    const cmd = `bash "${BRIDGE_SCRIPT}" ${command} ${args.join(' ')}`;
    const { stdout, stderr } = await execAsync(cmd);

    // Parse JSON response
    try {
      return JSON.parse(stdout);
    } catch (e) {
      return {
        success: false,
        message: 'Failed to parse bridge response',
        data: { stdout, stderr },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: { error: error.toString() },
    };
  }
}

// Read state file
function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading state:', e);
  }
  return {
    status: 'unknown',
    last_update: new Date().toISOString(),
  };
}

// Watch state file for changes
let stateWatchers = [];

function watchState(callback) {
  const watcher = fs.watch(STATE_FILE, (eventType) => {
    if (eventType === 'change') {
      callback(readState());
    }
  });
  stateWatchers.push(watcher);
  return watcher;
}

// HTTP request handler
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Parse URL
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // Route: GET /
  if (pathname === '/' && req.method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(
      JSON.stringify({
        name: 'Claude Bridge Server',
        version: '1.0.0',
        endpoints: {
          '/': 'API information',
          '/status': 'Get system status',
          '/health': 'Health check',
          '/state': 'Get current state',
          '/command': 'Execute bridge command (POST)',
          '/logs': 'Get logs',
          '/watch': 'WebSocket endpoint for real-time updates',
        },
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Route: GET /status
  if (pathname === '/status' && req.method === 'GET') {
    const result = await executeBridge('status');
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result));
    return;
  }

  // Route: GET /health
  if (pathname === '/health' && req.method === 'GET') {
    const result = await executeBridge('health');
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result));
    return;
  }

  // Route: GET /state
  if (pathname === '/state' && req.method === 'GET') {
    const state = readState();
    res.writeHead(200, corsHeaders);
    res.end(
      JSON.stringify({
        success: true,
        message: 'State retrieved',
        timestamp: new Date().toISOString(),
        data: state,
      })
    );
    return;
  }

  // Route: POST /command
  if (pathname === '/command' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { command, args } = JSON.parse(body);
        const result = await executeBridge(command, args || []);
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, corsHeaders);
        res.end(
          JSON.stringify({
            success: false,
            message: 'Invalid request body',
            data: { error: error.message },
          })
        );
      }
    });
    return;
  }

  // Route: GET /logs
  if (pathname === '/logs' && req.method === 'GET') {
    const source = url.searchParams.get('source') || 'bridge';
    const lines = url.searchParams.get('lines') || '50';
    const result = await executeBridge('logs', [source, lines]);
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result));
    return;
  }

  // Route: POST /quick-dev
  if (pathname === '/quick-dev' && req.method === 'POST') {
    const result = await executeBridge('quick-dev');
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result));
    return;
  }

  // Route: POST /start-metro
  if (pathname === '/start-metro' && req.method === 'POST') {
    const result = await executeBridge('start-metro');
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result));
    return;
  }

  // Route: POST /stop-metro
  if (pathname === '/stop-metro' && req.method === 'POST') {
    const result = await executeBridge('stop-metro');
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result));
    return;
  }

  // Route: POST /reload
  if (pathname === '/reload' && req.method === 'POST') {
    const result = await executeBridge('reload');
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result));
    return;
  }

  // Route: POST /boot-simulator
  if (pathname === '/boot-simulator' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { name } = JSON.parse(body);
        const result = await executeBridge('boot-simulator', name ? [name] : []);
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify(result));
      } catch (error) {
        const result = await executeBridge('boot-simulator');
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify(result));
      }
    });
    return;
  }

  // Route: POST /build
  if (pathname === '/build' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { clean } = JSON.parse(body);
        const result = await executeBridge('build-simulator', [clean ? 'true' : 'false']);
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify(result));
      } catch (error) {
        const result = await executeBridge('build-simulator', ['false']);
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify(result));
      }
    });
    return;
  }

  // Route: Server-Sent Events for real-time updates
  if (pathname === '/watch' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial state
    const initialState = readState();
    res.write(`data: ${JSON.stringify(initialState)}\n\n`);

    // Watch for changes
    const watcher = watchState((newState) => {
      res.write(`data: ${JSON.stringify(newState)}\n\n`);
    });

    // Cleanup on close
    req.on('close', () => {
      watcher.close();
      const index = stateWatchers.indexOf(watcher);
      if (index > -1) {
        stateWatchers.splice(index, 1);
      }
    });

    return;
  }

  // 404 Not Found
  res.writeHead(404, corsHeaders);
  res.end(
    JSON.stringify({
      success: false,
      message: 'Endpoint not found',
      data: { path: pathname },
    })
  );
});

// Start server
server.listen(PORT, '127.0.0.1', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         🌉 Claude Bridge Server                               ║
║                                                               ║
║         Running on: http://127.0.0.1:${PORT}                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Available endpoints:
  GET  /              - API information
  GET  /status        - System status
  GET  /health        - Health check
  GET  /state         - Current state
  POST /command       - Execute command
  GET  /logs          - Get logs
  POST /quick-dev     - Quick dev mode
  POST /start-metro   - Start Metro
  POST /stop-metro    - Stop Metro
  POST /reload        - Hot reload
  POST /boot-simulator - Boot simulator
  POST /build         - Build app
  GET  /watch         - Real-time updates (SSE)

Example usage:
  curl http://127.0.0.1:${PORT}/status
  curl -X POST http://127.0.0.1:${PORT}/quick-dev
  curl -X POST -H "Content-Type: application/json" -d '{"command":"status"}' http://127.0.0.1:${PORT}/command

State file: ${STATE_FILE}
Bridge script: ${BRIDGE_SCRIPT}

Press Ctrl+C to stop
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down Claude Bridge Server...');
  stateWatchers.forEach((watcher) => watcher.close());
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
