/**
 * This file is a modified version of THREE.OrbitControls
 * Contributors:
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

import * as THREE from 'three';
import $ from 'jquery';

// State constants for the controller
const STATE = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_DOLLY: 4,
  TOUCH_PAN: 5
};

/**
 * Controls for camera movement in 3D space
 */
export class Controls {
  // Camera & DOM elements
  public object: THREE.Camera;
  public domElement: HTMLElement;
  
  // Control settings
  public enabled: boolean = true;
  public target: THREE.Vector3 = new THREE.Vector3();
  public center: THREE.Vector3; // alias for target, deprecated
  
  // Zoom settings
  public noZoom: boolean = false;
  public zoomSpeed: number = 1.0;
  public minDistance: number = 0;
  public maxDistance: number = 1500;
  
  // Rotation settings
  public noRotate: boolean = false;
  public rotateSpeed: number = 1.0;
  
  // Pan settings
  public noPan: boolean = false;
  public keyPanSpeed: number = 40.0;
  
  // Auto-rotation settings
  public autoRotate: boolean = false;
  public autoRotateSpeed: number = 2.0;
  
  // Orbital limits
  public minPolarAngle: number = 0;
  public maxPolarAngle: number = Math.PI / 2;
  
  // Key control settings
  public noKeys: boolean = false;
  public keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
  
  // Callback system
  public cameraMovedCallbacks = $.Callbacks();
  
  // Update flag
  public needsUpdate: boolean = true;
  
  // Private state
  private EPS: number = 0.000001;
  private state: number = STATE.NONE;
  
  // Movement tracking
  private rotateStart = new THREE.Vector2();
  private rotateEnd = new THREE.Vector2();
  private rotateDelta = new THREE.Vector2();
  
  private panStart = new THREE.Vector2();
  private panEnd = new THREE.Vector2();
  private panDelta = new THREE.Vector2();
  
  private dollyStart = new THREE.Vector2();
  private dollyEnd = new THREE.Vector2();
  private dollyDelta = new THREE.Vector2();
  
  // Rotation & movement state
  private phiDelta: number = 0;
  private thetaDelta: number = 0;
  private scale: number = 1;
  private pan = new THREE.Vector3();
  
