# Hello3DLLM - 3D Cube Visualization with MCP Server

A 3D interactive cube visualization built with Three.js, enhanced with Model Context Protocol (MCP) server capabilities that allow AI assistants and other MCP clients to manipulate the cube in real-time.

## Features

- **Interactive 3D Cube**: Rotate with mouse/touch, zoom with mouse wheel/pinch
- **MCP Server Integration**: Control the cube remotely via MCP tools
- **Real-time Updates**: Changes made through MCP tools are instantly visible in the browser
- **WebSocket Communication**: Bidirectional communication between MCP server and browser app

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

Install dependencies:
```bash
npm install
```

## Running the Application

### Start the MCP Server

In one terminal, start the MCP server:
```bash
npm run mcp:server
```

The server will start on:
- **MCP HTTP Endpoint**: `http://localhost:3000/mcp`
- **WebSocket Server**: `ws://localhost:3001`

### Start the Web Application

In another terminal, start the Vite development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

## Connecting MCP Clients

### Using MCP Inspector

Test the server using the MCP Inspector:
```bash
npx @modelcontextprotocol/inspector
```

Then connect to: `http://localhost:3000/mcp`

### Using Claude Code

```bash
claude mcp add --transport http 3d-cube-server http://localhost:3000/mcp
```

### Using VS Code

Add to your MCP configuration:
```json
{
  "name": "3d-cube-server",
  "type": "http",
  "url": "http://localhost:3000/mcp"
}
```

### Using Cursor

**Option 1: Use the deeplink (Easiest)**

On macOS, run this command in your terminal:
```bash
open 'cursor://anysphere.cursor-deeplink/mcp/install?name=3d-cube-server&config=eyJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAvbWNwIn0='
```

This will automatically open Cursor and configure the MCP server.

**Option 2: Manual configuration**

1. Open Cursor Settings → Features → Model Context Protocol
2. Click "Add Server" or edit your MCP settings file
3. Add this configuration:
```json
{
  "mcpServers": {
    "3d-cube-server": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Using ChatGPT

**Important:** For ChatGPT to connect, your MCP server must be publicly accessible (not just `localhost`). Follow these steps in order:

#### Step 1: Start the MCP Server Locally

In a terminal, start the MCP server:
```bash
npm run mcp:server
```

You should see:
```
MCP Server listening on http://localhost:3000/mcp
WebSocket server listening on ws://localhost:3001
```

**Keep this terminal running** - the server must stay active for ChatGPT to connect.

#### Step 2: Make the Server Publicly Accessible

You have two options:

**Option A: Using ngrok (Recommended for Testing)**

1. **Install ngrok** (if not already installed):
   - Download from https://ngrok.com
   - Or install via Homebrew: `brew install ngrok`

2. **Start ngrok** in a **new terminal** (keep the MCP server running):
   
   **Basic usage** (random URL):
   ```bash
   ngrok http 3000
   ```
   
   **Using a custom domain** (requires ngrok account):
   ```bash
   ngrok http 3000 --domain=your-custom-name.ngrok-free.app
   ```
   
   Or if you have a reserved domain:
   ```bash
   ngrok http 3000 --domain=your-reserved-domain.ngrok.io
   ```
   
   **Note:** Custom domains require:
   - A free ngrok account (sign up at https://ngrok.com)
   - For `.ngrok-free.app`: Available on free tier
   - For `.ngrok.io`: Requires paid plan with reserved domain

3. **Copy the HTTPS URL** that ngrok provides (e.g., `https://abc123.ngrok-free.app` or your custom domain)
   - This is your public URL that ChatGPT will use
   - **Important:** Use the HTTPS URL, not HTTP
   - **Tip:** If using a custom domain, you can reuse the same URL each time

**Option B: Deploy to a Public Service**

Deploy your server to a service like Railway, Render, or Fly.io. Make sure:
- The server runs on the service's assigned port (or use `PORT` environment variable)
- The endpoint is accessible at `https://your-app.railway.app/mcp` (or similar)

#### Step 3: Configure ChatGPT

1. **Open ChatGPT** in your browser
2. **Go to Settings:**
   - Click your profile icon (bottom left)
   - Select "Settings" → "Personalization" → "Model Context Protocol"
