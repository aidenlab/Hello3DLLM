import * as THREE from 'three';
import { CONFIG } from './constants.js';
import { Cube } from './Cube.js';
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
    this.cube = null;
    
    this._initialize();
  }

  _initialize() {
    this._createScene();
    this._createRenderer();
    this._createCube();
    this._createLights();
  }

  _createScene() {
    this.scene = new THREE.Scene();
  }

  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _createCube() {
    this.cube = new Cube();
    this.scene.add(this.cube.getMesh());
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

  getCube() {
    return this.cube.getMesh();
  }

  /**
   * Gets the cube instance for full manipulation access
   * @returns {Cube} The cube instance
   */
  getCubeInstance() {
    return this.cube;
  }

  /**
   * Changes the color of the cube
   * @param {string} color - Hex color string (e.g., "#ff0000")
   */
  changeCubeColor(color) {
    const hexColor = parseInt(color.replace('#', ''), 16);
    this.cube.getMaterial().color.setHex(hexColor);
  }

  /**
   * Changes the uniform size of the cube by recreating the geometry
   * @param {number} size - New size value
   */
  changeCubeSize(size) {
    // Dispose old geometry
    this.cube.getGeometry().dispose();
    
    // Create new geometry with new size
    const newGeometry = new THREE.BoxGeometry(size, size, size);
    newGeometry.computeVertexNormals();
    newGeometry.normalizeNormals();
    
    // Replace geometry
    this.cube.mesh.geometry = newGeometry;
    this.cube.geometry = newGeometry;
  }

  /**
   * Scales the cube independently in each dimension
   * @param {number} x - Scale factor for X axis
   * @param {number} y - Scale factor for Y axis
   * @param {number} z - Scale factor for Z axis
   */
  scaleCube(x, y, z) {
    this.cube.getMesh().scale.set(x, y, z);
  }
}

