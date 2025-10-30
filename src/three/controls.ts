import * as THREE from 'three';
import { Callbacks } from '../core/event_emitter';

export class Controls {
  public object: THREE.Camera;
  public domElement: HTMLElement | Document;
  public enabled = true;
  public target = new THREE.Vector3();
  public center = this.target;
  public noZoom = false;
  public zoomSpeed = 1.0;
  public minDistance = 0;
  public maxDistance = 1500;
  public noRotate = false;
  public rotateSpeed = 1.0;
  public noPan = false;
  public keyPanSpeed = 40.0;
  public autoRotate = false;
  public autoRotateSpeed = 2.0;
  public minPolarAngle = 0;
  public maxPolarAngle = Math.PI / 2;
  public noKeys = false;
  public keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
  public cameraMovedCallbacks = new Callbacks();
  public needsUpdate = true;

  private EPS = 0.000001;

  private rotateStart = new THREE.Vector2();
  private rotateEnd = new THREE.Vector2();
  private rotateDelta = new THREE.Vector2();

  private panStart = new THREE.Vector2();
  private panEnd = new THREE.Vector2();
  private panDelta = new THREE.Vector2();

  private dollyStart = new THREE.Vector2();
  private dollyEnd = new THREE.Vector2();
  private dollyDelta = new THREE.Vector2();

  private phiDelta = 0;
  private thetaDelta = 0;
  private scale = 1;
  private pan = new THREE.Vector3();

