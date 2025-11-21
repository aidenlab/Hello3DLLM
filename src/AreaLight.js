import * as THREE from 'three';
import { CONFIG } from './constants.js';

/**
 * Represents an area light (RectAreaLight) for key or fill lighting
 * Handles area light creation and configuration
 * The light rotates around the model origin (0, -0.5, 0) via a parent group
 */
export class AreaLight {
  constructor(type = 'key') {
    this.areaLight = null;
    this.parentGroup = null;
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
}

