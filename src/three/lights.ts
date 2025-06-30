import * as THREE from 'three';
import { Floorplan } from '../model/floorplan';
import { Scene } from '../model/scene';

export class Lights {
  private scene: Scene;
  private floorplan: Floorplan;
  private dirLight: THREE.DirectionalLight;

  private tol = 1;
  private height = 300;

  constructor(scene: Scene, floorplan: Floorplan) {
    this.scene = scene;
    this.floorplan = floorplan;
    this.init();
  }

  public getDirLight(): THREE.DirectionalLight {
    return this.dirLight;
  }

  private init() {
    var light = new THREE.HemisphereLight(0xffffff, 0x888888, 1.1);
    light.position.set(0, this.height, 0);
    this.scene.add(light);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0);
    this.dirLight.color.setHSL(1, 1, 0.1);

    this.dirLight.castShadow = false;

    this.dirLight.castShadow = true;

    // this.dirLight.shadow.mapSize.width = 1024;
    // this.dirLight.shadow.mapSize.height = 1024;

    // this.dirLight.shadow.camera.far = this.height + this.tol;
    // this.dirLight.shadow.bias = -0.0001;
    // this.dirLight.shadow.darkness = 0.2;
    this.dirLight.visible = true;
    //this.dirLight.shadow.cameraVisible = false;

    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    this.floorplan.fireOnUpdatedRooms(this.updateShadowCamera.bind(this));
  }

  private updateShadowCamera() {
    var size = this.floorplan.getSize();
    var d = (Math.max(size.z, size.x) + this.tol) / 2.0;

    var center = this.floorplan.getCenter();
    var pos = new THREE.Vector3(
      center.x, this.height, center.z);
    this.dirLight.position.copy(pos);
    this.dirLight.target.position.copy(center);

    this.dirLight.shadowCameraLeft = -d;
    this.dirLight.shadowCameraRight = d;
    this.dirLight.shadowCameraTop = d;
    this.dirLight.shadowCameraBottom = -d;

    if (this.dirLight.shadowCamera) {
      this.dirLight.shadowCamera.updateProjectionMatrix();
    }
  }
}