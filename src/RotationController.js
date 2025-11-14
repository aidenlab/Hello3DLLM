import { CONFIG } from './constants.js';

/**
 * Handles cube rotation via mouse drag and touch gestures
 */
export class RotationController {
  constructor(cube) {
    this.cube = cube;
    this.isDragging = false;
    this.previousPosition = { x: 0, y: 0 };
    this.rotationSensitivity = CONFIG.INTERACTION.ROTATION_SENSITIVITY;
  }

  startDrag(x, y) {
    this.isDragging = true;
    this.previousPosition = { x, y };
  }

  updateDrag(x, y) {
    if (!this.isDragging) return;
    
    const deltaX = x - this.previousPosition.x;
    const deltaY = y - this.previousPosition.y;
    
    // Rotate cube based on movement
    // X rotation corresponds to vertical movement
    // Y rotation corresponds to horizontal movement
    this.cube.rotation.y += deltaX * this.rotationSensitivity;
    this.cube.rotation.x += deltaY * this.rotationSensitivity;
    
    this.previousPosition = { x, y };
  }

  stopDrag() {
    this.isDragging = false;
  }

  isCurrentlyDragging() {
    return this.isDragging;
  }
}

