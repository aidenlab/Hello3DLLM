import * as THREE from 'three';
import { CONFIG } from './constants.js';

/**
 * Represents a spotlight with its configuration and target
 * Handles all spotlight-related creation and setup
 */
export class Spotlight {
  constructor() {
    this.spotlight = null;
    this.target = null;
    
    this._createSpotlight();
    this._configureSpotlight();
  }

  _createSpotlight() {
    this.spotlight = new THREE.SpotLight(
      CONFIG.LIGHTING.SPOTLIGHT.COLOR,
      CONFIG.LIGHTING.SPOTLIGHT.INTENSITY
    );
    this.target = this.spotlight.target;
  }

  _configureSpotlight() {
    // Set position
    this.spotlight.position.set(
      CONFIG.LIGHTING.SPOTLIGHT.POSITION.x,
      CONFIG.LIGHTING.SPOTLIGHT.POSITION.y,
      CONFIG.LIGHTING.SPOTLIGHT.POSITION.z
    );

    // Configure spotlight properties
    this.spotlight.angle = CONFIG.LIGHTING.SPOTLIGHT.ANGLE;
    this.spotlight.penumbra = CONFIG.LIGHTING.SPOTLIGHT.PENUMBRA;
    this.spotlight.decay = CONFIG.LIGHTING.SPOTLIGHT.DECAY;
    this.spotlight.distance = CONFIG.LIGHTING.SPOTLIGHT.DISTANCE;

    // Set target position
    this.target.position.set(
      CONFIG.LIGHTING.SPOTLIGHT.TARGET.x,
      CONFIG.LIGHTING.SPOTLIGHT.TARGET.y,
      CONFIG.LIGHTING.SPOTLIGHT.TARGET.z
    );
  }

  /**
   * Gets the Three.js spotlight object
   * @returns {THREE.SpotLight} The spotlight
   */
  getLight() {
    return this.spotlight;
  }

  /**
   * Gets the spotlight target object
   * @returns {THREE.Object3D} The spotlight target
   */
  getTarget() {
    return this.target;
  }
}

