import * as THREE from 'three';
import { CONFIG } from './constants.js';

/**
 * Represents an area light (RectAreaLight) for key or fill lighting
 * Handles area light creation and configuration
 */
export class AreaLight {
  constructor(type = 'key') {
    this.areaLight = null;
    this.type = type; // 'key' or 'fill'
    
    this._createAreaLight();
    this._configureAreaLight();
  }

  _createAreaLight() {
    const config = this.type === 'key' 
      ? CONFIG.LIGHTING.KEY_LIGHT 
      : CONFIG.LIGHTING.FILL_LIGHT;
    
    this.areaLight = new THREE.RectAreaLight(
      config.COLOR,
      config.INTENSITY,
      config.WIDTH,
      config.HEIGHT
    );
  }

  _configureAreaLight() {
    const config = this.type === 'key' 
      ? CONFIG.LIGHTING.KEY_LIGHT 
      : CONFIG.LIGHTING.FILL_LIGHT;
    
    // Set position
    this.areaLight.position.set(
      config.POSITION.x,
      config.POSITION.y,
      config.POSITION.z
    );

    // Set rotation to point the light toward the target
    // RectAreaLight uses lookAt() method to orient toward a point
    const targetPosition = config.TARGET || { x: 0, y: 0, z: 0 };
    this.areaLight.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }

  /**
   * Gets the Three.js area light object
   * @returns {THREE.RectAreaLight} The area light
   */
  getLight() {
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

