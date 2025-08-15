import { Model } from '../model';
import { WallItem } from './wall_item';
import { Metadata } from './metadata';

/** */
export abstract class InWallItem extends WallItem {
  constructor(model: Model, metadata: Metadata, geometry: THREE.Geometry, material: THREE.MeshFaceMaterial, position: THREE.Vector3, rotation: number, scale: THREE.Vector3) {
    super(model, metadata, geometry, material, position, rotation, scale);
    this.addToWall = true;
  };

  /** */
  public getWallOffset() {
    // fudge factor so it saves to the right wall
    return -this.currentWallEdge.offset + 0.5;
  }
}