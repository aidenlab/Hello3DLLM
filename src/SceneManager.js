import * as THREE from 'three';
import { CONFIG } from './constants.js';
import { Model } from './Model.js';
import { AreaLight } from './AreaLight.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

/**
 * Manages the Three.js scene, renderer, lights, and objects
 */
export class SceneManager {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.scene = null;
    this.renderer = null;
    this.model = null;
    this.keyLight = null;
    this.fillLight = null;
  }

  async initialize() {
    this._createScene();
    this._createRenderer();
    await this._createModel();
    this._createLights();
  }

  _createScene() {
    this.scene = new THREE.Scene();
  }

  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Initialize RectAreaLight uniforms library (required for area lights)
    RectAreaLightUniformsLib.init();
  }

  async _createModel() {
    this.model = new Model();
    await this.model.load();
    this.scene.add(this.model.getMesh());
  }

  _createLights() {
    // Ambient light for minimal general illumination
    const ambientLight = new THREE.AmbientLight(
      CONFIG.LIGHTING.AMBIENT.COLOR,
      CONFIG.LIGHTING.AMBIENT.INTENSITY
    );
    this.scene.add(ambientLight);

    // Key light - main light source
    this.keyLight = new AreaLight('key');
    this.scene.add(this.keyLight.getLight()); // Add parent group to scene
    // Add helper to visualize the key light (attach to light object, not parent)
    const keyLightHelper = new RectAreaLightHelper(this.keyLight.getLightObject());
    this.keyLight.getLightObject().add(keyLightHelper);

    // Fill light - softer light to fill shadows
    this.fillLight = new AreaLight('fill');
    this.scene.add(this.fillLight.getLight()); // Add parent group to scene
    // Add helper to visualize the fill light (attach to light object, not parent)
    const fillLightHelper = new RectAreaLightHelper(this.fillLight.getLightObject());
    this.fillLight.getLightObject().add(fillLightHelper);
  }

  render(camera) {
    this.renderer.render(this.scene, camera);
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  getModel() {
    return this.model.getMesh();
  }

  /**
   * Gets the model instance for full manipulation access
   * @returns {Model} The model instance
   */
  getModelInstance() {
    return this.model;
  }

  /**
   * Changes the color of the model
   * @param {string} color - Hex color string (e.g., "#ff0000")
   */
  changeModelColor(color) {
    const hexColor = parseInt(color.replace('#', ''), 16);
    this.model.getMaterial().color.setHex(hexColor);
  }

  /**
   * Changes the uniform size of the model by scaling
   * @param {number} size - New size value (scale factor)
   */
  changeModelSize(size) {
    // Use uniform scale instead of geometry recreation for GLTF models
    this.model.getMesh().scale.set(size, size, size);
  }

  /**
   * Scales the model independently in each dimension
   * @param {number} x - Scale factor for X axis
   * @param {number} y - Scale factor for Y axis
   * @param {number} z - Scale factor for Z axis
   */
  scaleModel(x, y, z) {
    this.model.getMesh().scale.set(x, y, z);
  }

  /**
   * Changes the background color of the scene
   * @param {string} color - Hex color string (e.g., "#000000")
   */
  changeBackgroundColor(color) {
    const hexColor = parseInt(color.replace('#', ''), 16);
    this.scene.background = new THREE.Color(hexColor);
  }

  // Key light control methods
  setKeyLightIntensity(intensity) {
    if (this.keyLight) {
      this.keyLight.getLightObject().intensity = intensity;
    }
  }

  setKeyLightPosition(x, y, z) {
    if (this.keyLight) {
      // Convert world position to relative position (relative to model origin)
      const origin = CONFIG.MODEL.ORIGIN;
      const relativeX = x - origin.x;
      const relativeY = y - origin.y;
      const relativeZ = z - origin.z;
      
      // Set position relative to parent group
      this.keyLight.getLightObject().position.set(relativeX, relativeY, relativeZ);
      // Re-orient toward target (world coordinates)
      const target = CONFIG.LIGHTING.KEY_LIGHT.TARGET || { x: 0, y: 0, z: 0 };
      this.keyLight.getLightObject().lookAt(target.x, target.y, target.z);
    }
  }

  setKeyLightColor(color) {
    if (this.keyLight) {
      const hexColor = parseInt(color.replace('#', ''), 16);
      this.keyLight.getLightObject().color.setHex(hexColor);
    }
  }

  setKeyLightSize(width, height) {
    if (this.keyLight) {
      this.keyLight.getLightObject().width = width;
      this.keyLight.getLightObject().height = height;
    }
  }

  // Fill light control methods
  setFillLightIntensity(intensity) {
    if (this.fillLight) {
      this.fillLight.getLightObject().intensity = intensity;
    }
  }

  setFillLightPosition(x, y, z) {
    if (this.fillLight) {
      // Convert world position to relative position (relative to model origin)
      const origin = CONFIG.MODEL.ORIGIN;
      const relativeX = x - origin.x;
      const relativeY = y - origin.y;
      const relativeZ = z - origin.z;
      
      // Set position relative to parent group
      this.fillLight.getLightObject().position.set(relativeX, relativeY, relativeZ);
      // Re-orient toward target (world coordinates)
      const target = CONFIG.LIGHTING.FILL_LIGHT.TARGET || { x: 0, y: 0, z: 0 };
      this.fillLight.getLightObject().lookAt(target.x, target.y, target.z);
    }
  }

  setFillLightColor(color) {
    if (this.fillLight) {
      const hexColor = parseInt(color.replace('#', ''), 16);
      this.fillLight.getLightObject().color.setHex(hexColor);
    }
  }

  setFillLightSize(width, height) {
    if (this.fillLight) {
      this.fillLight.getLightObject().width = width;
      this.fillLight.getLightObject().height = height;
    }
  }
}

