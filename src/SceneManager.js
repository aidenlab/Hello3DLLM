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
}

