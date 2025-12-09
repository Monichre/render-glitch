# Nature Beyond Technology Clone - Pseudocode

## Overview
A WebGL experience showcasing trees as high-end technological creations, featuring:
- Three.js 3D scene with tree model
- Scroll-based camera animations via GSAP ScrollTrigger
- Lenis smooth scrolling
- Post-processing effects (bloom, noise, rain)
- Tech-style UI with info cards

## Architecture

### Core Components

1. **WebGLScene** - Main Three.js scene manager
   - Scene, Camera (PerspectiveCamera), Renderer (WebGLRenderer)
   - Camera rig system for mouse interaction + scroll animations
   - Fog for depth effect
   - Post-processing pipeline

2. **TreeModel** - 3D tree with separated bark/leaves
   - Load GLB model
   - Separate materials for bark and foliage
   - Transparent materials with dark fog

3. **ParticleSystem** - Ambient floating particles
   - GPU-based position updates
   - Noise-driven movement

4. **ScrollSections** - Content sections
   - Hero intro with drag rotation
   - Feature sections (Solar Panels, Water System, Climate Control, etc.)
   - Each section triggers camera animation + UI changes

5. **UIOverlay** - Tech-style interface
   - Progress indicators
   - Info cards with FPS-game styling
   - Section titles with split text animations

### Data Flow

\`\`\`
User Scroll → Lenis → ScrollTrigger → 
  → Camera Rig Animation
  → UI State Changes
  → Particle System Updates
  → Post-processing toggles
\`\`\`

### Key Implementation Details

1. **Camera Rig System**
   \`\`\`
   CameraRig
   ├── outerRig (position/rotation for scroll)
   │   └── innerRig (mouse interaction)
   │       └── PerspectiveCamera
   \`\`\`

2. **Scroll Progress Mapping**
   - Map scroll [0-1] to different sub-ranges for each animation
   - Example: camera [0-0.5], leaf reveal [0.3-0.6]

3. **Material Setup**
   - Tree: MeshStandardMaterial with transparency
   - Background: Wireframe icosahedron
   - Floor: Low-poly grid

4. **Post-Processing Stack**
   - RenderPass → BloomPass → NoisePass → OutputPass

## Sections Structure

1. **Hero** - Full viewport, drag to rotate tree
2. **Solar Panels** - Leaf closeup with holographic reveal
3. **Water Cycle** - Particles following curves
4. **Climate Control** - Interactive particle field
5. **Carbon Storage** - Root system view
6. **Biodiversity** - Full tree overview
7. **Footer** - Credits and links
