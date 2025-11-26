import * as THREE from 'three';

/**
 * Arcball rotation controller using quaternions
 * Converted from Swift EIArcball implementation
 */
export class RotationController {
  constructor(model, canvas) {
    this.model = model;
    this.canvas = canvas;

    // Initialize view bounds
    const rect = canvas.getBoundingClientRect();
    this.viewBounds = { width: rect.width, height: rect.height };

    // Constants
    this.kRotationRate = 1.0 / 30.0;
    this.kRotationDecelerationRate = 1.0 / 60.0;

    // State variables
    this.startVector = new THREE.Vector3(0, 0, 0);
    this.isDragging = false;
    this.rotationTimer = null;
    this.ballCenter = { x: 0.0, y: 0.0 };
    this.ballRadius = 1.0;

    // Quaternion and rotation state
    // Initialize from model's current rotation
    this.quaternion = model.quaternion.clone();
    this.quaternionTouchDown = model.quaternion.clone();

    this.angleOfRotation = 0;
    this.axisOfRotation = new THREE.Vector3(0, 0, 0);

    // Render callback (will be set by Application)
    this.onRender = null;
  }

  /**
   * Update view bounds when canvas is resized
   */
  reshape(viewBounds) {
    this.viewBounds = viewBounds;
  }

  /**
   * Begin drag operation
   */
  beginDrag(screenLocation) {
    if (this.rotationTimer !== null) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }

