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

Customize server ports:
```bash
MCP_PORT=3000 WS_PORT=3001 npm run mcp:server
```

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
