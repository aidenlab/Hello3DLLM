import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3001;

// Store connected WebSocket clients
const wsClients = new Set();

// Create WebSocket server for browser communication
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('Browser client connected');
  wsClients.add(ws);

  // Handle incoming messages from clients (for testing/debugging)
  ws.on('message', (message) => {
    try {
      const command = JSON.parse(message.toString());
      console.log('Received command from client:', command);
      // Broadcast to all clients (including the sender)
      broadcastToClients(command);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Browser client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast command to all connected browser clients
function broadcastToClients(command) {
  const message = JSON.stringify(command);
  wsClients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Create MCP server
const mcpServer = new McpServer({
  name: '3d-cube-server',
  version: '1.0.0'
});

// Register tool: change_cube_color
mcpServer.registerTool(
  'change_cube_color',
  {
    title: 'Change Cube Color',
    description: 'Change the color of the cube in the 3D scene',
    inputSchema: {
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('Hex color code (e.g., "#ff0000" for red)')
    }
  },
  async ({ color }) => {
    broadcastToClients({
      type: 'changeColor',
      color: color
    });

    return {
      content: [
        {
          type: 'text',
          text: `Cube color changed to ${color}`
        }
      ]
    };
  }
);

// Register tool: change_cube_size
mcpServer.registerTool(
  'change_cube_size',
  {
    title: 'Change Cube Size',
    description: 'Change the uniform size of the cube',
    inputSchema: {
      size: z.number().positive().describe('New size value (uniform scaling)')
    }
  },
  async ({ size }) => {
    broadcastToClients({
      type: 'changeSize',
      size: size
    });

    return {
      content: [
        {
          type: 'text',
          text: `Cube size changed to ${size}`
        }
      ]
    };
  }
);

// Register tool: scale_cube
mcpServer.registerTool(
  'scale_cube',
  {
    title: 'Scale Cube',
    description: 'Scale the cube independently in each dimension (x, y, z)',
    inputSchema: {
      x: z.number().positive().describe('Scale factor for X axis'),
      y: z.number().positive().describe('Scale factor for Y axis'),
      z: z.number().positive().describe('Scale factor for Z axis')
    }
  },
  async ({ x, y, z }) => {
    broadcastToClients({
      type: 'scaleCube',
      x: x,
      y: y,
      z: z
    });

    return {
      content: [
        {
          type: 'text',
          text: `Cube scaled to (${x}, ${y}, ${z})`
        }
      ]
    };
  }
);

// Register tool: change_background_color
mcpServer.registerTool(
  'change_background_color',
  {
    title: 'Change Background Color',
    description: 'Change the background color of the 3D scene',
    inputSchema: {
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('Hex color code (e.g., "#000000" for black, "#ffffff" for white)')
    }
  },
  async ({ color }) => {
    broadcastToClients({
      type: 'changeBackgroundColor',
      color: color
    });

    return {
      content: [
        {
          type: 'text',
          text: `Background color changed to ${color}`
        }
      ]
    };
  }
);

// Set up Express HTTP server for MCP transport
const app = express();
app.use(express.json());

// Enable CORS for ChatGPT and other clients
app.use(
  cors({
    origin: '*', // Allow all origins (restrict in production)
    exposedHeaders: ['Mcp-Session-Id'],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
  })
);

// Map to store transports by session ID
const transports = {};

// Handle POST requests (initialization and tool calls)
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  
  // Log request for debugging
  if (sessionId) {
    console.log(`Received MCP request for session: ${sessionId}, method: ${req.body?.method || 'unknown'}`);
  } else {
    console.log(`Received MCP request (no session), method: ${req.body?.method || 'unknown'}, body:`, JSON.stringify(req.body).substring(0, 200));
  }
  
  try {
    let transport;
    
    if (sessionId && transports[sessionId]) {
      // Reuse existing transport for subsequent requests
      transport = transports[sessionId];
    } else if (sessionId && !transports[sessionId]) {
      // Session ID provided but transport doesn't exist - session expired or lost
      // Allow re-initialization if this is an initialize request
      if (isInitializeRequest(req.body)) {
        console.log(`Session ${sessionId} not found, creating new transport for re-initialization`);
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId, // Reuse the same session ID
          onsessioninitialized: (sid) => {
            console.log(`MCP session re-initialized: ${sid}`);
            transports[sid] = transport;
          }
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            console.log(`MCP session closed: ${sid}`);
            delete transports[sid];
          }
        };

        await mcpServer.connect(transport);
      } else {
        // Session ID exists but transport is missing and not an init request
        // Return 404 as per MCP spec - this tells ChatGPT the session doesn't exist
        console.error(`Session ${sessionId} not found for non-init request`);
        res.status(404).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Session not found'
          },
          id: req.body?.id || null
        });
        return;
      }
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Create new transport for initialization
      console.log('Creating new transport for initialization');
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          console.log(`MCP session initialized: ${sid}`);
          transports[sid] = transport;
        }
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`MCP session closed: ${sid}`);
          delete transports[sid];
        }
      };

      // Connect transport to MCP server
      await mcpServer.connect(transport);
    } else {
      // Invalid request - no session ID or not initialization request
      console.error('Invalid request:', {
        hasSessionId: !!sessionId,
        isInitialize: isInitializeRequest(req.body),
        method: req.body?.method,
        body: JSON.stringify(req.body).substring(0, 200)
      });
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided or invalid initialization request'
        },
        id: req.body?.id || null
      });
      return;
    }

    // Handle the POST request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP POST request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

// Handle GET requests for SSE streams
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  try {
    const transport = transports[sessionId];
    const lastEventId = req.headers['last-event-id'];
    
    if (lastEventId) {
      console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    } else {
      console.log(`Establishing new SSE stream for session ${sessionId}`);
    }
    
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling MCP GET request:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing SSE stream');
    }
  }
});

// Handle DELETE requests for session termination
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  try {
    console.log(`Received session termination request for session ${sessionId}`);
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
});

// Serve static files from dist folder (for unified deployment)
// This must be after all API routes
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, 'dist');

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res) => {
    // Don't serve index.html for MCP routes (shouldn't reach here, but safety check)
    if (req.path.startsWith('/mcp')) {
      return res.status(404).send('Not found');
    }
    res.sendFile(join(distPath, 'index.html'));
  });
}

// Start HTTP server
app.listen(MCP_PORT, () => {
  console.log(`MCP Server listening on http://localhost:${MCP_PORT}/mcp`);
  console.log(`WebSocket server listening on ws://localhost:${WS_PORT}`);
  if (existsSync(distPath)) {
    console.log(`Serving static files from ${distPath}`);
  }
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down servers...');
  
  // Close all WebSocket connections
  wss.close();
  
  // Close all MCP transports
  for (const sessionId in transports) {
    try {
      await transports[sessionId].close();
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  
  await mcpServer.close();
  process.exit(0);
});

