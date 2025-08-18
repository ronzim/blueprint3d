# Core Module

The `core` module provides a set of essential, low-level functionalities that are used throughout the Blueprint3D application. This includes configuration management, dimensioning utilities, logging, and various helper functions.

## Files

The `core` module is composed of the following files:

-   `configuration.ts`: Manages global configuration settings.
-   `dimensioning.ts`: Provides functions for converting measurements.
-   `log.ts`: Implements a simple logging framework.
-   `utils.ts`: Contains a collection of utility functions for geometry, GUID generation, and array manipulation.
-   `version.ts`: Manages application version information.

---

## `Configuration` Class

The `Configuration` class provides a static interface for managing global settings for the application.

### Public Static Methods

-   **`setValue(key: string, value: string | number): void`**
    -   Sets a configuration parameter.
    -   **Parameters:**
        -   `key`: The configuration key (e.g., `configWallHeight`).
        -   `value`: The value to set.

-   **`getStringValue(key: string): string`**
    -   Retrieves a string configuration parameter.
    -   **Parameters:**
        -   `key`: The configuration key.
    -   **Returns:** The string value of the parameter.

-   **`getNumericValue(key: string): number`**
    -   Retrieves a numeric configuration parameter.
    -   **Parameters:**
        -   `key`: The configuration key.
    -   **Returns:** The numeric value of the parameter.

---

## `Dimensioning` Class

The `Dimensioning` class provides static methods for handling measurement conversions.

### Public Static Methods

-   **`cmToMeasure(cm: number): string`**
    -   Converts a value in centimeters to a string representation based on the current dimensioning unit setting (e.g., inches, meters).
    -   **Parameters:**
        -   `cm`: The value in centimeters.
    -   **Returns:** A string representation of the measurement.

---

## Logging Functions

The `log.ts` file provides a simple logging framework.

### Public Functions

-   **`isLogging(context: ELogContext, level: ELogLevel): boolean`**
    -   Checks if logging is enabled for a specific context and level.
    -   **Parameters:**
        -   `context`: The logging context (e.g., `ELogContext.Wall`).
        -   `level`: The logging level (e.g., `ELogLevel.Error`).
    -   **Returns:** `true` if logging is enabled, `false` otherwise.

-   **`log(context: ELogContext, level: ELogLevel, message: string): void`**
    -   Logs a message with a specific context and level.
    -   **Parameters:**
        -   `context`: The logging context.
        -   `level`: The logging level.
        -   `message`: The message to log.

---

## Utility Functions

The `utils.ts` file provides a collection of miscellaneous utility functions.

### Public Functions

-   **`pointDistanceFromLine(x, y, x1, y1, x2, y2): number`**: Calculates the distance of a point from a line.
-   **`closestPointOnLine(x, y, x1, y1, x2, y2): { x: number, y: number }`**: Finds the closest point on a line to a given point.
-   **`distance(x1, y1, x2, y2): number`**: Calculates the distance between two points.
-   **`angle(x1, y1, x2, y2): number`**: Calculates the angle between two vectors.
-   **`angle2pi(x1, y1, x2, y2): number`**: Shifts an angle to be in the range [0, 2π].
-   **`isClockwise(points): boolean`**: Checks if a set of points is in clockwise order.
-   **`guid(): string`**: Generates a new GUID.
-   **`polygonPolygonIntersect(firstCorners, secondCorners): boolean`**: Checks if two polygons intersect.
-   **`linePolygonIntersect(x1, y1, x2, y2, corners): boolean`**: Checks if a line intersects with a polygon.
-   **`lineLineIntersect(x1, y1, x2, y2, x3, y3, x4, y4): boolean`**: Checks if two lines intersect.
-   **`pointInPolygon(x, y, corners, startX, startY): boolean`**: Checks if a point is inside a polygon.
-   **`polygonInsidePolygon(insideCorners, outsideCorners, startX, startY): boolean`**: Checks if a polygon is entirely inside another polygon.
-   **`polygonOutsidePolygon(insideCorners, outsideCorners, startX, startY): boolean`**: Checks if a polygon is entirely outside another polygon.
-   And various array utility functions (`forEach`, `map`, `removeIf`, etc.).

---

## `Version` Class

The `Version` class provides static methods for retrieving application version information.

### Public Static Methods

-   **`getInformalVersion(): string`**
    -   Gets the informal version string (e.g., "1.0 Beta 1").
    -   **Returns:** The informal version string.

-   **`getTechnicalVersion(): string`**
    -   Gets the technical version string (e.g., "1.0.0.1").
    -   **Returns:** The technical version string.
