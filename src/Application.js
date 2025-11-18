import { SceneManager } from './SceneManager.js';
import { CameraController } from './CameraController.js';
import { RotationController } from './RotationController.js';
import { WebSocketClient } from './WebSocketClient.js';

/**
 * Main application class that orchestrates the 3D scene and user interactions
 */
export class Application {
  constructor(canvas) {
    this.canvas = canvas;
    this.cameraController = new CameraController();
    this.sceneManager = new SceneManager(canvas, this.cameraController.getCamera());
    this.rotationController = new RotationController(this.sceneManager.getCube());
    
    this._setupWebSocket();
    this._setupEventListeners();
    this._startAnimation();
  }

  _setupEventListeners() {
    // Mouse events for rotation
    this.canvas.addEventListener('mousedown', (e) => {
      this.rotationController.startDrag(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.rotationController.updateDrag(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mouseup', () => {
      this.rotationController.stopDrag();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.rotationController.stopDrag();
    });

    // Mouse wheel for zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraController.handleWheel(e.deltaY);
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
      this.rotationController.stopDrag();
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.cameraController.handleResize();
      this.sceneManager.handleResize();
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
      this.rotationController.startDrag(touch.clientX, touch.clientY);
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
      this.rotationController.updateDrag(touch.clientX, touch.clientY);
    }
  }

  _setupWebSocket() {
    this.wsClient = new WebSocketClient(
      (command) => {
        this._handleWebSocketCommand(command);
      },
      (connected) => {
        this._updateConnectionStatus(connected);
      }
    );
    this.wsClient.connect();
  }

  _updateConnectionStatus(connected) {
    const statusElement = document.getElementById('ws-status');
    const labelElement = statusElement.querySelector('.ws-status-label');
    
    if (connected) {
      statusElement.classList.remove('disconnected');
      statusElement.classList.add('connected');
      labelElement.textContent = 'connected';
    } else {
      statusElement.classList.remove('connected');
      statusElement.classList.add('disconnected');
      labelElement.textContent = 'disconnected';
    }
  }

  _handleWebSocketCommand(command) {
    switch (command.type) {
      case 'changeColor':
        this.sceneManager.changeCubeColor(command.color);
        break;
      case 'changeSize':
        this.sceneManager.changeCubeSize(command.size);
        break;
      case 'scaleCube':
        this.sceneManager.scaleCube(command.x, command.y, command.z);
        break;
      case 'changeBackgroundColor':
        this.sceneManager.changeBackgroundColor(command.color);
        break;
      default:
        console.warn('Unknown command type:', command.type);
    }
  }

  _startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.sceneManager.render(this.cameraController.getCamera());
    };
    animate();
  }
}

