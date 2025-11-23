import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { appleCrayonColorsHexStrings } from './src/utils/color/color.js';

// Load environment variables from .env file if it exists
// Using manual parsing instead of dotenv package to avoid any stdout output
// that would interfere with STDIO MCP protocol communication
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

if (existsSync(envPath)) {
  try {
    // Manually parse .env file to avoid any potential stdout output from dotenv package
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      // Skip comments and empty lines
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Parse KEY=VALUE format
      const match = trimmed.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Only set if not already in environment (don't override)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    // Completely silent - .env file is optional and errors should not break the server
    // Any output here would interfere with STDIO MCP protocol communication
  }
}

// Parse command line arguments
function parseCommandLineArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--browser-url' || arg === '-u') {
      args.browserUrl = process.argv[++i];
    } else if (arg.startsWith('--browser-url=')) {
      args.browserUrl = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node server.js [options]

Options:
  --browser-url, -u <url>    Browser URL for the 3D app (e.g., https://your-app.netlify.app)
                             Overrides BROWSER_URL environment variable and .env file
  --help, -h                 Show this help message

Environment Variables:
  BROWSER_URL                Browser URL (used if --browser-url not provided)
                             Can also be set in .env file
  MCP_PORT                   MCP server port (default: 3000)
  WS_PORT                    WebSocket server port (default: 3001)

Configuration Priority:
  1. Command line argument (--browser-url)
  2. Environment variable (BROWSER_URL)
  3. .env file (BROWSER_URL)
  4. Default (http://localhost:5173)

Examples:
  node server.js --browser-url https://my-app.netlify.app
  node server.js -u http://localhost:5173
      `);
      process.exit(0);
    }
  }
  return args;
}

const cliArgs = parseCommandLineArgs();

const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3001;
// Browser URL for the 3D app (Netlify deployment)
// Priority: 1) Command line argument (--browser-url), 2) Environment variable (BROWSER_URL), 
//           3) .env file (BROWSER_URL), 4) Default (localhost)
// Note: dotenv.config() was called earlier, so process.env.BROWSER_URL may come from .env file
const BROWSER_URL = cliArgs.browserUrl || process.env.BROWSER_URL || 'http://localhost:5173';

/**
 * Converts a color input (hex code or Apple crayon color name) to a hex code
 * @param {string} colorInput - Either a hex code (e.g., "#ff0000") or an Apple crayon color name (e.g., "maraschino")
 * @returns {string|null} Hex color code or null if invalid
 */
function normalizeColorToHex(colorInput) {
  if (!colorInput || typeof colorInput !== 'string') {
    return null;
  }
  
  // Check if it's already a hex code
  if (/^#[0-9A-Fa-f]{6}$/.test(colorInput)) {
    return colorInput.toLowerCase();
  }
  
  // Normalize the input: lowercase, trim, and handle variations
  let normalizedName = colorInput.toLowerCase().trim();
  
  // Handle "sea foam" variations (with space, without space, with hyphen)
  if (normalizedName === 'seafoam' || normalizedName === 'sea-foam') {
    normalizedName = 'sea foam';
  }
  
  // Try to find it as an Apple crayon color name
  const hexColor = appleCrayonColorsHexStrings.get(normalizedName);
  
  if (hexColor) {
    return hexColor.toLowerCase();
  }
  
  return null;
}

// Store connected WebSocket clients by session ID
// Map<sessionId, WebSocket>
const wsClients = new Map();

// Create WebSocket server for browser communication
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.warn('Browser client connected (waiting for session ID)');
  let sessionId = null;

  // Handle incoming messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // First message should be session registration
      if (data.type === 'registerSession' && data.sessionId) {
        sessionId = data.sessionId;
        wsClients.set(sessionId, ws);
        console.warn(`Browser client registered with session ID: ${sessionId}`);
        
        // Send confirmation
        ws.send(JSON.stringify({
          type: 'sessionRegistered',
          sessionId: sessionId
        }));
      } else if (sessionId) {
        // Handle other messages (for testing/debugging)
        console.warn(`Received command from client (session ${sessionId}):`, data);
        // Note: We no longer broadcast client-to-client messages
        // If needed, this could route to a specific session
      } else {
        console.warn('Received message from unregistered client');
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Session not registered. Please send registerSession message first.'
        }));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    if (sessionId) {
      console.warn(`Browser client disconnected (session: ${sessionId})`);
      wsClients.delete(sessionId);
    } else {
      console.warn('Browser client disconnected (unregistered)');
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error (session: ${sessionId || 'unregistered'}):`, error);
  });
});

