import * as THREE from 'three';
import { Utils } from '../core/utils';
import { Model } from '../model/model';
import { Metadata } from './metadata';

export abstract class Item extends THREE.Mesh {
  private scene: Model.Scene;
  private errorGlow = new THREE.Mesh();
  private hover = false;
  private selected = false;
  private highlighted = false;
  private error = false;
  private emissiveColor = 0x444444;
  private errorColor = 0xff0000;
  private resizable: boolean;
  protected obstructFloorMoves = true;
  protected position_set: boolean;
  protected allowRotate = true;
  public fixed = false;
  private dragOffset = new THREE.Vector3();
  protected halfSize: THREE.Vector3;

  constructor(protected model: Model, public metadata: Metadata, geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, rotation: number, scale: THREE.Vector3) {
    super(geometry, material);

    this.scene = this.model.scene;

    this.errorColor = 0xff0000;

    this.resizable = metadata.resizable;

    this.castShadow = true;
    this.receiveShadow = false;

    if (position) {
      this.position.copy(position);
      this.position_set = true;
    } else {
      this.position_set = false;
    }

    this.geometry.computeBoundingBox();
    this.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(
      - 0.5 * (this.geometry.boundingBox.max.x + this.geometry.boundingBox.min.x),
      - 0.5 * (this.geometry.boundingBox.max.y + this.geometry.boundingBox.min.y),
      - 0.5 * (this.geometry.boundingBox.max.z + this.geometry.boundingBox.min.z)
    ));
    this.geometry.computeBoundingBox();
    this.halfSize = this.objectHalfSize();

    if (rotation) {
      this.rotation.y = rotation;
    }

    if (scale != null) {
      this.setScale(scale.x, scale.y, scale.z);
    }
  };

  public remove() {
    this.scene.removeItem(this);
  };

  public resize(height: number, width: number, depth: number) {
    var x = width / this.getWidth();
    var y = height / this.getHeight();
    var z = depth / this.getDepth();
    this.setScale(x, y, z);
  }

  public setScale(x: number, y: number, z: number) {
    var scaleVec = new THREE.Vector3(x, y, z);
    this.halfSize.multiply(scaleVec);
    scaleVec.multiply(this.scale)
    this.scale.set(scaleVec.x, scaleVec.y, scaleVec.z);
    this.resized();
    this.scene.needsUpdate = true;
  };

  public setFixed(fixed: boolean) {
    this.fixed = fixed;
  }

  protected abstract resized();

  public getHeight = function () {
    return this.halfSize.y * 2.0;
  }

  public getWidth = function () {
    return this.halfSize.x * 2.0;
  }

  public getDepth = function () {
    return this.halfSize.z * 2.0;
  }

  public abstract placeInRoom();

  public initObject = function () {
    this.placeInRoom();
    this.scene.needsUpdate = true;
  };

  public removed() {
  }

  public updateHighlight() {
    var on = this.hover || this.selected;
    this.highlighted = on;
    var hex = on ? this.emissiveColor : 0x000000;
    if (Array.isArray(this.material)) {
      this.material.forEach((material) => {
        (<any>material).emissive.setHex(hex);
      });
    } else {
      (<any>this.material).emissive.setHex(hex);
    }
  }

  public mouseOver() {
    this.hover = true;
    this.updateHighlight();
  };

  public mouseOff() {
    this.hover = false;
    this.updateHighlight();
  };

  public setSelected() {
    this.selected = true;
    this.updateHighlight();
  };

  public setUnselected() {
    this.selected = false;
    this.updateHighlight();
  };

  public clickPressed(intersection) {
    this.dragOffset.copy(intersection.point).sub(this.position);
  };

  public clickDragged(intersection) {
    if (intersection) {
      this.moveToPosition(
        intersection.point.sub(this.dragOffset),
        intersection);
    }
  };

  public rotate(intersection) {
    if (intersection) {
      var angle = Utils.angle(
        0,
        1,
        intersection.point.x - this.position.x,
        intersection.point.z - this.position.z);

      var snapTolerance = Math.PI / 16.0;

      for (var i = -4; i <= 4; i++) {
        if (Math.abs(angle - (i * (Math.PI / 2))) < snapTolerance) {
          angle = i * (Math.PI / 2);
          break;
        }
      }

      this.rotation.y = angle;
    }
  }

  public moveToPosition(vec3, intersection) {
    this.position.copy(vec3);
  }

  public clickReleased() {
    if (this.error) {
      this.hideError();
    }
  };

  public customIntersectionPlanes() {
    return [];
  }

  public getCorners(xDim, yDim, position) {

    position = position || this.position;

    var halfSize = this.halfSize.clone();

    var c1 = new THREE.Vector3(-halfSize.x, 0, -halfSize.z);
    var c2 = new THREE.Vector3(halfSize.x, 0, -halfSize.z);
    var c3 = new THREE.Vector3(halfSize.x, 0, halfSize.z);
    var c4 = new THREE.Vector3(-halfSize.x, 0, halfSize.z);

    var transform = new THREE.Matrix4();
    transform.makeRotationY(this.rotation.y);

    c1.applyMatrix4(transform);
    c2.applyMatrix4(transform);
    c3.applyMatrix4(transform);
    c4.applyMatrix4(transform);

    c1.add(position);
    c2.add(position);
    c3.add(position);
    c4.add(position);

    var corners = [
      { x: c1.x, y: c1.z },
      { x: c2.x, y: c2.z },
      { x: c3.x, y: c3.z },
      { x: c4.x, y: c4.z }
    ];

    return corners;
  }

  public abstract isValidPosition(vec3): boolean;

  public showError(vec3) {
    vec3 = vec3 || this.position;
    if (!this.error) {
      this.error = true;
      this.errorGlow = this.createGlow(this.errorColor, 0.8, true);
      this.scene.add(this.errorGlow);
    }
    this.errorGlow.position.copy(vec3);
  }

  public hideError() {
    if (this.error) {
      this.error = false;
      this.scene.remove(this.errorGlow);
    }
  }

  private objectHalfSize(): THREE.Vector3 {
    var objectBox = new THREE.Box3();
    objectBox.setFromObject(this);
    return objectBox.max.clone().sub(objectBox.min).divideScalar(2);
  }

  public createGlow(color, opacity, ignoreDepth): THREE.Mesh {
    ignoreDepth = ignoreDepth || false
    opacity = opacity || 0.2;
    var glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      blending: THREE.AdditiveBlending,
      opacity: 0.2,
      transparent: true,
      depthTest: !ignoreDepth
    });

    var glow = new THREE.Mesh(<THREE.Geometry>this.geometry.clone(), glowMaterial);
    glow.position.copy(this.position);
    glow.rotation.copy(this.rotation);
    glow.scale.copy(this.scale);
    return glow;
  };
}
