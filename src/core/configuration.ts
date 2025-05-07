// Import from dimensioning.ts instead of using reference
import { dimCentiMeter } from './dimensioning';

// GENERAL Configuration constants
/** The dimensioning unit for 2D floorplan measurements. */
export const configDimUnit = "dimUnit";

// WALL Configuration constants
/** The initial wall height in cm. */
export const configWallHeight = "wallHeight";

/** The initial wall thickness in cm. */
export const configWallThickness = "wallThickness";

/** Global configuration to customize the whole system.  */
export class Configuration {
  /** Configuration data loaded from/stored to extern. */
  private static data: { [key: string]: any } = {
    dimUnit: dimCentiMeter,
    wallHeight: 250,
    wallThickness: 10
  };

  /** Set a configuration parameter. */
  public static setValue(key: string, value: string | number) {
    this.data[key] = value;
  }

  /** Get a string configuration parameter. */
  public static getStringValue(key: string): string {
    switch (key) {
      case configDimUnit:
        return this.data[key] as string;
      default:
        throw new Error("Invalid string configuration parameter: " + key);
    }
  }

  /** Get a numeric configuration parameter. */
  public static getNumericValue(key: string): number {
    switch (key) {
      case configWallHeight:
      case configWallThickness:
        return this.data[key] as number;
      default:
        throw new Error("Invalid numeric configuration parameter: " + key);
    }
  }
}

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Core.configDimUnit = configDimUnit;
  (globalThis as any).BP3D.Core.configWallHeight = configWallHeight;
  (globalThis as any).BP3D.Core.configWallThickness = configWallThickness;
  (globalThis as any).BP3D.Core.Configuration = Configuration;
}
