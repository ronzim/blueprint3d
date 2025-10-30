import * as THREE from 'three';
import { Callbacks } from '../core/event_emitter';
import { Utils } from '../core/utils';
import { Wall } from './wall';
import { Corner } from './corner';
import { Room } from './room';
import { HalfEdge } from './half_edge';

export const defaultFloorPlanTolerance = 10.0;

export class Floorplan {
  public walls: Wall[] = [];
  public corners: Corner[] = [];
  public rooms: Room[] = [];
  private new_wall_callbacks = new Callbacks();
  private new_corner_callbacks = new Callbacks();
  private redraw_callbacks = new Callbacks();
  private updated_rooms = new Callbacks();
  public roomLoadedCallbacks = new Callbacks();
  private floorTextures = {};

  constructor() {}

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

  public newWall(start: Corner, end: Corner): Wall {
    var wall = new Wall(start, end);
    this.walls.push(wall);
    var scope = this;
    wall.fireOnDelete(() => {
      scope.removeWall(wall);
    });
    this.new_wall_callbacks.fire(wall);
    this.update();
    return wall;
  }

  private removeWall(wall: Wall) {
    Utils.removeValue(this.walls, wall);
    this.update();
  }

  public newCorner(x: number, y: number, id?: string): Corner {
    var corner = new Corner(this, x, y, id);
    this.corners.push(corner);
    corner.fireOnDelete(() => {
      this.removeCorner;
    });
    this.new_corner_callbacks.fire(corner);
    return corner;
  }

  private removeCorner(corner: Corner) {
    Utils.removeValue(this.corners, corner);
  }

  public getWalls(): Wall[] {
    return this.walls;
  }

  public getCorners(): Corner[] {
    return this.corners;
  }

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

  private updateFloorTextures() {
    var uuids = Utils.map(this.rooms, function (room) {
      return room.getUuid();
    });
    for (var uuid in this.floorTextures) {
      if (!Utils.hasValue(uuids, uuid)) {
        delete this.floorTextures[uuid];
      }
    }
  }

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

  public update() {
    this.walls.forEach(wall => {
      wall.resetFrontBack();
    });

    var roomCorners = this.findRooms(this.corners);
    this.rooms = [];
    var scope = this;
    roomCorners.forEach(corners => {
      scope.rooms.push(new Room(scope, corners));
    });
    this.assignOrphanEdges();

    this.updateFloorTextures();
    this.updated_rooms.fire();
  }

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
        ret = new THREE.Vector3((xMin + xMax) * 0.5, 0, (zMin + zMax) * 0.5);
      } else {
        ret = new THREE.Vector3(xMax - xMin, 0, zMax - zMin);
      }
    }
    return ret;
  }

  private assignOrphanEdges() {
    var orphanWalls = [];
    this.walls.forEach(wall => {
      if (!wall.backEdge && !wall.frontEdge) {
        wall.orphan = true;
        var back = new HalfEdge(null, wall, false);
        back.generatePlane();
        var front = new HalfEdge(null, wall, true);
        front.generatePlane();
        orphanWalls.push(wall);
      }
    });
  }

  public findRooms(corners: Corner[]): Corner[][] {
    function _calculateTheta(
      previousCorner: Corner,
      currentCorner: Corner,
      nextCorner: Corner
    ) {
      var theta = Utils.angle2pi(
        previousCorner.x - currentCorner.x,
        previousCorner.y - currentCorner.y,
        nextCorner.x - currentCorner.x,
        nextCorner.y - currentCorner.y
      );
      return theta;
    }

    function _removeDuplicateRooms(roomArray: Corner[][]): Corner[][] {
      var results: Corner[][] = [];
      var lookup = {};
      var hashFunc = function (corner) {
        return corner.id;
      };
      var sep = "-";
      for (var i = 0; i < roomArray.length; i++) {
        var add = true;
        var room = roomArray[i];
        for (var j = 0; j < room.length; j++) {
          var roomShift = Utils.cycle(room, j);
          var str = Utils.map(roomShift, hashFunc).join(sep);
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
        var currentCorner = next.corner;
        visited[currentCorner.id] = true;

        if (next.corner === firstCorner && currentCorner !== secondCorner) {
          return next.previousCorners;
        }

        var addToStack: Corner[] = [];
        var adjacentCorners = next.corner.adjacentCorners();
        for (var i = 0; i < adjacentCorners.length; i++) {
          var nextCorner = adjacentCorners[i];

          if (
            nextCorner.id in visited &&
            !(nextCorner === firstCorner && currentCorner !== secondCorner)
          ) {
            continue;
          }

          addToStack.push(nextCorner);
        }

        var previousCorners = next.previousCorners.slice(0);
        previousCorners.push(currentCorner);
        if (addToStack.length > 1) {
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
          addToStack.forEach(corner => {
            stack.push({
              corner: corner,
              previousCorners: previousCorners
            });
          });
        }

        next = stack.pop();
      }
      return [];
    }

    var loops: Corner[][] = [];

    corners.forEach(firstCorner => {
      firstCorner.adjacentCorners().forEach(secondCorner => {
        loops.push(_findTightestCycle(firstCorner, secondCorner));
      });
    });

    var uniqueLoops = _removeDuplicateRooms(loops);
    var uniqueCCWLoops = Utils.removeIf(
      uniqueLoops,
      Utils.isClockwise
    );

    return uniqueCCWLoops;
  }
}
