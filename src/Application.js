import { SceneManager } from './SceneManager.js';
import { CameraController } from './CameraController.js';
import { RotationController } from './RotationController.js';
import { WebSocketClient } from './WebSocketClient.js';

/**
 * Main application class that orchestrates the 3D scene and user interactions
 */
export class Application {
  async init(canvas) {
    this.canvas = canvas;
    this.cameraController = new CameraController();
    this.sceneManager = new SceneManager(canvas, this.cameraController.getCamera());
    
    // Initialize scene manager (loads model asynchronously)
    await this.sceneManager.initialize();
    
    this.rotationController = new RotationController(this.sceneManager.getModel(), canvas);
    
    // Set up render callback for arcball
    this.rotationController.onRender = () => {
      this.sceneManager.render(this.cameraController.getCamera());
    };
    
    // Initialize arcball view bounds
    const rect = this.canvas.getBoundingClientRect();
    this.rotationController.reshape({
      width: rect.width,
      height: rect.height
    });
    
    // Track mouse velocity for momentum
    this.lastMousePosition = { x: 0, y: 0 };
    this.lastMouseTime = 0;
    this.mouseVelocity = { x: 0, y: 0 };
    
    this._setupWebSocket();
    this._setupEventListeners();
    this._startAnimation();
  }

  _setupEventListeners() {
    // Mouse events for rotation
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.lastMousePosition = { x: e.clientX, y: e.clientY };
      this.lastMouseTime = Date.now();
      this.mouseVelocity = { x: 0, y: 0 };
      this.rotationController.beginDrag({ x, y });
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.rotationController.isCurrentlyDragging()) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate velocity
        const now = Date.now();
        const dt = Math.max(1, now - this.lastMouseTime); // Avoid division by zero
        this.mouseVelocity = {
          x: (e.clientX - this.lastMousePosition.x) / dt * 16, // Normalize to ~60fps
          y: (e.clientY - this.lastMousePosition.y) / dt * 16
        };
        this.lastMousePosition = { x: e.clientX, y: e.clientY };
        this.lastMouseTime = now;
        
