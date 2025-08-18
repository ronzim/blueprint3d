import * as THREE from 'three';
import { ObjectLoader, Vector3, Mesh, MeshFaceMaterial, Geometry } from 'three';
import * as Utils from '../core/utils';
import { Configuration, configWallThickness, configWallHeight } from '../core/configuration';
import { Item } from '../items/item';
import { Factory } from '../items/factory';

/** */
const cornerTolerance: number = 20;

/**
 * Corners are used to define Walls.
 */
export class Corner {
  /** Array of start walls. */
  private wallStarts: Wall[] = [];

  /** Array of end walls. */
  private wallEnds: Wall[] = [];

  /** Callbacks to be fired on movement. */
  private moved_callbacks = $.Callbacks();

  /** Callbacks to be fired on removal. */
  private deleted_callbacks = $.Callbacks();

  /** Callbacks to be fired in case of action. */
  private action_callbacks = $.Callbacks();

  /** Constructs a corner.
   * @param floorplan The associated floorplan.
   * @param x X coordinate.
   * @param y Y coordinate.
   * @param id An optional unique id. If not set, created internally.
   */
  constructor(
    private floorplan: Floorplan,
    public x: number,
    public y: number,
    public id?: string
  ) {
    this.id = id || Utils.guid();
  }

  /** Add function to moved callbacks.
   * @param func The function to be added.
   */
  public fireOnMove(func) {
    this.moved_callbacks.add(func);
  }

  /** Add function to deleted callbacks.
   * @param func The function to be added.
   */
  public fireOnDelete(func) {
    this.deleted_callbacks.add(func);
  }

  /** Add function to action callbacks.
   * @param func The function to be added.
   */
  public fireOnAction(func) {
    this.action_callbacks.add(func);
  }

  /**
   * @returns
   * @deprecated
   */
  public getX(): number {
    return this.x;
  }

  /**
   * @returns
   * @deprecated
   */
  public getY(): number {
    return this.y;
  }

  /**
   *
   */
  public snapToAxis(tolerance: number): { x: boolean; y: boolean } {
    // try to snap this corner to an axis
    var snapped = {
      x: false,
      y: false
    };

    var scope = this;

    this.adjacentCorners().forEach(corner => {
      if (Math.abs(corner.x - scope.x) < tolerance) {
        scope.x = corner.x;
        snapped.x = true;
      }
      if (Math.abs(corner.y - scope.y) < tolerance) {
        scope.y = corner.y;
        snapped.y = true;
      }
    });
    return snapped;
  }

  /** Moves corner relatively to new position.
   * @param dx The delta x.
   * @param dy The delta y.
   */
  public relativeMove(dx: number, dy: number) {
    this.move(this.x + dx, this.y + dy);
  }

  private fireAction(action) {
    this.action_callbacks.fire(action);
  }

  /** Remove callback. Fires the delete callbacks. */
  public remove() {
    this.deleted_callbacks.fire(this);
  }

  /** Removes all walls. */
  private removeAll() {
    for (var i = 0; i < this.wallStarts.length; i++) {
      this.wallStarts[i].remove();
    }
    for (var i = 0; i < this.wallEnds.length; i++) {
      this.wallEnds[i].remove();
    }
    this.remove();
  }

  /** Moves corner to new position.
   * @param newX The new x position.
   * @param newY The new y position.
   */
  private move(newX: number, newY: number) {
    this.x = newX;
    this.y = newY;
    this.mergeWithIntersected();
    this.moved_callbacks.fire(this.x, this.y);

    this.wallStarts.forEach(wall => {
      wall.fireMoved();
    });

    this.wallEnds.forEach(wall => {
      wall.fireMoved();
    });
  }

