# Add MCP Server Capabilities to 3D App

## Overview
Create an MCP server that communicates with the browser-based 3D app to manipulate the cube. The server will run in Node.js and communicate with the browser app via WebSocket.

## Architecture
- **MCP Server** (`server.js`): Node.js server using the TypeScript SDK (via JavaScript) that exposes tools for cube manipulation
- **WebSocket Bridge**: Communication layer between MCP server and browser app
- **Browser Integration**: Modify `Application.js` to listen for WebSocket commands and update the cube

## Implementation Steps

### 1. Install Dependencies
Add to `package.json`:
- `@modelcontextprotocol/sdk` (from the TypeScript SDK workspace or npm)
- `express` (for HTTP transport)
- `ws` (for WebSocket server)
- `zod` (for schema validation in JavaScript)

### 2. Create MCP Server (`server.js`)
- Import `McpServer` and `StreamableHTTPServerTransport` from the SDK
- Create WebSocket server on port 3001 for browser communication
- Create Express HTTP server on port 3000 for MCP transport
- Register three MCP tools:
  - `change_cube_color`: Accepts hex color string (e.g., "#ff0000")
  - `change_cube_size`: Accepts single size value (uniform scaling)
  - `scale_cube`: Accepts x, y, z scale values (independent scaling)
- Each tool sends commands via WebSocket to connected browser clients

### 3. Create WebSocket Client Module (`src/WebSocketClient.js`)
- Connect to WebSocket server (ws://localhost:3001)
- Handle incoming commands: `changeColor`, `changeSize`, `scaleCube`
- Expose methods to send commands to the MCP server

### 4. Modify Application.js
- Import and initialize `WebSocketClient`
- Store reference to `SceneManager` for cube access
- Add methods to handle cube manipulation:
  - `changeCubeColor(color)`: Update `cube.material.color`
  - `changeCubeSize(size)`: Recreate geometry or scale mesh uniformly
  - `scaleCube(x, y, z)`: Update `cube.mesh.scale.set(x, y, z)`

### 5. Modify SceneManager.js
- Expose method to get cube instance (not just mesh) for full manipulation access
- Or add helper methods for cube manipulation

### 6. Update package.json Scripts
- Add `"mcp:server": "node server.js"` script
- Optionally add script to run both Vite dev server and MCP server concurrently

## Key Files to Modify/Create

**New Files:**
- `server.js` - MCP server with WebSocket bridge
- `src/WebSocketClient.js` - Browser WebSocket client

**Modified Files:**
- `package.json` - Add dependencies and scripts
- `src/Application.js` - Add WebSocket integration and cube manipulation handlers
- `src/SceneManager.js` - Expose cube access methods if needed

## Technical Details

### MCP Tool Schemas (using zod in JavaScript)
```javascript
// change_cube_color
{ color: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }

// change_cube_size  
{ size: z.number().positive() }

// scale_cube
{ x: z.number().positive(), y: z.number().positive(), z: z.number().positive() }
```

### WebSocket Protocol
Commands sent from MCP server to browser:
```json
{ "type": "changeColor", "color": "#ff0000" }
{ "type": "changeSize", "size": 2.0 }
{ "type": "scaleCube", "x": 1.5, "y": 1.0, "z": 2.0 }
```

### Cube Manipulation
- **Color**: `cube.material.color.setHex(parseInt(color.replace('#', ''), 16))`
- **Size**: Recreate `BoxGeometry` with new size or use uniform scale
- **Scale**: `cube.mesh.scale.set(x, y, z)`

## Notes
- The MCP server uses the TypeScript SDK but is written in JavaScript (zod works in JS)
- WebSocket allows real-time bidirectional communication
- The server can handle multiple browser clients simultaneously
- Cube changes will be visible immediately in the browser

