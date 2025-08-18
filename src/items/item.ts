import * as THREE from 'three';
import * as Utils from '../core/utils';
import { Model, Scene } from '../model';
import { Metadata } from './metadata';

/**
 * An Item is an abstract entity for all things placed in the scene,
 * e.g. at walls or on the floor.
 */
export abstract class Item extends THREE.Mesh {

  /** */
  private scene: Scene;

  /** */
  private errorGlow = new THREE.Mesh();

  /** */
  private hover = false;

  /** */
  private selected = false;

  /** */
  private highlighted = false;

  /** */
  private error = false;

  /** */
  private emissiveColor = 0x444444;

  /** */
  private errorColor = 0xff0000;

  /** */
  private resizable: boolean;

  /** Does this object affect other floor items */
  protected obstructFloorMoves = true;

  /** */
  protected position_set: boolean;

  /** Show rotate option in context menu */
  protected allowRotate = true;

  /** */
  public fixed = false;

  /** dragging */
  private dragOffset = new THREE.Vector3();

  /** */
  protected halfSize: THREE.Vector3;

  /** Constructs an item.
   * @param model TODO
   * @param metadata TODO
   * @param geometry TODO
   * @param material TODO
   * @param position TODO
   * @param rotation TODO
   * @param scale TODO
   */
  constructor(protected model: Model, public metadata: Metadata, geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], position: THREE.Vector3, rotation: number, scale: THREE.Vector3) {
    super(geometry, material);

    this.scene = this.model.scene;

    this.errorColor = 0xff0000;

    this.resizable = metadata.resizable;

    (this as any).castShadow = true;
    (this as any).receiveShadow = false;

    if (position) {
      (this as any).position.copy(position);
      this.position_set = true;
    } else {
      this.position_set = false;
    }

    // center in its boundingbox
    (this as any).geometry.computeBoundingBox();
    (this as any).geometry.center();
    (this as any).geometry.computeBoundingBox();
    this.halfSize = this.objectHalfSize();

    if (rotation) {
      (this as any).rotation.y = rotation;
    }

    if (scale != null) {
      this.setScale(scale.x, scale.y, scale.z);
    }
  };

  /** */
  public remove() {
    this.scene.removeItem(this);
  };

  /** */
  public resize(height: number, width: number, depth: number) {
    var x = width / this.getWidth();
    var y = height / this.getHeight();
    var z = depth / this.getDepth();
    this.setScale(x, y, z);
  }

  /** */
  public setScale(x: number, y: number, z: number) {
    var scaleVec = new THREE.Vector3(x, y, z);
    this.halfSize.multiply(scaleVec);
    scaleVec.multiply((this as any).scale)
    ;(this as any).scale.set(scaleVec.x, scaleVec.y, scaleVec.z);
    this.resized();
    this.scene.needsUpdate = true;
  };

  /** */
  public setFixed(fixed: boolean) {
    this.fixed = fixed;
  }

  /** Subclass can define to take action after a resize. */
  protected abstract resized();

  /** */
  public getHeight = function () {
    return this.halfSize.y * 2.0;
  }

  /** */
  public getWidth = function () {
    return this.halfSize.x * 2.0;
  }

  /** */
  public getDepth = function () {
    return this.halfSize.z * 2.0;
  }

  /** */
  public abstract placeInRoom();

  /** */
  public initObject = function () {
    this.placeInRoom();
    // select and stuff
    this.scene.needsUpdate = true;
  };

  /** */
  public removed() {
  }

  /** on is a bool */
  public updateHighlight() {
    const on = this.hover || this.selected;
    this.highlighted = on;
    const hex = on ? this.emissiveColor : 0x000000;
    const materials = Array.isArray((this as any).material) ? (this as any).material : [(this as any).material];
    materials.forEach((material) => {
      if ('emissive' in material) {
        (material as any).emissive.setHex(hex);
      }
    });
  }

  /** */
  public mouseOver() {
    this.hover = true;
    this.updateHighlight();
  };

  /** */
  public mouseOff() {
    this.hover = false;
    this.updateHighlight();
  };

  /** */
  public setSelected() {
    this.selected = true;
    this.updateHighlight();
  };

  /** */
  public setUnselected() {
    this.selected = false;
    this.updateHighlight();
  };

  /** intersection has attributes point (vec3) and object (THREE.Mesh) */
  public clickPressed(intersection) {
    this.dragOffset.copy(intersection.point).sub((this as any).position);
  };

  /** */
  public clickDragged(intersection) {
    if (intersection) {
      this.moveToPosition(
        intersection.point.sub(this.dragOffset),
        intersection);
    }
  };

  /** */
  public rotate(intersection) {
    if (intersection) {
      var angle = Utils.angle(
        0,
        1,
        intersection.point.x - (this as any).position.x,
        intersection.point.z - (this as any).position.z);

      var snapTolerance = Math.PI / 16.0;

      // snap to intervals near Math.PI/2
      for (var i = -4; i <= 4; i++) {
        if (Math.abs(angle - (i * (Math.PI / 2))) < snapTolerance) {
          angle = i * (Math.PI / 2);
          break;
        }
      }

      (this as any).rotation.y = angle;
    }
  }

  /** */
  public moveToPosition(vec3, intersection) {
    (this as any).position.copy(vec3);
  }

  /** */
  public clickReleased() {
    if (this.error) {
      this.hideError();
    }
  };

  /**
   * Returns an array of planes to use other than the ground plane
   * for passing intersection to clickPressed and clickDragged
   */
  public customIntersectionPlanes() {
    return [];
  }

  /**
   * returns the 2d corners of the bounding polygon
   *
   * offset is Vector3 (used for getting corners of object at a new position)
   *
   * TODO: handle rotated objects better!
   */
  public getCorners(xDim, yDim, position) {

    position = position || (this as any).position;

    var halfSize = this.halfSize.clone();

    var c1 = new THREE.Vector3(-halfSize.x, 0, -halfSize.z);
    var c2 = new THREE.Vector3(halfSize.x, 0, -halfSize.z);
    var c3 = new THREE.Vector3(halfSize.x, 0, halfSize.z);
    var c4 = new THREE.Vector3(-halfSize.x, 0, halfSize.z);

    var transform = new THREE.Matrix4();
    //console.log((this as any).rotation.y);
    transform.makeRotationY((this as any).rotation.y); //  + Math.PI/2)

    c1.applyMatrix4(transform);
    c2.applyMatrix4(transform);
    c3.applyMatrix4(transform);
    c4.applyMatrix4(transform);

    c1.add(position);
    c2.add(position);
    c3.add(position);
    c4.add(position);

    //halfSize.applyMatrix4(transform);

    //var min = position.clone().sub(halfSize);
    //var max = position.clone().add(halfSize);

    var corners = [
      { x: c1.x, y: c1.z },
      { x: c2.x, y: c2.z },
      { x: c3.x, y: c3.z },
      { x: c4.x, y: c4.z }
    ];

    return corners;
  }

  /** */
  public abstract isValidPosition(vec3): boolean;

  /** */
  public showError(vec3) {
    vec3 = vec3 || (this as any).position;
    if (!this.error) {
      this.error = true;
      this.errorGlow = this.createGlow(this.errorColor, 0.8, true);
      this.scene.add(this.errorGlow);
    }
    this.errorGlow.position.copy(vec3);
  }

  /** */
  public hideError() {
    if (this.error) {
      this.error = false;
      this.scene.remove(this.errorGlow);
    }
  }

  /** */
  private objectHalfSize(): THREE.Vector3 {
    var objectBox = new THREE.Box3();
    objectBox.setFromObject(this);
    return objectBox.max.clone().sub(objectBox.min).divideScalar(2);
  }

  /** */
  public createGlow(color, opacity, ignoreDepth): THREE.Mesh {
    ignoreDepth = ignoreDepth || false;
    opacity = opacity || 0.2;
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      blending: THREE.AdditiveBlending,
      opacity: 0.2,
      transparent: true,
      depthTest: !ignoreDepth
    });

    const glow = new THREE.Mesh((this as any).geometry.clone(), glowMaterial);
    glow.position.copy((this as any).position);
    glow.rotation.copy((this as any).rotation);
    glow.scale.copy((this as any).scale);
    return glow;
  };
}
