import * as THREE from 'three';
import { Utils } from '../core/utils';
import { Scene } from '../model/scene';
import { Room } from '../model/room';

export class Floor {
  private scene: Scene;
  private room: Room;
  private floorPlane: THREE.Mesh = null;
  private roofPlane: THREE.Mesh = null;

  constructor(scene: Scene, room: Room) {
    this.scene = scene;
    this.room = room;
    this.init();
  }

  private init() {
    this.room.fireOnFloorChange(this.redraw.bind(this));
    this.floorPlane = this.buildFloor();
  }

  private redraw() {
    this.removeFromScene();
    this.floorPlane = this.buildFloor();
    this.addToScene();
  }

  private buildFloor(): THREE.Mesh {
    var textureSettings = this.room.getTexture();
    var floorTexture = THREE.ImageUtils.loadTexture(textureSettings.url);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(1, 1);
    var floorMaterialTop = new THREE.MeshPhongMaterial({
      map: floorTexture,
      side: THREE.DoubleSide,
      color: 0xcccccc,
      specular: 0x0a0a0a
    });

    var textureScale = textureSettings.scale;

    var points = [];
    this.room.interiorCorners.forEach((corner) => {
      points.push(new THREE.Vector2(
        corner.x / textureScale,
        corner.y / textureScale));
    });
    var shape = new THREE.Shape(points);

    var geometry = new THREE.ShapeGeometry(shape);

    var floor = new THREE.Mesh(geometry, floorMaterialTop);

    floor.rotation.set(Math.PI / 2, 0, 0);
    floor.scale.set(textureScale, textureScale, textureScale);
    floor.receiveShadow = true;
    floor.castShadow = false;
    return floor;
  }

  private buildRoof(): THREE.Mesh {
    var roofMaterial = new THREE.MeshBasicMaterial({
      side: THREE.FrontSide,
      color: 0xe5e5e5
    });

    var points = [];
    this.room.interiorCorners.forEach((corner) => {
      points.push(new THREE.Vector2(
        corner.x,
        corner.y));
    });
    var shape = new THREE.Shape(points);
    var geometry = new THREE.ShapeGeometry(shape);
    var roof = new THREE.Mesh(geometry, roofMaterial);

    roof.rotation.set(Math.PI / 2, 0, 0);
    roof.position.y = 250;
    return roof;
  }

  public addToScene() {
    this.scene.add(this.floorPlane);
    this.scene.add(this.room.floorPlane);
  }

  public removeFromScene() {
    this.scene.remove(this.floorPlane);
    this.scene.remove(this.room.floorPlane);
  }
}
