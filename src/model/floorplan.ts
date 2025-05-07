import * as THREE from 'three';
import $ from 'jquery';
import * as Utils from '../core/utils';

// Import types to avoid circular dependencies
import type { Wall } from './wall';
import type { Corner } from './corner';
import type { Room } from './room';
import type { HalfEdge } from './half_edge';

/** Default tolerance for detecting overlapping */
const defaultFloorPlanTolerance = 10.0;

/**
 * A Floorplan represents a number of Walls, Corners and Rooms.
 */
export class Floorplan {
  /** Walls in the floorplan */
  private walls: Wall[] = [];

  /** Corners in the floorplan */
  private corners: Corner[] = [];

  /** Rooms in the floorplan */
  private rooms: Room[] = [];

  /** Callbacks when a new wall is added */
  private new_wall_callbacks = $.Callbacks();

  /** Callbacks when a new corner is added */
  private new_corner_callbacks = $.Callbacks();

  /** Callbacks when the floorplan needs to be redrawn */
  private redraw_callbacks = $.Callbacks();

  /** Callbacks when rooms are updated */
  private updated_rooms = $.Callbacks();

  /** Callbacks when room is loaded */
  public roomLoadedCallbacks = $.Callbacks();

    /**
     * Floor textures are owned by the floorplan, because room objects are
     * destroyed and created each time we change the floorplan.
     * floorTextures is a map of room UUIDs (string) to a object with
     * url and scale attributes.
     */
    private floorTextures = {};

    /** Constructs a floorplan. */
    constructor() {}

    // hack
    public wallEdges(): HalfEdge[] {
      var edges = [];

      this.walls.forEach(wall => {
        if (wall.frontEdge) {
          edges.push(wall.frontEdge);
        }
        if (wall.backEdge) {
          edges.push(wall.backEdge);
        }
      });
      return edges;
    }

    // hack
    public wallEdgePlanes(): THREE.Mesh[] {
      var planes = [];
      this.walls.forEach(wall => {
        if (wall.frontEdge) {
          planes.push(wall.frontEdge.plane);
        }
        if (wall.backEdge) {
          planes.push(wall.backEdge.plane);
        }
      });
      return planes;
    }

    /**
     * Get all floor planes in the floorplan
     * @returns Array of floor plane meshes
     */
    private floorPlanes(): THREE.Mesh[] {
      return Utils.map(this.rooms, (room: Room) => {
        return room.floorPlane;
      });
    }

    public fireOnNewWall(callback) {
      this.new_wall_callbacks.add(callback);
    }

    public fireOnNewCorner(callback) {
      this.new_corner_callbacks.add(callback);
    }

    public fireOnRedraw(callback) {
      this.redraw_callbacks.add(callback);
    }

    public fireOnUpdatedRooms(callback) {
      this.updated_rooms.add(callback);
    }

    /**
     * Creates a new wall.
     * @param start The start corner.
     * @param end he end corner.
     * @returns The new wall.
     */
    public newWall(start: Corner, end: Corner): Wall {
      // Import Wall dynamically to avoid circular dependencies
      const { Wall } = require('./wall');
      
      const wall = new Wall(start, end);
      this.walls.push(wall);
      wall.fireOnDelete(() => {
        this.removeWall(wall);
      });
      this.new_wall_callbacks.fire(wall);
      this.update();
      return wall;
    }

    /** Removes a wall.
     * @param wall The wall to be removed.
     */
    /**
     * Removes a wall from the floorplan.
     * @param wall The wall to be removed.
     */
    private removeWall(wall: Wall) {
      Utils.removeValue(this.walls, wall);
      this.update();
    }

    /**
     * Creates a new corner.
     * @param x The x coordinate.
     * @param y The y coordinate.
     * @param id An optional id. If unspecified, the id will be created internally.
     * @returns The new corner.
     */
    /**
     * Creates a new corner in the floorplan.
     * @param x The x coordinate.
     * @param y The y coordinate.
     * @param id An optional id. If unspecified, the id will be created internally.
     * @returns The new corner.
     */
    public newCorner(x: number, y: number, id?: string): Corner {
      // Import Corner dynamically to avoid circular dependencies
      const { Corner } = require('./corner');
      
      const corner = new Corner(this, x, y, id);
      this.corners.push(corner);
      corner.fireOnDelete(() => {
        this.removeCorner(corner); // Fix missing function call here
      });
      this.new_corner_callbacks.fire(corner);
      return corner;
    }

    /** Removes a corner.
     * @param corner The corner to be removed.
     */
    /**
     * Removes a corner from the floorplan.
     * @param corner The corner to be removed.
     */
    private removeCorner(corner: Corner) {
      Utils.removeValue(this.corners, corner);
    }

    /** Gets the walls. */
    public getWalls(): Wall[] {
      return this.walls;
    }

    /** Gets the corners. */
    public getCorners(): Corner[] {
      return this.corners;
    }

