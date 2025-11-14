import * as THREE from 'three';
import { CONFIG } from './constants.js';

/**
 * Manages the camera: creation, positioning, zoom, and resize handling
 */
export class CameraController {
  constructor() {
    this.camera = null;
    this.minZoom = CONFIG.CAMERA.MIN_ZOOM;
    this.maxZoom = CONFIG.CAMERA.MAX_ZOOM;
    this.zoomSpeed = CONFIG.CAMERA.ZOOM_SPEED;
    
    // Touch pinch state
    this.initialDistance = 0;
    this.initialZoom = CONFIG.CAMERA.INITIAL_Z;
    
    this._createCamera();
  }

  _createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA.NEAR,
      CONFIG.CAMERA.FAR
    );
    this.camera.position.z = CONFIG.CAMERA.INITIAL_Z;
  }

  handleWheel(deltaY) {
    const zoomDelta = deltaY > 0 ? this.zoomSpeed : -this.zoomSpeed;
    this._applyZoom(zoomDelta);
  }

  startPinchZoom(touch1, touch2) {
    this.initialDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    this.initialZoom = this.camera.position.z;
  }

  updatePinchZoom(touch1, touch2) {
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    const distanceDelta = this.initialDistance - currentDistance;
    const zoomDelta = distanceDelta * CONFIG.INTERACTION.PINCH_ZOOM_SENSITIVITY;
    const newZ = this.initialZoom + zoomDelta;
    
    this.camera.position.z = this._clampZoom(newZ);
  }

  _applyZoom(zoomDelta) {
    const newZ = this.camera.position.z + zoomDelta;
    this.camera.position.z = this._clampZoom(newZ);
  }

  _clampZoom(value) {
    return Math.max(this.minZoom, Math.min(this.maxZoom, value));
  }

  /**
   * Handles window resize by updating camera aspect ratio and projection matrix
   */
  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Gets the Three.js camera instance
   * @returns {THREE.PerspectiveCamera} The camera
   */
  getCamera() {
    return this.camera;
  }
}

