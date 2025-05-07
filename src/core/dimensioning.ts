// Import needed configuration
import { Configuration, configDimUnit } from './configuration';

/** Dimensioning in Inch. */
export const dimInch: string = "inch";

/** Dimensioning in Meter. */
export const dimMeter: string = "m";

/** Dimensioning in Centi Meter. */
export const dimCentiMeter: string = "cm";

/** Dimensioning in Milli Meter. */
export const dimMilliMeter: string = "mm";

/** Dimensioning functions. */
export class Dimensioning {
  /** Converts cm to dimensioning string.
   * @param cm Centi meter value to be converted.
   * @returns String representation.
   */
  public static cmToMeasure(cm: number): string {
    switch (Configuration.getStringValue(configDimUnit)) {
      case dimInch:
        const realFeet = ((cm * 0.393700) / 12);
        const feet = Math.floor(realFeet);
        const inches = Math.round((realFeet - feet) * 12);
        return feet + "'" + inches + '"';
      case dimMilliMeter:
        return "" + Math.round(10 * cm) + " mm";
      case dimCentiMeter:
        return "" + Math.round(10 * cm) / 10 + " cm";
      case dimMeter:
      default:
        return "" + Math.round(10 * cm) / 1000 + " m";
    }
  }
}

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Core.dimInch = dimInch;
  (globalThis as any).BP3D.Core.dimMeter = dimMeter;
  (globalThis as any).BP3D.Core.dimCentiMeter = dimCentiMeter;
  (globalThis as any).BP3D.Core.dimMilliMeter = dimMilliMeter;
  (globalThis as any).BP3D.Core.Dimensioning = Dimensioning;
}
