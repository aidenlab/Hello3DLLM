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
    this.keyLightHelper = null;
    this.fillLightHelper = null;
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
    this.keyLightHelper = new RectAreaLightHelper(this.keyLight.getLightObject());
    this.keyLight.getLightObject().add(this.keyLightHelper);
    this.keyLight.setHelper(this.keyLightHelper);
    
    // Create highlight overlay for key light
    this.keyLight.createHighlightOverlay();

    // Fill light - softer light to fill shadows
    this.fillLight = new AreaLight('fill');
    this.scene.add(this.fillLight.getLight()); // Add parent group to scene
    // Add helper to visualize the fill light (attach to light object, not parent)
    this.fillLightHelper = new RectAreaLightHelper(this.fillLight.getLightObject());
    this.fillLight.getLightObject().add(this.fillLightHelper);
    this.fillLight.setHelper(this.fillLightHelper);
    
    // Create highlight overlay for fill light
    this.fillLight.createHighlightOverlay();
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
      // Update highlight overlay color to match
      this.keyLight.updateHighlightColor();
    }
  }

  setKeyLightSize(width, height) {
    if (this.keyLight) {
      this.keyLight.getLightObject().width = width;
      this.keyLight.getLightObject().height = height;
    }
  }

  /**
   * Sets the key light position using camera-centric spherical coordinates
   * Preserves the current distance - only changes azimuth and elevation
   * @param {number|string} azimuth - Horizontal angle in degrees (0-360) or direction name (e.g., "north", "northwest", "NW")
   *   0° = camera forward (North), 90° = camera right (East), 180° = behind camera (South), 270° = camera left (West)
   * @param {number} elevation - Vertical angle in degrees (0-90), 0° = horizon, 90° = overhead
   */
  setKeyLightPositionSpherical(azimuth, elevation) {
    if (this.keyLight && this.camera) {
      this.keyLight.setPositionSpherical(azimuth, elevation, this.camera);
    }
  }

  /**
   * Gets the current key light position as camera-centric spherical coordinates
   * @returns {{azimuth: number, elevation: number, distance: number}} Spherical coordinates
   */
  getKeyLightPositionSpherical() {
    if (this.keyLight && this.camera) {
      return this.keyLight.getPositionSpherical(this.camera);
    }
    return { azimuth: 0, elevation: 0, distance: 0 };
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
      // Update highlight overlay color to match
      this.fillLight.updateHighlightColor();
    }
  }

  setFillLightSize(width, height) {
    if (this.fillLight) {
      this.fillLight.getLightObject().width = width;
      this.fillLight.getLightObject().height = height;
    }
  }

  /**
   * Sets the fill light position using camera-centric spherical coordinates
   * Preserves the current distance - only changes azimuth and elevation
   * @param {number|string} azimuth - Horizontal angle in degrees (0-360) or direction name (e.g., "north", "northwest", "NW")
   *   0° = camera forward (North), 90° = camera right (East), 180° = behind camera (South), 270° = camera left (West)
   * @param {number} elevation - Vertical angle in degrees (0-90), 0° = horizon, 90° = overhead
   */
  setFillLightPositionSpherical(azimuth, elevation) {
    if (this.fillLight && this.camera) {
      this.fillLight.setPositionSpherical(azimuth, elevation, this.camera);
    }
  }

  /**
   * Gets the current fill light position as camera-centric spherical coordinates
   * @returns {{azimuth: number, elevation: number, distance: number}} Spherical coordinates
   */
  getFillLightPositionSpherical() {
    if (this.fillLight && this.camera) {
      return this.fillLight.getPositionSpherical(this.camera);
    }
    return { azimuth: 0, elevation: 0, distance: 0 };
  }

  // Key light swing methods
  swingKeyLightUp() {
    if (this.keyLight) {
      const swingAmountDegrees = CONFIG.INTERACTION.AREA_LIGHT_SWING_AMOUNT;
      const swingAmountRadians = THREE.MathUtils.degToRad(swingAmountDegrees);
      this.keyLight.rotate(0, -swingAmountRadians); // Vertical rotation (X axis)
    }
  }

  swingKeyLightDown() {
    if (this.keyLight) {
      const swingAmountDegrees = CONFIG.INTERACTION.AREA_LIGHT_SWING_AMOUNT;
      const swingAmountRadians = THREE.MathUtils.degToRad(swingAmountDegrees);
      this.keyLight.rotate(0, swingAmountRadians); // Vertical rotation (X axis)
    }
  }

  swingKeyLightLeft() {
    if (this.keyLight) {
      const swingAmountDegrees = CONFIG.INTERACTION.AREA_LIGHT_SWING_AMOUNT;
      const swingAmountRadians = THREE.MathUtils.degToRad(swingAmountDegrees);
      this.keyLight.rotate(-swingAmountRadians, 0); // Horizontal rotation (Y axis)
    }
  }

  swingKeyLightRight() {
    if (this.keyLight) {
      const swingAmountDegrees = CONFIG.INTERACTION.AREA_LIGHT_SWING_AMOUNT;
      const swingAmountRadians = THREE.MathUtils.degToRad(swingAmountDegrees);
      this.keyLight.rotate(swingAmountRadians, 0); // Horizontal rotation (Y axis)
    }
  }

  // Fill light swing methods
  swingFillLightUp() {
    if (this.fillLight) {
      const swingAmountDegrees = CONFIG.INTERACTION.AREA_LIGHT_SWING_AMOUNT;
      const swingAmountRadians = THREE.MathUtils.degToRad(swingAmountDegrees);
      this.fillLight.rotate(0, -swingAmountRadians); // Vertical rotation (X axis)
    }
  }

  swingFillLightDown() {
    if (this.fillLight) {
      const swingAmountDegrees = CONFIG.INTERACTION.AREA_LIGHT_SWING_AMOUNT;
      const swingAmountRadians = THREE.MathUtils.degToRad(swingAmountDegrees);
      this.fillLight.rotate(0, swingAmountRadians); // Vertical rotation (X axis)
    }
  }

  swingFillLightLeft() {
    if (this.fillLight) {
      const swingAmountDegrees = CONFIG.INTERACTION.AREA_LIGHT_SWING_AMOUNT;
      const swingAmountRadians = THREE.MathUtils.degToRad(swingAmountDegrees);
      this.fillLight.rotate(-swingAmountRadians, 0); // Horizontal rotation (Y axis)
    }
  }

  swingFillLightRight() {
    if (this.fillLight) {
      const swingAmountDegrees = CONFIG.INTERACTION.AREA_LIGHT_SWING_AMOUNT;
      const swingAmountRadians = THREE.MathUtils.degToRad(swingAmountDegrees);
      this.fillLight.rotate(swingAmountRadians, 0); // Horizontal rotation (Y axis)
    }
  }

  // Key light walk methods (dolly in/out)
  walkKeyLightIn() {
    if (this.keyLight) {
      const walkAmount = CONFIG.INTERACTION.AREA_LIGHT_WALK_AMOUNT;
      this.keyLight.dolly(-walkAmount); // Negative moves toward origin
    }
  }

  walkKeyLightOut() {
    if (this.keyLight) {
      const walkAmount = CONFIG.INTERACTION.AREA_LIGHT_WALK_AMOUNT;
      this.keyLight.dolly(walkAmount); // Positive moves away from origin
    }
  }

  // Fill light walk methods (dolly in/out)
  walkFillLightIn() {
    if (this.fillLight) {
      const walkAmount = CONFIG.INTERACTION.AREA_LIGHT_WALK_AMOUNT;
      this.fillLight.dolly(-walkAmount); // Negative moves toward origin
    }
  }

  walkFillLightOut() {
    if (this.fillLight) {
      const walkAmount = CONFIG.INTERACTION.AREA_LIGHT_WALK_AMOUNT;
      this.fillLight.dolly(walkAmount); // Positive moves away from origin
    }
  }

  /**
   * Gets array of pickable objects for ray picking (picker geometries)
   * @returns {Array<THREE.Object3D>} Array of pickable objects
   */
  getAreaLightHelpers() {
    const pickers = [];
    if (this.keyLight && this.keyLight.getPickerGeometry()) {
      pickers.push(this.keyLight.getPickerGeometry());
    }
    if (this.fillLight && this.fillLight.getPickerGeometry()) {
      pickers.push(this.fillLight.getPickerGeometry());
    }
    return pickers;
  }

  /**
   * Gets array of AreaLight instances
   * @returns {Array<AreaLight>} Array of area light instances
   */
  getAreaLights() {
    const lights = [];
    if (this.keyLight) {
      lights.push(this.keyLight);
    }
    if (this.fillLight) {
      lights.push(this.fillLight);
    }
    return lights;
  }

  /**
   * Identifies which area light corresponds to an intersection
   * @param {Object} intersection - Intersection result from raycaster
   * @returns {AreaLight|null} The corresponding area light or null
   */
  getHoveredAreaLight(intersection) {
    if (!intersection || !intersection.object) {
      return null;
    }

    const intersectedObject = intersection.object;
    
    // Check if intersection is with key light picker geometry
    if (this.keyLight && intersectedObject === this.keyLight.getPickerGeometry()) {
      return this.keyLight;
    }
    
    // Check if intersection is with fill light picker geometry
    if (this.fillLight && intersectedObject === this.fillLight.getPickerGeometry()) {
      return this.fillLight;
    }

    return null;
  }
}

