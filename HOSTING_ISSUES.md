# Hosting Issues Analysis

## Summary

**Netlify cannot host the MCP server** - it requires a persistent Node.js server with WebSocket support, which Netlify doesn't provide. However, **the front-end can be hosted on Netlify** after making the WebSocket URL configurable.

## Detailed Issues

### 1. MCP Server Cannot Run on Netlify

**Why Netlify Won't Work:**
- ❌ **No WebSocket Support**: Netlify Functions are serverless and don't support persistent WebSocket connections (port 3001)
- ❌ **No SSE Support**: The MCP server uses Server-Sent Events (SSE) for streaming, which requires long-running connections
- ❌ **Stateless**: Netlify Functions are stateless - they can't maintain in-memory session state
- ❌ **No Custom Ports**: Netlify doesn't allow you to specify custom ports (3000, 3001)
- ❌ **Execution Time Limits**: Even if it worked, functions have 10-26 second execution limits, insufficient for persistent connections

**What the MCP Server Needs:**
- ✅ Persistent Node.js process
- ✅ WebSocket server (port 3001)
- ✅ HTTP server with SSE support (port 3000)
- ✅ In-memory session storage
- ✅ Long-running connections

### 2. Front-End Issues

**Current Problems:**
- ❌ Hardcoded WebSocket URL: `ws://localhost:3001` in `WebSocketClient.js`
- ❌ No environment-based configuration
- ✅ Can be hosted on Netlify (static site)

**Solution:**
Make WebSocket URL configurable via environment variables or build-time configuration.

## Recommended Hosting Architecture

### Option 1: Separate Hosting (Recommended)

**Front-End (Netlify/Vercel):**
- Host the static Vite build
- Configure WebSocket URL via environment variable
- Connect to backend WebSocket server

**Backend (Railway/Render/Fly.io/Heroku):**
- Host the full Node.js server (`server.js`)
- Runs both MCP HTTP endpoint and WebSocket server
- Requires persistent process support

### Option 2: Unified Hosting

**Full Stack (Railway/Render/Fly.io/Heroku):**
- Host both front-end and backend together
- Serve static files from Express
- Single deployment, simpler setup

## Hosting Platform Comparison

| Platform | Front-End | MCP Server | WebSocket | Cost |
|----------|-----------|------------|-----------|------|
| **Netlify** | ✅ Yes | ❌ No | ❌ No | Free tier available |
| **Vercel** | ✅ Yes | ❌ No | ❌ No | Free tier available |
| **Railway** | ✅ Yes | ✅ Yes | ✅ Yes | Pay-as-you-go |
| **Render** | ✅ Yes | ✅ Yes | ✅ Yes | Free tier available |
| **Fly.io** | ✅ Yes | ✅ Yes | ✅ Yes | Free tier available |
| **Heroku** | ✅ Yes | ✅ Yes | ✅ Yes | Paid plans only |

## Required Changes for Deployment

### 1. Make WebSocket URL Configurable

Update `WebSocketClient.js` to use environment variables:
- Development: `ws://localhost:3001`
- Production: `wss://your-backend-domain.com` (or appropriate port)

### 2. Update Server Configuration

Ensure server uses environment variables for ports:
- `MCP_PORT` (default: 3000)
- `WS_PORT` (default: 3001)
- `NODE_ENV` for environment detection

### 3. CORS Configuration

Update CORS settings for production:
- Restrict origins instead of `origin: '*'`
- Add front-end domain to allowed origins

### 4. Build Configuration

Create `vite.config.js` to inject environment variables at build time.

## Deployment Steps

### For Railway/Render/Fly.io (Full Stack):

1. **Set Environment Variables:**
   ```bash
   MCP_PORT=3000
   WS_PORT=3001
   NODE_ENV=production
   ```

2. **Update `package.json` start script:**
   ```json
   "start": "node server.js"
   ```

3. **Serve static files from Express:**
   - Add static file serving to `server.js`
   - Serve `dist/` folder after `npm run build`

4. **Deploy:**
   - Connect repository
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`

### For Netlify (Front-End Only):

1. **Build Configuration:**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment Variables:**
   - `VITE_WS_URL`: WebSocket URL (e.g., `wss://your-backend.railway.app`)

3. **Deploy:**
   - Connect repository
   - Configure build settings
   - Set environment variables

## Security Considerations

1. **CORS**: Restrict to specific origins in production
2. **WebSocket**: Use WSS (secure WebSocket) in production
3. **Rate Limiting**: Add rate limiting for MCP endpoints
4. **Authentication**: Consider adding authentication for production use

## Testing Deployment

1. Deploy backend first
2. Test MCP endpoint: `https://your-backend.com/mcp`
3. Test WebSocket: `wss://your-backend.com:3001`
4. Deploy front-end with correct WebSocket URL
5. Verify end-to-end functionality