  /** Gets the adjacent corners.
   * @returns Array of corners.
   */
  public adjacentCorners(): Corner[] {
    var retArray = [];
    for (var i = 0; i < this.wallStarts.length; i++) {
      retArray.push(this.wallStarts[i].getEnd());
    }
    for (var i = 0; i < this.wallEnds.length; i++) {
      retArray.push(this.wallEnds[i].getStart());
    }
    return retArray;
  }

  /** Checks if a wall is connected.
   * @param wall A wall.
   * @returns True in case of connection.
   */
  private isWallConnected(wall: Wall): boolean {
    for (var i = 0; i < this.wallStarts.length; i++) {
      if (this.wallStarts[i] == wall) {
        return true;
      }
    }
    for (var i = 0; i < this.wallEnds.length; i++) {
      if (this.wallEnds[i] == wall) {
        return true;
      }
    }
    return false;
  }

  /**
   *
   */
  public distanceFrom(x: number, y: number): number {
    var distance = Utils.distance(x, y, this.x, this.y);
    //console.log('x,y ' + x + ',' + y + ' to ' + this.getX() + ',' + this.getY() + ' is ' + distance);
    return distance;
  }

  /** Gets the distance from a wall.
   * @param wall A wall.
   * @returns The distance.
   */
  public distanceFromWall(wall: Wall): number {
    return wall.distanceFrom(this.x, this.y);
  }

  /** Gets the distance from a corner.
   * @param corner A corner.
   * @returns The distance.
   */
  public distanceFromCorner(corner: Corner): number {
    return this.distanceFrom(corner.x, corner.y);
  }

  /** Detaches a wall.
   * @param wall A wall.
   */
  public detachWall(wall: Wall) {
    Utils.removeValue(this.wallStarts, wall);
    Utils.removeValue(this.wallEnds, wall);
    if (this.wallStarts.length == 0 && this.wallEnds.length == 0) {
      this.remove();
    }
  }

  /** Attaches a start wall.
   * @param wall A wall.
   */
  public attachStart(wall: Wall) {
    this.wallStarts.push(wall);
  }

  /** Attaches an end wall.
   * @param wall A wall.
   */
  public attachEnd(wall: Wall) {
    this.wallEnds.push(wall);
  }

  /** Get wall to corner.
   * @param corner A corner.
   * @return The associated wall or null.
   */
  public wallTo(corner: Corner): Wall {
    for (var i = 0; i < this.wallStarts.length; i++) {
      if (this.wallStarts[i].getEnd() === corner) {
        return this.wallStarts[i];
      }
    }
    return null;
  }

  /** Get wall from corner.
   * @param corner A corner.
   * @return The associated wall or null.
   */
  public wallFrom(corner: Corner): Wall {
    for (var i = 0; i < this.wallEnds.length; i++) {
      if (this.wallEnds[i].getStart() === corner) {
        return this.wallEnds[i];
      }
    }
    return null;
  }

  /** Get wall to or from corner.
   * @param corner A corner.
   * @return The associated wall or null.
   */
  public wallToOrFrom(corner: Corner): Wall {
    return this.wallTo(corner) || this.wallFrom(corner);
  }

  /**
   *
   */
  private combineWithCorner(corner: Corner) {
    // update position to other corner's
    this.x = corner.x;
    this.y = corner.y;
    // absorb the other corner's wallStarts and wallEnds
    for (var i = corner.wallStarts.length - 1; i >= 0; i--) {
      corner.wallStarts[i].setStart(this);
    }
    for (var i = corner.wallEnds.length - 1; i >= 0; i--) {
      corner.wallEnds[i].setEnd(this);
    }
    // delete the other corner
    corner.removeAll();
    this.removeDuplicateWalls();
    this.floorplan.update();
  }

