/**
 * WebSocket client for communicating with the MCP server
 * Handles connection to the WebSocket server and processes incoming commands
 * Automatically detects if server is not running and polls for availability
 */
export class WebSocketClient {
  constructor(onCommand) {
    this.ws = null;
    this.onCommand = onCommand;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.serverAvailable = false; // Track if we've ever successfully connected
    this.pollingMode = false; // True when server appears to be offline
    this.pollingInterval = null;
    this.pollingDelay = 5000; // Check every 5 seconds when server is offline
    this.initialConnectionAttempts = 0;
    this.maxInitialAttempts = 3; // Try 3 times quickly before assuming server is offline
    this.initialAttemptDelay = 500; // 500ms between initial attempts
  }

  connect(url = null) {
    // Use environment variable or default to localhost for development
    const wsUrl = url || import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    // If we're in polling mode, log differently
    if (this.pollingMode) {
      console.log(`Checking if WebSocket server is available at ${wsUrl}...`);
    } else {
      console.log(`Connecting to WebSocket server at ${wsUrl}...`);
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.serverAvailable = true;
        this.pollingMode = false;
        this.initialConnectionAttempts = 0;
        
        // Clear any polling interval since we're connected
        if (this.pollingInterval) {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
        }
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
        // Don't log errors in polling mode to reduce noise
        if (!this.pollingMode) {
          console.error('WebSocket error:', error);
        }
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        
        // If we were previously connected, attempt normal reconnection
        if (this.serverAvailable) {
          console.log('WebSocket disconnected (was connected), attempting to reconnect...');
          this._attemptReconnect(wsUrl);
        } else {
          // Server was never connected, check if we should enter polling mode
          this._handleInitialConnectionFailure(wsUrl, event);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this._handleInitialConnectionFailure(wsUrl, null);
    }
  }

  _handleInitialConnectionFailure(url, closeEvent) {
    this.initialConnectionAttempts++;
    
    // If we've tried a few times quickly and failed, assume server is not running
    if (this.initialConnectionAttempts >= this.maxInitialAttempts) {
      if (!this.pollingMode) {
        console.log('WebSocket server appears to be offline. Will check periodically for availability...');
        this.pollingMode = true;
        this._startPolling(url);
      }
    } else {
      // Try a few more times quickly before giving up
      setTimeout(() => {
        this.connect(url);
      }, this.initialAttemptDelay);
    }
  }

  _startPolling(url) {
    // Clear any existing polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Poll periodically to check if server becomes available
    this.pollingInterval = setInterval(() => {
      if (!this.isConnecting && !this.isConnected()) {
        this.connect(url);
      }
    }, this.pollingDelay);
  }

  _attemptReconnect(url) {
    // If we're in polling mode, don't do aggressive reconnection
    // The polling mechanism will handle it
    if (this.pollingMode) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached. Server may be offline. Entering polling mode...');
      this.pollingMode = true;
      this.serverAvailable = false;
      this._startPolling(url);
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
    
    // Clear polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    this.pollingMode = false;
    this.serverAvailable = false;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

