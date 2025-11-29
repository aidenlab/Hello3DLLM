# Color Models Reference for 3D Applications

## Executive Summary

RGB is inadequate for intuitive color adjustments in 3D lighting and modeling applications. This document outlines perceptually uniform and industry-standard color models suitable for implementing professional color control systems.

---

## Why RGB Falls Short

**Problems with RGB for color adjustments:**
- Non-intuitive: changing "warmth" requires adjusting multiple channels
- Not perceptually uniform: equal numeric changes produce unequal visual changes
- Difficult to maintain consistent brightness when adjusting hue
- No direct mapping to artistic concepts like "warmer," "cooler," or "more saturated"

---

## Recommended Color Models

### 1. LAB Color Space (CIE L\*a\*b\*)

**Best for: Perceptually uniform color adjustments**

#### Structure
- **L\***: Lightness (0-100, black to white)
- **a\***: Green-Red axis (-128 to +127, green to red)
- **b\***: Blue-Yellow axis (-128 to +127, blue to yellow)

#### Key Advantages
- **Perceptually uniform**: Equal numeric changes produce equal perceived changes
- **Device independent**: Not tied to specific display hardware
- **Industry standard**: Used in Photoshop, Lightroom, color science research
- **Separate luminance**: Can adjust color without affecting brightness

#### Common Operations
- **Make warmer**: Increase b\* value (toward yellow/orange)
- **Make cooler**: Decrease b\* value (toward blue)
- **Increase saturation**: Move a\* and b\* away from zero proportionally
- **Lighten/darken**: Adjust L\* only

#### Implementation Notes
```
Conversion path: RGB → XYZ → LAB → adjust → XYZ → RGB
Reference white point: D65 (daylight, 6500K) typically used
Gamma correction: Apply to RGB before conversion
```

#### Mathematical Foundation
Based on CIE 1976 color space, designed to approximate human vision's opponent process theory.

---

### 2. LCH Color Space (Lightness, Chroma, Hue)

**Best for: Intuitive artistic color control**

#### Structure
- **L**: Lightness (0-100, same as LAB)
- **C**: Chroma (0-100+, colorfulness/saturation)
- **H**: Hue angle (0-360°, color wheel position)

#### Hue Angle Reference
```
0° / 360° = Red
30° = Orange
60° = Yellow
120° = Green
180° = Cyan
240° = Blue
300° = Magenta
```

#### Key Advantages
- **Most intuitive**: Maps directly to artistic concepts
- **Cylindrical coordinates**: Natural for color wheel thinking
- **Perceptually uniform**: Inherits LAB uniformity
- **Perfect for UI controls**: Hue slider, chroma slider, lightness slider

#### Common Operations
- **Warm/cool adjustment**: Shift H toward orange (30-60°) or blue (210-240°)
- **Saturation**: Adjust C value
- **Brightness**: Adjust L value
- **Complementary colors**: H ± 180°

#### Implementation Notes
```
Conversion: LAB ↔ LCH uses polar coordinates
C = sqrt(a*² + b*²)
H = atan2(b*, a*) converted to degrees
a* = C × cos(H)
b* = C × sin(H)
```

#### Use Cases
- Color picker interfaces
- Gradient generation
- Harmonious color scheme creation
- Artist-friendly color adjustments

---

### 3. HSL/HSV (Hue, Saturation, Lightness/Value)

**Best for: Quick implementations, legacy compatibility**

#### Structure (HSL)
- **H**: Hue (0-360°, color wheel)
- **S**: Saturation (0-100%, gray to pure color)
- **L**: Lightness (0-100%, black to white)

#### Key Advantages
- **Simple conversion**: Direct from RGB, computationally cheap
- **Widely supported**: Built into many graphics libraries
- **Intuitive enough**: Better than RGB for most operations

#### Limitations
- **Not perceptually uniform**: Brightness varies across hues at same L
- **Saturation issues**: S doesn't correspond to perceptual colorfulness
- **Hue shifts**: Can produce unexpected results at extreme lightness/darkness

#### When to Use
- Prototyping and quick implementations
- When performance is critical and precision isn't
- Backward compatibility with existing systems
- Simple color picker UIs

---

### 4. Color Temperature (Kelvin Scale)

**Best for: Lighting control in 3D scenes**

#### Temperature Scale
```
1000K-2000K: Candlelight (very warm orange)
2500K-3000K: Tungsten/incandescent bulbs (warm)
3500K-4000K: Warm white fluorescent
5000K-5500K: Daylight horizon
5500K-6500K: Noon daylight (neutral)
6500K-7500K: Overcast sky (slightly cool)
8000K-10000K: Clear blue sky (cool)
10000K+: Deep blue sky/shade (very cool)
```

#### Key Advantages
- **Industry standard**: How cinematographers and gaffers think
- **Physical basis**: Corresponds to blackbody radiation
- **Intuitive for lighting**: Natural language for describing light quality
- **Cross-disciplinary**: Shared vocabulary with photography, film, stage lighting

#### Implementation
Maps to the CIE daylight locus or blackbody locus in XYZ/LAB space.

#### Common Operations
- **Warm key light**: 2800K-3200K (golden hour, tungsten)
- **Neutral key light**: 5500K-6500K (daylight)
- **Cool key light**: 7000K-9000K (overcast, moonlight)
- **Opposite temperature fill**: Creates dimension and interest

