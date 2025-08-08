import { Blueprint3d, Options } from "./src/blueprint3d";
import { Floorplanner } from "./src/floorplanner/floorplanner";
import { Main } from "./src/three/main";
import { Model } from "./src/model/model";
import { Scene } from "./src/model/scene";

// Blueprint3d, Options, Floorplanner, Main, Model, Scene
(window as any).BP3D = {
  Blueprint3d,
  Options,
  Floorplanner,
  Main,
  Model,
  Scene,
};
