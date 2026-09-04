# Ellis Wormhole Parallax

A native Android application that generates a real-time, 3D wireframe visualization of an Ellis wormhole (drainhole). Built entirely with mathematical functions mapped to an Android Canvas, this project uses the device's hardware sensors to create an interactive parallax window into the wormhole's throat. 

**Core Features**
* **Mathematical Rendering:** Calculates and projects a 3D grid onto a 2D plane using trigonometric spatial projections, requiring no external 3D engines.
* **Hardware Parallax:** Reads real-time accelerometer sensor data to tilt and roll the perspective dynamically as you move your device.
* **Interactive Overlay:** A custom collapsible control panel lets you manipulate the simulation parameters on the fly:
  * **Expansion Angle:** Widens or narrows the gravitational throat of the wormhole.
  * **Bg Hue:** Toggles and cycles the background environment color.
  * **Line Multiplier:** Increases the density of the 3D wireframe mesh.
  * **Spin:** Applies a continuous rotational velocity to the geometry.
  * **Movement Smoother:** Adjusts the low-pass filter on the sensor data to dampen hand shake.

**How to Install**
This repository is configured with a fully automated CI/CD pipeline using GitHub Actions. You do not need to compile the code manually.
1. Navigate to the **Releases** section on the right side of the repository page.
2. Click on the **Latest Build** tag.
3. Download the `app-debug.apk` asset directly to your Android device and install it.

**Technical Stack**
* **Language:** Kotlin
* **Graphics:** Android Custom Views (`Canvas`, `Paint`)
* **Sensors:** `SensorManager`, `TYPE_ACCELEROMETER`
* **Build System:** Gradle, compiled via GitHub Actions workflow
* 
