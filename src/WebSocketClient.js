/**
 * WebSocket client for communicating with the MCP server
 * Handles connection to the WebSocket server and processes incoming commands
 */
export class WebSocketClient {
  constructor(onCommand) {
    this.ws = null;
    this.onCommand = onCommand;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
  }

  connect(url = 'ws://localhost:3001') {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    console.log(`Connecting to WebSocket server at ${url}...`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const command = JSON.parse(event.data);
          console.log('Received command:', command);
          
          if (this.onCommand) {
            this.onCommand(command);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this._attemptReconnect(url);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this._attemptReconnect(url);
    }
  }

  _attemptReconnect(url) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect(url);
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

