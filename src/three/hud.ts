import * as THREE from 'three';
import { Utils } from '../core/utils';
import { Main } from './main';

export class HUD {
  private three: Main;
  private scene: THREE.Scene;
  private selectedItem: any = null;
  private rotating = false;
  private mouseover = false;

  private tolerance = 10;
  private height = 5;
  private distance = 20;
  private color = "#ffffff";
  private hoverColor = "#f1c40f";

  private activeObject: any = null;

  constructor(three: Main) {
    this.three = three;
    this.scene = new THREE.Scene();
    this.init();
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getObject(): any {
    return this.activeObject;
  }

  private init() {
    this.three.itemSelectedCallbacks.add(this.itemSelected.bind(this));
    this.three.itemUnselectedCallbacks.add(this.itemUnselected.bind(this));
  }

  private resetSelectedItem() {
    this.selectedItem = null;
    if (this.activeObject) {
      this.scene.remove(this.activeObject);
      this.activeObject = null;
    }
  }

  private itemSelected(item) {
    if (this.selectedItem != item) {
      this.resetSelectedItem();
      if (item.allowRotate && !item.fixed) {
        this.selectedItem = item;
        this.activeObject = this.makeObject(this.selectedItem);
        this.scene.add(this.activeObject);
      }
    }
  }

  private itemUnselected() {
    this.resetSelectedItem();
  }

  public setRotating(isRotating: boolean) {
    this.rotating = isRotating;
    this.setColor();
  }

  public setMouseover(isMousedOver: boolean) {
    this.mouseover = isMousedOver;
    this.setColor();
  }

  private setColor() {
    if (this.activeObject) {
      this.activeObject.children.forEach((obj) => {
        (<THREE.MeshBasicMaterial>obj.material).color.set(this.getColor());
      });
    }
    this.three.needsUpdate();
  }

  private getColor(): string {
    return (this.mouseover || this.rotating) ? this.hoverColor : this.color;
  }

  public update() {
    if (this.activeObject) {
      this.activeObject.rotation.y = this.selectedItem.rotation.y;
      this.activeObject.position.x = this.selectedItem.position.x;
      this.activeObject.position.z = this.selectedItem.position.z;
    }
  }

  private makeLineGeometry(item: any): THREE.BufferGeometry {
    var geometry = new THREE.BufferGeometry();

    geometry.setFromPoints(
      [new THREE.Vector3(0, 0, 0),
      this.rotateVector(item)]
    );

    return geometry;
  }

  private rotateVector(item: any): THREE.Vector3 {
    var vec = new THREE.Vector3(0, 0,
      Math.max(item.halfSize.x, item.halfSize.z) + 1.4 + this.distance);
    return vec;
  }

  private makeLineMaterial(rotating: boolean): THREE.LineBasicMaterial {
    var mat = new THREE.LineBasicMaterial({
      color: this.getColor(),
    });
    return mat;
  }

  private makeCone(item: any): THREE.Mesh {
    var coneGeo = new THREE.CylinderBufferGeometry(5, 0, 10);
    var coneMat = new THREE.MeshBasicMaterial({
      color: this.getColor()
    });
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(this.rotateVector(item));

    cone.rotation.x = -Math.PI / 2.0;

    return cone;
  }

  private makeSphere(item: any): THREE.Mesh {
    var geometry = new THREE.SphereBufferGeometry(4, 16, 16);
    var material = new THREE.MeshBasicMaterial({
      color: this.getColor()
    });
    var sphere = new THREE.Mesh(geometry, material);
    return sphere;
  }

  private makeObject(item: any): THREE.Object3D {
    var object = new THREE.Object3D();
    var line = new THREE.Line(
      this.makeLineGeometry(item),
      this.makeLineMaterial(this.rotating));

    var cone = this.makeCone(item);
    var sphere = this.makeSphere(item);

    object.add(line);
    object.add(cone);
    object.add(sphere);

    object.rotation.y = item.rotation.y;
    object.position.x = item.position.x;
    object.position.z = item.position.z;
    object.position.y = this.height;

    return object;
  }
}
