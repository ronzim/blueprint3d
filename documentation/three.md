# Three Module

The `three` module is responsible for rendering the 3D visualization of the floor plan and the items within it. It is built on top of the popular `three.js` library and manages the scene, camera, lighting, controls, and user interactions in the 3D environment.

## Core Components

The `three` module is composed of several key components that work together to create the 3D view.

-   **`Main`**: The central class that initializes and orchestrates all the other components of the 3D view. It sets up the `three.js` renderer, scene, and camera, and manages the main rendering loop.
-   **`Controller`**: Handles all user interactions within the 3D scene, such as selecting, moving, and rotating items. It uses a state machine to manage different interaction modes.
-   **`Controls`**: A modified version of `THREE.OrbitControls` that manages camera movement, including orbiting, panning, and zooming.
-   **`Floorplan`**: Responsible for creating the 3D representation of the floor plan, including the `Floor` and `Edge` meshes.
-   **`Floor`**: Creates the 3D mesh for the floor of a room, including applying textures.
-   **`Edge`**: Creates the 3D meshes for the walls of a room.
-   **`Lights`**: Sets up the lighting for the scene, including ambient light and directional lights for shadows.
-   **`Skybox`**: Creates a sky-like background for the scene.
-   **`HUD`**: Manages the Heads-Up Display, such as the rotation arrows for selected items.

---

## `Main` Class

The primary driver for the 3D view.

### Public Methods

-   **`getController(): Controller`**: Returns the `Controller` instance.
-   **`getCamera(): THREE.Camera`**: Returns the `three.js` camera object.
-   **`getScene(): THREE.Scene`**: Returns the `three.js` scene object.
-   **`centerCamera(): void`**: Centers the camera to view the entire floor plan.

---

## `Controller` Class

Manages user interactions in the 3D scene.

### Public Methods

-   **`selectedObject(): Item`**: Returns the currently selected item.
-   **`setSelectedObject(object: Item): void`**: Sets the currently selected item.

---

## `Controls` Class

Manages camera manipulation.

### Public Methods

-   **`panTo(vec3: THREE.Vector3): void`**: Pans the camera to a specific location.
-   **`rotateLeft(angle: number): void`**: Rotates the camera to the left.
-   **`rotateUp(angle: number): void`**: Rotates the camera up.
-   **`dollyIn(): void`** / **`dollyOut(): void`**: Zooms the camera in or out.

---

## User Input and 3D Interaction Mechanism

User interaction in the 3D view is managed by the `Controller` class, which uses a state machine and raycasting to translate mouse events into actions in the 3D world.

### State Machine

The `Controller` maintains a state machine to track the current user action. The possible states are:

-   `UNSELECTED`: No object is selected. The user can navigate the scene freely.
-   `SELECTED`: An object is selected but is not being interacted with.
-   `DRAGGING`: The user is clicking and dragging a selected object to move it.
-   `ROTATING`: The user is clicking and dragging the rotation handle to rotate an object.
-   `ROTATING_FREE`: The user has clicked the rotation handle and is now rotating the object without holding the mouse button.

By managing these states, the `Controller` can interpret user input correctly based on the context. For example, a mouse drag will move an object if the state is `DRAGGING`, but it will orbit the camera if the state is `SELECTED`.

### Raycasting and Object Selection

To determine what the user is clicking on, the `Controller` uses `THREE.Raycaster`.

1.  When the user clicks or moves the mouse, the 2D screen coordinates of the mouse are converted into a 3D ray that projects from the camera into the scene.
2.  The `Raycaster` then checks which objects in the scene intersect with this ray.
3.  The `Controller` prioritizes intersections, first checking for HUD elements (like the rotation handle), then for items, and finally for walls and floors.
4.  If an intersection is found, the corresponding object becomes the `intersectedObject`.
5.  When the user clicks, the `intersectedObject` becomes the `selectedObject`, and the state machine transitions accordingly (e.g., to `DRAGGING`). The action is then delegated to the appropriate method on the `Item` object (e.g., `item.clickDragged()`).
