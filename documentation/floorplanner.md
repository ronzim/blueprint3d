# Floorplanner Module

The `floorplanner` module provides the interactive 2D tool for creating and editing floor plans. It consists of a controller (`Floorplanner`) that handles user input and logic, and a view (`FloorplannerView`) that renders the floor plan on a canvas.

## Files

-   `floorplanner.ts`: The main controller for the 2D floor planner.
-   `floorplanner_view.ts`: The view responsible for rendering the 2D floor plan.

---

## `Floorplanner` Class

The `Floorplanner` class is the core controller for the 2D editor. It manages user interactions, such as mouse clicks and movements, to enable drawing, moving, and deleting walls and corners.

### Public Properties

-   **`mode: number`**: The current operating mode of the floor planner (e.g., `floorplannerModes.MOVE`, `floorplannerModes.DRAW`).
-   **`activeWall: Wall`**: The wall currently under the mouse cursor.
-   **`activeCorner: Corner`**: The corner currently under the mouse cursor.
-   **`originX: number`**, **`originY: number`**: The origin of the view, used for panning.

### Public Methods

-   **`setMode(mode: number): void`**
    -   Sets the current operating mode of the floor planner.
    -   **Parameters:**
        -   `mode`: The new mode to set.

-   **`convertX(x: number): number`**
    -   Converts a 3D world coordinate (in cm) to a 2D canvas coordinate.
    -   **Parameters:**
        -   `x`: The X-coordinate in the 3D world.
    -   **Returns:** The corresponding X-coordinate on the canvas.

-   **`convertY(y: number): number`**
    -   Converts a 3D world coordinate (in cm) to a 2D canvas coordinate.
    -   **Parameters:**
        -   `y`: The Y-coordinate in the 3D world.
    -   **Returns:** The corresponding Y-coordinate on the canvas.

---

## `FloorplannerView` Class

The `FloorplannerView` class is responsible for all the rendering in the 2D floor planner. It draws the grid, walls, corners, rooms, and other visual elements onto the HTML canvas.

### Public Methods

-   **`handleWindowResize(): void`**
    -   Handles the resizing of the browser window to ensure the canvas adjusts its dimensions correctly.

-   **`draw(): void`**
    -   Redraws the entire 2D scene, including the grid, rooms, walls, and corners. This method is called whenever the view needs to be updated.

---

## 2D Drawing and Interaction Mechanism

The `Floorplanner` class manages user input on the 2D canvas to enable the drawing and manipulation of walls and corners.

### Drawing Mode

When the `Floorplanner` is in `DRAW` mode, the user can create new walls by clicking on the canvas.

1.  The first click creates a new `Corner` at the mouse position. This corner becomes the `lastNode`.
2.  As the user moves the mouse, a temporary line is drawn from the `lastNode` to the current mouse position to visualize the wall being drawn.
3.  The second click creates another `Corner` at the new mouse position and then creates a `Wall` connecting the `lastNode` to the new corner.
4.  The new corner then becomes the `lastNode`, allowing the user to continue drawing a chain of walls.

### Snapping

To assist with drawing accurate floor plans, the `Floorplanner` implements two types of snapping:

-   **Axis Snapping**: When drawing, if the mouse cursor is close to being horizontally or vertically aligned with the `lastNode`, the target position will "snap" to that axis. This helps in creating perfectly straight walls. The `snapTolerance` variable controls the distance at which this snapping occurs.
-   **Corner Snapping and Merging**: When a new corner is created, the `Floorplanner` checks if it is close to any existing corners or walls.
    -   If it is close to another corner, the new corner is merged with the existing one.
    -   If it is close to a wall, the wall is split into two new walls, and the new corner is inserted at the intersection point.

This snapping and merging behavior simplifies the process of creating closed rooms and complex layouts.
