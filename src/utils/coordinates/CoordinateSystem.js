import * as THREE from 'three';

/**
 * Camera-centric coordinate system utilities
 * 
 * Coordinate System Convention:
 * - Azimuth (0-360°): Horizontal angle from camera's perspective
 *   - 0° = North (camera forward, toward model) = -Z direction
 *   - 90° = East (camera right) = +X direction
 *   - 180° = South (behind camera) = +Z direction
 *   - 270° = West (camera left) = -X direction
 * - Elevation (0-90°): Vertical angle above horizon
 *   - 0° = Horizon (horizontal plane)
 *   - 90° = Directly overhead (+Y direction)
 * - Distance: Radial distance from model origin
 * - Y-axis: Always up (gravity)
 */

/**
 * Direction name to azimuth angle mapping
 * Maps cardinal and intercardinal directions to azimuth values in degrees
 */
const directionToAzimuth = new Map([
  // Cardinal directions
  ['north', 0],
  ['east', 90],
  ['south', 180],
  ['west', 270],
  // Intercardinal directions
  ['northeast', 45],
  ['northwest', 315],
  ['southeast', 135],
  ['southwest', 225],
  // Abbreviations
  ['n', 0],
  ['e', 90],
  ['s', 180],
  ['w', 270],
  ['ne', 45],
  ['nw', 315],
  ['se', 135],
  ['sw', 225],
  ['nne', 22.5],  // North-northeast
  ['ene', 67.5],  // East-northeast
  ['ese', 112.5], // East-southeast
  ['sse', 157.5], // South-southeast
  ['ssw', 202.5], // South-southwest
  ['wsw', 247.5], // West-southwest
  ['wnw', 292.5], // West-northwest
  ['nnw', 337.5], // North-northwest
]);

/**
 * Normalizes a direction string to a canonical form
 * Handles variations like "north-west", "northwest", "north west", "NW", etc.
 * @param {string} direction - Direction string to normalize
 * @returns {string} Normalized direction string (lowercase, no spaces/hyphens)
 */
export function normalizeDirectionName(direction) {
  if (!direction || typeof direction !== 'string') {
    return null;
  }
  
  // Convert to lowercase and remove spaces, hyphens, periods
  let normalized = direction.toLowerCase().trim();
  normalized = normalized.replace(/[\s\-\.]/g, '');
  
  return normalized;
}

/**
 * Converts a direction name (string) to an azimuth angle in degrees
 * Supports cardinal directions (north, east, south, west) and intercardinal directions
 * Also supports abbreviations (N, E, S, W, NE, NW, SE, SW) and variations
 * @param {string|number} direction - Direction name (e.g., "north", "northwest", "NW") or numeric azimuth
 * @returns {number|null} Azimuth angle in degrees (0-360), or null if invalid
 */
export function directionToAzimuthAngle(direction) {
  // If it's already a number, return it (clamped to 0-360)
  if (typeof direction === 'number') {
    // Normalize to 0-360 range
    let azimuth = direction % 360;
    if (azimuth < 0) {
      azimuth += 360;
    }
    return azimuth;
  }
  
  // If it's a string, look it up in the direction map
  if (typeof direction === 'string') {
    const normalized = normalizeDirectionName(direction);
    if (normalized && directionToAzimuth.has(normalized)) {
      return directionToAzimuth.get(normalized);
    }
  }
  
  // Invalid direction
  return null;
}

/**
 * Converts an azimuth angle to a direction name
 * @param {number} azimuth - Azimuth angle in degrees (0-360)
 * @returns {string} Direction name (e.g., "north", "northeast")
 */
