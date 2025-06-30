import * as THREE from 'three';
import { Model } from '../model/model';
import { Item } from './item';
import { Metadata } from './metadata';
import { Utils } from '../core/utils';

export abstract class FloorItem extends Item {
  constructor(model: Model, metadata: Metadata, geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, rotation: number, scale: THREE.Vector3) {
    super(model, metadata, geometry, material, position, rotation, scale);
  };

  public placeInRoom() {
    if (!this.position_set) {
      var center = this.model.floorplan.getCenter();
      this.position.x = center.x;
      this.position.z = center.z;
      this.position.y = 0.5 * (this.geometry.boundingBox.max.y - this.geometry.boundingBox.min.y);
    }
  };

  public resized() {
    this.position.y = this.halfSize.y;
  }

  public moveToPosition(vec3, intersection) {
    if (!this.isValidPosition(vec3)) {
      this.showError(vec3);
      return;
    } else {
      this.hideError();
      vec3.y = this.position.y; // keep it on the floor!
      this.position.copy(vec3);
    }
  }

  public isValidPosition(vec3): boolean {
    var corners = this.getCorners('x', 'z', vec3);

    var rooms = this.model.floorplan.getRooms();
    var isInARoom = false;
    for (var i = 0; i < rooms.length; i++) {
      if (Utils.pointInPolygon(vec3.x, vec3.z, rooms[i].interiorCorners) &&
        !Utils.polygonPolygonIntersect(corners, rooms[i].interiorCorners)) {
        isInARoom = true;
      }
    }
    if (!isInARoom) {
      return false;
    }

    return true;
  }
}