    /** Gets the rooms. */
    public getRooms(): Room[] {
      return this.rooms;
    }

    public overlappedCorner(x: number, y: number, tolerance?: number): Corner {
      tolerance = tolerance || defaultFloorPlanTolerance;
      for (var i = 0; i < this.corners.length; i++) {
        if (this.corners[i].distanceFrom(x, y) < tolerance) {
          return this.corners[i];
        }
      }
      return null;
    }

    public overlappedWall(x: number, y: number, tolerance?: number): Wall {
      tolerance = tolerance || defaultFloorPlanTolerance;
      for (var i = 0; i < this.walls.length; i++) {
        if (this.walls[i].distanceFrom(x, y) < tolerance) {
          return this.walls[i];
        }
      }
      return null;
    }

    // import and export -- cleanup

    public saveFloorplan() {
      var floorplan = {
        corners: {},
        walls: [],
        wallTextures: [],
        floorTextures: {},
        newFloorTextures: {}
      };

      this.corners.forEach(corner => {
        floorplan.corners[corner.id] = {
          x: corner.x,
          y: corner.y
        };
      });

      this.walls.forEach(wall => {
        floorplan.walls.push({
          corner1: wall.getStart().id,
          corner2: wall.getEnd().id,
          frontTexture: wall.frontTexture,
          backTexture: wall.backTexture
        });
      });
      floorplan.newFloorTextures = this.floorTextures;
      return floorplan;
    }

    public loadFloorplan(floorplan) {
      this.reset();

      var corners = {};
      if (
        floorplan == null ||
        !("corners" in floorplan) ||
        !("walls" in floorplan)
      ) {
        return;
      }
      for (var id in floorplan.corners) {
        var corner = floorplan.corners[id];
        corners[id] = this.newCorner(corner.x, corner.y, id);
      }
      var scope = this;
      floorplan.walls.forEach(wall => {
        var newWall = scope.newWall(
          corners[wall.corner1],
          corners[wall.corner2]
        );
        if (wall.frontTexture) {
          newWall.frontTexture = wall.frontTexture;
        }
        if (wall.backTexture) {
          newWall.backTexture = wall.backTexture;
        }
      });

      if ("newFloorTextures" in floorplan) {
        this.floorTextures = floorplan.newFloorTextures;
      }

      this.update();
      this.roomLoadedCallbacks.fire();
    }

    public getFloorTexture(uuid: string) {
      if (uuid in this.floorTextures) {
        return this.floorTextures[uuid];
      } else {
        return null;
      }
    }

    public setFloorTexture(uuid: string, url: string, scale: number) {
      this.floorTextures[uuid] = {
        url: url,
        scale: scale
      };
    }

    /** clear out obsolete floor textures */
    private updateFloorTextures() {
      const uuids = Utils.map(this.rooms, function (room) {
        return room.getUuid();
      });
      for (const uuid in this.floorTextures) {
        if (!Utils.hasValue(uuids, uuid)) {
          delete this.floorTextures[uuid];
        }
      }
    }

    /** */
    private reset() {
      var tmpCorners = this.corners.slice(0);
      var tmpWalls = this.walls.slice(0);
      tmpCorners.forEach(corner => {
        corner.remove();
      });
      tmpWalls.forEach(wall => {
        wall.remove();
      });
      this.corners = [];
      this.walls = [];
    }

    /**
     * Update rooms
     */
    public update() {
      this.walls.forEach(wall => {
        wall.resetFrontBack();
      });

      var roomCorners = this.findRooms(this.corners);
      this.rooms = [];
      var scope = this;
      roomCorners.forEach(corners => {
        // Import Room dynamically to avoid circular dependencies
        const { Room } = require('./room');
        scope.rooms.push(new Room(scope, corners));
      });
      this.assignOrphanEdges();

      this.updateFloorTextures();
      this.updated_rooms.fire();
    }

    /**
     * Returns the center of the floorplan in the y plane
     */
    public getCenter() {
      return this.getDimensions(true);
    }

    public getSize() {
      return this.getDimensions(false);
    }

    public getDimensions(center) {
      center = center || false; // otherwise, get size

      var xMin = Infinity;
      var xMax = -Infinity;
      var zMin = Infinity;
      var zMax = -Infinity;
      this.corners.forEach(corner => {
        if (corner.x < xMin) xMin = corner.x;
        if (corner.x > xMax) xMax = corner.x;
        if (corner.y < zMin) zMin = corner.y;
        if (corner.y > zMax) zMax = corner.y;
      });
      var ret;
      if (
        xMin == Infinity ||
        xMax == -Infinity ||
        zMin == Infinity ||
        zMax == -Infinity
      ) {
        ret = new THREE.Vector3();
      } else {
        if (center) {
          // center
          ret = new THREE.Vector3((xMin + xMax) * 0.5, 0, (zMin + zMax) * 0.5);
        } else {
          // size
          ret = new THREE.Vector3(xMax - xMin, 0, zMax - zMin);
        }
      }
      return ret;
    }