export function azimuthToDirectionName(azimuth) {
  // Normalize azimuth to 0-360
  let normalizedAzimuth = azimuth % 360;
  if (normalizedAzimuth < 0) {
    normalizedAzimuth += 360;
  }
  
  // Find closest matching direction
  let closestDirection = 'north';
  let minDifference = 360;
  
  for (const [direction, directionAzimuth] of directionToAzimuth.entries()) {
    // Skip single-letter abbreviations for reverse lookup
    if (direction.length <= 1) {
      continue;
    }
    
    let difference = Math.abs(normalizedAzimuth - directionAzimuth);
    // Handle wraparound (e.g., 350° is closer to 0° than to 315°)
    if (difference > 180) {
      difference = 360 - difference;
    }
    
    if (difference < minDifference) {
      minDifference = difference;
      closestDirection = direction;
    }
  }
  
  return closestDirection;
}

/**
 * Gets a list of available direction names
 * @returns {Array<string>} Array of direction names (cardinal and intercardinal)
 */
export function getAvailableDirectionNames() {
  // Return only the full names, not abbreviations
  return Array.from(directionToAzimuth.keys()).filter(name => name.length > 1);
}

/**
 * Gets the camera's forward direction vector (normalized)
 * Camera forward is the -Z direction in camera space
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @returns {THREE.Vector3} Forward direction vector in world space
 */
export function getCameraForward(camera) {
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);
  return forward.normalize();
}

/**
 * Gets the camera's right direction vector (normalized)
 * Camera right is the +X direction in camera space
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @returns {THREE.Vector3} Right direction vector in world space
 */
export function getCameraRight(camera) {
  const right = new THREE.Vector3(1, 0, 0);
  right.applyQuaternion(camera.quaternion);
  return right.normalize();
}

/**
 * Gets the camera's up direction vector (normalized)
 * Camera up is the +Y direction in camera space
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @returns {THREE.Vector3} Up direction vector in world space
 */
export function getCameraUp(camera) {
  const up = new THREE.Vector3(0, 1, 0);
  up.applyQuaternion(camera.quaternion);
  return up.normalize();
}

/**
 * Converts camera-centric spherical coordinates to world-space Cartesian coordinates
 * @param {number|string} azimuth - Horizontal angle in degrees (0-360) or direction name (e.g., "north", "northwest")
 * @param {number} elevation - Vertical angle in degrees (0-90)
 * @param {number} distance - Radial distance from origin
 * @param {THREE.PerspectiveCamera} camera - The camera (for camera-centric reference frame)
 * @returns {THREE.Vector3} Cartesian coordinates (x, y, z) in world space
 */
export function sphericalToCartesian(azimuth, elevation, distance, camera) {
  // Convert direction name to azimuth angle if needed
  const azimuthAngle = directionToAzimuthAngle(azimuth);
  if (azimuthAngle === null) {
    throw new Error(`Invalid azimuth: ${azimuth}. Must be a number (0-360) or a direction name (e.g., "north", "northwest")`);
  }
  
  // Convert degrees to radians
  const azimuthRad = THREE.MathUtils.degToRad(azimuthAngle);
  const elevationRad = THREE.MathUtils.degToRad(elevation);
  
  // Get camera's basis vectors in world space
  const forward = getCameraForward(camera);
  const right = getCameraRight(camera);
  const worldUp = new THREE.Vector3(0, 1, 0); // Always world Y (gravity)
  
  // In camera-centric coordinates:
  // - Forward (0° azimuth) points toward the model (camera's -Z)
  // - Right (90° azimuth) points to camera's right (+X)
  // - Up is always world Y (gravity)
  
  // Calculate horizontal direction vector in camera-centric space
  // azimuth 0° = forward, 90° = right, 180° = -forward, 270° = -right
  const horizontalDir = new THREE.Vector3();
  horizontalDir.addScaledVector(forward, Math.cos(azimuthRad));
  horizontalDir.addScaledVector(right, Math.sin(azimuthRad));
  
  // Project onto horizontal plane (perpendicular to world Y)
  // Remove vertical component by subtracting projection onto world Y
  const verticalComponent = horizontalDir.dot(worldUp);
  const horizontalPlaneDir = horizontalDir.clone().sub(worldUp.clone().multiplyScalar(verticalComponent));
  
  // Normalize horizontal direction
  if (horizontalPlaneDir.length() > 0.0001) {
    horizontalPlaneDir.normalize();
  } else {
    // If horizontal direction is vertical (camera looking straight up/down),
    // use a default horizontal direction (forward projected onto horizontal plane)
    const forwardHorizontal = forward.clone();
    forwardHorizontal.sub(worldUp.clone().multiplyScalar(forward.dot(worldUp)));
    if (forwardHorizontal.length() > 0.0001) {
      forwardHorizontal.normalize();
      horizontalPlaneDir.copy(forwardHorizontal);
    } else {
      // If forward is also vertical, use right projected onto horizontal plane
      const rightHorizontal = right.clone();
      rightHorizontal.sub(worldUp.clone().multiplyScalar(right.dot(worldUp)));
      rightHorizontal.normalize();
      horizontalPlaneDir.copy(rightHorizontal);
    }
  }
  
  // Combine horizontal direction with elevation
  // elevation 0° = horizontal, 90° = vertical up (world Y)
  const direction = new THREE.Vector3();
  direction.addScaledVector(horizontalPlaneDir, Math.cos(elevationRad));
  direction.addScaledVector(worldUp, Math.sin(elevationRad));
  direction.normalize();
  
  // Scale by distance
  direction.multiplyScalar(distance);
  
  return direction;
}

