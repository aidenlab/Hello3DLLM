/**
 * Application constants and configuration values
 */
export const CONFIG = {
  // Camera settings
  CAMERA: {
    FOV: 32,
    NEAR: 0.1,
    FAR: 1000,
    INITIAL_Z: 32,
    MIN_ZOOM: 8,
    MAX_ZOOM: 64,
    ZOOM_SPEED: 0.1,
  },

  // Model settings
  MODEL: {
    SIZE: 1,
    COLOR: 0xff0000,
  },

  // Lighting settings
  LIGHTING: {
    AMBIENT: {
      COLOR: 0xffffff,
      INTENSITY: 0.2,
    },
    SPOTLIGHT: {
      COLOR: 0xffffff,
      INTENSITY: 2.0,
      POSITION: { x: 5, y: 5, z: 5 },
      ANGLE: Math.PI / 4,
      PENUMBRA: 0.3,
      DECAY: 1,
      DISTANCE: 20,
      TARGET: { x: 0, y: 0, z: 0 },
    },
  },

  // Interaction settings
  INTERACTION: {
    ROTATION_SENSITIVITY: 0.01,
    PINCH_ZOOM_SENSITIVITY: 0.01,
  },
};

