import * as THREE from 'three';
import { CONFIG } from './constants.js';
import { sphericalToCartesian, cartesianToSpherical, directionToAzimuthAngle } from './utils/coordinates/CoordinateSystem.js';

/**
 * Represents an area light (RectAreaLight) for key or fill lighting
 * Handles area light creation and configuration
 * The light rotates around the model origin (0, -0.5, 0) via a parent group
 * Future rotation will use Euler angles (simpler than quaternions for constrained rotations)
 */
export class AreaLight {
  constructor(type = 'key') {
    this.areaLight = null;
    this.parentGroup = null;
    this.helper = null;
    this.highlightOverlay = null;
    this.pickerGeometry = null; // Invisible geometry for ray picking
    this.type = type; // 'key' or 'fill'
    
    this._createAreaLight();
    this._configureAreaLight();
  }

  _createAreaLight() {
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const { COLOR, INTENSITY, WIDTH, HEIGHT } = config;
    
    // Create parent group positioned at model origin (rotation pivot)
    this.parentGroup = new THREE.Object3D();
    const origin = CONFIG.MODEL.ORIGIN;
    this.parentGroup.position.set(origin.x, origin.y, origin.z);
    
    // Create the actual light as a child of the parent group
    this.areaLight = new THREE.RectAreaLight(COLOR, INTENSITY, WIDTH, HEIGHT);
    this.parentGroup.add(this.areaLight);
  }

  _configureAreaLight() {
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const origin = CONFIG.MODEL.ORIGIN;

    // Calculate light position relative to parent (model origin)
    // Parent is at (0, -0.5, 0), so we need to offset by the difference
    const worldPosition = config.POSITION;
    const relativePosition = {
      x: worldPosition.x - origin.x,
      y: worldPosition.y - origin.y,
      z: worldPosition.z - origin.z
    };
    
    // Set position relative to parent
    this.areaLight.position.set(relativePosition.x, relativePosition.y, relativePosition.z);

    // Set rotation to point the light toward the target
    // RectAreaLight uses lookAt() method to orient toward a point (world coordinates)
    const targetPosition = config.TARGET || { x: 0, y: 0, z: 0 };
    this.areaLight.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }

  /**
   * Gets the parent group (for scene addition)
   * This is the rotation pivot positioned at the model origin
   * @returns {THREE.Object3D} The parent group
   */
  getLight() {
    return this.parentGroup;
  }

  /**
   * Gets the actual RectAreaLight object (for property access and helper attachment)
   * @returns {THREE.RectAreaLight} The area light
   */
  getLightObject() {
    return this.areaLight;
  }

  /**
   * Gets the light type ('key' or 'fill')
   * @returns {string} The light type
   */
  getType() {
    return this.type;
  }

  /**
   * Sets the helper reference for this light
   * @param {THREE.Object3D} helper - The RectAreaLightHelper instance
   */
  setHelper(helper) {
    this.helper = helper;
  }

  /**
   * Gets the helper reference
   * @returns {THREE.Object3D} The helper instance
   */
  getHelper() {
    return this.helper;
  }