  public mergeWithIntersected(): boolean {
    //console.log('mergeWithIntersected for object: ' + this.type);
    // check corners
    for (var i = 0; i < this.floorplan.getCorners().length; i++) {
      var corner = this.floorplan.getCorners()[i];
      if (
        this.distanceFromCorner(corner) < cornerTolerance &&
        corner != this
      ) {
        this.combineWithCorner(corner);
        return true;
      }
    }
    // check walls
    for (var i = 0; i < this.floorplan.getWalls().length; i++) {
      var wall = this.floorplan.getWalls()[i];
      if (
        this.distanceFromWall(wall) < cornerTolerance &&
        !this.isWallConnected(wall)
      ) {
        // update position to be on wall
        var intersection = Utils.closestPointOnLine(
          this.x,
          this.y,
          wall.getStart().x,
          wall.getStart().y,
          wall.getEnd().x,
          wall.getEnd().y
        );
        this.x = intersection.x;
        this.y = intersection.y;
        // merge this corner into wall by breaking wall into two parts
        this.floorplan.newWall(this, wall.getEnd());
        wall.setEnd(this);
        this.floorplan.update();
        return true;
      }
    }
    return false;
  }

  /** Ensure we do not have duplicate walls (i.e. same start and end points) */
  private removeDuplicateWalls() {
    // delete the wall between these corners, if it exists
    var wallEndpoints = {};
    var wallStartpoints = {};
    for (var i = this.wallStarts.length - 1; i >= 0; i--) {
      if (this.wallStarts[i].getEnd() === this) {
        // remove zero length wall
        this.wallStarts[i].remove();
      } else if (this.wallStarts[i].getEnd().id in wallEndpoints) {
        // remove duplicated wall
        this.wallStarts[i].remove();
      } else {
        wallEndpoints[this.wallStarts[i].getEnd().id] = true;
      }
    }
    for (var i = this.wallEnds.length - 1; i >= 0; i--) {
      if (this.wallEnds[i].getStart() === this) {
        // removed zero length wall
        this.wallEnds[i].remove();
      } else if (this.wallEnds[i].getStart().id in wallStartpoints) {
        // removed duplicated wall
        this.wallEnds[i].remove();
      } else {
        wallStartpoints[this.wallEnds[i].getStart().id] = true;
      }
    }
  }
}

/** The default wall texture. */
const defaultWallTexture = {
  url: "rooms/textures/wallmap.png",
  stretch: true,
  scale: 0
};

/**
 * A Wall is the basic element to create Rooms.
 *
 * Walls consists of two half edges.
 */
export class Wall {
  /** The unique id of each wall. */
  private id: string;

  /** Front is the plane from start to end. */
  public frontEdge: HalfEdge = null;

  /** Back is the plane from end to start. */
  public backEdge: HalfEdge = null;

  /** */
  public orphan = false;

  /** Items attached to this wall */
  public items: Item[] = [];

  /** */
  public onItems: Item[] = [];

  /** The front-side texture. */
  public frontTexture = defaultWallTexture;

  /** The back-side texture. */
  public backTexture = defaultWallTexture;

  /** Wall thickness. */
  public thickness = Configuration.getNumericValue(
    configWallThickness
  );

  /** Wall height. */
  public height = Configuration.getNumericValue(configWallHeight);

  /** Actions to be applied after movement. */
  private moved_callbacks = $.Callbacks();

  /** Actions to be applied on removal. */
  private deleted_callbacks = $.Callbacks();

  /** Actions to be applied explicitly. */
  private action_callbacks = $.Callbacks();

  /**
   * Constructs a new wall.
   * @param start Start corner.
   * @param end End corner.
   */
  constructor(private start: Corner, private end: Corner) {
    this.id = this.getUuid();

    this.start.attachStart(this);
    this.end.attachEnd(this);
  }

  private getUuid(): string {
    return [this.start.id, this.end.id].join();
  }

  public resetFrontBack() {
    this.frontEdge = null;
    this.backEdge = null;
    this.orphan = false;
  }

  private snapToAxis(tolerance: number) {
    // order here is important, but unfortunately arbitrary
    this.start.snapToAxis(tolerance);
    this.end.snapToAxis(tolerance);
  }