/**
 * Converts world-space Cartesian coordinates to camera-centric spherical coordinates
 * @param {number} x - X coordinate in world space
 * @param {number} y - Y coordinate in world space
 * @param {number} z - Z coordinate in world space
 * @param {THREE.PerspectiveCamera} camera - The camera (for camera-centric reference frame)
 * @returns {{azimuth: number, elevation: number, distance: number}} Spherical coordinates
 */
export function cartesianToSpherical(x, y, z, camera) {
  const position = new THREE.Vector3(x, y, z);
  const distance = position.length();
  
  if (distance < 0.0001) {
    // Position is at origin, return default values
    return { azimuth: 0, elevation: 0, distance: 0 };
  }
  
  // Normalize position to get direction vector
  const direction = position.clone().normalize();
  
  // Get camera's basis vectors
  const forward = getCameraForward(camera);
  const right = getCameraRight(camera);
  const worldUp = new THREE.Vector3(0, 1, 0); // Always world Y (gravity)
  
  // Calculate elevation (angle from horizontal plane)
  // elevation = arcsin(y component of direction, relative to world Y)
  const elevation = THREE.MathUtils.radToDeg(Math.asin(Math.max(-1, Math.min(1, direction.dot(worldUp)))));
  
  // Project direction onto horizontal plane (perpendicular to world Y)
  const verticalComponent = direction.dot(worldUp);
  const horizontalDir = direction.clone().sub(worldUp.clone().multiplyScalar(verticalComponent));
  const horizontalLength = horizontalDir.length();
  
  // Calculate azimuth (angle in horizontal plane)
  if (horizontalLength > 0.0001) {
    horizontalDir.normalize();
    
    // Project horizontal direction onto camera's forward-right plane
    // azimuth = angle from forward direction, measured counterclockwise
    const forwardComponent = horizontalDir.dot(forward);
    const rightComponent = horizontalDir.dot(right);
    
    // Calculate angle using atan2
    // atan2(right, forward) gives angle from forward, positive = right (east)
    let azimuthRad = Math.atan2(rightComponent, forwardComponent);
    
    // Convert to degrees and normalize to 0-360
    let azimuth = THREE.MathUtils.radToDeg(azimuthRad);
    if (azimuth < 0) {
      azimuth += 360;
    }
    
    return { azimuth, elevation, distance };
  } else {
    // Direction is vertical (straight up or down)
    // Azimuth is undefined, default to 0
    return { azimuth: 0, elevation, distance };
  }
}

