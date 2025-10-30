import * as THREE from 'three';
import { EventEmitter } from '../core/event_emitter';
import { Utils } from '../core/utils';
import { Wall } from './wall';
import { Room } from './room';

export class HalfEdge extends EventEmitter {
  public next: HalfEdge;
  public prev: HalfEdge;
  public offset: number;
  public height: number;
  public plane: THREE.Mesh = null;
  public interiorTransform = new THREE.Matrix4();
  public invInteriorTransform = new THREE.Matrix4();
  private exteriorTransform = new THREE.Matrix4();
  private invExteriorTransform = new THREE.Matrix4();
  public redrawCallbacks = {
    add: (listener: () => void) => this.on('redraw', listener),
    fire: () => this.emit('redraw')
  };

  constructor(private room: Room, public wall: Wall, private front: boolean) {
    super();
    this.front = front || false;
    this.offset = wall.thickness / 2.0;
    this.height = wall.height;

    if (this.front) {
      this.wall.frontEdge = this;
    } else {
      this.wall.backEdge = this;
    }
  }

  public getTexture() {
    if (this.front) {
      return this.wall.frontTexture;
    } else {
      return this.wall.backTexture;
    }
  }

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

  public generatePlane = function () {
    function transformCorner(corner) {
      return new THREE.Vector3(corner.x, 0, corner.y);
    }

    var v1 = transformCorner(this.interiorStart());
    var v2 = transformCorner(this.interiorEnd());
    var v3 = v2.clone();
    v3.y = this.wall.height;
    var v4 = v1.clone();
    v4.y = this.wall.height;

    var geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      v1.x, v1.y, v1.z,
      v2.x, v2.y, v2.z,
      v3.x, v3.y, v3.z,

      v3.x, v3.y, v3.z,
      v4.x, v4.y, v4.z,
      v1.x, v1.y, v1.z,
    ]);

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
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

  public distanceTo(x: number, y: number): number {
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

  public corners(): { x: number; y: number }[] {
    return [
      this.interiorStart(),
      this.interiorEnd(),
      this.exteriorEnd(),
      this.exteriorStart()
    ];
  }

  private halfAngleVector(
    v1: HalfEdge,
    v2: HalfEdge
  ): { x: number; y: number } {
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

    var theta = Utils.angle2pi(
      v1startX - v1endX,
      v1startY - v1endY,
      v2endX - v1endX,
      v2endY - v1endY
    );

    var cs = Math.cos(theta / 2.0);
    var sn = Math.sin(theta / 2.0);

    var v2dx = v2endX - v2startX;
    var v2dy = v2endY - v2startY;

    var vx = v2dx * cs - v2dy * sn;
    var vy = v2dx * sn + v2dy * cs;

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
