import * as THREE from 'three';
import { CONFIG } from './constants.js';

/**
 * Represents an area light (RectAreaLight) for key or fill lighting
 * Handles area light creation and configuration
 * The light rotates around the model origin (0, -0.5, 0) via a parent group
 * Future rotation will use Euler angles (simpler than quaternions for constrained rotations)
 */
export class AreaLight {
  constructor(type = 'key') {
    this.areaLight = null;
    this.parentGroup = null;
    this.helper = null;
    this.highlightOverlay = null;
    this.pickerGeometry = null; // Invisible geometry for ray picking
    this.type = type; // 'key' or 'fill'
    
    this._createAreaLight();
    this._configureAreaLight();
  }

  _createAreaLight() {
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const { COLOR, INTENSITY, WIDTH, HEIGHT } = config;
    
    // Create parent group positioned at model origin (rotation pivot)
    this.parentGroup = new THREE.Object3D();
    const origin = CONFIG.MODEL.ORIGIN;
    this.parentGroup.position.set(origin.x, origin.y, origin.z);
    
    // Create the actual light as a child of the parent group
    this.areaLight = new THREE.RectAreaLight(COLOR, INTENSITY, WIDTH, HEIGHT);
    this.parentGroup.add(this.areaLight);
  }

  _configureAreaLight() {
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const origin = CONFIG.MODEL.ORIGIN;

    // Calculate light position relative to parent (model origin)
    // Parent is at (0, -0.5, 0), so we need to offset by the difference
    const worldPosition = config.POSITION;
    const relativePosition = {
      x: worldPosition.x - origin.x,
      y: worldPosition.y - origin.y,
      z: worldPosition.z - origin.z
    };
    
    // Set position relative to parent
    this.areaLight.position.set(relativePosition.x, relativePosition.y, relativePosition.z);

    // Set rotation to point the light toward the target
    // RectAreaLight uses lookAt() method to orient toward a point (world coordinates)
    const targetPosition = config.TARGET || { x: 0, y: 0, z: 0 };
    this.areaLight.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }

  /**
   * Gets the parent group (for scene addition)
   * This is the rotation pivot positioned at the model origin
   * @returns {THREE.Object3D} The parent group
   */
  getLight() {
    return this.parentGroup;
  }

  /**
   * Gets the actual RectAreaLight object (for property access and helper attachment)
   * @returns {THREE.RectAreaLight} The area light
   */
  getLightObject() {
    return this.areaLight;
  }

  /**
   * Gets the light type ('key' or 'fill')
   * @returns {string} The light type
   */
  getType() {
    return this.type;
  }

  /**
   * Sets the helper reference for this light
   * @param {THREE.Object3D} helper - The RectAreaLightHelper instance
   */
  setHelper(helper) {
    this.helper = helper;
  }

  /**
   * Gets the helper reference
   * @returns {THREE.Object3D} The helper instance
   */
  getHelper() {
    return this.helper;
  }

  /**
   * Creates a translucent highlight overlay matching the light's bounds
   * Also creates an invisible picker geometry for ray picking
   * The overlay uses the light's color to provide visual feedback
   */
  createHighlightOverlay() {
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const { WIDTH, HEIGHT } = config;

    // Create plane geometry matching the light's dimensions
    const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    
    // Create translucent material using the light's current color
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: this.areaLight.color, // Use the light's actual color
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });

    // Create highlight overlay mesh
    this.highlightOverlay = new THREE.Mesh(geometry.clone(), highlightMaterial);
    this.highlightOverlay.visible = false;
    
    // Create invisible picker geometry for ray picking
    const pickerMaterial = new THREE.MeshBasicMaterial({
      visible: false, // Invisible but still pickable
      side: THREE.DoubleSide
    });
    this.pickerGeometry = new THREE.Mesh(geometry.clone(), pickerMaterial);
    
    // Both overlay and picker inherit the light's position and rotation
    // Add both as children of the light object
    this.areaLight.add(this.highlightOverlay);
    this.areaLight.add(this.pickerGeometry);
  }

  /**
   * Gets the highlight overlay mesh
   * @returns {THREE.Mesh} The highlight overlay
   */
  getHighlightOverlay() {
    return this.highlightOverlay;
  }

  /**
   * Gets the picker geometry for ray picking
   * @returns {THREE.Mesh} The picker geometry
   */
  getPickerGeometry() {
    return this.pickerGeometry;
  }

  /**
   * Sets the highlighted state of the light
   * @param {boolean} highlighted - Whether the light should be highlighted
   */
  setHighlighted(highlighted) {
    if (this.highlightOverlay) {
      this.highlightOverlay.visible = highlighted;
    }
  }

  /**
   * Updates the highlight overlay color to match the light's current color
   */
  updateHighlightColor() {
    if (this.highlightOverlay && this.highlightOverlay.material) {
      // Copy the light's color to the overlay material
      this.highlightOverlay.material.color.copy(this.areaLight.color);
    }
  }

  /**
   * Rotates the light around the model origin using Euler angles
   * @param {number} deltaX - Horizontal rotation delta (left/right movement)
   * @param {number} deltaY - Vertical rotation delta (up/down movement)
   */
  rotate(deltaX, deltaY) {
    if (!this.parentGroup) {
      return;
    }

    // Apply rotation to parent group (rotation pivot at model origin)
    // Horizontal movement (deltaX) rotates around Y axis (vertical axis)
    // Vertical movement (deltaY) rotates around X axis (horizontal axis)
    this.parentGroup.rotation.y += deltaX;
    this.parentGroup.rotation.x += deltaY;

    // After rotating the parent, update the light's lookAt to maintain target orientation
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const targetPosition = config.TARGET || { x: 0, y: 0, z: 0 };
    
    // Get world position of the light after rotation
    const worldPosition = new THREE.Vector3();
    this.areaLight.getWorldPosition(worldPosition);
    
    // Update lookAt to point toward target (world coordinates)
    this.areaLight.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }

  /**
   * Gets the parent group's rotation (Euler angles)
   * @returns {THREE.Euler} The rotation Euler angles
   */
  getRotation() {
    return this.parentGroup ? this.parentGroup.rotation : new THREE.Euler();
  }
}