        this.rotationController.updateDrag({ x, y });
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (this.rotationController.isCurrentlyDragging()) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.rotationController.endDrag(this.mouseVelocity, { x, y });
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.rotationController.isCurrentlyDragging()) {
        this.rotationController.stopDrag();
      }
    });

    // Mouse wheel for zoom (or dolly when Shift is pressed)
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const isShiftPressed = e.shiftKey;
      this.cameraController.handleWheel(e.deltaY, isShiftPressed);
    });

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      this._handleTouchStart(e);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      this._handleTouchMove(e);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        // Use touch velocity if available, otherwise zero
        const velocity = { x: 0, y: 0 }; // Touch events don't provide velocity directly
        this.rotationController.endDrag(velocity, { x, y });
      } else {
        this.rotationController.stopDrag();
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.cameraController.handleResize();
      this.sceneManager.handleResize();
      // Update arcball view bounds
      const rect = this.canvas.getBoundingClientRect();
      this.rotationController.reshape({
        width: rect.width,
        height: rect.height
      });
    });
  }

  _handleTouchStart(e) {
    if (e.touches.length === 2) {
      // Two-finger touch - prepare for pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.cameraController.startPinchZoom(touch1, touch2);
      this.rotationController.stopDrag(); // Disable rotation during pinch
    } else if (e.touches.length === 1) {
      // Single touch - enable rotation
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.rotationController.beginDrag({ x, y });
    }
  }

  _handleTouchMove(e) {
    if (e.touches.length === 2) {
      // Two-finger pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.cameraController.updatePinchZoom(touch1, touch2);
    } else if (e.touches.length === 1 && this.rotationController.isCurrentlyDragging()) {
      // Single touch rotation
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.rotationController.updateDrag({ x, y });
    }
  }

  _setupWebSocket() {
    // Extract session ID from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    
    if (!sessionId) {
      // No session ID provided - app can run but without ChatGPT/MCP connection
      console.log('No sessionId found in URL. App running in standalone mode (no ChatGPT connection).');
      this._updateConnectionStatus(false, 'not-connected');
      return;
    }
    
    console.log(`Initializing WebSocket client with session ID: ${sessionId}`);
    
    this.wsClient = new WebSocketClient(
      (command) => {
        this._handleWebSocketCommand(command);
      },
      (connected) => {
        this._updateConnectionStatus(connected);
      },
      sessionId
    );
    this.wsClient.connect();
  }

  _updateConnectionStatus(connected, statusType = 'disconnected') {
    const statusElement = document.getElementById('ws-status');
    const labelElement = statusElement.querySelector('.ws-status-label');
    
    if (connected) {
      statusElement.classList.remove('disconnected', 'not-connected');
      statusElement.classList.add('connected');
      labelElement.textContent = 'connected';
    } else {
      statusElement.classList.remove('connected');
      if (statusType === 'not-connected') {
        statusElement.classList.remove('disconnected');
        statusElement.classList.add('not-connected');
        labelElement.textContent = 'not connected';
      } else {
        statusElement.classList.remove('not-connected');
        statusElement.classList.add('disconnected');
        labelElement.textContent = 'disconnected';
      }
    }
  }

  _handleWebSocketCommand(command) {
    switch (command.type) {
      case 'toolCall':
        this._showToolNotification(command.toolName);
        break;
      case 'changeColor':
        this.sceneManager.changeModelColor(command.color);
        break;
      case 'changeSize':
        this.sceneManager.changeModelSize(command.size);
        break;
      case 'scaleCube':
        this.sceneManager.scaleModel(command.x, command.y, command.z);
        break;
      case 'changeBackgroundColor':
        this.sceneManager.changeBackgroundColor(command.color);
        break;
      // Key light controls
      case 'setKeyLightIntensity':
        this.sceneManager.setKeyLightIntensity(command.intensity);
        break;
      case 'setKeyLightPosition':
        this.sceneManager.setKeyLightPosition(command.x, command.y, command.z);
        break;
      case 'setKeyLightColor':
        this.sceneManager.setKeyLightColor(command.color);
        break;
      case 'setKeyLightSize':
        this.sceneManager.setKeyLightSize(command.width, command.height);
        break;
      // Fill light controls
      case 'setFillLightIntensity':
        this.sceneManager.setFillLightIntensity(command.intensity);
        break;
      case 'setFillLightPosition':
        this.sceneManager.setFillLightPosition(command.x, command.y, command.z);
        break;
      case 'setFillLightColor':
        this.sceneManager.setFillLightColor(command.color);
        break;
      case 'setFillLightSize':
        this.sceneManager.setFillLightSize(command.width, command.height);
        break;
      default:
        console.warn('Unknown command type:', command.type);
    }
  }

  _showToolNotification(toolName) {
    // Format tool name for display (convert snake_case to Title Case)
    const formattedName = toolName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const notificationElement = document.getElementById('tool-notification');
    const labelElement = notificationElement.querySelector('.tool-notification-label');
    
    // Clear any existing timeout
    if (this._toolNotificationTimeout) {
      clearTimeout(this._toolNotificationTimeout);
      this._toolNotificationTimeout = null;
    }
    
    labelElement.textContent = formattedName;
    
    // Show notification with animation
    notificationElement.classList.remove('hidden');
    notificationElement.classList.add('visible');
    
    // Hide after 3 seconds
    this._toolNotificationTimeout = setTimeout(() => {
      notificationElement.classList.remove('visible');
      notificationElement.classList.add('hidden');
      this._toolNotificationTimeout = null;
    }, 3000);
  }

  _startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.sceneManager.render(this.cameraController.getCamera());
    };
    animate();
  }
}

