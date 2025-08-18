import * as THREE from 'three';
import { Model } from '../model';
import { Item } from './item';
import { Metadata } from './metadata';
import * as Utils from '../core/utils';

/**
 * A Floor Item is an entity to be placed related to a floor.
 */
export abstract class FloorItem extends Item {
  constructor(model: Model, metadata: Metadata, geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], position: THREE.Vector3, rotation: number, scale: THREE.Vector3) {
    super(model, metadata, geometry, material, position, rotation, scale);
  };

  /** */
  public placeInRoom() {
    if (!this.position_set) {
      const center = this.model.floorplan.getCenter();
      (this as any).position.x = center.x;
      (this as any).position.z = center.z;
      (this as any).position.y = 0.5 * ((this as any).geometry.boundingBox.max.y - (this as any).geometry.boundingBox.min.y);
    }
  };

  /** Take action after a resize */
  public resized() {
    (this as any).position.y = this.halfSize.y;
  }

  /** */
  public moveToPosition(vec3, intersection) {
    // keeps the position in the room and on the floor
    if (!this.isValidPosition(vec3)) {
      this.showError(vec3);
      return;
    } else {
      this.hideError();
      vec3.y = (this as any).position.y; // keep it on the floor!
      (this as any).position.copy(vec3);
    }
  }

  /** */
  public isValidPosition(vec3): boolean {
    const corners = this.getCorners('x', 'z', vec3);

    // check if we are in a room
    const rooms = this.model.floorplan.getRooms();
    let isInARoom = false;
    for (let i = 0; i < rooms.length; i++) {
      if (Utils.pointInPolygon(vec3.x, vec3.z, rooms[i].interiorCorners) &&
        !Utils.polygonPolygonIntersect(corners, rooms[i].interiorCorners)) {
        isInARoom = true;
      }
    }
    if (!isInARoom) {
      //console.log('object not in a room');
      return false;
    }

    // check if we are outside all other objects
    /*
    if (this.obstructFloorMoves) {
        var objects = this.model.items.getItems();
        for (var i = 0; i < objects.length; i++) {
            if (objects[i] === this || !objects[i].obstructFloorMoves) {
                continue;
            }
            if (!utils.polygonOutsidePolygon(corners, objects[i].getCorners('x', 'z')) ||
                utils.polygonPolygonIntersect(corners, objects[i].getCorners('x', 'z'))) {
                //console.log('object not outside other objects');
                return false;
            }
        }
    }*/

    return true;
  }
}