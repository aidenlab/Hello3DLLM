import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from './constants.js';

/**
 * Represents a 3D model with its geometry, material, and mesh
 * Handles all model-related creation and configuration
 */
export class Model {
  constructor() {
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.loader = new GLTFLoader();
  }

  /**
   * Loads the GLTF model asynchronously
   * @returns {Promise<void>}
   */
  async load() {
    await this._loadModel();
    this._createMaterial();
    this._createMesh();
  }

  async _loadModel() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        '/models/gltf/LeePerrySmith/LeePerrySmith.glb',
        (gltf) => {
          // Extract geometry from the first child of the scene
          this.geometry = gltf.scene.children[0].geometry;
          resolve();
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
          reject(error);
        }
      );
    });
  }

  _createMaterial() {
    // Create a simple material that responds to lighting
    this.material = new THREE.MeshStandardMaterial({
      color: CONFIG.MODEL.COLOR,
    });
  }

  _createMesh() {
    // Create a mesh (geometry + material)
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    // Position model at y: -0.5 as in the bumpmap example
    this.mesh.position.y = -0.5;
    // Apply initial scale
    this.mesh.scale.set(CONFIG.MODEL.SIZE, CONFIG.MODEL.SIZE, CONFIG.MODEL.SIZE);
  }

  /**
   * Gets the Three.js mesh object that can be added to a scene
   * @returns {THREE.Mesh} The model mesh
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * Gets the model's geometry
   * @returns {THREE.BufferGeometry} The model geometry
   */
  getGeometry() {
    return this.geometry;
  }

  /**
   * Gets the model's material
   * @returns {THREE.MeshStandardMaterial} The model material
   */
  getMaterial() {
    return this.material;
  }
}