    this.isDragging = true;
    this.startVector = this.ballLocationInCameraSpaceXYPlane(screenLocation);
  }

  /**
   * Update drag operation
   */
  updateDrag(screenLocation) {
    const endVector = this.ballLocationInCameraSpaceXYPlane(screenLocation);

    // Calculate angle and axis of rotation
    this.angleOfRotation = Math.acos(Math.max(-1, Math.min(1, this.startVector.dot(endVector))));
    this.axisOfRotation.crossVectors(this.startVector, endVector);

    // Normalize axis - if too small, skip rotation (vectors are parallel)
    const axisLength = this.axisOfRotation.length();
    if (axisLength < 0.0001) {
      return; // No meaningful rotation
    }
    this.axisOfRotation.normalize();

    // Create quaternion for this rotation
    const quaternionDrag = new THREE.Quaternion();
    quaternionDrag.setFromAxisAngle(this.axisOfRotation, this.angleOfRotation);

    // Multiply with the quaternion from touch down
    this.quaternion.multiplyQuaternions(quaternionDrag, this.quaternionTouchDown);

    // Apply rotation to model
    this.model.quaternion.copy(this.quaternion);

    // Trigger render if callback is set
    if (this.onRender) {
      this.onRender();
    }
  }

  /**
   * End drag operation with velocity for momentum
   */
  endDrag(velocityInView, locationInView) {
    this.isDragging = false;
    this.quaternionTouchDown.copy(this.quaternion);

    // Only apply momentum if there's significant velocity
    const velocityMagnitude = Math.sqrt(velocityInView.x * velocityInView.x + velocityInView.y * velocityInView.y);
    if (velocityMagnitude < 0.1) {
      return; // No momentum, just stop
    }

    // Calculate target location based on velocity
    const xx = this.kRotationRate * velocityInView.x + locationInView.x;
    const yy = this.kRotationRate * velocityInView.y + locationInView.y;
    const screenLocationTo = { x: xx, y: yy };

    const a = this.ballLocationInCameraSpaceXYPlane(locationInView);
    const b = this.ballLocationInCameraSpaceXYPlane(screenLocationTo);

    const radians = Math.acos(Math.max(-1, Math.min(1, a.dot(b))));

    // Only start momentum if there's meaningful rotation
    if (radians < 0.001) {
      return;
    }

    // Store state for timer
    const anglePackage = {
      radiansBegin: radians,
      radians: radians
    };

    // Start rotation timer for momentum
    this.rotationTimer = setInterval(() => {
      this.rotationTimerHandler(anglePackage);
    }, this.kRotationRate * 1000);
  }

  /**
   * Handle rotation timer for momentum decay
   */
  rotationTimerHandler(anglePackage) {
    const radiansBegin = anglePackage.radiansBegin;
    let radians = anglePackage.radians;

    if (radians < 0) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    } else {
      const updated = radians - this.kRotationDecelerationRate * radiansBegin;
      anglePackage.radians = updated;

      // Create quaternion for this incremental rotation
      const quaternionDrag = new THREE.Quaternion();
      quaternionDrag.setFromAxisAngle(this.axisOfRotation, updated);

      // Multiply with the quaternion from touch down
      this.quaternion.multiplyQuaternions(quaternionDrag, this.quaternionTouchDown);

      // Apply rotation to model
      this.model.quaternion.copy(this.quaternion);

      // Update touch down quaternion for next iteration
      this.quaternionTouchDown.copy(this.quaternion);

      // Trigger render if callback is set
      if (this.onRender) {
        this.onRender();
      }
    }
  }

  /**
   * Convert screen location to ball location in camera space XY plane
   */
  ballLocationInCameraSpaceXYPlane(screenLocation) {
    const locationInBallCoordinates = this.locationInBallCoordinates(screenLocation);

    let ballLocation_x = (locationInBallCoordinates.x - this.ballCenter.x) / this.ballRadius;
    let ballLocation_y = (locationInBallCoordinates.y - this.ballCenter.y) / this.ballRadius;

    const magnitude = ballLocation_x * ballLocation_x + ballLocation_y * ballLocation_y;

    if (magnitude > 1.0) {
      const scale = 1.0 / Math.sqrt(magnitude);
      ballLocation_x *= scale;
      ballLocation_y *= scale;
      return new THREE.Vector3(ballLocation_x, ballLocation_y, 0);
    } else {
      return new THREE.Vector3(ballLocation_x, ballLocation_y, Math.sqrt(1 - magnitude));
    }
  }

  /**
   * Convert screen location to ball location in camera space XZ plane
   */
  ballLocationInCameraSpaceXZPlane(screenLocation) {
    const locationInBallCoordinates = this.locationInBallCoordinates(screenLocation);

    let ballLocation_x = (locationInBallCoordinates.x - this.ballCenter.x) / this.ballRadius;
    let ballLocation_z = (locationInBallCoordinates.y - this.ballCenter.y) / this.ballRadius;

    const magnitude = ballLocation_x * ballLocation_x + ballLocation_z * ballLocation_z;

    if (magnitude > 1.0) {
      const scale = 1.0 / Math.sqrt(magnitude);
      ballLocation_x *= scale;
      ballLocation_z *= scale;
      return new THREE.Vector3(ballLocation_x, 0, ballLocation_z);
    } else {
      return new THREE.Vector3(ballLocation_x, -Math.sqrt(1 - magnitude), ballLocation_z);
    }
  }

  /**
   * Convert screen location to ball coordinates
   */
  locationInBallCoordinates(screenLocation) {
    const ballBBoxSizeScreenCoordinates = Math.max(this.viewBounds.width, this.viewBounds.height);

    // Convert to -1 to +1 range
    let screenLocationInBallCoordinates_x = (2.0 * (screenLocation.x - 0) / this.viewBounds.width) - 1.0;
    screenLocationInBallCoordinates_x *= (this.viewBounds.width / ballBBoxSizeScreenCoordinates);

    let screenLocationInBallCoordinates_y = (2.0 * (screenLocation.y - 0) / this.viewBounds.height) - 1.0;
    screenLocationInBallCoordinates_y *= (this.viewBounds.height / ballBBoxSizeScreenCoordinates);

    // Flip y
    screenLocationInBallCoordinates_y *= -1.0;

    return { x: screenLocationInBallCoordinates_x, y: screenLocationInBallCoordinates_y };
  }

  /**
   * Check if currently dragging
   */
  isCurrentlyDragging() {
    return this.isDragging || this.rotationTimer !== null;
  }

  /**
   * Stop drag operation
   */
  stopDrag() {
    this.isDragging = false;
    if (this.rotationTimer !== null) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
    this.startVector.set(0, 0, 0);
  }

  /**
   * Gets the model rotation as Euler angles in degrees
   * @returns {{x: number, y: number, z: number}} Euler angles in degrees (XYZ order)
   */
  getRotationEuler() {
    const euler = new THREE.Euler();
    euler.setFromQuaternion(this.model.quaternion, 'XYZ');
    return {
      x: THREE.MathUtils.radToDeg(euler.x),
      y: THREE.MathUtils.radToDeg(euler.y),
      z: THREE.MathUtils.radToDeg(euler.z)
    };
  }

  /**
   * Sets the model rotation from Euler angles in degrees
   * @param {number} x - Rotation around X axis in degrees (pitch)
   * @param {number} y - Rotation around Y axis in degrees (yaw)
   * @param {number} z - Rotation around Z axis in degrees (roll)
   */
  setRotationEuler(x, y, z) {
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(x),
      THREE.MathUtils.degToRad(y),
      THREE.MathUtils.degToRad(z),
      'XYZ'
    );
    this.model.quaternion.setFromEuler(euler);
    // Update internal quaternion state to match
    this.quaternion.copy(this.model.quaternion);
    this.quaternionTouchDown.copy(this.model.quaternion);
    
    // Trigger render if callback is set
    if (this.onRender) {
      this.onRender();
    }
  }

  /**
   * Rotates the model clockwise around Y axis (yaw) relative to current rotation
   * @param {number} degrees - Amount to rotate in degrees (defaults to 10°)
   */
  rotateClockwise(degrees = 10) {
    const current = this.getRotationEuler();
    const newY = (current.y - degrees + 360) % 360;
    this.setRotationEuler(current.x, newY, current.z);
  }

  /**
   * Rotates the model counterclockwise around Y axis (yaw) relative to current rotation
   * @param {number} degrees - Amount to rotate in degrees (defaults to 10°)
   */
  rotateCounterclockwise(degrees = 10) {
    const current = this.getRotationEuler();
    const newY = (current.y + degrees) % 360;
    this.setRotationEuler(current.x, newY, current.z);
  }

  /**
   * Adjusts the model pitch (X axis rotation) upward relative to current rotation
   * @param {number} degrees - Amount to increase pitch in degrees (defaults to 5°)
   */
  nudgePitchUp(degrees = 5) {
    const current = this.getRotationEuler();
    const newX = current.x + degrees;
    this.setRotationEuler(newX, current.y, current.z);
  }

  /**
   * Adjusts the model pitch (X axis rotation) downward relative to current rotation
   * @param {number} degrees - Amount to decrease pitch in degrees (defaults to 5°)
   */
  nudgePitchDown(degrees = 5) {
    const current = this.getRotationEuler();
    const newX = current.x - degrees;
    this.setRotationEuler(newX, current.y, current.z);
  }

  /**
   * Adjusts the model roll (Z axis rotation) relative to current rotation
   * @param {number} degrees - Amount to adjust roll in degrees (positive = clockwise, defaults to 5°)
   */
  nudgeRoll(degrees = 5) {
    const current = this.getRotationEuler();
    const newZ = (current.z + degrees + 360) % 360;
    this.setRotationEuler(current.x, current.y, newZ);
  }
}
