# Connecting Cursor to Your MCP Server

Since your Netlify app is already connected to the WebSocket, you now need to connect Cursor to the MCP HTTP endpoint.

## Quick Setup

### Step 1: Find Your MCP Server URL

Your MCP server should be accessible at a tunneled URL. Since your WebSocket is tunneled, you likely have:

- **MCP HTTP endpoint**: `https://your-tunnel-url.ngrok-free.app/mcp` or `https://hello3dllm-mcpserver.loca.lt/mcp`
- The URL should end with `/mcp`

### Step 2: Configure Cursor

#### Option A: Using the Helper Script (Easiest)

```bash
cd /Users/turner/MCPDevelopment/Hello3DLLM
./helpful/configure-cursor-mcp.sh https://your-tunnel-url.ngrok-free.app/mcp
```

Replace `https://your-tunnel-url.ngrok-free.app/mcp` with your actual MCP tunnel URL.

#### Option B: Manual Configuration

1. **Open Cursor Settings**
   - Press `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
   - Or go to: **Cursor** → **Settings**

2. **Navigate to MCP Settings**
   - Go to **Features** → **Model Context Protocol**

3. **Add Server Configuration**
   - Click **Add Server** or edit the MCP servers JSON
   - Add this configuration:

```json
{
  "mcpServers": {
    "3d-model-server": {
      "url": "https://your-tunnel-url.ngrok-free.app/mcp"
    }
  }
}
```

Replace `https://your-tunnel-url.ngrok-free.app/mcp` with your actual MCP tunnel URL.

4. **Save and Restart Cursor**
   - Save the configuration
   - Restart Cursor to apply changes

### Step 3: Verify Connection

1. **Check Cursor Status**
   - Look for MCP server status in Cursor's status bar or settings
   - Should show "connected" or similar

2. **Test the Connection**
   - In Cursor's chat, try: "Change the model color to red"
   - The 3D model in your Netlify app should change color

## Troubleshooting

### Cursor Can't Connect

- ✅ **Verify MCP server is running**: Check that your MCP server (`npm run mcp:server`) is running
- ✅ **Check tunnel is active**: Ensure your MCP tunnel (port 3000) is still running
- ✅ **Verify URL format**: URL must end with `/mcp` and use `https://` (not `http://`)
- ✅ **Check firewall**: Ensure port 3000 is accessible through the tunnel

### Tools Not Available

- ✅ **Restart Cursor**: After adding the server, restart Cursor completely
- ✅ **Check server logs**: Look at your MCP server terminal for connection attempts
- ✅ **Verify server name**: Use `3d-model-server` as the server name

### Changes Not Appearing in Browser

- ✅ **Verify WebSocket connection**: Check that your Netlify app shows "connected" status
- ✅ **Check browser console**: Look for WebSocket messages in the browser console
- ✅ **Verify MCP server is broadcasting**: Check MCP server logs for tool calls

## Common Tunnel URLs

### If using ngrok:
```
https://abc123.ngrok-free.app/mcp
```

### If using localtunnel:
```
https://hello3dllm-mcpserver.loca.lt/mcp
```

## Testing the Full Flow

Once connected, try these commands in Cursor:

1. **Change color**: "Change the model color to purple"
2. **Change size**: "Make the model bigger"
3. **Change background**: "Change the background to black"
4. **Adjust lighting**: "Set key light intensity to 3.0"

All changes should appear immediately in your Netlify app!

## Next Steps

- Try more complex commands: "Make a tall, thin, blue model"
- Experiment with lighting: "Set key light color to yellow"
- Combine commands: "Change model to red and background to white"

