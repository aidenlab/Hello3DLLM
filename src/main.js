import './style.css'
import * as THREE from 'three'

// Get the canvas element
const canvas = document.getElementById('canvas')

// Create scene
const scene = new THREE.Scene()

// Create camera
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
)

// Position camera
camera.position.z = 5

// Create renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas })
renderer.setSize(window.innerWidth, window.innerHeight)

// Create a cube geometry
const geometry = new THREE.BoxGeometry(1, 1, 1)

// Ensure normals are computed for flat shading
// This ensures each face has its own normal for proper edge definition
if (geometry.attributes.normal === undefined) {
  geometry.computeVertexNormals()
}
// For flat shading, we want face normals - ensure geometry is set up correctly
geometry.normalizeNormals()

// Create a material that responds to lighting
// Use flat shading so each face has distinct normals and edges are visible
const material = new THREE.MeshStandardMaterial({ 
  color: 0x00ff00,
  flatShading: true // Flat shading ensures each face has distinct normals
})

// Create a mesh (geometry + material)
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

// Create ambient light for minimal general illumination
// Keep it low so spotlight creates clear contrast and edge definition
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
scene.add(ambientLight)

// Create spotlight for focused lighting on the cube
// Static spotlight - position remains fixed while cube rotates
const spotlight = new THREE.SpotLight(0xffffff, 2.0)
spotlight.position.set(5, 5, 5)
spotlight.angle = Math.PI / 4 // 45 degrees
spotlight.penumbra = 0.3 // Sharper edge for better definition
spotlight.decay = 1
spotlight.distance = 20
spotlight.target.position.set(0, 0, 0) // Point at the cube
scene.add(spotlight)
scene.add(spotlight.target) // Add target to scene

// Interactive cube rotation controls
let isDragging = false
let previousMousePosition = { x: 0, y: 0 }

// Mouse down - start dragging
canvas.addEventListener('mousedown', (e) => {
  isDragging = true
  previousMousePosition = { x: e.clientX, y: e.clientY }
})

// Mouse move - rotate cube
canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return
  
  const deltaX = e.clientX - previousMousePosition.x
  const deltaY = e.clientY - previousMousePosition.y
  
  // Rotate cube based on mouse movement
  // X rotation corresponds to vertical mouse movement
  // Y rotation corresponds to horizontal mouse movement
  cube.rotation.y += deltaX * 0.01
  cube.rotation.x += deltaY * 0.01
  
  previousMousePosition = { x: e.clientX, y: e.clientY }
})

// Mouse up - stop dragging
canvas.addEventListener('mouseup', () => {
  isDragging = false
})

// Mouse leave - stop dragging
canvas.addEventListener('mouseleave', () => {
  isDragging = false
})

// Zoom controls
const minZoom = 2
const maxZoom = 20
const zoomSpeed = 0.1

// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
  e.preventDefault()
  
  // Calculate zoom based on scroll direction
  const zoomDelta = e.deltaY > 0 ? zoomSpeed : -zoomSpeed
  const newZ = camera.position.z + zoomDelta
  
  // Clamp zoom within limits
  camera.position.z = Math.max(minZoom, Math.min(maxZoom, newZ))
})

// Pinch-to-zoom for touch devices
let initialDistance = 0
let initialZoom = camera.position.z

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    // Two-finger touch - prepare for pinch zoom
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    initialDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )
    initialZoom = camera.position.z
    isDragging = false // Disable rotation during pinch
  } else if (e.touches.length === 1) {
    // Single touch - enable rotation
    e.preventDefault()
    isDragging = true
    const touch = e.touches[0]
    previousMousePosition = { x: touch.clientX, y: touch.clientY }
  }
})

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    // Two-finger pinch zoom
    e.preventDefault()
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )
    
    // Calculate zoom change based on distance change
    const distanceDelta = initialDistance - currentDistance
    const zoomDelta = distanceDelta * 0.01
    const newZ = initialZoom + zoomDelta
    
    // Clamp zoom within limits
    camera.position.z = Math.max(minZoom, Math.min(maxZoom, newZ))
  } else if (e.touches.length === 1 && isDragging) {
    // Single touch rotation
    e.preventDefault()
    const touch = e.touches[0]
    const deltaX = touch.clientX - previousMousePosition.x
    const deltaY = touch.clientY - previousMousePosition.y
    
    cube.rotation.y += deltaX * 0.01
    cube.rotation.x += deltaY * 0.01
    
    previousMousePosition = { x: touch.clientX, y: touch.clientY }
  }
})

canvas.addEventListener('touchend', (e) => {
  e.preventDefault()
  isDragging = false
})

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  
  // Render the scene
  renderer.render(scene, camera)
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Start the animation
animate()
