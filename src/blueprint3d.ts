import { Model } from './model/model';
import { Floorplanner } from './floorplanner/floorplanner';
import { Main as ThreeMain } from './three/main';

export interface Options {
  widget?: boolean;
  threeElement?: string;
  threeCanvasElement?: string;
  floorplannerElement?: string;
  textureDir?: string;
}

export class Blueprint3d {
  private model: Model;
  private three: ThreeMain;
  private floorplanner: Floorplanner;

  constructor(options: Options) {
    this.model = new Model(options.textureDir);
    this.three = new ThreeMain(this.model, options.threeElement, options.threeCanvasElement, {});

    if (!options.widget) {
      this.floorplanner = new Floorplanner(options.floorplannerElement, this.model.floorplan);
    }
    else {
      this.three.getController().enabled = false;
    }
  }
}