  public fireOnMove(func) {
    this.moved_callbacks.add(func);
  }

  public fireOnDelete(func) {
    this.deleted_callbacks.add(func);
  }

  public dontFireOnDelete(func) {
    this.deleted_callbacks.remove(func);
  }

  public fireOnAction(func) {
    this.action_callbacks.add(func);
  }

  public fireAction(action) {
    this.action_callbacks.fire(action);
  }

  private relativeMove(dx: number, dy: number) {
    this.start.relativeMove(dx, dy);
    this.end.relativeMove(dx, dy);
  }

  public fireMoved() {
    this.moved_callbacks.fire();
  }

  public fireRedraw() {
    if (this.frontEdge) {
      this.frontEdge.redrawCallbacks.fire();
    }
    if (this.backEdge) {
      this.backEdge.redrawCallbacks.fire();
    }
  }

  public getStart(): Corner {
    return this.start;
  }

  public getEnd(): Corner {
    return this.end;
  }

  public getStartX(): number {
    return this.start.getX();
  }

  public getEndX(): number {
    return this.end.getX();
  }

  public getStartY(): number {
    return this.start.getY();
  }

  public getEndY(): number {
    return this.end.getY();
  }

  public remove() {
    this.start.detachWall(this);
    this.end.detachWall(this);
    this.deleted_callbacks.fire(this);
  }

  public setStart(corner: Corner) {
    this.start.detachWall(this);
    corner.attachStart(this);
    this.start = corner;
    this.fireMoved();
  }

  public setEnd(corner: Corner) {
    this.end.detachWall(this);
    corner.attachEnd(this);
    this.end = corner;
    this.fireMoved();
  }

  public distanceFrom(x: number, y: number): number {
    return Utils.pointDistanceFromLine(
      x,
      y,
      this.getStartX(),
      this.getStartY(),
      this.getEndX(),
      this.getEndY()
    );
  }

  /** Return the corner opposite of the one provided.
   * @param corner The given corner.
   * @returns The opposite corner.
   */
  private oppositeCorner(corner: Corner): Corner {
    if (this.start === corner) {
      return this.end;
    } else if (this.end === corner) {
      return this.start;
    } else {
      console.log("Wall does not connect to corner");
    }
  }
}

/**
 * Half Edges are created by Room.
 *
 * Once rooms have been identified, Half Edges are created for each interior wall.
 *
 * A wall can have two half edges if it is visible from both sides.
 */
export class HalfEdge {
  /** The successor edge in CCW ??? direction. */
  public next: HalfEdge;

  /** The predecessor edge in CCW ??? direction. */
  public prev: HalfEdge;

  /** */
  public offset: number;

  /** */
  public height: number;

  /** used for intersection testing... not convinced this belongs here */
  public plane: THREE.Mesh = null;

  /** transform from world coords to wall planes (z=0) */
  public interiorTransform = new THREE.Matrix4();

  /** transform from world coords to wall planes (z=0) */
  public invInteriorTransform = new THREE.Matrix4();

  /** transform from world coords to wall planes (z=0) */
  private exteriorTransform = new THREE.Matrix4();

  /** transform from world coords to wall planes (z=0) */
  private invExteriorTransform = new THREE.Matrix4();

  /** */
  public redrawCallbacks = $.Callbacks();

  /**
   * Constructs a half edge.
   * @param room The associated room.
   * @param wall The corresponding wall.
   * @param front True if front side.
   */
  constructor(private room: Room, public wall: Wall, private front: boolean) {
    this.front = front || false;

    this.offset = wall.thickness / 2.0;
    this.height = wall.height;

    if (this.front) {
      this.wall.frontEdge = this;
    } else {
      this.wall.backEdge = this;
    }
  }

  /**
   *
   */
  public getTexture() {
    if (this.front) {
      return this.wall.frontTexture;
    } else {
      return this.wall.backTexture;
    }
  }

