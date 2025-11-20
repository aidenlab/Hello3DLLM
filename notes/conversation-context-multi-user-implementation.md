# Conversation Context: Multi-User Session Routing Implementation

**Date**: Implementation Session  
**Topic**: Transition from single-user broadcast to multi-user session-based routing with improved user connection workflow

## Overview

This document captures the complete context of implementing multi-user support for the Hello3DLLM project, including session-based routing, AsyncLocalStorage for context management, and a user-friendly connection workflow via ChatGPT.

## Problem Statement

### Initial Issue: Single-User Architecture Limitations

The original implementation used a broadcast model where:
- All WebSocket clients were stored in a `Set`
- MCP tool commands were broadcast to ALL connected browsers
- Multiple ChatGPT users would interfere with each other
- No isolation between sessions

### User Experience Problem

The connection workflow was awkward:
- Users had to manually extract session IDs from server logs
- Required manual URL editing with session IDs
- No clear way for users to know what session ID to use
- Poor user experience for demos with collaborators

## Solution Implemented

### 1. Session-Based Routing Architecture

**Key Changes:**
- Changed WebSocket storage from `Set` to `Map<sessionId, WebSocket>`
- Implemented session registration: browsers send `registerSession` message with session ID
- Created `sendToSession(sessionId, command)` for targeted routing
- All tool handlers updated to use `routeToCurrentSession()` instead of `broadcastToClients()`

**Files Modified:**
- `server.js`: WebSocket storage, routing functions, tool handlers

### 2. AsyncLocalStorage for Context Management

**Problem Encountered:**
- Initial implementation used a module-level variable (`currentRequestSessionId`)
- Tool handlers couldn't access session ID because they execute asynchronously
- Error: "Tool handler called but no session context available"

**Solution:**
- Implemented `AsyncLocalStorage` from Node.js `async_hooks`
- Maintains session context across async operations
- Tool handlers access session ID via `sessionContext.getStore()`

**Key Code:**
```javascript
import { AsyncLocalStorage } from 'node:async_hooks';

const sessionContext = new AsyncLocalStorage();

// In POST handler:
await sessionContext.run(sessionId || null, async () => {
  // Tool handlers can access sessionId via sessionContext.getStore()
  await transport.handleRequest(req, res, req.body);
});

// In tool handlers:
function routeToCurrentSession(command) {
  const sessionId = sessionContext.getStore();
  if (sessionId) {
    sendToSession(sessionId, command);
  }
}
```

### 3. User-Friendly Connection Workflow

**Solution: `get_browser_connection_url` Tool**

Created an MCP tool that ChatGPT can call to provide users with connection URLs:

**Implementation:**
- Tool name: `get_browser_connection_url`
- No parameters required
- Returns URL with embedded session ID
- User asks: "How do I connect to the 3D app?"
- ChatGPT provides: "Open this URL: https://your-app.netlify.app?sessionId=abc-123..."

**Workflow:**
1. User adds MCP tool in ChatGPT
2. User asks: "How do I connect to the 3D app?"
3. ChatGPT calls `get_browser_connection_url` tool
4. Tool returns URL with session ID
5. User copies/pastes URL into browser
6. Browser connects and registers with session ID

### 4. Browser URL Configuration

**Problem:**
- Server needs to know which URL to provide (localhost vs Netlify)
- Hard to switch between environments during testing

**Solution: Command-Line Arguments**

Added flexible browser URL configuration with priority:
1. Command-line argument (`--browser-url` or `-u`) - highest priority
2. Environment variable (`BROWSER_URL`)
3. Default (`http://localhost:5173`) - lowest priority

**Usage:**
```bash
# Default (localhost)
npm run mcp:server

# Netlify URL via command-line
npm run mcp:server -- --browser-url https://your-app.netlify.app

# Short form
npm run mcp:server -- -u https://your-app.netlify.app

# Environment variable
BROWSER_URL=https://your-app.netlify.app npm run mcp:server
```

## Implementation Details

### Server-Side Changes (`server.js`)

**WebSocket Connection Handler:**
- Accepts `registerSession` message from browser clients
- Stores mapping: `wsClients.set(sessionId, ws)`
- Sends confirmation: `sessionRegistered` message
- Cleans up on disconnect

**Routing Functions:**
- `sendToSession(sessionId, command)`: Routes to specific session
- `routeToCurrentSession(command)`: Helper for tool handlers
- `broadcastToClients(command)`: Kept for backward compatibility

**Tool Handler Updates:**
- All 13 tool handlers updated to use `routeToCurrentSession()`
- Commands now route only to the browser associated with calling session

**POST Handler:**
- Wraps request handling in `sessionContext.run()`
- Sets session context before tool handlers execute
- Clears context in `finally` block for error safety

### Client-Side Changes