3. **Add the MCP Server:**
   - Click "Add Server" or "Create Server"
   - Enter the following:
     - **Name**: `3d-cube-server` (or any name you prefer)
     - **URL**: 
       - If using ngrok: `https://your-ngrok-url.ngrok-free.app/mcp` (replace with your actual ngrok URL)
       - **CRITICAL:** Make sure to include `/mcp` at the end of the URL!
       - Example: If ngrok shows `https://abc123.ngrok-free.app`, use `https://abc123.ngrok-free.app/mcp`
       - If deployed: `https://your-app.railway.app/mcp` (replace with your actual deployment URL)
     - **Transport**: Select "HTTP" or "Streamable HTTP"
4. **Save** the configuration

**Common Error Fixes:**
- **404 Not Found**: Make sure you added `/mcp` to the end of your ngrok URL
- **Connection refused**: Verify the MCP server is running (`npm run mcp:server`)
- **ngrok URL not working**: Check that ngrok is running and pointing to port 3000

#### Step 4: Start the Web Application (Optional but Recommended)

In another terminal, start the web app so you can see the cube changes:
```bash
npm run dev
```

Open the app in your browser (usually `http://localhost:5173`).

#### Step 5: Use ChatGPT to Control the Cube

Now you can ask ChatGPT to manipulate the cube! For example:
- "Change the cube to red"
- "Make the cube larger"
- "Scale the cube to be 2x wider and 1.5x taller"
- "Change the background to black"

ChatGPT will automatically use the MCP tools, and you'll see the changes in your browser in real-time.

#### Troubleshooting

- **ChatGPT can't connect**: Make sure ngrok is running and the MCP server is running
- **Connection timeout**: Check that your ngrok URL is correct and includes `/mcp` at the end
- **Tools not available**: Restart ChatGPT or refresh the page after adding the server
- **Changes not visible**: Make sure the web app (`npm run dev`) is running and open in your browser

#### Security Note

The current server allows all origins (`origin: '*'`). For production use, restrict CORS to ChatGPT domains:
```javascript
cors({
  origin: ['https://chat.openai.com', 'https://chatgpt.com'],
  // ... other options
})
```

**The server is ChatGPT-compatible** with:
- ✅ CORS enabled for cross-origin requests
- ✅ Streamable HTTP transport support (GET, POST, DELETE)
- ✅ Proper session management
- ✅ Initialization request handling

## Available MCP Tools

### 1. `change_cube_color`

Changes the color of the cube.

**Parameters:**
- `color` (string): Hex color code (e.g., "#ff0000" for red)

**Example:**
```json
{
  "name": "change_cube_color",
  "arguments": {
    "color": "#ff0000"
  }
}
```

**Supported Colors:**
- Red: `#ff0000`
- Green: `#00ff00`
- Blue: `#0000ff`
- Yellow: `#ffff00`
- Purple: `#ff00ff`
- Cyan: `#00ffff`
- White: `#ffffff`
- Any valid 6-digit hex color

### 2. `change_cube_size`

Changes the uniform size of the cube by recreating its geometry.

**Parameters:**
- `size` (number): New size value (must be positive)

**Example:**
```json
{
  "name": "change_cube_size",
  "arguments": {
    "size": 2.0
  }
}
```

**Note:** This recreates the cube geometry, so the cube will appear at its default position and rotation.

### 3. `scale_cube`

Scales the cube independently in each dimension (x, y, z axes).

**Parameters:**
- `x` (number): Scale factor for X axis (must be positive)
- `y` (number): Scale factor for Y axis (must be positive)
- `z` (number): Scale factor for Z axis (must be positive)

**Example:**
```json
{
  "name": "scale_cube",
  "arguments": {
    "x": 1.5,
    "y": 1.0,
    "z": 2.0
  }
}
```

This would make the cube 1.5x wider, keep the height the same, and make it 2x deeper.

### 4. `change_background_color`

Changes the background color of the 3D scene.

**Parameters:**
- `color` (string): Hex color code (e.g., "#000000" for black, "#ffffff" for white)

**Example:**
```json
{
  "name": "change_background_color",
  "arguments": {
    "color": "#000000"
  }
}
```

**Supported Colors:**
- Black: `#000000`
- White: `#ffffff`
- Red: `#ff0000`
- Blue: `#0000ff`
- Green: `#00ff00`
- Any valid 6-digit hex color

## Adding New Tools

When you add a new tool to the MCP server, you need to update several parts of the codebase and propagate the changes to make the tool available to ChatGPT and other MCP clients.

### Step 1: Register the Tool in the MCP Server

Add your new tool registration in `server.js` using `mcpServer.registerTool()`. Follow the pattern of existing tools:

