#!/bin/bash
# Script to configure Cursor MCP server with a custom URL (for tunneled servers)

# Check if URL argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <mcp-server-url>"
    echo ""
    echo "Example:"
    echo "  $0 https://abc123.ngrok-free.app/mcp"
    echo "  $0 https://hello3dllm-mcpserver.loca.lt/mcp"
    echo ""
    echo "The URL should include /mcp at the end"
    exit 1
fi

MCP_URL="$1"
SERVER_NAME="3d-model-server"

# Validate URL format
if [[ ! "$MCP_URL" =~ ^https?:// ]]; then
    echo "Error: URL must start with http:// or https://"
    exit 1
fi

if [[ ! "$MCP_URL" =~ /mcp$ ]]; then
    echo "Warning: URL should end with /mcp"
    echo "Adding /mcp to the URL..."
    MCP_URL="${MCP_URL%/}/mcp"
fi

# Create JSON config
CONFIG_JSON="{\"url\":\"$MCP_URL\"}"

# Base64 encode the config
CONFIG_B64=$(echo -n "$CONFIG_JSON" | base64)

# Create deeplink
DEEPLINK="cursor://anysphere.cursor-deeplink/mcp/install?name=$SERVER_NAME&config=$CONFIG_B64"

echo "=========================================="
echo "Cursor MCP Server Configuration"
echo "=========================================="
echo ""
echo "Server Name: $SERVER_NAME"
echo "MCP URL: $MCP_URL"
echo ""
echo "Opening Cursor MCP installation dialog..."
echo ""
echo "If the dialog doesn't open automatically, you can manually configure:"
echo "1. Open Cursor Settings → Features → Model Context Protocol"
echo "2. Add server configuration:"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"$SERVER_NAME\": {"
echo "      \"url\": \"$MCP_URL\""
echo "    }"
echo "  }"
echo "}"
echo ""

# Open deeplink (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$DEEPLINK"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$DEEPLINK" 2>/dev/null || echo "Please open this URL manually: $DEEPLINK"
else
    echo "Please open this URL manually: $DEEPLINK"
fi

echo ""
echo "Make sure your MCP server is running and accessible at: $MCP_URL"