// Send command to a specific session's browser client
function sendToSession(sessionId, command) {
  const ws = wsClients.get(sessionId);
  if (ws && ws.readyState === 1) { // WebSocket.OPEN
    const message = JSON.stringify(command);
    ws.send(message);
    return true;
  } else {
    console.warn(`No active WebSocket connection found for session: ${sessionId}`);
    return false;
  }
}

// Request-scoped context for current session ID using AsyncLocalStorage
// This maintains context across async operations
const sessionContext = new AsyncLocalStorage();

// Helper function for tool handlers to route commands to the current request's session
function routeToCurrentSession(command) {
  const sessionId = sessionContext.getStore();
  if (sessionId) {
    console.error(`Routing command to session: ${sessionId}`, command.type);
    sendToSession(sessionId, command);
  } else if (isStdioMode) {
    // In STDIO mode, broadcast to all connected clients
    console.error('Routing command in STDIO mode - broadcasting to all clients:', command.type);
    if (wsClients.size > 0) {
      broadcastToClients(command);
    } else {
      console.error('No WebSocket clients connected. Command not routed:', command.type);
    }
  } else {
    console.warn('Tool handler called but no session context available. Command not routed.');
    console.warn('Current request session ID:', sessionId);
  }
}

// Broadcast command to all connected browser clients (kept for backward compatibility if needed)
function broadcastToClients(command) {
  const message = JSON.stringify(command);
  wsClients.forEach((client, sessionId) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Create MCP server
const mcpServer = new McpServer({
  name: '3d-model-server',
  version: '1.0.0'
});

// Create a list of available Apple crayon color names for the description
const availableColorNames = Array.from(appleCrayonColorsHexStrings.keys()).join(', ');

// Zod schema for color input - accepts hex codes or Apple crayon color names
const colorSchema = z.string().refine(
  (val) => {
    // Accept hex codes
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      return true;
    }
    // Accept Apple crayon color names (case-insensitive)
    let normalizedName = val.toLowerCase().trim();
    // Handle "sea foam" variations
    if (normalizedName === 'seafoam' || normalizedName === 'sea-foam') {
      normalizedName = 'sea foam';
    }
    return appleCrayonColorsHexStrings.has(normalizedName);
  },
  {
    message: `Must be a hex color code (e.g., "#ff0000") or an Apple crayon color name. Available colors: ${availableColorNames}`
  }
).describe(`Hex color code (e.g., "#ff0000") or Apple crayon color name (e.g., "maraschino", "turquoise", "lemon"). Available colors: ${availableColorNames}`);

// Register tool: change_model_color
mcpServer.registerTool(
  'change_model_color',
  {
    title: 'Change Model Color',
    description: 'Change the color of the 3D model in the scene',
    inputSchema: {
      color: colorSchema
    }
  },
  async ({ color }) => {
    const hexColor = normalizeColorToHex(color);
    if (!hexColor) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid color: ${color}. Please use a hex code (e.g., "#ff0000") or an Apple crayon color name.`
          }
        ],
        isError: true
      };
    }

    routeToCurrentSession({
      type: 'changeColor',
      color: hexColor
    });

    const displayName = /^#[0-9A-Fa-f]{6}$/.test(color) ? hexColor : `${color} (${hexColor})`;
    return {
      content: [
        {
          type: 'text',
          text: `Model color changed to ${displayName}`
        }
      ]
    };
  }
);

// Register tool: change_model_size
mcpServer.registerTool(
  'change_model_size',
  {
    title: 'Change Model Size',
    description: 'Change the uniform size of the 3D model',
    inputSchema: {
      size: z.number().positive().describe('New size value (uniform scaling)')
    }
  },
  async ({ size }) => {
    routeToCurrentSession({
      type: 'changeSize',
      size: size
    });

    return {
      content: [
        {
          type: 'text',
          text: `Model size changed to ${size}`
        }
      ]
    };
  }
);

// Register tool: scale_model
mcpServer.registerTool(
  'scale_model',
  {
    title: 'Scale Model',
    description: 'Scale the 3D model independently in each dimension (x, y, z)',
    inputSchema: {
      x: z.number().positive().describe('Scale factor for X axis'),
      y: z.number().positive().describe('Scale factor for Y axis'),
      z: z.number().positive().describe('Scale factor for Z axis')
    }
  },
  async ({ x, y, z }) => {
    routeToCurrentSession({
      type: 'scaleModel',
      x: x,
      y: y,
      z: z
    });

    return {
      content: [
        {
          type: 'text',
          text: `Model scaled to (${x}, ${y}, ${z})`
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
      color: colorSchema
    }
  },
  async ({ color }) => {
    const hexColor = normalizeColorToHex(color);
    if (!hexColor) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid color: ${color}. Please use a hex code (e.g., "#000000") or an Apple crayon color name.`
          }
        ],
        isError: true
      };
    }

    routeToCurrentSession({
      type: 'changeBackgroundColor',
      color: hexColor
    });

    const displayName = /^#[0-9A-Fa-f]{6}$/.test(color) ? hexColor : `${color} (${hexColor})`;
    return {
      content: [
        {
          type: 'text',
          text: `Background color changed to ${displayName}`
        }
      ]
    };
  }
);