  /**
   * Constructor for orbit controls
   * @param object The camera to control
   * @param domElement The DOM element to attach to
   */
  constructor(object: THREE.Camera, domElement?: HTMLElement) {
    this.object = object;
    this.domElement = domElement !== undefined ? domElement : document;
    this.center = this.target;
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Check if controls are active
   * @returns True if the controls are in the NONE state
   */

  public controlsActive(): boolean {
    return this.state === STATE.NONE;
  }
  
  /**
   * Set the pan position
   * @param vec3 The new pan position
   */
  public setPan(vec3: THREE.Vector3): void {
    this.pan = vec3;
  }
  
  /**
   * Pan to a specific 3D position
   * @param vec3 The position to pan to
   */
  public panTo(vec3: THREE.Vector3): void {
    const newTarget = new THREE.Vector3(vec3.x, this.target.y, vec3.z);
    const delta = this.target.clone().sub(newTarget);
    this.pan.sub(delta);
    this.update();
  }
  
  /**
   * Rotate left by a specified angle
   * @param angle The angle to rotate by
   */
  public rotateLeft(angle?: number): void {
    if (angle === undefined) {
      angle = this.getAutoRotationAngle();
    }
    this.thetaDelta -= angle;
  }
  
  /**
   * Rotate up by a specified angle
   * @param angle The angle to rotate by
   */
  public rotateUp(angle?: number): void {
    if (angle === undefined) {
      angle = this.getAutoRotationAngle();
    }
    this.phiDelta -= angle;
  }
  /**
   * Pan left by a specified distance
   * @param distance The distance to pan
   */
  public panLeft(distance: number): void {
    const panOffset = new THREE.Vector3();
    const te = this.object.matrix.elements;
    // get X column of matrix
    panOffset.set(te[0], 0, te[2]);
    panOffset.normalize();
    
    panOffset.multiplyScalar(-distance);
    
    this.pan.add(panOffset);
  }
  
  /**
   * Pan up by a specified distance
   * @param distance The distance to pan
   */
  public panUp(distance: number): void {
    const panOffset = new THREE.Vector3();
    const te = this.object.matrix.elements;
    // get Y column of matrix
    panOffset.set(te[4], 0, te[6]);
    panOffset.normalize();
    panOffset.multiplyScalar(distance);
    
    this.pan.add(panOffset);
  }
  /**
   * Main pan method - pass in Vector2 of change desired in pixel space,
   * right and down are positive
   * @param delta Change in x and y coordinates
   */
  public pan(delta: THREE.Vector2): void {
    try {
      const element = this.domElement === document ? document.body : this.domElement;

      if ((this.object as any).fov !== undefined) {
        // perspective
        const position = this.object.position;
        const offset = position.clone().sub(this.target);
        let targetDistance = offset.length();

        // half of the fov is center to top of screen
        targetDistance *= Math.tan(((this.object as any).fov / 2) * Math.PI / 180.0);
        // we actually don't use screenWidth, since perspective camera is fixed to screen height
        this.panLeft((2 * delta.x * targetDistance) / element.clientHeight);
        this.panUp((2 * delta.y * targetDistance) / element.clientHeight);
      } else if ((this.object as any).top !== undefined) {
        // orthographic
        this.panLeft(
          (delta.x * ((this.object as any).right - (this.object as any).left)) / element.clientWidth
        );
        this.panUp(
          (delta.y * ((this.object as any).top - (this.object as any).bottom)) / element.clientHeight
        );
      } else {
        // camera neither orthographic nor perspective - warn user
        console.warn('WARNING: OrbitControls encountered an unknown camera type - pan disabled.');
      }

      this.update();
    } catch (error) {
      console.error('Error in pan method:', error);
    }
  }

  /**
   * Pan by specific x and y amounts
   * @param x Amount to pan horizontally
   * @param y Amount to pan vertically
   */
  public panXY(x: number, y: number): void {
    this.pan(new THREE.Vector2(x, y));
  }

  /**
   * Dolly in (zoom in)
   * @param dollyScale Scale factor for zooming
   */
  public dollyIn(dollyScale?: number): void {
    if (dollyScale === undefined) {
      dollyScale = this.getZoomScale();
    }

    this.scale /= dollyScale;
  }

  /**
   * Dolly out (zoom out)
   * @param dollyScale Scale factor for zooming
   */
  public dollyOut(dollyScale?: number): void {
    if (dollyScale === undefined) {
      dollyScale = this.getZoomScale();
    }

    this.scale *= dollyScale;
  }

  /**
   * Update the camera position and target
   */
  public update(): void {
    try {
      const position = this.object.position;
      const offset = position.clone().sub(this.target);

      // angle from z-axis around y-axis
      let theta = Math.atan2(offset.x, offset.z);

      // angle from y-axis
      let phi = Math.atan2(
        Math.sqrt(offset.x * offset.x + offset.z * offset.z),
        offset.y
      );
      if (this.autoRotate) {
        this.rotateLeft(this.getAutoRotationAngle());
      }

      theta += this.thetaDelta;
      phi += this.phiDelta;

      // restrict phi to be between desired limits
      phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

      // restrict phi to be between EPS and PI-EPS
      phi = Math.max(this.EPS, Math.min(Math.PI - this.EPS, phi));

      let radius = offset.length() * this.scale;

      // restrict radius to be between desired limits
      radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

      // move target to panned location
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
    } catch (error) {
      console.error('Error updating camera position:', error);
    }
  }

  /**
   * Get the auto rotation angle
   * @returns The angle for automatic rotation
   */
  private getAutoRotationAngle(): number {
    return ((2 * Math.PI) / 60 / 60) * this.autoRotateSpeed;
  }

  /**
   * Get the zoom scale
   * @returns The zoom scale factor
   */
  private getZoomScale(): number {
    return Math.pow(0.95, this.zoomSpeed);
  }
  /**
   * Setup event listeners for user interaction
   */
  private setupEventListeners(): void {
    try {
      // Prevent context menu
      this.domElement.addEventListener("contextmenu", (event) => {
        event.preventDefault();
      }, false);
      
      // Mouse events
      this.domElement.addEventListener("mousedown", this.onMouseDown.bind(this), false);
      this.domElement.addEventListener("mousewheel", this.onMouseWheel.bind(this), false);
      this.domElement.addEventListener("DOMMouseScroll", this.onMouseWheel.bind(this), false); // Firefox
      
      // Touch events
      this.domElement.addEventListener("touchstart", this.touchstart.bind(this), false);
      this.domElement.addEventListener("touchend", this.touchend.bind(this), false);
      this.domElement.addEventListener("touchmove", this.touchmove.bind(this), false);
      
      // Keyboard events
      window.addEventListener("keydown", this.onKeyDown.bind(this), false);
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  /**
   * Handle mouse down event
   * @param event The mouse event
   */
  private onMouseDown(event: MouseEvent): void {
    if (this.enabled === false) {
      return;
    }
    event.preventDefault();

    try {
      if (event.button === 0) {
        if (this.noRotate === true) {
          return;
        }

        this.state = STATE.ROTATE;
        this.rotateStart.set(event.clientX, event.clientY);
      } else if (event.button === 1) {
        if (this.noZoom === true) {
          return;
        }

        this.state = STATE.DOLLY;
        this.dollyStart.set(event.clientX, event.clientY);
      } else if (event.button === 2) {
        if (this.noPan === true) {
          return;
        }

        this.state = STATE.PAN;
        this.panStart.set(event.clientX, event.clientY);
      }

      // Add temporary event listeners
      document.addEventListener("mousemove", this.onMouseMove, false);
      document.addEventListener("mouseup", this.onMouseUp, false);
    } catch (error) {
      console.error('Error in onMouseDown:', error);
    }
  }

  /**
   * Handle mouse move event
   * @param event The mouse event
   */
  private onMouseMove = (event: MouseEvent): void => {
    if (this.enabled === false) return;

    event.preventDefault();

    try {
      const element = this.domElement === document ? document.body : this.domElement;

      if (this.state === STATE.ROTATE) {
        if (this.noRotate === true) return;

        this.rotateEnd.set(event.clientX, event.clientY);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

        // rotating across whole screen goes 360 degrees around
        this.rotateLeft(
          ((2 * Math.PI * this.rotateDelta.x) / element.clientWidth) * this.rotateSpeed
        );
        
        // rotating up and down along whole screen attempts to go 360, but limited to 180
        this.rotateUp(
          ((2 * Math.PI * this.rotateDelta.y) / element.clientHeight) * this.rotateSpeed
        );

        this.rotateStart.copy(this.rotateEnd);
      } else if (this.state === STATE.DOLLY) {
        if (this.noZoom === true) return;

        this.dollyEnd.set(event.clientX, event.clientY);
        this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

        if (this.dollyDelta.y > 0) {
          this.dollyIn();
        } else {
          this.dollyOut();
        }

        this.dollyStart.copy(this.dollyEnd);
      } else if (this.state === STATE.PAN) {
        if (this.noPan === true) return;

        this.panEnd.set(event.clientX, event.clientY);
        this.panDelta.subVectors(this.panEnd, this.panStart);
        
        this.pan(this.panDelta);
        
        this.panStart.copy(this.panEnd);
      }

      // Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
      this.update();
    } catch (error) {
      console.error('Error in onMouseMove:', error);
    }
  }

  /**
   * Handle mouse up event
   * @param event The mouse event
   */
  private onMouseUp = (event: MouseEvent): void => {
    if (this.enabled === false) return;

    try {
      // Remove temporary event listeners
      document.removeEventListener("mousemove", this.onMouseMove, false);
      document.removeEventListener("mouseup", this.onMouseUp, false);

      this.state = STATE.NONE;
    } catch (error) {
      console.error('Error in onMouseUp:', error);
    }
  }
  /**
   * Handle mouse wheel event
   * @param event The mouse wheel event
   */
  private onMouseWheel = (event: MouseWheelEvent | any): void => {
    if (this.enabled === false || this.noZoom === true) return;

    try {
      let delta = 0;

      if (event.wheelDelta) {
        // WebKit / Opera / Explorer 9
        delta = event.wheelDelta;
      } else if (event.detail) {
        // Firefox
        delta = -event.detail;
      }

      if (delta > 0) {
        this.dollyOut();
      } else {
        this.dollyIn();
      }
      
      this.update();
    } catch (error) {
      console.error('Error in onMouseWheel:', error);
    }
  }

  /**
   * Handle key down event
   * @param event The keyboard event
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.enabled === false) return;
    if (this.noKeys === true) return;
    if (this.noPan === true) return;

    try {
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
    } catch (error) {
      console.error('Error in onKeyDown:', error);
    }
  }

  /**
   * Handle touch start event
   * @param event The touch event
   */
  private touchstart = (event: TouchEvent): void => {
    if (this.enabled === false) return;

    try {
      switch (event.touches.length) {
        case 1: // one-fingered touch: rotate
          if (this.noRotate === true) return;

          this.state = STATE.TOUCH_ROTATE;
          this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
          break;

        case 2: // two-fingered touch: dolly
          if (this.noZoom === true) return;

          this.state = STATE.TOUCH_DOLLY;
          const dx = event.touches[0].pageX - event.touches[1].pageX;
          const dy = event.touches[0].pageY - event.touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          this.dollyStart.set(0, distance);
          break;

        case 3: // three-fingered touch: pan
          if (this.noPan === true) return;

          this.state = STATE.TOUCH_PAN;
          this.panStart.set(event.touches[0].pageX, event.touches[0].pageY);
          break;

        default:
          this.state = STATE.NONE;
      }
    } catch (error) {
      console.error('Error in touchstart:', error);
    }
  }

  /**
   * Handle touch move event
   * @param event The touch event
   */
  private touchmove = (event: TouchEvent): void => {
    if (this.enabled === false) return;

    try {
      event.preventDefault();
      event.stopPropagation();

      const element = this.domElement === document ? document.body : this.domElement;

      switch (event.touches.length) {
        case 1: // one-fingered touch: rotate
          if (this.noRotate === true) return;
          if (this.state !== STATE.TOUCH_ROTATE) return;

          this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
          this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

          // rotating across whole screen goes 360 degrees around
          this.rotateLeft(
            ((2 * Math.PI * this.rotateDelta.x) / element.clientWidth) * this.rotateSpeed
          );
          // rotating up and down along whole screen attempts to go 360, but limited to 180
          this.rotateUp(
            ((2 * Math.PI * this.rotateDelta.y) / element.clientHeight) * this.rotateSpeed
          );

          this.rotateStart.copy(this.rotateEnd);
          this.update();
          break;

        case 2: // two-fingered touch: dolly
          if (this.noZoom === true) return;
          if (this.state !== STATE.TOUCH_DOLLY) return;

          const dx = event.touches[0].pageX - event.touches[1].pageX;
          const dy = event.touches[0].pageY - event.touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          this.dollyEnd.set(0, distance);
          this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

          if (this.dollyDelta.y > 0) {
            this.dollyOut();
          } else {
            this.dollyIn();
          }

          this.dollyStart.copy(this.dollyEnd);
          this.update();
          break;

        case 3: // three-fingered touch: pan
          if (this.noPan === true) return;
          if (this.state !== STATE.TOUCH_PAN) return;

          this.panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
          this.panDelta.subVectors(this.panEnd, this.panStart);
          
          this.pan(this.panDelta);
          
          this.panStart.copy(this.panEnd);
          this.update();
          break;

        default:
          this.state = STATE.NONE;
      }
    } catch (error) {
      console.error('Error in touchmove:', error);
    }
  }

  /**
   * Handle touch end event
   * @param event The touch event
   */
  private touchend = (event: TouchEvent): void => {
    if (this.enabled === false) return;
    
    try {
      this.state = STATE.NONE;
    } catch (error) {
      console.error('Error in touchend:', error);
    }
  }
}

// Export as default
export default Controls;

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Three = (globalThis as any).BP3D.Three || {};
  (globalThis as any).BP3D.Three.Controls = Controls;
}