  /**
   *
   */
  public setTexture(
    textureUrl: string,
    textureStretch: boolean,
    textureScale: number
  ) {
    var texture = {
      url: textureUrl,
      stretch: textureStretch,
      scale: textureScale
    };
    if (this.front) {
      this.wall.frontTexture = texture;
    } else {
      this.wall.backTexture = texture;
    }
    this.redrawCallbacks.fire();
  }

  /**
   * this feels hacky, but need wall items
   */
  public generatePlane = function () {
    function transformCorner(corner) {
      return new THREE.Vector3(corner.x, 0, corner.y);
    }

    const v1 = transformCorner(this.interiorStart());
    const v2 = transformCorner(this.interiorEnd());
    const v3 = v2.clone();
    v3.y = this.wall.height;
    const v4 = v1.clone();
    v4.y = this.wall.height;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        v1.x, v1.y, v1.z,
        v2.x, v2.y, v2.z,
        v3.x, v3.y, v3.z,
        v4.x, v4.y, v4.z
    ]), 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    this.plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    this.plane.visible = false;
    this.plane.edge = this; // js monkey patch

    this.computeTransforms(
      this.interiorTransform,
      this.invInteriorTransform,
      this.interiorStart(),
      this.interiorEnd()
    );
    this.computeTransforms(
      this.exteriorTransform,
      this.invExteriorTransform,
      this.exteriorStart(),
      this.exteriorEnd()
    );
  };

  public interiorDistance(): number {
    var start = this.interiorStart();
    var end = this.interiorEnd();
    return Utils.distance(start.x, start.y, end.x, end.y);
  }

  private computeTransforms(transform, invTransform, start, end) {
    var v1 = start;
    var v2 = end;

    var angle = Utils.angle(1, 0, v2.x - v1.x, v2.y - v1.y);

    var tt = new THREE.Matrix4();
    tt.makeTranslation(-v1.x, 0, -v1.y);
    var tr = new THREE.Matrix4();
    tr.makeRotationY(-angle);
    transform.multiplyMatrices(tr, tt);
    invTransform.getInverse(transform);
  }

  /** Gets the distance from specified point.
   * @param x X coordinate of the point.
   * @param y Y coordinate of the point.
   * @returns The distance.
   */
  public distanceTo(x: number, y: number): number {
    // x, y, x1, y1, x2, y2
    return Utils.pointDistanceFromLine(
      x,
      y,
      this.interiorStart().x,
      this.interiorStart().y,
      this.interiorEnd().x,
      this.interiorEnd().y
    );
  }

  private getStart() {
    if (this.front) {
      return this.wall.getStart();
    } else {
      return this.wall.getEnd();
    }
  }

  private getEnd() {
    if (this.front) {
      return this.wall.getEnd();
    } else {
      return this.wall.getStart();
    }
  }

  private getOppositeEdge(): HalfEdge {
    if (this.front) {
      return this.wall.backEdge;
    } else {
      return this.wall.frontEdge;
    }
  }

  // these return an object with attributes x, y
  public interiorEnd(): { x: number; y: number } {
    var vec = this.halfAngleVector(this, this.next);
    return {
      x: this.getEnd().x + vec.x,
      y: this.getEnd().y + vec.y
    };
  }

  public interiorStart(): { x: number; y: number } {
    var vec = this.halfAngleVector(this.prev, this);
    return {
      x: this.getStart().x + vec.x,
      y: this.getStart().y + vec.y
    };
  }

  public interiorCenter(): { x: number; y: number } {
    return {
      x: (this.interiorStart().x + this.interiorEnd().x) / 2.0,
      y: (this.interiorStart().y + this.interiorEnd().y) / 2.0
    };
  }

  public exteriorEnd(): { x: number; y: number } {
    var vec = this.halfAngleVector(this, this.next);
    return {
      x: this.getEnd().x - vec.x,
      y: this.getEnd().y - vec.y
    };
  }

  public exteriorStart(): { x: number; y: number } {
    var vec = this.halfAngleVector(this.prev, this);
    return {
      x: this.getStart().x - vec.x,
      y: this.getStart().y - vec.y
    };
  }

  /** Get the corners of the half edge.
   * @returns An array of x,y pairs.
   */
  public corners(): { x: number; y: number }[] {
    return [
      this.interiorStart(),
      this.interiorEnd(),
      this.exteriorEnd(),
      this.exteriorStart()
    ];
  }

  /**
   * Gets CCW angle from v1 to v2
   */
  private halfAngleVector(
    v1: HalfEdge,
    v2: HalfEdge
  ): { x: number; y: number } {
    // make the best of things if we dont have prev or next
    if (!v1) {
      var v1startX = v2.getStart().x - (v2.getEnd().x - v2.getStart().x);
      var v1startY = v2.getStart().y - (v2.getEnd().y - v2.getStart().y);
      var v1endX = v2.getStart().x;
      var v1endY = v2.getStart().y;
    } else {
      var v1startX = <number>v1.getStart().x;
      var v1startY = <number>v1.getStart().y;
      var v1endX = v1.getEnd().x;
      var v1endY = v1.getEnd().y;
    }

    if (!v2) {
      var v2startX = v1.getEnd().x;
      var v2startY = v1.getEnd().y;
      var v2endX = v1.getEnd().x + (v1.getEnd().x - v1.getStart().x);
      var v2endY = v1.getEnd().y + (v1.getEnd().y - v1.getStart().y);
    } else {
      var v2startX = v2.getStart().x;
      var v2startY = v2.getStart().y;
      var v2endX = v2.getEnd().x;
      var v2endY = v2.getEnd().y;
    }

    // CCW angle between edges
    var theta = Utils.angle2pi(
      v1startX - v1endX,
      v1startY - v1endY,
      v2endX - v1endX,
      v2endY - v1endY
    );

    // cosine and sine of half angle
    var cs = Math.cos(theta / 2.0);
    var sn = Math.sin(theta / 2.0);

    // rotate v2
    var v2dx = v2endX - v2startX;
    var v2dy = v2endY - v2startY;

    var vx = v2dx * cs - v2dy * sn;
    var vy = v2dx * sn + v2dy * cs;

    // normalize
    var mag = Utils.distance(0, 0, vx, vy);
    var desiredMag = this.offset / sn;
    var scalar = desiredMag / mag;

    var halfAngleVector = {
      x: vx * scalar,
      y: vy * scalar
    };

    return halfAngleVector;
  }
}