// Key light control tools
mcpServer.registerTool(
  'set_key_light_intensity',
  {
    title: 'Set Key Light Intensity',
    description: 'Set the intensity of the key light (main light source)',
    inputSchema: {
      intensity: z.number().nonnegative().describe('Light intensity value (0.0 or higher)')
    }
  },
  async ({ intensity }) => {
    routeToCurrentSession({
      type: 'setKeyLightIntensity',
      intensity: intensity
    });

    return {
      content: [
        {
          type: 'text',
          text: `Key light intensity set to ${intensity}`
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'set_key_light_color',
  {
    title: 'Set Key Light Color',
    description: 'Set the color of the key light',
    inputSchema: {
      color: colorSchema
    }
  },
  async ({ color }) => {
    const hexColor = normalizeColorToHex(color);
    if (!hexColor) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid color: ${color}. Please use a hex code (e.g., "#ffffff") or an Apple crayon color name.`
          }
        ],
        isError: true
      };
    }

    routeToCurrentSession({
      type: 'setKeyLightColor',
      color: hexColor
    });

    const displayName = /^#[0-9A-Fa-f]{6}$/.test(color) ? hexColor : `${color} (${hexColor})`;
    return {
      content: [
        {
          type: 'text',
          text: `Key light color changed to ${displayName}`
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'swing_key_light_up',
  {
    title: 'Swing Key Light Up',
    description: 'Rotate the key light upward in an arc around the center of the model',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'swingKeyLightUp'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Key light swung up'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'swing_key_light_down',
  {
    title: 'Swing Key Light Down',
    description: 'Rotate the key light downward in an arc around the center of the model',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'swingKeyLightDown'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Key light swung down'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'swing_key_light_left',
  {
    title: 'Swing Key Light Left',
    description: 'Rotate the key light leftward in an arc around the center of the model',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'swingKeyLightLeft'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Key light swung left'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'swing_key_light_right',
  {
    title: 'Swing Key Light Right',
    description: 'Rotate the key light rightward in an arc around the center of the model',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'swingKeyLightRight'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Key light swung right'
        }
      ]
    };
  }
);

// Fill light control tools
mcpServer.registerTool(
  'set_fill_light_intensity',
  {
    title: 'Set Fill Light Intensity',
    description: 'Set the intensity of the fill light (shadow-filling light)',
    inputSchema: {
      intensity: z.number().nonnegative().describe('Light intensity value (0.0 or higher)')
    }
  },
  async ({ intensity }) => {
    routeToCurrentSession({
      type: 'setFillLightIntensity',
      intensity: intensity
    });

    return {
      content: [
        {
          type: 'text',
          text: `Fill light intensity set to ${intensity}`
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'set_fill_light_color',
  {
    title: 'Set Fill Light Color',
    description: 'Set the color of the fill light',
    inputSchema: {
      color: colorSchema
    }
  },
  async ({ color }) => {
    const hexColor = normalizeColorToHex(color);
    if (!hexColor) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid color: ${color}. Please use a hex code (e.g., "#ffffff") or an Apple crayon color name.`
          }
        ],
        isError: true
      };
    }

    routeToCurrentSession({
      type: 'setFillLightColor',
      color: hexColor
    });

    const displayName = /^#[0-9A-Fa-f]{6}$/.test(color) ? hexColor : `${color} (${hexColor})`;
    return {
      content: [
        {
          type: 'text',
          text: `Fill light color changed to ${displayName}`
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'swing_fill_light_up',
  {
    title: 'Swing Fill Light Up',
    description: 'Rotate the fill light upward in an arc around the center of the model',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'swingFillLightUp'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Fill light swung up'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'swing_fill_light_down',
  {
    title: 'Swing Fill Light Down',
    description: 'Rotate the fill light downward in an arc around the center of the model',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'swingFillLightDown'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Fill light swung down'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'swing_fill_light_left',
  {
    title: 'Swing Fill Light Left',
    description: 'Rotate the fill light leftward in an arc around the center of the model',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'swingFillLightLeft'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Fill light swung left'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'swing_fill_light_right',
  {
    title: 'Swing Fill Light Right',
    description: 'Rotate the fill light rightward in an arc around the center of the model',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'swingFillLightRight'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Fill light swung right'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'walk_key_light_in',
  {
    title: 'Walk Key Light In',
    description: 'Move the key light closer to the center of the model along the axis from the model origin',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'walkKeyLightIn'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Key light walked in'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'walk_key_light_out',
  {
    title: 'Walk Key Light Out',
    description: 'Move the key light farther from the center of the model along the axis from the model origin',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'walkKeyLightOut'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Key light walked out'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'walk_fill_light_in',
  {
    title: 'Walk Fill Light In',
    description: 'Move the fill light closer to the center of the model along the axis from the model origin',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'walkFillLightIn'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Fill light walked in'
        }
      ]
    };
  }
);

mcpServer.registerTool(
  'walk_fill_light_out',
  {
    title: 'Walk Fill Light Out',
    description: 'Move the fill light farther from the center of the model along the axis from the model origin',
    inputSchema: {}
  },
  async () => {
    routeToCurrentSession({
      type: 'walkFillLightOut'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Fill light walked out'
        }
      ]
    };
  }
);

// Register tool: get_browser_connection_url
mcpServer.registerTool(
  'get_browser_connection_url',
  {
    title: 'Get Browser Connection URL',
    description: 'Get the URL to open in your browser to connect the 3D visualization app. Use this when users ask how to connect or how to open the 3D app.',
    inputSchema: {}
  },
  async () => {
    // In STDIO mode, use the fixed STDIO session ID
    // In HTTP mode, get session ID from context
    let sessionId;
    if (isStdioMode) {
      sessionId = STDIO_SESSION_ID;
    } else {
      sessionId = sessionContext.getStore();
    }
    
    if (!sessionId) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: No active session found. Please ensure the MCP connection is properly initialized.'
          }
        ],
        isError: true
      };
    }

    const connectionUrl = `${BROWSER_URL}?sessionId=${sessionId}`;
    
    return {
      content: [
        {
          type: 'text',
          text: `To connect your browser to the 3D visualization app, open this URL:\n\n${connectionUrl}\n\nCopy and paste this URL into your web browser to begin interacting with the 3D scene.`
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

// Detect if we're running in STDIO mode (subprocess) or HTTP mode
// If stdin is NOT a TTY, we're being run as a subprocess (STDIO mode)
// If stdin IS a TTY, we're running manually (HTTP mode)
const isStdioMode = !process.stdin.isTTY;

// Map to store transports by session ID (for HTTP mode)
const transports = {};

// For STDIO mode, use a fixed session ID since we don't have HTTP sessions
const STDIO_SESSION_ID = 'stdio-session';

// If running in STDIO mode (subprocess), set up STDIO transport
if (isStdioMode) {
  console.error('Running in STDIO mode (subprocess)');
  const stdioTransport = new StdioServerTransport();
  
  // Connect MCP server to STDIO transport
  mcpServer.connect(stdioTransport).catch((error) => {
    console.error('Error connecting MCP server to STDIO transport:', error);
    process.exit(1);
  });
  
  // In STDIO mode, route tool calls to all connected WebSocket clients
  // We'll modify the tool handlers to broadcast instead of using session context
  console.error('MCP server connected via STDIO transport');
  console.error('WebSocket server listening on ws://localhost:3001');
  console.error(`Browser URL configured: ${BROWSER_URL}`);
  console.error(`STDIO session ID: ${STDIO_SESSION_ID}`);
} else {
  console.error('Running in HTTP/SSE mode');
}

// Handle POST requests (initialization and tool calls) - only in HTTP mode
if (!isStdioMode) {
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  
  // Log request for debugging (use stderr to avoid interfering with MCP protocol on stdout)
  if (sessionId) {
    console.error(`Received MCP request for session: ${sessionId}, method: ${req.body?.method || 'unknown'}`);
  } else {
    console.error(`Received MCP request (no session), method: ${req.body?.method || 'unknown'}, body:`, JSON.stringify(req.body).substring(0, 200));
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
        console.error(`Session ${sessionId} not found, creating new transport for re-initialization`);
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId, // Reuse the same session ID
          onsessioninitialized: (sid) => {
            console.error(`MCP session re-initialized: ${sid}`);
            transports[sid] = transport;
          }
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            console.error(`MCP session closed: ${sid}`);
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
      console.error('Creating new transport for initialization');
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          console.error(`MCP session initialized: ${sid}`);
          transports[sid] = transport;
        }
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.error(`MCP session closed: ${sid}`);
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

    // Use AsyncLocalStorage to maintain session context across async operations
    // This ensures tool handlers can access the sessionId even when called asynchronously
    try {
      await sessionContext.run(sessionId || null, async () => {
        console.error(`Setting request context for session: ${sessionId || 'null'}`);

        // Detect tool calls and notify WebSocket clients
        if (req.body?.method === 'tools/call' && req.body?.params?.name) {
          const toolName = req.body.params.name;
          console.error(`MCP tool called: ${toolName} (session: ${sessionId || 'unknown'})`);
          
          // Send tool call notification to specific session's browser client
          if (sessionId) {
            const sent = sendToSession(sessionId, {
              type: 'toolCall',
              toolName: toolName,
              timestamp: Date.now()
            });
            if (!sent) {
              console.warn(`Tool call notification not sent - no browser connected for session: ${sessionId}`);
            }
          }
        }

        // Handle the POST request - tool handlers will be called during this
        // The sessionContext will maintain the sessionId across all async operations
        await transport.handleRequest(req, res, req.body);
        
        console.error(`Request handling complete for session: ${sessionId || 'null'}`);
      });
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
  } catch (error) {
    console.error('Error in MCP POST handler (transport setup):', error);
    
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
}

// Handle GET requests for SSE streams - only in HTTP mode
if (!isStdioMode) {
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
      console.error(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    } else {
      console.error(`Establishing new SSE stream for session ${sessionId}`);
    }
    
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling MCP GET request:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing SSE stream');
    }
  }
});
}

// Handle DELETE requests for session termination - only in HTTP mode
if (!isStdioMode) {
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  try {
    console.error(`Received session termination request for session ${sessionId}`);
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
});
}

// Serve static files from dist folder (for unified deployment) - only in HTTP mode
if (!isStdioMode) {
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
    // Use console.error for startup messages to avoid interfering with MCP protocol on stdout
    console.error(`MCP Server listening on http://localhost:${MCP_PORT}/mcp`);
    console.error(`WebSocket server listening on ws://localhost:${WS_PORT}`);
    console.error(`Browser URL configured: ${BROWSER_URL}`);
    if (existsSync(distPath)) {
      console.error(`Serving static files from ${distPath}`);
    }
  });
}

// Handle server shutdown
process.on('SIGINT', async () => {
  console.warn('Shutting down servers...');
  
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

