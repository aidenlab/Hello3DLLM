# Hello3DLLM - 3D Cube Visualization with MCP Server

A 3D interactive cube visualization built with Three.js, enhanced with Model Context Protocol (MCP) server capabilities that allow AI assistants and other MCP clients to manipulate the cube in real-time.

## Features

- **Interactive 3D Cube**: Rotate with mouse/touch, zoom with mouse wheel/pinch
- **MCP Server Integration**: Control the cube remotely via MCP tools
- **Real-time Updates**: Changes made through MCP tools are instantly visible in the browser
- **WebSocket Communication**: Bidirectional communication between MCP server and browser app

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the MCP server** (in one terminal):
   ```bash
   npm run mcp:server
   ```
   Server starts on `http://localhost:3000/mcp` (MCP) and `ws://localhost:3001` (WebSocket)

3. **Start the web application** (in another terminal):
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser

4. **Connect an MCP client** (see [Connecting MCP Clients](#connecting-mcp-clients) below)

## Connecting MCP Clients

### Local Clients (Cursor, VS Code, Claude Code)

These clients work with `localhost`, so no additional setup is needed.

#### Cursor

**Option 1: Deeplink (macOS)**
```bash
open 'cursor://anysphere.cursor-deeplink/mcp/install?name=3d-cube-server&config=eyJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAvbWNwIn0='
```

**Option 2: Manual Configuration**
1. Open Cursor Settings → Features → Model Context Protocol
2. Add server configuration:
   ```json
   {
     "mcpServers": {
       "3d-cube-server": {
         "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

#### VS Code

Add to your MCP configuration:
```json
{
  "name": "3d-cube-server",
  "type": "http",
  "url": "http://localhost:3000/mcp"
}
```

#### Claude Code

```bash
claude mcp add --transport http 3d-cube-server http://localhost:3000/mcp
```

#### MCP Inspector

Test the server:
```bash
npx @modelcontextprotocol/inspector
```
Connect to: `http://localhost:3000/mcp`

### ChatGPT (Requires Public Access)

ChatGPT requires a publicly accessible server. See [ChatGPT Setup](#chatgpt-setup) for detailed instructions.

## Using the MCP Tools

Once connected, ask your AI assistant to manipulate the cube using natural language:

- **Change color**: "Change the cube to red" or "Make it blue"
- **Change size**: "Make the cube bigger" or "Set size to 2.5"
- **Scale**: "Stretch horizontally" or "Make it tall and thin"
- **Background**: "Change background to black"
- **Combined**: "Make a red cube that's tall and thin"

The AI will automatically call the appropriate MCP tools, and changes appear in real-time in your browser.

## Available MCP Tools

### `change_cube_color`

Changes the color of the cube.

**Parameters:**
- `color` (string): Hex color code (e.g., `#ff0000` for red)

**Example:**
```json
{
  "name": "change_cube_color",
  "arguments": { "color": "#ff0000" }
}
```

### `change_cube_size`

Changes the uniform size of the cube by recreating its geometry.

**Parameters:**
- `size` (number): New size value (must be positive)

**Note:** This recreates the cube geometry, so it resets to default position and rotation.

**Example:**
```json
{
  "name": "change_cube_size",
  "arguments": { "size": 2.0 }
}
```

### `scale_cube`

Scales the cube independently in each dimension (x, y, z axes).

**Parameters:**
- `x` (number): Scale factor for X axis (must be positive)
- `y` (number): Scale factor for Y axis (must be positive)
- `z` (number): Scale factor for Z axis (must be positive)

**Example:**
```json
{
  "name": "scale_cube",
  "arguments": { "x": 1.5, "y": 1.0, "z": 2.0 }
}
```

### `change_background_color`

Changes the background color of the 3D scene.

**Parameters:**
- `color` (string): Hex color code (e.g., `#000000` for black)

**Example:**
```json
{
  "name": "change_background_color",
  "arguments": { "color": "#000000" }
}
```

## ChatGPT Setup

**Important:** ChatGPT requires a publicly accessible server (not just `localhost`).

### Option A: Using ngrok (Recommended for Testing)

1. **Install ngrok:**
   - Download from https://ngrok.com or `brew install ngrok`

2. **Start ngrok** in a new terminal (keep MCP server running):
   ```bash
   ngrok http 3000
   ```
   For a custom domain (requires free ngrok account):
   ```bash
   ngrok http 3000 --domain=your-name.ngrok-free.app
   ```

3. **Copy the HTTPS URL** from ngrok (e.g., `https://abc123.ngrok-free.app`)

4. **Configure ChatGPT:**
   - Open ChatGPT → Settings → Personalization → Model Context Protocol
   - Add server:
     - **Name**: `3d-cube-server`
     - **URL**: `https://your-ngrok-url.ngrok-free.app/mcp` ⚠️ **Include `/mcp` at the end!**
     - **Transport**: HTTP or Streamable HTTP

5. **Start the web app** (optional but recommended):
   ```bash
   npm run dev
   ```

### Option B: Deploy to Public Service

Deploy to Railway, Render, or Fly.io. Ensure:
- Server runs on the service's assigned port (or use `PORT` env var)
- Endpoint accessible at `https://your-app.railway.app/mcp`

### Troubleshooting

- **404 Not Found**: Make sure URL includes `/mcp` at the end
- **Connection refused**: Verify MCP server is running (`npm run mcp:server`)
- **Tools not available**: Refresh ChatGPT page after adding server
- **Changes not visible**: Ensure web app (`npm run dev`) is running

### Security Note

The server currently allows all origins (`origin: '*'`). For production, restrict CORS:
```javascript
cors({
  origin: ['https://chat.openai.com', 'https://chatgpt.com']
})
```

## Production Deployment

### Hybrid Deployment: Front-End on Netlify + Local MCP Server

**Yes, this scenario works!** You can host the front-end on Netlify while running the MCP server locally, using ngrok tunnels for external access.

**Setup Steps:**

1. **Start your local MCP server:**
   ```bash
   npm run mcp:server
   ```
   Server runs on `http://localhost:3000/mcp` (MCP) and `ws://localhost:3001` (WebSocket)

2. **Create ngrok tunnels:**

   **Terminal 1 - MCP HTTP tunnel (for ChatGPT):**
   ```bash
   ngrok http 3000
   ```
   Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

   **Terminal 2 - WebSocket tunnel (for front-end):**
   ```bash
   ngrok http 3001
   ```
   Copy the HTTPS URL (e.g., `https://xyz789.ngrok-free.app`)
   
   ⚠️ **Important**: ngrok tunnels HTTP/HTTPS, and WebSocket connections work over these tunnels. Use the HTTPS URL with `wss://` protocol.

3. **Configure ChatGPT:**
   - Open ChatGPT → Settings → Personalization → Model Context Protocol
   - Add server:
     - **Name**: `3d-cube-server`
     - **URL**: `https://your-mcp-ngrok-url.ngrok-free.app/mcp` ⚠️ **Include `/mcp` at the end!**
     - **Transport**: HTTP or Streamable HTTP

4. **Deploy front-end to Netlify:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - **Environment Variable**: Set `VITE_WS_URL` to your WebSocket ngrok URL:
     ```
     VITE_WS_URL=wss://your-websocket-ngrok-url.ngrok-free.app
     ```
     ⚠️ **Use `wss://` (not `ws://`) and the HTTPS ngrok URL**

5. **Keep your local server running** while using the application

**Pros:**
- ✅ Free hosting for front-end (Netlify)
- ✅ No backend hosting costs
- ✅ Full control over MCP server
- ✅ Easy to test and iterate locally

**Cons:**
- ❌ Requires your local machine to be running 24/7 for production use
- ❌ Two ngrok tunnels needed (free tier has limits)
- ❌ ngrok free tier URLs change on restart (unless using paid tier with custom domain)
- ❌ Network-dependent (your internet connection must be stable)

**Alternative: Single ngrok tunnel**
If you want to use a single tunnel, you could modify the server to serve both MCP and WebSocket on the same port, but this requires code changes and may complicate the setup.

### Important: Hosting Limitations

**⚠️ The MCP server cannot be hosted on Netlify or Vercel** because:
- These platforms use serverless functions that don't support persistent WebSocket connections
- The MCP server requires long-running SSE (Server-Sent Events) streams
- Serverless functions are stateless and can't maintain in-memory session state
- Custom ports (3000, 3001) are not supported

**✅ The front-end can be hosted on Netlify/Vercel**, but requires a separate backend server for the MCP server and WebSocket.

### Deployment Options

#### Option 1: Separate Hosting (Recommended for Flexibility)

**Front-End on Netlify/Vercel + Backend on Railway/Render/Fly.io**

**Front-End Deployment (Netlify):**

1. **Build Configuration:**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment Variables:**
   - `VITE_WS_URL`: Your backend WebSocket URL (e.g., `wss://your-backend.railway.app` or `wss://your-backend.railway.app:3001`)
   - ⚠️ **Important**: Use `wss://` (secure WebSocket) for HTTPS sites

3. **Deploy:**
   - Connect your repository to Netlify
   - Configure build settings
   - Set the `VITE_WS_URL` environment variable
   - Deploy

**Backend Deployment (Railway/Render/Fly.io):**

1. **Environment Variables:**
   ```bash
   MCP_PORT=3000
   WS_PORT=3001
   NODE_ENV=production
   ```
   - Note: Some platforms use `PORT` instead - check your platform's documentation
   - If your platform assigns a single port, you may need to use the same port for both MCP and WebSocket

2. **Build & Start Commands:**
   - Build command: `npm install && npm run build` (builds front-end for unified serving)
   - Start command: `npm start` (runs `server.js`)

3. **Deploy:**
   - Connect your repository
   - Set environment variables
   - Deploy

4. **Update Front-End WebSocket URL:**
   - After backend deployment, update `VITE_WS_URL` in Netlify to match your backend URL
   - Format: `wss://your-backend-domain.com` (or with port if needed)

#### Option 2: Unified Hosting (Simpler Setup)

**Full Stack on Railway/Render/Fly.io**

Deploy both front-end and backend together on a single platform:

1. **Environment Variables:**
   ```bash
   MCP_PORT=3000
   WS_PORT=3001
   NODE_ENV=production
   VITE_WS_URL=wss://your-app-domain.com  # Or use relative URL detection
   ```

2. **Build & Start Commands:**
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

3. **How It Works:**
   - The server automatically serves static files from `dist/` folder
   - Front-end connects to WebSocket on the same domain
   - Single deployment, simpler configuration

4. **WebSocket URL Configuration:**
   - For same-domain deployment, you can use relative WebSocket URLs or detect the current hostname
   - Update `WebSocketClient.js` if needed to auto-detect the WebSocket URL from the current page location

### Platform-Specific Notes

#### Railway
- ✅ Supports persistent processes and WebSocket
- ✅ Free tier available (with usage limits)
- ✅ Automatic HTTPS
- Set `MCP_PORT` and `WS_PORT` environment variables

#### Render
- ✅ Supports persistent processes and WebSocket
- ✅ Free tier available (spins down after inactivity)
- ✅ Automatic HTTPS
- May need to configure health checks

#### Fly.io
- ✅ Supports persistent processes and WebSocket
- ✅ Free tier available
- ✅ Automatic HTTPS
- Requires `fly.toml` configuration file

#### Netlify (Front-End Only)
- ✅ Excellent for static sites
- ✅ Free tier with generous limits
- ✅ Automatic HTTPS
- ❌ Cannot host MCP server or WebSocket server
- Must set `VITE_WS_URL` to external backend

#### Vercel (Front-End Only)
- ✅ Excellent for static sites
- ✅ Free tier available
- ✅ Automatic HTTPS
- ❌ Cannot host MCP server or WebSocket server
- Must set `VITE_WS_URL` to external backend

### Production Security Checklist

1. **CORS Configuration:**
   ```javascript
   // In server.js, replace:
   cors({ origin: '*' })
   // With:
   cors({
     origin: [
       'https://your-frontend-domain.netlify.app',
       'https://chat.openai.com',
       'https://chatgpt.com'
     ]
   })
   ```

2. **WebSocket Security:**
   - Always use `wss://` (secure WebSocket) in production
   - Ensure your hosting platform provides SSL/TLS certificates

3. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use platform-specific secret management
   - Rotate secrets regularly

4. **Rate Limiting:**
   - Consider adding rate limiting for MCP endpoints
   - Protect against abuse and DDoS attacks

5. **Monitoring:**
   - Set up error tracking (e.g., Sentry)
   - Monitor WebSocket connection health
   - Track MCP session usage

### Testing Production Deployment

1. **Test MCP Endpoint:**
   ```bash
   curl https://your-backend-domain.com/mcp
   ```

2. **Test WebSocket Connection:**
   - Open browser console on your deployed front-end
   - Check for WebSocket connection logs
   - Verify connection uses `wss://` protocol

3. **Test End-to-End:**
   - Connect an MCP client (ChatGPT, Cursor, etc.) to your deployed MCP endpoint
   - Make a tool call (e.g., "change cube color to red")
   - Verify changes appear in the browser

### Troubleshooting Production Issues

**WebSocket Connection Fails:**
- Verify `VITE_WS_URL` is set correctly in front-end deployment
- Check that backend WebSocket server is running
- Ensure firewall/security groups allow WebSocket connections
- Verify SSL certificate is valid (for `wss://`)

**MCP Client Can't Connect:**
- Verify MCP endpoint is accessible: `https://your-backend.com/mcp`
- Check CORS settings allow your MCP client's origin
- Review server logs for connection errors

**Front-End Can't Connect to WebSocket:**
- Check browser console for connection errors
- Verify `VITE_WS_URL` environment variable is set
- Ensure WebSocket URL uses correct protocol (`ws://` vs `wss://`)
- Check that backend WebSocket server is accessible from the front-end domain

**Static Files Not Serving:**
- Verify `npm run build` completed successfully
- Check that `dist/` folder exists in deployment
- Review server logs for static file serving messages

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   MCP Client    │────────▶│  MCP Server   │────────▶│  WebSocket  │
│  (AI Assistant) │         │  (server.js)  │         │   Server    │
└─────────────────┘         └──────────────┘         └─────────────┘
                                      │                       │
                                      │              ┌────────▼────────┐
                                      │              │  Browser App    │
                                      │              │  (Application)  │
                                      │              └────────┬────────┘
                                      │                       │
                                      │              ┌────────▼────────┐
                                      └──────────────▶│  SceneManager   │
                                                     │  (Cube Control)  │
                                                     └─────────────────┘
```

1. **MCP Client** sends tool call requests to the MCP Server
2. **MCP Server** processes the request and broadcasts commands via WebSocket
3. **Browser App** receives WebSocket messages and updates the cube
4. Changes are immediately visible in the 3D scene

## Project Structure

```
Hello3DLLM/
├── server.js                 # MCP server with WebSocket bridge
├── src/
│   ├── Application.js         # Main app with WebSocket integration
│   ├── SceneManager.js        # Scene management with cube manipulation methods
│   ├── WebSocketClient.js    # WebSocket client for browser
│   ├── Cube.js                # Cube class definition
│   ├── CameraController.js    # Camera controls
│   ├── RotationController.js  # Rotation handling
│   └── main.js                # Entry point
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Development

### Environment Variables

**Server Configuration:**
```bash
MCP_PORT=3000 WS_PORT=3001 npm run mcp:server
```

**Front-End Configuration:**
Create a `.env` file in the project root (optional for development):
```bash
# WebSocket URL for front-end connection
# Development: ws://localhost:3001 (default)
# Production: wss://your-backend-domain.com
VITE_WS_URL=ws://localhost:3001
```

The front-end will automatically use `ws://localhost:3001` if `VITE_WS_URL` is not set, making local development seamless.

### Building for Production

```bash
npm run build
npm run preview  # Preview production build
```

### Adding New Tools

When adding a new MCP tool:

1. **Register in `server.js`** using `mcpServer.registerTool()`:
   ```javascript
   mcpServer.registerTool(
     'your_tool_name',
     {
       title: 'Your Tool Title',
       description: 'Description of what the tool does',
       inputSchema: {
         param1: z.string().describe('Parameter description')
       }
     },
     async ({ param1 }) => {
       broadcastToClients({
         type: 'yourCommandType',
         param1: param1
       });
       return { content: [{ type: 'text', text: 'Success' }] };
     }
   );
   ```

2. **Add handler in `src/Application.js`**:
   ```javascript
   case 'yourCommandType':
     this.sceneManager.yourMethod(command.param1);
     break;
   ```

3. **Implement method in `src/SceneManager.js`**:
   ```javascript
   yourMethod(param1) {
     // Your implementation
   }
   ```

4. **Update README** with tool documentation

5. **Restart the MCP server** and refresh your MCP client

See the `change_background_color` tool implementation in the codebase for a complete example.

## Troubleshooting

### WebSocket Connection Issues

- Ensure MCP server is running (`npm run mcp:server`)
- Check that port 3001 is not in use
- Check browser console for connection errors

### MCP Client Connection Issues

- Verify MCP server is running on port 3000
- Check endpoint URL: `http://localhost:3000/mcp`
- Ensure no firewall is blocking the connection

### Cube Not Updating

- Check browser console for WebSocket errors
- Verify browser app is running and connected
- Ensure WebSocket server is running on port 3001

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.
