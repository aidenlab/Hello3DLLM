/**
 * Manages interaction modes for the application
 */
export class InteractionModeManager {
  constructor() {
    this.MODEL_ROTATION = 'MODEL_ROTATION';
    this.AREA_LIGHT_MANIPULATION = 'AREA_LIGHT_MANIPULATION';
    this.currentMode = this.MODEL_ROTATION;
  }

  /**
   * Set the current interaction mode
   * @param {string} mode - The mode to set (MODEL_ROTATION or AREA_LIGHT_MANIPULATION)
   */
  setMode(mode) {
    if (mode === this.MODEL_ROTATION || mode === this.AREA_LIGHT_MANIPULATION) {
      this.currentMode = mode;
    } else {
      console.warn('Invalid interaction mode:', mode);
    }
  }

  /**
   * Get the current interaction mode
   * @returns {string} The current mode
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Check if currently in model rotation mode
   * @returns {boolean} True if in model rotation mode
   */
  isModelRotationMode() {
    return this.currentMode === this.MODEL_ROTATION;
  }

  /**
   * Check if currently in area light manipulation mode
   * @returns {boolean} True if in area light manipulation mode
   */
  isAreaLightMode() {
    return this.currentMode === this.AREA_LIGHT_MANIPULATION;
  }
}