/** Default texture to be used if nothing is provided. */
const defaultRoomTexture = {
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

  private getUuid(): string {
    var cornerUuids = Utils.map(this.corners, function (c) {
      return c.id;
    });
    cornerUuids.sort();
    return cornerUuids.join();
  }

  public fireOnFloorChange(callback) {
    this.floorChangeCallbacks.add(callback);
  }

  private getTexture() {
    var uuid = this.getUuid();
    var tex = this.floorplan.getFloorTexture(uuid);
    return tex || defaultRoomTexture;
  }

  /**
   * textureStretch always true, just an argument for consistency with walls
   */
  private setTexture(
    textureUrl: string,
    textureStretch,
    textureScale: number
  ) {
    var uuid = this.getUuid();
    this.floorplan.setFloorTexture(uuid, textureUrl, textureScale);
    this.floorChangeCallbacks.fire();
  }

  private generatePlane() {
    const points: THREE.Vector2[] = [];
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
    (<any>this.floorPlane).room = this; // js monkey patch
  }

  private cycleIndex(index) {
    if (index < 0) {
      return (index += this.corners.length);
    } else {
      return index % this.corners.length;
    }
  }

  private updateInteriorCorners() {
    var edge = this.edgePointer;
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
    var prevEdge = null;
    var firstEdge = null;

    for (var i = 0; i < this.corners.length; i++) {
      var firstCorner = this.corners[i];
      var secondCorner = this.corners[(i + 1) % this.corners.length];

      // find if wall is heading in that direction
      var wallTo = firstCorner.wallTo(secondCorner);
      var wallFrom = firstCorner.wallFrom(secondCorner);

      if (wallTo) {
        var edge = new HalfEdge(this, wallTo, true);
      } else if (wallFrom) {
        var edge = new HalfEdge(this, wallFrom, false);
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

/** */
const defaultFloorPlanTolerance = 10.0;

/**
 * A Floorplan represents a number of Walls, Corners and Rooms.
 */
export class Floorplan {
  /** */
  private walls: Wall[] = [];

  /** */
  private corners: Corner[] = [];

  /** */
  private rooms: Room[] = [];

  /** */
  private new_wall_callbacks = $.Callbacks();

  /** */
  private new_corner_callbacks = $.Callbacks();

  /** */
  private redraw_callbacks = $.Callbacks();

  /** */
  private updated_rooms = $.Callbacks();

  /** */
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

  /** Removes a wall.
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
  public newCorner(x: number, y: number, id?: string): Corner {
    var corner = new Corner(this, x, y, id);
    this.corners.push(corner);
    corner.fireOnDelete(() => {
      this.removeCorner;
    });
    this.new_corner_callbacks.fire(corner);
    return corner;
  }

  /** Removes a corner.
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
    var uuids = Utils.map(this.rooms, function (room) {
      return room.getUuid();
    });
    for (var uuid in this.floorTextures) {
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
        var back = new HalfEdge(null, wall, false);
        back.generatePlane();
        var front = new HalfEdge(null, wall, true);
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
        // rooms are cycles, shift it around to check uniqueness
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
    var uniqueCCWLoops = Utils.removeIf(
      uniqueLoops,
      Utils.isClockwise
    );

    return uniqueCCWLoops;
  }
}

/**
 * The Scene is a manager of Items and also links to a ThreeJS scene.
 */
export class Scene {
  /** The associated ThreeJS scene. */
  private scene: THREE.Scene;

  /** */
  private items: Item[] = [];

  /** */
  public needsUpdate = false;

  /** The Json loader. */
  private loader: ObjectLoader;

  /** */
  private itemLoadingCallbacks = $.Callbacks();

  /** Item */
  private itemLoadedCallbacks = $.Callbacks();

  /** Item */
  private itemRemovedCallbacks = $.Callbacks();

  /**
   * Constructs a scene.
   * @param model The associated model.
   * @param textureDir The directory from which to load the textures.
   */
  constructor(private model: Model, private textureDir: string) {
    this.scene = new THREE.Scene();

    // init item loader
    this.loader = new ObjectLoader();
    this.loader.crossOrigin = "";
  }

  /** Adds a non-item, basically a mesh, to the scene.
   * @param mesh The mesh to be added.
   */
  public add(mesh: THREE.Mesh) {
    this.scene.add(mesh);
  }

  /** Removes a non-item, basically a mesh, from the scene.
   * @param mesh The mesh to be removed.
   */
  public remove(mesh: THREE.Mesh) {
    this.scene.remove(mesh);
    Utils.removeValue(this.items, mesh);
  }

  /** Gets the scene.
   * @returns The scene.
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /** Gets the items.
   * @returns The items.
   */
  public getItems(): Item[] {
    return this.items;
  }

  /** Gets the count of items.
   * @returns The count.
   */
  public itemCount(): number {
    return this.items.length;
  }

  /** Removes all items. */
  public clearItems() {
    var items_copy = this.items;
    var scope = this;
    this.items.forEach(item => {
      scope.removeItem(item, true);
    });
    this.items = [];
  }

  /**
   * Removes an item.
   * @param item The item to be removed.
   * @param dontRemove If not set, also remove the item from the items list.
   */
  public removeItem(item: Item, dontRemove?: boolean) {
    dontRemove = dontRemove || false;
    // use this for item meshes
    this.itemRemovedCallbacks.fire(item);
    item.removed();
    this.scene.remove(item);
    if (!dontRemove) {
      Utils.removeValue(this.items, item);
    }
  }

  /**
   * Creates an item and adds it to the scene.
   * @param itemType The type of the item given by an enumerator.
   * @param fileName The name of the file to load.
   * @param metadata TODO
   * @param position The initial position.
   * @param rotation The initial rotation around the y axis.
   * @param scale The initial scaling.
   * @param fixed True if fixed.
   */
  public addItem(
    itemType: number,
    fileName: string,
    metadata,
    position: Vector3,
    rotation: number,
    scale: Vector3,
    fixed: boolean
  ) {
    itemType = itemType || 1;
    const scope = this;
    const loaderCallback = function (
      loadedObject: Mesh
    ) {
      const geometry = loadedObject.geometry;
      const material = loadedObject.material;
      const item = new (Factory.getClass(itemType))(
        scope.model,
        metadata,
        geometry as any,
        material,
        position,
        rotation,
        scale
      );
      item.fixed = fixed || false;
      scope.items.push(item);
      scope.add(item);
      item.initObject();
      scope.itemLoadedCallbacks.fire(item);
    };

    this.itemLoadingCallbacks.fire();
    this.loader.load(
      fileName,
      loaderCallback,
    );
  }
}

/**
 * A Model connects a Floorplan and a Scene.
 */
export class Model {
  /** */
  public floorplan: Floorplan;

  /** */
  public scene: Scene;

  /** */
  private roomLoadingCallbacks = $.Callbacks();

  /** */
  private roomLoadedCallbacks = $.Callbacks();

  /** name */
  private roomSavedCallbacks = $.Callbacks();

  /** success (bool), copy (bool) */
  private roomDeletedCallbacks = $.Callbacks();

  /** Constructs a new model.
   * @param textureDir The directory containing the textures.
   */
  constructor(textureDir: string) {
    this.floorplan = new Floorplan();
    this.scene = new Scene(this, textureDir);
  }

  public loadSerialized(json: string) {
    // TODO: better documentation on serialization format.
    // TODO: a much better serialization format.
    this.roomLoadingCallbacks.fire();

    const data = JSON.parse(json);
    this.newRoom(data.floorplan, data.items);

    this.roomLoadedCallbacks.fire();
  }

  public exportSerialized(): string {
    const items_arr = [];
    const objects = this.scene.getItems();
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      items_arr[i] = {
        item_name: object.metadata.itemName,
        item_type: object.metadata.itemType,
        model_url: object.metadata.modelUrl,
        xpos: (object as any).position.x,
        ypos: (object as any).position.y,
        zpos: (object as any).position.z,
        rotation: (object as any).rotation.y,
        scale_x: (object as any).scale.x,
        scale_y: (object as any).scale.y,
        scale_z: (object as any).scale.z,
        fixed: (object as any).fixed
      };
    }

    const room = {
      floorplan: this.floorplan.saveFloorplan(),
      items: items_arr
    };

    return JSON.stringify(room);
  }

  public newRoom(floorplan: string, items) {
    this.scene.clearItems();
    this.floorplan.loadFloorplan(floorplan);
    items.forEach(item => {
      const position = new Vector3(item.xpos, item.ypos, item.zpos);
      const metadata = {
        itemName: item.item_name,
        resizable: item.resizable,
        itemType: item.item_type,
        modelUrl: item.model_url
      };
      const scale = new Vector3(item.scale_x, item.scale_y, item.scale_z);
      this.scene.addItem(
        item.item_type,
        item.model_url,
        metadata,
        position,
        item.rotation,
        scale,
        item.fixed
      );
    });
  }
}
