/** Version information. */
export class Version {
  /** The informal version. */
  public static getInformalVersion(): string {
    return "1.0 Beta 1";
  }

  /** The technical version. */
  public static getTechnicalVersion(): string {
    return "1.0.0.1"
  }
}

// Log version on load
console.log("Blueprint3D " + Version.getInformalVersion()
  + " (" + Version.getTechnicalVersion() + ")")

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Core.Version = Version;
}
