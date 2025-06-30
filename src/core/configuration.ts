import { dimCentiMeter } from './dimensioning';

export const configDimUnit = "dimUnit";
export const configWallHeight = "wallHeight";
export const configWallThickness = "wallThickness";

export class Configuration {
  private static data: { [key: string]: any } = {
    dimUnit: dimCentiMeter,
    wallHeight: 250,
    wallThickness: 10
  };

  public static setValue(key: string, value: string | number) {
    this.data[key] = value;
  }

  public static getStringValue(key: string): string {
    switch (key) {
      case configDimUnit:
        return <string>this.data[key];
      default:
        throw new Error("Invalid string configuration parameter: " + key);
    }
  }

  public static getNumericValue(key: string): number {
    switch (key) {
      case configWallHeight:
      case configWallThickness:
        return <number>this.data[key];
      default:
        throw new Error("Invalid numeric configuration parameter: " + key);
    }
  }
}