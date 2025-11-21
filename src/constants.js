import {getAppleCrayonColorByName} from "./utils/color/color.js"
import * as THREE from 'three'

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
        MIN_ZOOM: 8,  // Minimum camera distance (for dollying)
        MAX_ZOOM: 64, // Maximum camera distance (for dollying)
        ZOOM_ANGLE_MIN: 0.5,  // Minimum zoom angle (camera.zoom - wider FOV)
        ZOOM_ANGLE_MAX: 5.0,  // Maximum zoom angle (camera.zoom - narrower FOV)
        ZOOM_SPEED: 0.1,  // Speed for dollying (position changes)
        ZOOM_ANGLE_SPEED: 0.02,  // Speed for zoom angle (FOV) changes
    },

    // Model settings
    MODEL: {
        SIZE: 1,
        COLOR: getAppleCrayonColorByName('snow'),
        ORIGIN: { x: 0, y: -0.5, z: 0 },  // Model origin - center of rotation for area lights
    },

    // Lighting settings
    LIGHTING:
        {
            AMBIENT:
                {
                    COLOR: 0xffffff,
                    INTENSITY: 0.1,
                },
            // Key light - main light source (brighter, positioned at ~45 degrees)
            KEY_LIGHT:
                {
                    COLOR: getAppleCrayonColorByName('snow'),
                    INTENSITY: 2.5,
                    WIDTH: 6,
                    HEIGHT: 6,
                    POSITION:
                        {
                            x: 5,
                            y: 3,
                            z: 5
                        },
                    TARGET:
                        {
                            x: 0,
                            y: 0,
                            z: 0
                        },
                },
            // Fill light - softer light to fill shadows (lower intensity, opposite side)
            FILL_LIGHT:
                {
                    COLOR: getAppleCrayonColorByName('snow'),
                    INTENSITY: 0.2,
                    WIDTH: 8,
                    HEIGHT: 8,
                    POSITION:
                        {
                            x: -5,
                            y: 2,
                            z: 5
                        },
                    TARGET:
                        {
                            x: 0,
                            y: 0,
                            z: 0
                        },
                },
        },

    // Interaction settings
    INTERACTION: {
        ROTATION_SENSITIVITY: 0.01,
        PINCH_ZOOM_SENSITIVITY: 0.01,
        AREA_LIGHT_ROTATION_SENSITIVITY: 0.005,  // Sensitivity for area light rotation
        AREA_LIGHT_DOLLY_SENSITIVITY: 0.1,  // Sensitivity for area light dolly (movement along axis)
        AREA_LIGHT_SWING_AMOUNT: 10,  // Amount to swing light (in degrees) for each command
        AREA_LIGHT_WALK_AMOUNT: 1.0,  // Amount to walk light in/out (distance units) for each command
    },
};