```javascript
mcpServer.registerTool(
  'your_tool_name',
  {
    title: 'Your Tool Title',
    description: 'Description of what the tool does',
    inputSchema: {
      param1: z.string().describe('Parameter description'),
      param2: z.number().describe('Another parameter')
    }
  },
  async ({ param1, param2 }) => {
    // Broadcast command to WebSocket clients
    broadcastToClients({
      type: 'yourCommandType',
      param1: param1,
      param2: param2
    });

    return {
      content: [
        {
          type: 'text',
          text: `Tool executed successfully with ${param1} and ${param2}`
        }
      ]
    };
  }
);
```

### Step 2: Implement the Client-Side Handler

1. **Add handler in `src/Application.js`**:
   Add a case in the `_handleWebSocketCommand()` method:
   ```javascript
   case 'yourCommandType':
     this.sceneManager.yourMethod(command.param1, command.param2);
     break;
   ```

2. **Add method in `src/SceneManager.js`** (or appropriate file):
   Implement the actual functionality:
   ```javascript
   yourMethod(param1, param2) {
     // Your implementation here
   }
   ```

### Step 3: Update the README

Add documentation for your new tool in the "Available MCP Tools" section:
- Tool name and description
- Parameters with types and descriptions
- Example JSON usage
- Any relevant notes or examples

### Step 4: Restart the MCP Server

After making code changes, restart the server to load the new tool:

1. **Stop the current server** (if running):
   - Press `Ctrl+C` in the terminal where the server is running
   - Or find and kill the process: `ps aux | grep "node server.js"` then `kill <PID>`

2. **Start the server again**:
   ```bash
   npm run mcp:server
   ```

3. **Verify the server started**:
   You should see:
   ```
   MCP Server listening on http://localhost:3000/mcp
   WebSocket server listening on ws://localhost:3001
   ```

### Step 5: Make ChatGPT Aware of the New Tool

ChatGPT needs to reconnect to discover new tools. Choose one of these methods:

**Option A: Refresh ChatGPT (Easiest)**
- Simply refresh the ChatGPT page (`Cmd+R` on Mac, `Ctrl+R` on Windows/Linux)
- ChatGPT will automatically reconnect and discover the new tool

**Option B: Reconnect the MCP Server**
1. In ChatGPT, go to **Settings** → **Personalization** → **Model Context Protocol**
2. Find your `3d-cube-server` configuration
3. Temporarily **disable** it, then **re-enable** it
4. Or **remove** and **re-add** the server configuration

**Option C: Wait for Auto-Refresh**
- ChatGPT may periodically refresh its tool list automatically
- If the tool doesn't appear immediately, use Option A or B

### Step 6: Verify the Tool is Available

After refreshing ChatGPT, verify the tool is available:

1. **Ask ChatGPT directly**:
   - "What tools are available from the 3d-cube-server?"
   - ChatGPT should list all tools including your new one

2. **Test the tool**:
   - Try using the tool with a natural language request
   - For example: "Use the [your tool name] tool to..."

### Important Notes

- **If using ngrok**: If your server is behind ngrok, you may need to restart ngrok after restarting the server to ensure a fresh connection
- **Web app must be running**: Make sure your web app (`npm run dev`) is running so you can see the visual changes
- **Tool discovery**: The MCP protocol exposes tools via the `tools/list` method, which ChatGPT calls during initialization. After refreshing, ChatGPT should automatically see all registered tools
- **No code changes needed in ChatGPT**: Once the server exposes the tool and ChatGPT reconnects, it will automatically be available - no ChatGPT configuration changes needed

### Example: Adding the `change_background_color` Tool

As a reference, here's how the `change_background_color` tool was added:

1. **Server registration** (`server.js`):
   ```javascript
   mcpServer.registerTool('change_background_color', {...});
   ```

2. **Client handler** (`src/Application.js`):
   ```javascript
   case 'changeBackgroundColor':
     this.sceneManager.changeBackgroundColor(command.color);
     break;
   ```

3. **SceneManager method** (`src/SceneManager.js`):
   ```javascript
   changeBackgroundColor(color) {
     const hexColor = parseInt(color.replace('#', ''), 16);
     this.scene.background = new THREE.Color(hexColor);
   }
   ```

4. **README documentation**: Added tool documentation in the "Available MCP Tools" section

5. **Server restarted**: Restarted the MCP server to load the new tool

6. **ChatGPT refreshed**: Refreshed ChatGPT to discover the new tool

## Using the MCP Server in Cursor

