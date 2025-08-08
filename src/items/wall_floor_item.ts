import * as THREE from "three";
import { Model } from "../model/model";
import { WallItem } from "./wall_item";
import { Metadata } from "./metadata";

/** */
export abstract class WallFloorItem extends WallItem {
  constructor(
    model: Model,
    metadata: Metadata,
    geometry: THREE.Geometry,
    material: THREE.MeshFaceMaterial,
    position: THREE.Vector3,
    rotation: number,
    scale: THREE.Vector3
  ) {
    super(model, metadata, geometry, material, position, rotation, scale);
    this.boundToFloor = true;
  }
}
