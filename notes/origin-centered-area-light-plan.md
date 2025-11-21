# Origin-Centered Area Lights

## Overview
Restructure the area light system so that both key and fill lights rotate around the model's origin `(0, -0.5, 0)` instead of their own positions. This sets up the foundation for future Euler angle-based rotation.

## Implementation Steps

### 1. Modify AreaLight class (`src/AreaLight.js`)
- Add a parent `Object3D` group that will serve as the rotation pivot
- Position the parent at the model origin `(0, -0.5, 0)`
- Add the actual light as a child of this parent
- Calculate light position relative to parent:
  - Key light: parent at `(0, -0.5, 0)`, light at `(5, 3.5, 5)` relative to parent (equals `(5, 3, 5)` in world space)
  - Fill light: parent at `(0, -0.5, 0)`, light at `(-5, 2.5, 5)` relative to parent (equals `(-5, 2, 5)` in world space)
- Update `getLight()` to return the parent group (for scene addition)
- Add a new method `getLightObject()` to return the actual RectAreaLight (for helper attachment and property access)
- Ensure `lookAt()` still works correctly (it uses world coordinates, so should work as-is)

### 2. Update SceneManager (`src/SceneManager.js`)
- Modify `_createLights()` to attach helpers to the light object (not the parent group)
- Update all light property access methods (`setKeyLightPosition`, `setFillLightPosition`, etc.) to work with the new structure:
  - Position methods should update the light's local position relative to the parent
  - Other methods (intensity, color, size) should access the light object directly
- Store references to both the parent group and the light object for future rotation support

### 3. Add Model Origin Constant (`src/constants.js`)
- Add `MODEL.ORIGIN: { x: 0, y: -0.5, z: 0 }` to centralize the model origin definition
- Use this constant in both Model.js and AreaLight.js for consistency

## Technical Details
- The parent Object3D will be positioned at `(0, -0.5, 0)` (model origin)
- Lights will be children of this parent, positioned relative to it
- `lookAt()` will continue to use world coordinates `(0, 0, 0)` as target
- Future rotation will be applied to the parent's rotation (Euler angles), causing lights to orbit around the model origin
- All existing functionality (position, intensity, color, size) will continue to work

## Files Modified
- `src/AreaLight.js` - Add parent group structure
- `src/SceneManager.js` - Update light access methods
- `src/constants.js` - Add model origin constant
- `src/Model.js` - Use model origin constant

## Future Work
- Implement Euler angle-based rotation methods for area lights
- Rotation will be applied to the parent group's rotation property (Euler angles)
- Lights will orbit around the model origin while maintaining their lookAt target
- Euler angles are simpler and sufficient for the constrained rotation interactions planned

