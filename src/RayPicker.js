import * as THREE from 'three';

/**
 * Manages ray casting and intersection detection for mouse picking
 */
export class RayPicker {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
  }

  /**
   * Update mouse position from screen coordinates
   * @param {number} x - Screen x coordinate
   * @param {number} y - Screen y coordinate
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  updateMousePosition(x, y, width, height) {
    // Convert screen coordinates to normalized device coordinates [-1, 1]
    this.mouse.x = (x / width) * 2 - 1;
    this.mouse.y = -(y / height) * 2 + 1;
  }

  /**
   * Perform ray casting and return intersections
   * @param {THREE.Camera} camera - The camera to cast from
   * @param {Array<THREE.Object3D>} objects - Array of objects to test intersection with
   * @param {boolean} recursive - Whether to test child objects recursively
   * @returns {Array} Array of intersection results
   */
  getIntersections(camera, objects, recursive = true) {
    // Update raycaster with current mouse position and camera
    this.raycaster.setFromCamera(this.mouse, camera);
    
    // Calculate intersections
    const intersections = this.raycaster.intersectObjects(objects, recursive);
    
    return intersections;
  }

  /**
   * Get the currently hovered object
   * @returns {THREE.Object3D|null} The hovered object or null
   */
  getHoveredObject() {
    return this.hoveredObject;
  }

  /**
   * Set the currently hovered object
   * @param {THREE.Object3D|null} object - The object being hovered, or null
   */
  setHoveredObject(object) {
    this.hoveredObject = object;
  }
}

