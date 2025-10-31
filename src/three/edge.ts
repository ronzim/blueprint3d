import * as THREE from 'three';
import { Utils } from '../core/utils';
import { HalfEdge } from '../model/half_edge';
import { Scene } from '../model/scene';
import { Controls } from './controls';

export class Edge {
  private scene: Scene;
  private edge: HalfEdge;
  private controls: Controls;
  private wall: any;
  private front: boolean;

  private planes: THREE.Mesh[] = [];
  private basePlanes: THREE.Mesh[] = [];
  private texture: THREE.Texture = null;

  private lightMap = new THREE.TextureLoader().load(
    "rooms/textures/walllightmap.png"
  );
  private fillerColor = 0xdddddd;
  private sideColor = 0xcccccc;
  private baseColor = 0xdddddd;

  public visible = false;

  constructor(scene: Scene, edge: HalfEdge, controls: Controls) {
    this.scene = scene;
    this.edge = edge;
    this.controls = controls;
    this.wall = edge.wall;
    this.front = edge.front;

    this.init();
  }

  public remove() {
    this.edge.redrawCallbacks.remove(this.redraw.bind(this));
    this.controls.cameraMovedCallbacks.remove(this.updateVisibility.bind(this));
    this.removeFromScene();
  }

  private init() {
    this.edge.redrawCallbacks.add(this.redraw.bind(this));
    this.controls.cameraMovedCallbacks.add(this.updateVisibility.bind(this));
    this.updateTexture();
    this.updatePlanes();
    this.addToScene();
  }

  private redraw() {
    this.removeFromScene();
    this.updateTexture();
    this.updatePlanes();
    this.addToScene();
  }

  private removeFromScene() {
    this.planes.forEach(plane => {
      this.scene.remove(plane);
    });
    this.basePlanes.forEach(plane => {
      this.scene.remove(plane);
    });
    this.planes = [];
    this.basePlanes = [];
  }

  private addToScene() {
    this.planes.forEach(plane => {
      this.scene.add(plane);
    });
    this.basePlanes.forEach(plane => {
      this.scene.add(plane);
    });
    this.updateVisibility();
  }

  private updateVisibility() {
    var start = this.edge.interiorStart();
    var end = this.edge.interiorEnd();
    var x = end.x - start.x;
    var y = end.y - start.y;
    var normal = new THREE.Vector3(-y, 0, x);
    normal.normalize();

    var position = this.controls.object.position.clone();
    var focus = new THREE.Vector3(
      (start.x + end.x) / 2.0,
      0,
      (start.y + end.y) / 2.0
    );
    var direction = position.sub(focus).normalize();

    var dot = normal.dot(direction);

    this.visible = dot >= 0;

    this.planes.forEach(plane => {
      plane.visible = this.visible;
    });

    this.updateObjectVisibility();
  }

  private updateObjectVisibility() {
    this.wall.items.forEach(item => {
      item.updateEdgeVisibility(this.visible, this.front);
    });
    this.wall.onItems.forEach(item => {
      item.updateEdgeVisibility(this.visible, this.front);
    });
  }

  private updateTexture(callback?: Function) {
    callback =
      callback ||
      function () {
        this.scene.needsUpdate = true;
      }.bind(this);
    var textureData = this.edge.getTexture();
    var stretch = textureData.stretch;
    var url = textureData.url;
    var scale = textureData.scale;
    this.texture = new THREE.TextureLoader().load(url, callback);
    if (!stretch) {
      var height = this.wall.height;
      var width = this.edge.interiorDistance();
      this.texture.wrapT = THREE.RepeatWrapping;
      this.texture.wrapS = THREE.RepeatWrapping;
      this.texture.repeat.set(width / scale, height / scale);
      this.texture.needsUpdate = true;
    }
  }

