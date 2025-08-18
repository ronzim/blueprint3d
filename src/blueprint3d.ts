import { Model } from './model';
import { Floorplanner } from './floorplanner/floorplanner';
import { Main } from './three/main';

/** Startup options. */
export interface Options {
  /** */
  widget?: boolean;

  /** */
  threeElement?: string;

  /** */
  threeCanvasElement? : string;

  /** */
  floorplannerElement?: string;

  /** The texture directory. */
  textureDir?: string;
}

/** Blueprint3D core application. */
export class Blueprint3d {

  private model: Model;

  private three: Main;

  private floorplanner: Floorplanner;

  /** Creates an instance.
   * @param options The initialization options.
   */
  constructor(options: Options) {
    this.model = new Model(options.textureDir);
    this.three = new Main(this.model, options.threeElement, options.threeCanvasElement, {});

    if (!options.widget) {
      this.floorplanner = new Floorplanner(options.floorplannerElement, this.model.floorplan);
    }
    else {
      this.three.getController().enabled = false;
    }
  }
}
