import * as THREE from 'three';
import * as Utils from '../core/utils';

export var Edge = function (scene, edge, controls) {
  var scope = this;
  var scene = scene;
  var edge = edge;
  var controls = controls;
  var wall = edge.wall;
  var front = edge.front;

  var planes = [];
  var basePlanes = []; // always visible
  var texture = null;
  var lightMap = new THREE.TextureLoader().load(
    'rooms/textures/walllightmap.png'
  );
  var fillerColor = 0xdddddd;
  var sideColor = 0xcccccc;
  var baseColor = 0xdddddd;

  this.visible = false;

  this.remove = function () {
    edge.redrawCallbacks.remove(redraw);
    controls.cameraMovedCallbacks.remove(updateVisibility);
    removeFromScene();
  };

  function init() {
    edge.redrawCallbacks.add(redraw);
    controls.cameraMovedCallbacks.add(updateVisibility);
    updateTexture();
    updatePlanes();
    addToScene();
  }

  function redraw() {
    removeFromScene();
    updateTexture();
    updatePlanes();
    addToScene();
  }

  function removeFromScene() {
    planes.forEach(plane => {
      scene.remove(plane);
    });
    basePlanes.forEach(plane => {
      scene.remove(plane);
    });
    planes = [];
    basePlanes = [];
  }

  function addToScene() {
    planes.forEach(plane => {
      scene.add(plane);
    });
    basePlanes.forEach(plane => {
      scene.add(plane);
    });
    updateVisibility();
  }

  function updateVisibility() {
    // finds the normal from the specified edge
    var start = edge.interiorStart();
    var end = edge.interiorEnd();
    var x = end.x - start.x;
    var y = end.y - start.y;
    // rotate 90 degrees CCW
    var normal = new THREE.Vector3(-y, 0, x);
    normal.normalize();

    // setup camera
    var position = controls.object.position.clone();
    var focus = new THREE.Vector3(
      (start.x + end.x) / 2.0,
      0,
      (start.y + end.y) / 2.0
    );
    var direction = position.sub(focus).normalize();

    // find dot
    var dot = normal.dot(direction);

    // update visible
    scope.visible = dot >= 0;

    // show or hide plans
    planes.forEach(plane => {
      plane.visible = scope.visible;
    });

    updateObjectVisibility();
  }

  function updateObjectVisibility() {
    wall.items.forEach(item => {
      item.updateEdgeVisibility(scope.visible, front);
    });
    wall.onItems.forEach(item => {
      item.updateEdgeVisibility(scope.visible, front);
    });
  }

  function updateTexture(callback?) {
    // callback is fired when texture loads
    callback =
      callback ||
      function () {
        scene.needsUpdate = true;
      };
    var textureData = edge.getTexture();
    var stretch = textureData.stretch;
    var url = textureData.url;
    var scale = textureData.scale;
    texture = new THREE.TextureLoader().load(url, callback);
    if (!stretch) {
      var height = wall.height;
      var width = edge.interiorDistance();
      texture.wrapT = THREE.RepeatWrapping;
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.set(width / scale, height / scale);
      texture.needsUpdate = true;
    }
  }

  function updatePlanes() {
    var wallMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      // ambientColor: 0xffffff, TODO_Ekki
      //ambient: scope.wall.color,
      side: THREE.FrontSide,
      map: texture
      // lightMap: lightMap TODO_Ekki
    });

    var fillerMaterial = new THREE.MeshBasicMaterial({
      color: fillerColor,
      side: THREE.DoubleSide
    });

    // exterior plane
    planes.push(
      makeWall(
        edge.exteriorStart(),
        edge.exteriorEnd(),
        edge.exteriorTransform,
        edge.invExteriorTransform,
        fillerMaterial
      )
    );

    // interior plane
    planes.push(
      makeWall(
        edge.interiorStart(),
        edge.interiorEnd(),
        edge.interiorTransform,
        edge.invInteriorTransform,
        wallMaterial
      )
    );

    // bottom
    // put into basePlanes since this is always visible
    basePlanes.push(buildFiller(edge, 0, THREE.BackSide, baseColor));

    // top
    planes.push(
      buildFiller(edge, wall.height, THREE.DoubleSide, fillerColor)
    );

    // sides
    planes.push(
      buildSideFillter(
        edge.interiorStart(),
        edge.exteriorStart(),
        wall.height,
        sideColor
      )
    );

    planes.push(
      buildSideFillter(
        edge.interiorEnd(),
        edge.exteriorEnd(),
        wall.height,
        sideColor
      )
    );
  }

  // start, end have x and y attributes (i.e. corners)
  function makeWall(start, end, transform, invTransform, material) {
    var v1 = toVec3(start);
    var v2 = toVec3(end);
    var v3 = v2.clone();
    v3.y = wall.height;
    var v4 = v1.clone();
    v4.y = wall.height;

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

    // add holes for each wall item
    wall.items.forEach(item => {
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
    geometry.applyMatrix4(invTransform);

    // make UVs
    var totalDistance = Utils.distance(v1.x, v1.z, v2.x, v2.z);
    var height = wall.height;

    var uvs = geometry.attributes.uv;
    var positions = geometry.attributes.position;

    for (var i = 0; i < positions.count; i++) {
      let vertex = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      var x =
        Utils.distance(v1.x, v1.z, vertex.x, vertex.z) / totalDistance;
      var y = vertex.y / height;
      uvs.setXY(i, x, y);
    }
    uvs.needsUpdate = true;

    geometry.computeVertexNormals();

    var mesh = new THREE.Mesh(geometry, material);

    return mesh;
  }

  function buildSideFillter(p1, p2, height, color) {
    var vertices = [
      toVec3(p1),
      toVec3(p2),
      toVec3(p2, height),
      toVec3(p1, height)
    ];

    var geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(18);
    positions.set(vertices[0].toArray(), 0);
    positions.set(vertices[1].toArray(), 3);
    positions.set(vertices[2].toArray(), 6);
    positions.set(vertices[0].toArray(), 9);
    positions.set(vertices[2].toArray(), 12);
    positions.set(vertices[3].toArray(), 15);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeVertexNormals();

    var fillerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide
    });

    var filler = new THREE.Mesh(geometry, fillerMaterial);
    return filler;
  }

  function buildFiller(edge, height, side, color) {
    var points = [
      toVec2(edge.exteriorStart()),
      toVec2(edge.exteriorEnd()),
      toVec2(edge.interiorEnd()),
      toVec2(edge.interiorStart())
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

  function toVec2(pos) {
    return new THREE.Vector2(pos.x, pos.y);
  }

  function toVec3(pos, height?) {
    height = height || 0;
    return new THREE.Vector3(pos.x, height, pos.y);
  }

  init();
}