#### Use Cases
- Key/fill/rim light color selection
- Time-of-day lighting simulation
- Matching real-world lighting conditions
- Creating mood through temperature contrast

---

## Industry-Specific Models

### DaVinci Resolve Color Wheels
**Structure**: Lift/Gamma/Gain wheels with separate temperature/tint controls
- Works in a log-encoded color space
- Temperature/tint map to blue-yellow and green-magenta axes
- Professional standard for color grading

### Munsell Color System
**Structure**: Hue, Value, Chroma
- Artist-oriented, based on human perception
- Not ideal for computation but excellent reference
- Used in art education and physical color matching

---

## Recommended Implementation Strategy

### Phase 1: Foundation (LCH + Temperature)
1. **Implement LCH color space**
   - Provides intuitive controls for all color adjustments
   - Build RGB ↔ LAB ↔ LCH conversion pipeline
   
2. **Add Kelvin temperature for lights**
   - Map temperature to RGB via blackbody/daylight locus
   - Create presets for common lighting scenarios

### Phase 2: Advanced Controls
3. **Add LAB direct access**
   - For precise perceptual adjustments
   - Enable professional color correction workflows

4. **Create preset systems**
   - Color harmony generators (complementary, triadic, etc.)
   - Lighting scenarios (golden hour, overcast, studio, etc.)

### Phase 3: UI/UX
5. **Build intuitive interfaces**
   - Color wheel based on LCH hue
   - Temperature slider for lights (1000K-10000K)
   - Separate lightness and chroma controls

---

## Code Implementation Considerations

### Conversion Pipeline
```
User Input → LCH/Kelvin → LAB → XYZ → RGB → GPU/Display
                 ↑                              ↓
                 └──────── User Query ──────────┘
```

### Gamut Clipping
When converting from LAB/LCH to RGB, colors may fall outside RGB gamut:
- **Option 1**: Clip to nearest in-gamut color
- **Option 2**: Reduce chroma while maintaining hue and lightness
- **Option 3**: Flag out-of-gamut and warn user

### Performance Considerations
- Cache conversions when possible
- Use lookup tables (LUTs) for real-time applications
- Consider GPU-based color space conversion for interactive use

### Reference White Point
Standard: **D65** (daylight, 6500K)
- Matches most computer displays
- Defined as: X=95.047, Y=100.0, Z=108.883 (relative to Y=100)

---

## Libraries and Resources

### JavaScript/TypeScript
- **chroma.js**: Comprehensive color library with LAB, LCH support
- **culori**: Modern, fast, supports wide gamut and perceptual spaces
- **color**: Simple API, good LAB/LCH support

### Python
- **colorspacious**: Excellent CIECAM02, LAB, LCH implementation
- **colour-science**: Professional color science toolkit
- **scikit-image**: Image processing with color space conversions

### C++
- **lcms2**: Industry-standard color management system
- **OpenColorIO (OCIO)**: Film/VFX industry standard

### Mathematics
- **Bruce Lindbloom's website**: Definitive color space conversion formulas
- **CIE standards documents**: Official specifications
- **Fairchild's "Color Appearance Models"**: Comprehensive textbook

---

## Practical Examples for Your 3D Application

### Example 1: "Make model warmer"
```
Current: RGB → Convert to LCH
Adjustment: H += 10° (toward orange/yellow)
Result: LCH → Convert to RGB
```

### Example 2: "Subtle color shift"
```
Current: RGB → Convert to LAB
Adjustment: a* += 5, b* += 8
Result: LAB → Convert to RGB
(Maintains perceptual brightness)
```

### Example 3: "Golden hour key light"
```
Temperature: 3200K → Convert to RGB
Creates warm, directional light
Fill light: 6500K (cooler, for contrast)
```

### Example 4: "Match background and model in hue"
```
Background RGB → LCH: extract H
Model RGB → LCH: set H to match, adjust L for contrast
Result: Harmonious but distinguishable colors
```

---

## Testing and Validation

### Perceptual Tests
- Generate gradients in LAB vs RGB - LAB should appear more uniform
- Test "make warmer" on various colors - should consistently shift toward orange/yellow
- Verify lightness adjustments don't affect perceived hue

### Edge Cases
- Very dark colors (near black)
- Very light colors (near white)
- Highly saturated colors (near gamut boundary)
- Gray colors (C ≈ 0, H undefined)

---

## Conclusion

**For your 3D lighting application:**
- **Primary**: Use **LCH** for intuitive color control
- **Secondary**: Use **Kelvin temperature** for lighting
- **Foundation**: Implement **LAB** as the intermediate space

This combination provides professional-grade color control while maintaining intuitive interfaces for artists and developers.

---

## Quick Reference Card

| Task | Best Model | Operation |
|------|------------|-----------|
| Make warmer | LCH | Increase H toward 30-60° |
| Make cooler | LCH | Decrease H toward 210-240° |
| Increase saturation | LCH | Increase C |
| Adjust brightness | LAB/LCH | Adjust L only |
| Light color | Kelvin | Set temperature (1000K-10000K) |
| Subtle shift | LAB | Adjust a*, b* slightly |
| Color harmony | LCH | Use H relationships (±120°, ±180°) |
| Match hue | LCH | Copy H, vary L and C |