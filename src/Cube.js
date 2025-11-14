import * as THREE from 'three';
import { CONFIG } from './constants.js';

/**
 * Represents a 3D cube with its geometry, material, and mesh
 * Handles all cube-related creation and configuration
 */
export class Cube {
  constructor() {
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    
    this._createGeometry();
    this._createMaterial();
    this._createMesh();
  }

  _createGeometry() {
    this.geometry = new THREE.BoxGeometry(
      CONFIG.CUBE.SIZE,
      CONFIG.CUBE.SIZE,
      CONFIG.CUBE.SIZE
    );

    // Ensure normals are computed for flat shading
    // This ensures each face has its own normal for proper edge definition
    if (this.geometry.attributes.normal === undefined) {
      this.geometry.computeVertexNormals();
    }
    // For flat shading, we want face normals - ensure geometry is set up correctly
    this.geometry.normalizeNormals();
  }

  _createMaterial() {
    // Create a material that responds to lighting
    // Use flat shading so each face has distinct normals and edges are visible
    this.material = new THREE.MeshStandardMaterial({
      color: CONFIG.CUBE.COLOR,
      flatShading: true, // Flat shading ensures each face has distinct normals
    });
  }

  _createMesh() {
    // Create a mesh (geometry + material)
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  /**
   * Gets the Three.js mesh object that can be added to a scene
   * @returns {THREE.Mesh} The cube mesh
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * Gets the cube's geometry
   * @returns {THREE.BoxGeometry} The cube geometry
   */
  getGeometry() {
    return this.geometry;
  }

  /**
   * Gets the cube's material
   * @returns {THREE.MeshStandardMaterial} The cube material
   */
  getMaterial() {
    return this.material;
  }
}