**WebSocketClient.js:**
- Added `sessionId` parameter to constructor
- Sends `registerSession` message on connection open
- Handles `sessionRegistered` confirmation

**Application.js:**
- Extracts `sessionId` from URL query parameters
- Shows error if session ID missing
- Passes session ID to WebSocketClient

## Key Files Modified

1. **server.js**
   - WebSocket storage: Set → Map
   - AsyncLocalStorage implementation
   - Session registration handler
   - Routing functions
   - All tool handlers updated
   - `get_browser_connection_url` tool added
   - Command-line argument parsing

2. **src/WebSocketClient.js**
   - Session ID support
   - Registration message handling

3. **src/Application.js**
   - URL parameter extraction
   - Error handling for missing session ID

## Configuration

### Environment Variables

- `BROWSER_URL`: Browser URL for connection links (optional)
- `MCP_PORT`: MCP server port (default: 3000)
- `WS_PORT`: WebSocket server port (default: 3001)

### Command-Line Arguments

- `--browser-url <url>` or `-u <url>`: Set browser URL
- `--help` or `-h`: Show usage help

## Usage Instructions

### For End Users

1. Add Hello3DLLM as MCP tool in ChatGPT
2. Ask: "How do I connect to the 3D app?"
3. Copy the provided URL
4. Paste into browser
5. Browser connects automatically

### For Server Administrators

**Starting Server:**
```bash
# Local development (default)
npm run mcp:server

# With Netlify URL
npm run mcp:server -- --browser-url https://your-app.netlify.app

# With environment variable
BROWSER_URL=https://your-app.netlify.app npm run mcp:server
```

## Testing Scenarios

### Single User
- ✅ ChatGPT session connects
- ✅ User gets connection URL
- ✅ Browser connects with session ID
- ✅ Commands route correctly

### Multi-User
- ✅ Multiple ChatGPT sessions can connect simultaneously
- ✅ Each session gets unique connection URL
- ✅ Commands route only to correct browser
- ✅ No cross-contamination between users

## Edge Cases Handled

1. **Missing Session ID in URL**: Browser shows error message
2. **WebSocket Disconnect**: Server cleans up session mapping
3. **MCP Session Without Browser**: Tool calls succeed, warning logged
4. **Browser Without MCP Session**: Browser waits for session to connect
5. **Concurrent Requests**: AsyncLocalStorage ensures correct session context

## Technical Decisions

### Why AsyncLocalStorage?

- Tool handlers execute asynchronously
- Module-level variables don't persist across async boundaries
- AsyncLocalStorage uses Node.js async_hooks to maintain context
- Ensures each request has correct session ID

### Why URL-Based Pairing?

- Simple: No complex handshake protocol
- User-friendly: ChatGPT provides URL directly
- Flexible: Browser can connect before or after MCP session
- No state: Server doesn't need to track pending connections

### Why Command-Line Arguments?

- More flexible than environment variables for testing
- Easy to switch between localhost and Netlify
- Can override environment variables when needed
- Better developer experience

## Documentation Updates

### README.md
- Added "Connecting to the 3D App" section
- Documented `get_browser_connection_url` tool
- Added command-line argument examples
- Updated environment variables section

### notes/from-single-user-to-multi-user.md
- Updated usage instructions with new workflow
- Added server administrator configuration section
- Documented browser URL configuration priority

## Future Enhancements Considered

1. **QR Code Generation**: Could add QR code to connection URL response
2. **Auto-Discovery**: Browser list for ChatGPT to select from
3. **Short Pairing Codes**: 6-digit codes instead of full UUIDs
4. **Session Expiration**: Auto-cleanup of stale sessions
5. **Multiple Browsers Per Session**: Collaboration mode

## Important Notes

- **Session Isolation**: Each ChatGPT session controls only its own browser
- **URL Format**: `https://your-app.netlify.app?sessionId=<uuid>`
- **Priority Order**: Command-line → Environment variable → Default
- **Backward Compatibility**: `broadcastToClients()` kept for potential future use

## Troubleshooting

### "Tool handler called but no session context available"
- **Fixed**: Implemented AsyncLocalStorage for context management

### "No active WebSocket connection found for session"
- **Expected**: MCP session exists but browser hasn't connected yet
- **Solution**: User needs to open browser with connection URL

### Browser shows "Session ID Required" error
- **Cause**: URL missing `?sessionId=` parameter
- **Solution**: Get connection URL from ChatGPT using `get_browser_connection_url` tool

## Summary

This implementation successfully:
- ✅ Provides full session isolation for multi-user support
- ✅ Implements user-friendly connection workflow via ChatGPT
- ✅ Adds flexible browser URL configuration
- ✅ Handles all edge cases gracefully
- ✅ Maintains backward compatibility where possible

The system is now production-ready for multi-user scenarios with a much improved user experience.

