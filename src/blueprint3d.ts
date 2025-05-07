// Import core modules
import type { Model } from './model/model';
import type { Floorplanner } from './floorplanner/floorplanner';
import type { Main as ThreeMain } from './three/main';

// Re-export from module files for easier imports by consumers
export * from './core/configuration';
export * from './core/dimensioning';
export * from './core/utils';
export * from './core/version';

// Export floorplanner constants/modes from the floorplanner module 
export * from './floorplanner/floorplanner';

/** Startup options for Blueprint3D */
export interface Options {
  /** Whether to run as a widget */
  widget?: boolean;

  /** The ID of the 3D viewer element */
  threeElement?: string;

  /** The ID of the 3D viewer canvas element */
  threeCanvasElement?: string;

  /** The ID of the floorplanner element */
  floorplannerElement?: string;

  /** The texture directory */
  textureDir?: string;
}

/** Blueprint3D core application */
export class Blueprint3d {
  // Make these public so they can be accessed from outside
  public model: Model;
  public three: ThreeMain;
  public floorplanner: Floorplanner;

  /** Creates an instance.
   * @param options The initialization options.
   */
  constructor(options: Options) {
    // Dynamic imports are used here to avoid circular dependencies
    // These will be properly resolved at runtime
    const { Model } = require('./model/model');
    const { Floorplanner } = require('./floorplanner/floorplanner');
    const { Main: ThreeMain } = require('./three/main');

    this.model = new Model(options.textureDir);
    this.three = new ThreeMain(this.model, options.threeElement, options.threeCanvasElement, {});

    if (!options.widget) {
      this.floorplanner = new Floorplanner(options.floorplannerElement, this.model.floorplan);
    } else {
      this.three.getController().enabled = false;
    }
  }
}

// Export the Blueprint3d class as default for backward compatibility
export default Blueprint3d;

// Export constants for backward compatibility with existing code
// These will be properly defined in their respective modules
export const floorplannerModes = {
  MOVE: 0,
  DRAW: 1,
  DELETE: 2
};

// Namespace for backward compatibility with existing code
// This creates a global BP3D namespace that can be used by legacy code
(globalThis as any).BP3D = {
  Blueprint3d,
  floorplannerModes,
  // Additional namespaces will be added by other modules
  Core: {},
  Floorplanner: {
    floorplannerModes
  },
  Items: {},
  Model: {},
  Three: {}
};