  private updatePlanes() {
    var wallMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
      map: this.texture
    });

    var fillerMaterial = new THREE.MeshBasicMaterial({
      color: this.fillerColor,
      side: THREE.DoubleSide
    });

    this.planes.push(
      this.makeWall(
        this.edge.exteriorStart(),
        this.edge.exteriorEnd(),
        this.edge.exteriorTransform,
        this.edge.invExteriorTransform,
        fillerMaterial
      )
    );

    this.planes.push(
      this.makeWall(
        this.edge.interiorStart(),
        this.edge.interiorEnd(),
        this.edge.interiorTransform,
        this.edge.invInteriorTransform,
        wallMaterial
      )
    );

    this.basePlanes.push(this.buildFiller(this.edge, 0, THREE.BackSide, this.baseColor));

    this.planes.push(
      this.buildFiller(this.edge, this.wall.height, THREE.DoubleSide, this.fillerColor)
    );

    this.planes.push(
      this.buildSideFillter(
        this.edge.interiorStart(),
        this.edge.exteriorStart(),
        this.wall.height,
        this.sideColor
      )
    );

    this.planes.push(
      this.buildSideFillter(
        this.edge.interiorEnd(),
        this.edge.exteriorEnd(),
        this.wall.height,
        this.sideColor
      )
    );
  }

  private makeWall(start, end, transform, invTransform, material) {
    var v1 = this.toVec3(start);
    var v2 = this.toVec3(end);
    var v3 = v2.clone();
    v3.y = this.wall.height;
    var v4 = v1.clone();
    v4.y = this.wall.height;

    var points = [v1.clone(), v2.clone(), v3.clone(), v4.clone()];

    points.forEach(p => {
      p.applyMatrix4(transform);
    });

    var shape = new THREE.Shape([
      new THREE.Vector2(points[0].x, points[0].y),
      new THREE.Vector2(points[1].x, points[1].y),
      new THREE.Vector2(points[2].x, points[2].y),
      new THREE.Vector2(points[3].x, points[3].y)
    ]);

    this.wall.items.forEach(item => {
      var pos = item.position.clone();
      pos.applyMatrix4(transform);
      var halfSize = item.halfSize;
      var min = halfSize.clone().multiplyScalar(-1);
      var max = halfSize.clone();
      min.add(pos);
      max.add(pos);

      var holePoints = [
        new THREE.Vector2(min.x, min.y),
        new THREE.Vector2(max.x, min.y),
        new THREE.Vector2(max.x, max.y),
        new THREE.Vector2(min.x, max.y)
      ];

      shape.holes.push(new THREE.Path(holePoints));
    });

    var geometry = new THREE.ShapeGeometry(shape);

    geometry.vertices.forEach(v => {
      v.applyMatrix4(invTransform);
    });

    var totalDistance = Utils.distance(v1.x, v1.z, v2.x, v2.z);
    var height = this.wall.height;
    geometry.faceVertexUvs[0] = [];

    function vertexToUv(vertex) {
      var x =
        Utils.distance(v1.x, v1.z, vertex.x, vertex.z) / totalDistance;
      var y = vertex.y / height;
      return new THREE.Vector2(x, y);
    }

    geometry.faces.forEach(face => {
      var vertA = geometry.vertices[face.a];
      var vertB = geometry.vertices[face.b];
      var vertC = geometry.vertices[face.c];
      geometry.faceVertexUvs[0].push([
        vertexToUv(vertA),
        vertexToUv(vertB),
        vertexToUv(vertC)
      ]);
    });

    geometry.faceVertexUvs[1] = geometry.faceVertexUvs[0];

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    var mesh = new THREE.Mesh(geometry, material);

    return mesh;
  }

  private buildSideFillter(p1, p2, height, color) {
    var points = [
      this.toVec3(p1),
      this.toVec3(p2),
      this.toVec3(p2, height),
      this.toVec3(p1, height)
    ];

    var geometry = new THREE.Geometry();
    points.forEach(p => {
      geometry.vertices.push(p);
    });
    geometry.faces.push(new THREE.Face3(0, 1, 2));
    geometry.faces.push(new THREE.Face3(0, 2, 3));

    var fillerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide
    });

    var filler = new THREE.Mesh(geometry, fillerMaterial);
    return filler;
  }

  private buildFiller(edge: HalfEdge, height: number, side: THREE.Side, color: number) {
    var points = [
      this.toVec2(edge.exteriorStart()),
      this.toVec2(edge.exteriorEnd()),
      this.toVec2(edge.interiorEnd()),
      this.toVec2(edge.interiorStart())
    ];

    var fillerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: side
    });

    var shape = new THREE.Shape(points);
    var geometry = new THREE.ShapeGeometry(shape);

    var filler = new THREE.Mesh(geometry, fillerMaterial);
    filler.rotation.set(Math.PI / 2, 0, 0);
    filler.position.y = height;
    return filler;
  }

  private toVec2(pos: { x: number; y: number }): THREE.Vector2 {
    return new THREE.Vector2(pos.x, pos.y);
  }

  private toVec3(pos: { x: number; y: number }, height?: number): THREE.Vector3 {
    height = height || 0;
    return new THREE.Vector3(pos.x, height, pos.y);
  }
}
