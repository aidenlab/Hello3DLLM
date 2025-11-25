# Camera-Centric Coordinate System

## Overview

The Hello3DLLM application uses a **camera-centric spherical coordinate system** for positioning lights and describing orientations. This system matches how photographers think about lighting positions relative to their viewpoint, making it intuitive for users to describe light positions using natural language.

## Coordinate System Convention

### Spherical Coordinates

The coordinate system uses three parameters:

1. **Azimuth (0-360°)**: Horizontal angle around the model, measured from the camera's perspective
2. **Elevation (0-90°)**: Vertical angle above the horizon
3. **Distance**: Radial distance from the model origin

### Azimuth Mapping

The azimuth angle is measured from the camera's perspective, creating a compass that rotates with the camera:

- **0° (North)**: Camera forward direction (toward the model)
- **90° (East)**: Camera right direction
- **180° (South)**: Behind the camera
- **270° (West)**: Camera left direction

**Key Insight**: The compass rotates with the camera's view direction. When you rotate the camera, "North" always means "toward where the camera is looking."

### Elevation Mapping

- **0°**: Horizon (horizontal plane)
- **90°**: Directly overhead (straight up)

### Three.js Coordinate Mapping

The camera-centric system maps to Three.js world coordinates as follows:

- **Y-axis**: Always up (gravity) - unchanged
- **Camera Forward (0° azimuth)**: Camera's -Z direction (where it's looking)
- **Camera Right (90° azimuth)**: Camera's +X direction
- **Camera Back (180° azimuth)**: Camera's +Z direction
- **Camera Left (270° azimuth)**: Camera's -X direction

## Common Lighting Positions

Here are some common lighting positions expressed in spherical coordinates:

### "High Noon"
- **Azimuth**: Any (light is overhead)
- **Elevation**: 90°
- **Distance**: Varies
- **Description**: Light directly overhead, like the sun at noon

### "3 O'Clock" (Key Light Position)
- **Azimuth**: 90° (East, camera right)
- **Elevation**: 30-45° (typical)
- **Distance**: Varies
- **Description**: Light to the right of the camera, at a moderate elevation

### "9 O'Clock" (Fill Light Position)
- **Azimuth**: 270° (West, camera left)
- **Elevation**: 15-30° (typical, lower than key)
- **Distance**: Varies
- **Description**: Light to the left of the camera, at a lower elevation

### "Rim Light" (Behind Model)
- **Azimuth**: 180° (South, behind camera)
- **Elevation**: 0-30°
- **Distance**: Varies
- **Description**: Light behind the model, creating edge lighting

### "Front Light"
- **Azimuth**: 0° (North, camera forward)
- **Elevation**: 30-60°
- **Distance**: Varies
- **Description**: Light in front of the model, illuminating the face

## Usage Examples

### MCP Tool Usage

#### Set Key Light Position

```javascript
// Place key light at "high noon" (directly overhead)
set_key_light_position_spherical({
  azimuth: 0,      // Any azimuth works for overhead
  elevation: 90,   // Directly overhead
  distance: 10     // 10 units from model origin
})

// Place key light at "3 o'clock" position
set_key_light_position_spherical({
  azimuth: 90,     // Camera right (East)
  elevation: 45,   // Moderate elevation
  distance: 8      // 8 units from model origin
})

// Place fill light at "9 o'clock" position
set_fill_light_position_spherical({
  azimuth: 270,    // Camera left (West)
  elevation: 20,   // Lower elevation than key
  distance: 10     // 10 units from model origin
})
```

#### Natural Language Examples

When a user says:
- **"Place the key light at high noon"** → `azimuth: 0, elevation: 90`
- **"Move the fill light to 3 o'clock"** → `azimuth: 90, elevation: 30-45`
- **"Put the key light behind the model"** → `azimuth: 180, elevation: 0-30`
- **"Raise the key light overhead"** → Increase `elevation` toward 90
- **"Move the fill light to the left"** → `azimuth: 270`

## Technical Implementation

### Coordinate Conversion

The system converts between camera-centric spherical coordinates and Three.js Cartesian coordinates:

1. **Spherical → Cartesian**: Uses camera's forward/right/up vectors to establish camera-centric reference frame
2. **Cartesian → Spherical**: Projects position onto camera's horizontal plane to calculate azimuth

### Camera Reference

All coordinate conversions require a reference to the camera object because the coordinate system is camera-centric. The camera's orientation determines the "North" direction (0° azimuth).

### Model Origin

All positions are relative to the model origin `(0, -0.5, 0)`. Lights rotate around this point via a parent group positioned at the origin.

## API Reference

### AreaLight Methods

- `setPositionSpherical(azimuth, elevation, distance, camera)` - Set light position using spherical coordinates
- `getPositionSpherical(camera)` - Get current light position as spherical coordinates
- `setPositionCartesian(x, y, z)` - Set position using Cartesian coordinates (backward compatibility)

### SceneManager Methods

- `setKeyLightPositionSpherical(azimuth, elevation, distance)` - Set key light position
- `getKeyLightPositionSpherical()` - Get key light position
- `setFillLightPositionSpherical(azimuth, elevation, distance)` - Set fill light position
- `getFillLightPositionSpherical()` - Get fill light position

### MCP Tools

- `set_key_light_position_spherical` - Set key light position via MCP
- `get_key_light_position_spherical` - Query key light position via MCP
- `set_fill_light_position_spherical` - Set fill light position via MCP
- `get_fill_light_position_spherical` - Query fill light position via MCP

## Benefits

1. **Intuitive**: Matches how photographers think about lighting
2. **Human-Friendly**: Natural language descriptions map directly to coordinates
3. **Camera-Relative**: "North" always means "toward where camera is looking"
4. **Stable**: Elevation and distance are absolute, only azimuth rotates with camera

## Future Enhancements

- Bidirectional WebSocket communication for query commands (get position)
- Support for negative elevation (below horizon) for special effects
- Clock position aliases (e.g., "3 o'clock" → 90° azimuth)
- Cardinal direction aliases (e.g., "north" → 0° azimuth)

