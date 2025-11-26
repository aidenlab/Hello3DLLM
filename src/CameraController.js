import * as THREE from 'three';
import { CONFIG } from './constants.js';

/**
 * Manages the camera: creation, positioning, distance (dolly), and field of view (FOV) handling
 */
export class CameraController {
  constructor() {
    this.camera = null;
    this.minDistance = CONFIG.CAMERA.MIN_DISTANCE;
    this.maxDistance = CONFIG.CAMERA.MAX_DISTANCE;
    this.minFOV = CONFIG.CAMERA.FOV_MIN;
    this.maxFOV = CONFIG.CAMERA.FOV_MAX;
    this.dollySpeed = CONFIG.CAMERA.DOLLY_SPEED;
    this.fovSpeed = CONFIG.CAMERA.FOV_SPEED;
    
    // Touch pinch state
    this.initialPinchDistance = 0;
    this.initialCameraDistance = CONFIG.CAMERA.INITIAL_DISTANCE;
    
    this._createCamera();
  }

  _createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA.NEAR,
      CONFIG.CAMERA.FAR
    );
    this.camera.position.z = CONFIG.CAMERA.INITIAL_DISTANCE;
  }

  handleWheel(deltaY, isShiftPressed = false) {
    if (isShiftPressed) {
      // Change field of view (FOV)
      const fovDelta = deltaY > 0 ? -this.fovSpeed : this.fovSpeed;
      this._applyFOVChange(fovDelta);
    } else {
      // Dollying: translate camera forward/backward (distance change)
      const dollyDelta = deltaY > 0 ? this.dollySpeed : -this.dollySpeed;
      this._applyDolly(dollyDelta);
    }
  }

  startPinchZoom(touch1, touch2) {
    this.initialPinchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    this.initialCameraDistance = this.camera.position.z;
  }

  updatePinchZoom(touch1, touch2) {
    const currentPinchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    const pinchDelta = this.initialPinchDistance - currentPinchDistance;
    const dollyDelta = pinchDelta * CONFIG.INTERACTION.PINCH_ZOOM_SENSITIVITY;
    const newDistance = this.initialCameraDistance + dollyDelta;
    
    this.camera.position.z = this._clampDistance(newDistance);
  }

  _applyFOVChange(fovDelta) {
    // Change camera field of view (FOV)
    const newFOV = this.camera.zoom + fovDelta;
    this.camera.zoom = this._clampFOV(newFOV);
    this.camera.updateProjectionMatrix();
  }

  _applyDolly(dollyDelta) {
    // Dollying: change camera distance (position.z)
    const newDistance = this.camera.position.z + dollyDelta;
    this.camera.position.z = this._clampDistance(newDistance);
  }

  _clampDistance(value) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, value));
  }

  _clampFOV(value) {
    return Math.max(this.minFOV, Math.min(this.maxFOV, value));
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

  // Public methods for camera control

  /**
   * Sets the camera distance from the origin (dollying)
   * @param {number} distance - Distance from origin (clamped to MIN_DISTANCE - MAX_DISTANCE)
   */
  dollyCamera(distance) {
    this.camera.position.z = this._clampDistance(distance);
  }

  /**
   * Moves the camera closer to the origin (dolly in)
   * @param {number} amount - Optional amount to move (defaults to DOLLY_SPEED)
   */
  dollyCameraIn(amount = null) {
    const delta = amount !== null ? -amount : -this.dollySpeed;
    this._applyDolly(delta);
  }

  /**
   * Moves the camera farther from the origin (dolly out)
   * @param {number} amount - Optional amount to move (defaults to DOLLY_SPEED)
   */
  dollyCameraOut(amount = null) {
    const delta = amount !== null ? amount : this.dollySpeed;
    this._applyDolly(delta);
  }

  /**
   * Sets the camera field of view (FOV)
   * @param {number} fov - Field of view value (clamped to FOV_MIN - FOV_MAX)
   */
  setCameraFOV(fov) {
    this.camera.zoom = this._clampFOV(fov);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Increases the camera field of view (wider angle)
   * @param {number} amount - Optional amount to increase (defaults to FOV_SPEED)
   */
  increaseCameraFOV(amount = null) {
    const delta = amount !== null ? amount : this.fovSpeed;
    this._applyFOVChange(delta);
  }

  /**
   * Decreases the camera field of view (narrower angle, more zoomed in)
   * @param {number} amount - Optional amount to decrease (defaults to FOV_SPEED)
   */
  decreaseCameraFOV(amount = null) {
    const delta = amount !== null ? -amount : -this.fovSpeed;
    this._applyFOVChange(delta);
  }

  /**
   * Gets the current camera distance from origin
   * @returns {number} Current camera distance
   */
  getCameraDistance() {
    return this.camera.position.z;
  }

  /**
   * Gets the current camera field of view
   * @returns {number} Current FOV value (camera.zoom)
   */
  getCameraFOV() {
    return this.camera.zoom;
  }
}

