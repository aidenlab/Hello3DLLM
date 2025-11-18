import * as THREE from 'three';
import { CONFIG } from './constants.js';
import { Model } from './Model.js';
import { Spotlight } from './Spotlight.js';

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

    // Spotlight for focused lighting
    const spotlight = new Spotlight();
    this.scene.add(spotlight.getLight());
    this.scene.add(spotlight.getTarget());
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
}