    private assignOrphanEdges() {
      // kinda hacky
      // find orphaned wall segments (i.e. not part of rooms) and
      // give them edges
      var orphanWalls = [];
      this.walls.forEach(wall => {
        if (!wall.backEdge && !wall.frontEdge) {
          wall.orphan = true;
          // Import HalfEdge dynamically to avoid circular dependencies
          const { HalfEdge } = require('./half_edge');
          const back = new HalfEdge(null, wall, false);
          back.generatePlane();
          const front = new HalfEdge(null, wall, true);
          front.generatePlane();
          orphanWalls.push(wall);
        }
      });
    }

    /*
     * Find the "rooms" in our planar straight-line graph.
     * Rooms are set of the smallest (by area) possible cycles in this graph.
     * @param corners The corners of the floorplan.
     * @returns The rooms, each room as an array of corners.
     */
    public findRooms(corners: Corner[]): Corner[][] {
      function _calculateTheta(
        previousCorner: Corner,
        currentCorner: Corner,
        nextCorner: Corner
      ) {
        const theta = Utils.angle2pi(
          previousCorner.x - currentCorner.x,
          previousCorner.y - currentCorner.y,
          nextCorner.x - currentCorner.x,
          nextCorner.y - currentCorner.y
        );
        return theta;
      }

      function _removeDuplicateRooms(roomArray: Corner[][]): Corner[][] {
        const results: Corner[][] = [];
        const lookup: {[key: string]: boolean} = {};
        const hashFunc = function (corner: Corner) {
          return corner.id;
        };
        const sep = "-";
        for (let i = 0; i < roomArray.length; i++) {
          // rooms are cycles, shift it around to check uniqueness
          let add = true;
          const room = roomArray[i];
          for (let j = 0; j < room.length; j++) {
            const roomShift = Utils.cycle(room, j);
            const str = Utils.map(roomShift, hashFunc).join(sep);
            if (lookup.hasOwnProperty(str)) {
              add = false;
            }
          }
          if (add) {
            results.push(roomArray[i]);
            lookup[str] = true;
          }
        }
        return results;
      }

      function _findTightestCycle(
        firstCorner: Corner,
        secondCorner: Corner
      ): Corner[] {
        var stack: {
          corner: Corner;
          previousCorners: Corner[];
        }[] = [];

        var next = {
          corner: secondCorner,
          previousCorners: [firstCorner]
        };
        var visited = {};
        visited[firstCorner.id] = true;

        while (next) {
          // update previous corners, current corner, and visited corners
          var currentCorner = next.corner;
          visited[currentCorner.id] = true;

          // did we make it back to the startCorner?
          if (next.corner === firstCorner && currentCorner !== secondCorner) {
            return next.previousCorners;
          }

          var addToStack: Corner[] = [];
          var adjacentCorners = next.corner.adjacentCorners();
          for (var i = 0; i < adjacentCorners.length; i++) {
            var nextCorner = adjacentCorners[i];

            // is this where we came from?
            // give an exception if its the first corner and we aren't at the second corner
            if (
              nextCorner.id in visited &&
              !(nextCorner === firstCorner && currentCorner !== secondCorner)
            ) {
              continue;
            }

            // nope, throw it on the queue
            addToStack.push(nextCorner);
          }

          var previousCorners = next.previousCorners.slice(0);
          previousCorners.push(currentCorner);
          if (addToStack.length > 1) {
            // visit the ones with smallest theta first
            var previousCorner =
              next.previousCorners[next.previousCorners.length - 1];
            addToStack.sort(function (a, b) {
              return (
                _calculateTheta(previousCorner, currentCorner, b) -
                _calculateTheta(previousCorner, currentCorner, a)
              );
            });
          }

          if (addToStack.length > 0) {
            // add to the stack
            addToStack.forEach(corner => {
              stack.push({
                corner: corner,
                previousCorners: previousCorners
              });
            });
          }

          // pop off the next one
          next = stack.pop();
        }
        return [];
      }

      // find tightest loops, for each corner, for each adjacent
      // TODO: optimize this, only check corners with > 2 adjacents, or isolated cycles
      var loops: Corner[][] = [];

      corners.forEach(firstCorner => {
        firstCorner.adjacentCorners().forEach(secondCorner => {
          loops.push(_findTightestCycle(firstCorner, secondCorner));
        });
      });

      // remove duplicates
      var uniqueLoops = _removeDuplicateRooms(loops);
      //remove CW loops
      const uniqueCCWLoops = Utils.removeIf(
        uniqueLoops,
        Utils.isClockwise
      );

      return uniqueCCWLoops;
    }
  }
}

// Export for backward compatibility and default export
export default Floorplan;

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Model.Floorplan = Floorplan;
  (globalThis as any).BP3D.Model.defaultFloorPlanTolerance = defaultFloorPlanTolerance;
}