### Prerequisites

1. **Start the MCP Server** (in one terminal):
   ```bash
   npm run mcp:server
   ```
   You should see: `MCP Server listening on http://localhost:3000/mcp`

2. **Start the Web Application** (in another terminal):
   ```bash
   npm run dev
   ```
   Open the app in your browser (usually `http://localhost:5173`)

3. **Verify the connection** in Cursor:
   - The MCP server should show as connected in Cursor's MCP settings
   - You should see the four tools available: `change_cube_color`, `change_cube_size`, `scale_cube`, and `change_background_color`

### How to Use

Simply **ask Cursor's AI assistant** to manipulate the cube using natural language! The AI will automatically use the MCP tools. For example:

**Change the cube color:**
- "Change the cube to red"
- "Make the cube blue"
- "Set the cube color to #00ff00"

**Change the cube size:**
- "Make the cube bigger"
- "Set the cube size to 2.5"
- "Make the cube smaller, size 0.8"

**Scale the cube:**
- "Stretch the cube horizontally"
- "Make the cube tall and thin"
- "Scale the cube to be 2x wider, 1x tall, and 1.5x deep"

**Change the background color:**
- "Change the background to black"
- "Make the background white"
- "Set the background color to #0000ff"

**Combined requests:**
- "Change the cube to purple and make it twice as large"
- "Make a red cube that's tall and thin"
- "Change the cube to blue and set the background to black"

The AI will automatically call the appropriate MCP tools, and you'll see the changes happen in real-time in your browser!

## Usage Examples

### Example 1: Change Cube to Red
Ask Cursor: *"Change the cube to red"*

The AI will call:
```json
{
  "name": "change_cube_color",
  "arguments": { "color": "#ff0000" }
}
```

### Example 2: Make Cube Larger
Ask Cursor: *"Make the cube bigger, size 2.5"*

The AI will call:
```json
{
  "name": "change_cube_size",
  "arguments": { "size": 2.5 }
}
```

### Example 3: Stretch Cube Horizontally
Ask Cursor: *"Stretch the cube horizontally"*

The AI will call:
```json
{
  "name": "scale_cube",
  "arguments": { "x": 2.0, "y": 1.0, "z": 1.0 }
}
```

### Example 4: Create a Tall Thin Cube
Ask Cursor: *"Make the cube tall and thin"*

The AI will call:
```json
{
  "name": "scale_cube",
  "arguments": { "x": 0.5, "y": 3.0, "z": 0.5 }
}
```

### Example 5: Change Background Color
Ask Cursor: *"Change the background to black"*

The AI will call:
```json
{
  "name": "change_background_color",
  "arguments": { "color": "#000000" }
}
```

### Example 6: Combined Request
Ask Cursor: *"Change the cube to blue and set the background to white"*

The AI will call:
```json
{
  "name": "change_cube_color",
  "arguments": { "color": "#0000ff" }
}
```
and
```json
{
  "name": "change_background_color",
  "arguments": { "color": "#ffffff" }
}
```

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   MCP Client    │────────▶│  MCP Server   │────────▶│  WebSocket  │
│  (AI Assistant) │         │  (server.js)  │         │   Server    │
└─────────────────┘         └──────────────┘         └─────────────┘
                                      │                       │
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
│   ├── SceneManager.js       # Scene management with cube manipulation methods
│   ├── WebSocketClient.js    # WebSocket client for browser
│   ├── Cube.js               # Cube class definition
│   ├── CameraController.js  # Camera controls
│   ├── RotationController.js # Rotation handling
│   └── main.js              # Entry point
├── package.json              # Dependencies and scripts
└── README.md                # This file
```

## Environment Variables

You can customize the server ports using environment variables:

```bash
MCP_PORT=3000 WS_PORT=3001 npm run mcp:server
```

## Troubleshooting

### WebSocket Connection Issues

If the browser app can't connect to the WebSocket server:
1. Ensure the MCP server is running (`npm run mcp:server`)
2. Check that port 3001 is not in use
3. Check browser console for connection errors

### MCP Client Connection Issues

If MCP clients can't connect:
1. Verify the MCP server is running on port 3000
2. Check the endpoint URL: `http://localhost:3000/mcp`
3. Ensure no firewall is blocking the connection

### Cube Not Updating

If MCP tool calls succeed but the cube doesn't update:
1. Check browser console for WebSocket errors
2. Verify the browser app is running and connected
3. Check that the WebSocket server is running on port 3001

## Development

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