  /**
   * Creates a translucent highlight overlay matching the light's bounds
   * Also creates an invisible picker geometry for ray picking
   * The overlay uses the light's color to provide visual feedback
   */
  createHighlightOverlay() {
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const { WIDTH, HEIGHT } = config;

    // Create plane geometry matching the light's dimensions
    const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    
    // Create translucent material using the light's current color
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: this.areaLight.color, // Use the light's actual color
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });

    // Create highlight overlay mesh
    this.highlightOverlay = new THREE.Mesh(geometry.clone(), highlightMaterial);
    this.highlightOverlay.visible = false;
    
    // Create invisible picker geometry for ray picking
    const pickerMaterial = new THREE.MeshBasicMaterial({
      visible: false, // Invisible but still pickable
      side: THREE.DoubleSide
    });
    this.pickerGeometry = new THREE.Mesh(geometry.clone(), pickerMaterial);
    
    // Both overlay and picker inherit the light's position and rotation
    // Add both as children of the light object
    this.areaLight.add(this.highlightOverlay);
    this.areaLight.add(this.pickerGeometry);
  }

  /**
   * Gets the highlight overlay mesh
   * @returns {THREE.Mesh} The highlight overlay
   */
  getHighlightOverlay() {
    return this.highlightOverlay;
  }

  /**
   * Gets the picker geometry for ray picking
   * @returns {THREE.Mesh} The picker geometry
   */
  getPickerGeometry() {
    return this.pickerGeometry;
  }

  /**
   * Sets the highlighted state of the light
   * @param {boolean} highlighted - Whether the light should be highlighted
   */
  setHighlighted(highlighted) {
    if (this.highlightOverlay) {
      this.highlightOverlay.visible = highlighted;
    }
  }

  /**
   * Updates the highlight overlay color to match the light's current color
   */
  updateHighlightColor() {
    if (this.highlightOverlay && this.highlightOverlay.material) {
      // Copy the light's color to the overlay material
      this.highlightOverlay.material.color.copy(this.areaLight.color);
    }
  }

  /**
   * Rotates the light around the model origin using Euler angles
   * @param {number} deltaX - Horizontal rotation delta (left/right movement)
   * @param {number} deltaY - Vertical rotation delta (up/down movement)
   */
  rotate(deltaX, deltaY) {
    if (!this.parentGroup) {
      return;
    }

    // Apply rotation to parent group (rotation pivot at model origin)
    // Horizontal movement (deltaX) rotates around Y axis (vertical axis)
    // Vertical movement (deltaY) rotates around X axis (horizontal axis)
    this.parentGroup.rotation.y += deltaX;
    this.parentGroup.rotation.x += deltaY;

    // After rotating the parent, update the light's lookAt to maintain target orientation
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const targetPosition = config.TARGET || { x: 0, y: 0, z: 0 };
    
    // Get world position of the light after rotation
    const worldPosition = new THREE.Vector3();
    this.areaLight.getWorldPosition(worldPosition);
    
    // Update lookAt to point toward target (world coordinates)
    this.areaLight.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }

  /**
   * Gets the parent group's rotation (Euler angles)
   * @returns {THREE.Euler} The rotation Euler angles
   */
  getRotation() {
    return this.parentGroup ? this.parentGroup.rotation : new THREE.Euler();
  }

  /**
   * Moves the light along the radial vector from the model origin to the light's current position
   * (dollying in/out from the origin)
   * 
   * This composes nicely with setPositionSpherical():
   * - setPositionSpherical() changes azimuth/elevation while preserving distance
   * - dolly() then moves along the radial line from origin to the light's current position
   * This allows natural workflow: rotate to desired position, then adjust distance along the normal
   * 
   * @param {number} delta - Movement delta (positive moves away from origin, negative moves toward)
   */
  dolly(delta) {
    if (!this.areaLight || !this.parentGroup) {
      return;
    }

    // Get current position relative to parent (which is at model origin)
    const currentPosition = this.areaLight.position.clone();
    const currentDistance = currentPosition.length();
    
    // Calculate direction vector from origin to light position (radial direction)
    let direction;
    if (currentDistance > 0.0001) {
      // Normalize to get radial direction vector
      direction = currentPosition.clone().normalize();
    } else {
      // If light is at origin, use a default direction (forward along Z)
      direction = new THREE.Vector3(0, 0, 1);
    }
    
    // Calculate movement vector along the radial direction
    const movement = direction.multiplyScalar(delta);
    
    // Calculate new position by moving along the radial line
    const newPosition = currentPosition.add(movement);
    
    // Update light position
    this.areaLight.position.copy(newPosition);
    
    // After moving, update the light's lookAt to maintain target orientation
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const targetPosition = config.TARGET || { x: 0, y: 0, z: 0 };
    this.areaLight.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }

  /**
   * Sets the light position using camera-centric spherical coordinates
   * Preserves the current distance - only changes azimuth and elevation
   * @param {number|string} azimuth - Horizontal angle in degrees (0-360) or direction name (e.g., "north", "northwest", "NW")
   *   0° = camera forward (North), 90° = camera right (East), 180° = behind camera (South), 270° = camera left (West)
   * @param {number} elevation - Vertical angle in degrees (0-90), 0° = horizon, 90° = overhead
   * @param {THREE.PerspectiveCamera} camera - The camera (for camera-centric reference frame)
   */
  setPositionSpherical(azimuth, elevation, camera) {
    if (!this.areaLight || !this.parentGroup || !camera) {
      return;
    }

    // Get current distance from existing position
    const currentPosition = this.areaLight.position.clone();
    const currentDistance = currentPosition.length();
    
    // Use current distance (or default to 1 if at origin)
    const distance = currentDistance > 0.0001 ? currentDistance : 1.0;

    // Convert spherical coordinates to Cartesian (relative to model origin)
    const cartesian = sphericalToCartesian(azimuth, elevation, distance, camera);
    
    // Set position relative to parent group (which is at model origin)
    this.areaLight.position.set(cartesian.x, cartesian.y, cartesian.z);
    
    // Update the light's lookAt to maintain target orientation
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const targetPosition = config.TARGET || { x: 0, y: 0, z: 0 };
    this.areaLight.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }

  /**
   * Gets the current light position as camera-centric spherical coordinates
   * @param {THREE.PerspectiveCamera} camera - The camera (for camera-centric reference frame)
   * @returns {{azimuth: number, elevation: number, distance: number}} Spherical coordinates (numeric values only)
   */
  getPositionSpherical(camera) {
    if (!this.areaLight || !this.parentGroup || !camera) {
      return { azimuth: 0, elevation: 0, distance: 0 };
    }

    // Get position relative to parent (which is at model origin)
    const relativePosition = this.areaLight.position.clone();
    
    // Convert to spherical coordinates
    return cartesianToSpherical(
      relativePosition.x,
      relativePosition.y,
      relativePosition.z,
      camera
    );
  }

  /**
   * Rotates the light clockwise (decreases azimuth) relative to current position
   * @param {number} degrees - Amount to rotate in degrees (defaults to 10°)
   * @param {THREE.PerspectiveCamera} camera - The camera (for camera-centric reference frame)
   */
  rotateClockwise(degrees = 10, camera) {
    if (!this.areaLight || !this.parentGroup || !camera) {
      return;
    }

    const current = this.getPositionSpherical(camera);
    const newAzimuth = (current.azimuth - degrees + 360) % 360;
    this.setPositionSpherical(newAzimuth, current.elevation, camera);
  }

  /**
   * Rotates the light counterclockwise (increases azimuth) relative to current position
   * @param {number} degrees - Amount to rotate in degrees (defaults to 10°)
   * @param {THREE.PerspectiveCamera} camera - The camera (for camera-centric reference frame)
   */
  rotateCounterclockwise(degrees = 10, camera) {
    if (!this.areaLight || !this.parentGroup || !camera) {
      return;
    }

    const current = this.getPositionSpherical(camera);
    const newAzimuth = (current.azimuth + degrees) % 360;
    this.setPositionSpherical(newAzimuth, current.elevation, camera);
  }

  /**
   * Adjusts the light elevation upward relative to current position
   * @param {number} degrees - Amount to increase elevation in degrees (defaults to 5°)
   * @param {THREE.PerspectiveCamera} camera - The camera (for camera-centric reference frame)
   */
  nudgeElevationUp(degrees = 5, camera) {
    if (!this.areaLight || !this.parentGroup || !camera) {
      return;
    }

    const current = this.getPositionSpherical(camera);
    const newElevation = Math.min(90, current.elevation + degrees);
    this.setPositionSpherical(current.azimuth, newElevation, camera);
  }

  /**
   * Adjusts the light elevation downward relative to current position
   * @param {number} degrees - Amount to decrease elevation in degrees (defaults to 5°)
   * @param {THREE.PerspectiveCamera} camera - The camera (for camera-centric reference frame)
   */
  nudgeElevationDown(degrees = 5, camera) {
    if (!this.areaLight || !this.parentGroup || !camera) {
      return;
    }

    const current = this.getPositionSpherical(camera);
    const newElevation = Math.max(0, current.elevation - degrees);
    this.setPositionSpherical(current.azimuth, newElevation, camera);
  }

  /**
   * Moves the light toward a specific direction relative to current position
   * @param {number|string} targetDirection - Target direction (numeric azimuth or direction name)
   * @param {number} degrees - Amount to move toward target in degrees (defaults to 10°)
   * @param {THREE.PerspectiveCamera} camera - The camera (for camera-centric reference frame)
   */
  moveTowardDirection(targetDirection, degrees = 10, camera) {
    if (!this.areaLight || !this.parentGroup || !camera) {
      return;
    }

    // Convert direction name to numeric azimuth if needed
    const targetAzimuth = directionToAzimuthAngle(targetDirection);
    if (targetAzimuth === null) {
      // If not a valid direction, treat as numeric
      const numValue = typeof targetDirection === 'number' ? targetDirection : parseFloat(targetDirection);
      if (isNaN(numValue)) {
        return; // Invalid direction
      }
      var targetAzimuthNum = numValue;
    } else {
      var targetAzimuthNum = targetAzimuth;
    }

    const current = this.getPositionSpherical(camera);
    
    // Calculate shortest angular distance to target
    let diff = targetAzimuthNum - current.azimuth;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    // Move toward target by specified amount
    const moveAmount = Math.sign(diff) * Math.min(Math.abs(diff), degrees);
    const newAzimuth = (current.azimuth + moveAmount + 360) % 360;
    
    this.setPositionSpherical(newAzimuth, current.elevation, camera);
  }

  /**
   * Sets the light position using Cartesian coordinates (relative to model origin)
   * @param {number} x - X coordinate relative to model origin
   * @param {number} y - Y coordinate relative to model origin
   * @param {number} z - Z coordinate relative to model origin
   */
  setPositionCartesian(x, y, z) {
    if (!this.areaLight) {
      return;
    }

    // Set position relative to parent group (which is at model origin)
    this.areaLight.position.set(x, y, z);
    
    // Update the light's lookAt to maintain target orientation
    const config = this.type === 'key' ? CONFIG.LIGHTING.KEY_LIGHT : CONFIG.LIGHTING.FILL_LIGHT;
    const targetPosition = config.TARGET || { x: 0, y: 0, z: 0 };
    this.areaLight.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }
}

