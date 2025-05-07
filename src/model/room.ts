import * as THREE from 'three';
import $ from 'jquery';
import * as Utils from '../core/utils';

// Import types to avoid circular dependencies
import type { Corner } from './corner';
import type { Floorplan } from './floorplan';
import type { HalfEdge } from './half_edge';

/*
TODO
var Vec2 = require('vec2')
var segseg = require('segseg')
var Polygon = require('polygon')
*/

/** Default texture to be used if nothing is provided. */
export const defaultRoomTexture = {
  url: "rooms/textures/hardwood.png",
  scale: 400
};

/**
 * A Room is the combination of a Floorplan with a floor plane.
 */
export class Room {
    /** */
    public interiorCorners: Corner[] = [];

    /** */
    private edgePointer = null;

    /** floor plane for intersection testing */
    public floorPlane: THREE.Mesh = null;

    /** */
    private customTexture = false;

    /** */
    private floorChangeCallbacks = $.Callbacks();

    /**
     *  ordered CCW
     */
    constructor(private floorplan: Floorplan, public corners: Corner[]) {
      this.updateWalls();
      this.updateInteriorCorners();
      this.generatePlane();
    }
    
    /**
     * Gets the UUID of this room, which is the sorted list of corner UUIDs.
     * @returns The UUID of this room.
     */

    public getUuid(): string {
      const cornerUuids = Utils.map(this.corners, function (c) {
        return c.id;
      });
      cornerUuids.sort();
      return cornerUuids.join();
    }
    /**
     * Add a callback to be fired when the floor changes.
     * @param callback The callback to be added.
     */
    public fireOnFloorChange(callback) {
      this.floorChangeCallbacks.add(callback);
    }

    /**
     * Get the texture for this room's floor.
     * @returns The texture object for this room.
     */
    public getTexture() {
      const uuid = this.getUuid();
      const tex = this.floorplan.getFloorTexture(uuid);
      return tex || defaultRoomTexture;
    }

    /**
     * Set the texture for this room's floor.
     * textureStretch always true, just an argument for consistency with walls
     * @param textureUrl The URL of the new texture.
     * @param textureStretch Whether to stretch the texture (unused).
     * @param textureScale The scale of the texture.
     */
    public setTexture(
      textureUrl: string,
      textureStretch: boolean,
      textureScale: number
    ) {
      const uuid = this.getUuid();
      this.floorplan.setFloorTexture(uuid, textureUrl, textureScale);
      this.floorChangeCallbacks.fire();
    }
    /**
     * Generate the floor plane mesh for this room.
     */
    private generatePlane() {
      const points = [];
      this.interiorCorners.forEach(corner => {
        points.push(new THREE.Vector2(corner.x, corner.y));
      });
      const shape = new THREE.Shape(points);
      const geometry = new THREE.ShapeGeometry(shape);
      this.floorPlane = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide
        })
      );
      this.floorPlane.visible = false;
      this.floorPlane.rotation.set(Math.PI / 2, 0, 0);
      (this.floorPlane as any).room = this; // js monkey patch
    }
    /**
     * Cycle through the room indices with wrapping.
     * @param index The current index.
     * @returns The wrapped index.
     */
    private cycleIndex(index: number): number {
      if (index < 0) {
        return (index += this.corners.length);
      } else {
        return index % this.corners.length;
      }
    }

    /**
     * Update the interior corners of the room.
     */
    private updateInteriorCorners() {
      let edge = this.edgePointer;
      while (true) {
        this.interiorCorners.push(edge.interiorStart());
        edge.generatePlane();
        if (edge.next === this.edgePointer) {
          break;
        } else {
          edge = edge.next;
        }
      }
    }
    /**
     * Populates each wall's half edge relating to this room
     * this creates a fancy doubly connected edge list (DCEL)
     */
    private updateWalls() {
      // Import HalfEdge dynamically to avoid circular dependencies
      const { HalfEdge } = require('./half_edge');
      
      let prevEdge = null;
      let firstEdge = null;
      let edge = null;

      for (let i = 0; i < this.corners.length; i++) {
        const firstCorner = this.corners[i];
        const secondCorner = this.corners[(i + 1) % this.corners.length];

        // find if wall is heading in that direction
        const wallTo = firstCorner.wallTo(secondCorner);
        const wallFrom = firstCorner.wallFrom(secondCorner);

        if (wallTo) {
          edge = new HalfEdge(this, wallTo, true);
        } else if (wallFrom) {
          edge = new HalfEdge(this, wallFrom, false);
        } else {
          // something horrible has happened
          console.log("corners arent connected by a wall, uh oh");
        }

        if (i == 0) {
          firstEdge = edge;
        } else {
          edge.prev = prevEdge;
          prevEdge.next = edge;
          if (i + 1 == this.corners.length) {
            firstEdge.prev = edge;
            edge.next = firstEdge;
          }
        }
        prevEdge = edge;
      }

      // hold on to an edge reference
      this.edgePointer = firstEdge;
    }
  }
}

// Export as default
export default Room;

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Model.Room = Room;
  (globalThis as any).BP3D.Model.defaultRoomTexture = defaultRoomTexture;
}
