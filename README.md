# Ellis Wormhole Parallax (React Web)

A high-performance React web application that generates a real-time, 3D wireframe visualization of an Ellis wormhole (drainhole). Built with trigonometric spatial projections mapped onto an HTML5 Canvas, this project reproduces the core features, mathematics, and interactive parallax window of the original native application.

**Core Features**
* **Mathematical Rendering:** Calculates and projects a 3D grid onto a 2D plane using trigonometric spatial projections, requiring no external 3D engines.
* **Hardware & Cursor Parallax:** Reads real-time device orientation and motion sensors (with mouse position fallback on desktop) to tilt and roll the perspective dynamically as you move your device or cursor.
* **Multi-Touch & Mouse Gestures:** Supports two-finger pinch/twist/drag rotation as well as interactive desktop cursor drag.
* **Interactive Overlay:** A collapsible control panel lets you manipulate simulation parameters in real time:
  * **Room Size:** Adjusts the bounding wireframe room dimensions.
  * **Exit Expansion:** Widens or flares the gravitational exits of the wormhole.
  * **Throat Diameter:** Widens or narrows the throat of the wormhole.
  * **Bg Hue:** Toggles and cycles the background environment color with HSV mapping.
  * **Line Multiplier:** Increases or decreases the density of the 3D wireframe mesh.
  * **Spin:** Controls continuous rotational velocity of the geometry.
  * **Movement Smoother:** Adjusts the low-pass filter on sensor and motion input.

**Technical Stack**
* **Framework:** React 18 + TypeScript
* **Bundler & Dev Server:** Vite
* **Graphics:** HTML5 Canvas 2D Context (hardware-accelerated, high-DPI retina rendering)
* **Styling:** Tailwind CSS