  private STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY: 4,
    TOUCH_PAN: 5
  };
  private state = this.STATE.NONE;

  constructor(object: THREE.Camera, domElement?: HTMLElement | Document) {
    this.object = object;
    this.domElement = domElement !== undefined ? domElement : document;

    this.domElement.addEventListener(
      "contextmenu",
      this.onContextMenu.bind(this),
      false
    );
    this.domElement.addEventListener("mousedown", this.onMouseDown.bind(this), false);
    this.domElement.addEventListener("mousewheel", this.onMouseWheel.bind(this), false);
    this.domElement.addEventListener("DOMMouseScroll", this.onMouseWheel.bind(this), false);
    this.domElement.addEventListener("touchstart", this.onTouchStart.bind(this), false);
    this.domElement.addEventListener("touchend", this.onTouchEnd.bind(this), false);
    this.domElement.addEventListener("touchmove", this.onTouchMove.bind(this), false);

    window.addEventListener("keydown", this.onKeyDown.bind(this), false);
  }

  public controlsActive(): boolean {
    return this.state === this.STATE.NONE;
  }

  public setPan(vec3: THREE.Vector3) {
    this.pan = vec3;
  }

  public panTo(vec3: THREE.Vector3) {
    var newTarget = new THREE.Vector3(vec3.x, this.target.y, vec3.z);
    var delta = this.target.clone().sub(newTarget);
    this.pan.sub(delta);
    this.update();
  }

  public rotateLeft(angle?: number) {
    if (angle === undefined) {
      angle = this.getAutoRotationAngle();
    }
    this.thetaDelta -= angle;
  }

  public rotateUp(angle?: number) {
    if (angle === undefined) {
      angle = this.getAutoRotationAngle();
    }
    this.phiDelta -= angle;
  }

  public panLeft(distance: number) {
    var panOffset = new THREE.Vector3();
    var te = this.object.matrix.elements;
    panOffset.set(te[0], 0, te[2]);
    panOffset.normalize();

    panOffset.multiplyScalar(-distance);

    this.pan.add(panOffset);
  }

  public panUp(distance: number) {
    var panOffset = new THREE.Vector3();
    var te = this.object.matrix.elements;
    panOffset.set(te[4], 0, te[6]);
    panOffset.normalize();
    panOffset.multiplyScalar(distance);

    this.pan.add(panOffset);
  }

  public panXY(x: number, y: number) {
    this.pan(new THREE.Vector2(x, y));
  }

  public dollyIn(dollyScale?: number) {
    if (dollyScale === undefined) {
      dollyScale = this.getZoomScale();
    }

    this.scale /= dollyScale;
  }

  public dollyOut(dollyScale?: number) {
    if (dollyScale === undefined) {
      dollyScale = this.getZoomScale();
    }

    this.scale *= dollyScale;
  }

  public update() {
    var position = this.object.position;
    var offset = position.clone().sub(this.target);

    var theta = Math.atan2(offset.x, offset.z);
    var phi = Math.atan2(
      Math.sqrt(offset.x * offset.x + offset.z * offset.z),
      offset.y
    );

    if (this.autoRotate) {
      this.rotateLeft(this.getAutoRotationAngle());
    }

    theta += this.thetaDelta;
    phi += this.phiDelta;

    phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));
    phi = Math.max(this.EPS, Math.min(Math.PI - this.EPS, phi));

    var radius = offset.length() * this.scale;

    radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

    this.target.add(this.pan);

    offset.x = radius * Math.sin(phi) * Math.sin(theta);
    offset.y = radius * Math.cos(phi);
    offset.z = radius * Math.sin(phi) * Math.cos(theta);

    position.copy(this.target).add(offset);

    this.object.lookAt(this.target);

    this.thetaDelta = 0;
    this.phiDelta = 0;
    this.scale = 1;
    this.pan.set(0, 0, 0);

    this.cameraMovedCallbacks.fire();
    this.needsUpdate = true;
  }

  private getAutoRotationAngle(): number {
    return ((2 * Math.PI) / 60 / 60) * this.autoRotateSpeed;
  }

  private getZoomScale(): number {
    return Math.pow(0.95, this.zoomSpeed);
  }

  private onMouseDown(event: MouseEvent) {
    if (this.enabled === false) {
      return;
    }
    event.preventDefault();

    if (event.button === 0) {
      if (this.noRotate === true) {
        return;
      }

      this.state = this.STATE.ROTATE;

      this.rotateStart.set(event.clientX, event.clientY);
    } else if (event.button === 1) {
      if (this.noZoom === true) {
        return;
      }

      this.state = this.STATE.DOLLY;

      this.dollyStart.set(event.clientX, event.clientY);
    } else if (event.button === 2) {
      if (this.noPan === true) {
        return;
      }

      this.state = this.STATE.PAN;

      this.panStart.set(event.clientX, event.clientY);
    }

    this.domElement.addEventListener("mousemove", this.onMouseMove.bind(this), false);
    this.domElement.addEventListener("mouseup", this.onMouseUp.bind(this), false);
  }

  private onMouseMove(event: MouseEvent) {
    if (this.enabled === false) return;

    event.preventDefault();

    var element =
      this.domElement === document
        ? document.body
        : this.domElement;

    if (this.state === this.STATE.ROTATE) {
      if (this.noRotate === true) return;

      this.rotateEnd.set(event.clientX, event.clientY);
      this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

      this.rotateLeft(
        ((2 * Math.PI * this.rotateDelta.x) / element.clientWidth) *
          this.rotateSpeed
      );
      this.rotateUp(
        ((2 * Math.PI * this.rotateDelta.y) / element.clientHeight) *
          this.rotateSpeed
      );

      this.rotateStart.copy(this.rotateEnd);
    } else if (this.state === this.STATE.DOLLY) {
      if (this.noZoom === true) return;

      this.dollyEnd.set(event.clientX, event.clientY);
      this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

      if (this.dollyDelta.y > 0) {
        this.dollyIn();
      } else {
        this.dollyOut();
      }

      this.dollyStart.copy(this.dollyEnd);
    } else if (this.state === this.STATE.PAN) {
      if (this.noPan === true) return;

      this.panEnd.set(event.clientX, event.clientY);
      this.panDelta.subVectors(this.panEnd, this.panStart);

      this.pan(this.panDelta);

      this.panStart.copy(this.panEnd);
    }

    this.update();
  }

  private onMouseUp(event: MouseEvent) {
    if (this.enabled === false) return;

    this.domElement.removeEventListener("mousemove", this.onMouseMove.bind(this), false);
    this.domElement.removeEventListener("mouseup", this.onMouseUp.bind(this), false);

    this.state = this.STATE.NONE;
  }

  private onMouseWheel(event: MouseWheelEvent) {
    if (this.enabled === false || this.noZoom === true) return;

    var delta = 0;

    if (event.wheelDelta) {
      delta = event.wheelDelta;
    } else if (event.detail) {
      delta = -event.detail;
    }

    if (delta > 0) {
      this.dollyOut();
    } else {
      this.dollyIn();
    }
    this.update();
  }

  private onKeyDown(event: KeyboardEvent) {
    if (this.enabled === false) {
      return;
    }
    if (this.noKeys === true) {
      return;
    }
    if (this.noPan === true) {
      return;
    }

    switch (event.keyCode) {
      case this.keys.UP:
        this.pan(new THREE.Vector2(0, this.keyPanSpeed));
        break;
      case this.keys.BOTTOM:
        this.pan(new THREE.Vector2(0, -this.keyPanSpeed));
        break;
      case this.keys.LEFT:
        this.pan(new THREE.Vector2(this.keyPanSpeed, 0));
        break;
      case this.keys.RIGHT:
        this.pan(new THREE.Vector2(-this.keyPanSpeed, 0));
        break;
    }
  }

  private onTouchStart(event: TouchEvent) {
    if (this.enabled === false) {
      return;
    }

    switch (event.touches.length) {
      case 1:
        if (this.noRotate === true) {
          return;
        }

        this.state = this.STATE.TOUCH_ROTATE;

        this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
        break;

      case 2:
        if (this.noZoom === true) {
          return;
        }

        this.state = this.STATE.TOUCH_DOLLY;

        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;
        var distance = Math.sqrt(dx * dx + dy * dy);
        this.dollyStart.set(0, distance);
        break;

      case 3:
        if (this.noPan === true) {
          return;
        }

        this.state = this.STATE.TOUCH_PAN;

        this.panStart.set(event.touches[0].pageX, event.touches[0].pageY);
        break;

      default:
        this.state = this.STATE.NONE;
    }
  }

  private onTouchMove(event: TouchEvent) {
    if (this.enabled === false) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    var element =
      this.domElement === document
        ? document.body
        : this.domElement;

    switch (event.touches.length) {
      case 1:
        if (this.noRotate === true) {
          return;
        }
        if (this.state !== this.STATE.TOUCH_ROTATE) {
          return;
        }

        this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

        this.rotateLeft(
          ((2 * Math.PI * this.rotateDelta.x) / element.clientWidth) *
            this.rotateSpeed
        );
        this.rotateUp(
          ((2 * Math.PI * this.rotateDelta.y) / element.clientHeight) *
            this.rotateSpeed
        );

        this.rotateStart.copy(this.rotateEnd);
        break;

      case 2:
        if (this.noZoom === true) {
          return;
        }
        if (this.state !== this.STATE.TOUCH_DOLLY) {
          return;
        }

        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;
        var distance = Math.sqrt(dx * dx + dy * dy);

        this.dollyEnd.set(0, distance);
        this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

        if (this.dollyDelta.y > 0) {
          this.dollyOut();
        } else {
          this.dollyIn();
        }

        this.dollyStart.copy(this.dollyEnd);
        break;

      case 3:
        if (this.noPan === true) {
          return;
        }
        if (this.state !== this.STATE.TOUCH_PAN) {
          return;
        }

        this.panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
        this.panDelta.subVectors(this.panEnd, this.panStart);

        this.pan(this.panDelta);

        this.panStart.copy(this.panEnd);
        break;

      default:
        this.state = this.STATE.NONE;
    }
  }

  private onTouchEnd(event: TouchEvent) {
    if (this.enabled === false) {
      return;
    }
    this.state = this.STATE.NONE;
  }

  private onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }
}
