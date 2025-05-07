import * as THREE from 'three';
import $ from 'jquery';

// Import types to avoid circular dependencies
import type { Model } from '../model/model';
import type { Controller } from './controller';
import type { Floorplan as ThreeFloorplan } from './floorplan';
import type { Controls } from './controls';
import type { HUD } from './hud';

// Default options for the 3D viewer
const DEFAULT_OPTIONS = {
  resize: true,
  pushHref: false,
  spin: true,
  spinSpeed: 0.00002,
  clickPan: true,
  canMoveFixedItems: false
};

/**
 * The main 3D viewer class that manages the scene, camera, renderer, etc.
 */
export class Main {
  // DOM elements
  public element: JQuery;
  private domElement: HTMLElement;
  
  // THREE.js components
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  public controls: Controls;
  
  // Blueprint3D specific components  
  private controller: Controller;
  private floorplan: ThreeFloorplan;
  private hud: HUD;
  
  // Render state
  private needsUpdate = false;
  private lastRender = Date.now();
  private mouseOver = false;
  private hasClicked = false;
  
  // Element dimensions
  public heightMargin: number;
  public widthMargin: number;
  public elementHeight: number;
  public elementWidth: number;
  
  // Callbacks
  public itemSelectedCallbacks = $.Callbacks();
  public itemUnselectedCallbacks = $.Callbacks();
  public wallClicked = $.Callbacks();
  public floorClicked = $.Callbacks();
  public nothingClicked = $.Callbacks();
  
  // Options
  private options: any;
  
  /**
   * Create a new 3D viewer.
   * @param model The model to render.
   * @param element The DOM element to render into.
   * @param canvasElement The canvas element to use (unused?).
   * @param opts Options for the viewer.
   */
  constructor(private model: Model, element: string, canvasElement: string, opts: any = {}) {
    // Store a reference to this for callbacks
    const scope = this;

    // Initialize options with defaults and overrides
    this.options = { ...DEFAULT_OPTIONS };
    
    // override with manually set options
    for (const opt in DEFAULT_OPTIONS) {
      if (DEFAULT_OPTIONS.hasOwnProperty(opt) && opts.hasOwnProperty(opt)) {
        this.options[opt] = opts[opt];
      }
    }
    
    // Initialize DOM elements
    this.element = $(element);
    
    // Initialize the viewer
    this.init();

  /**
   * Initialize the 3D viewer.
   */
  private init() {
    // Import dependencies dynamically to avoid circular dependencies
    const { Skybox } = require('./skybox');
    const { Controls } = require('./controls');
    const { HUD } = require('./hud');
    const { Controller } = require('./controller');
    const { Lights } = require('./lights');
    const { Floorplan: ThreeFloorplan } = require('./floorplan');
    
    // Set up THREE.js
    THREE.ImageUtils.crossOrigin = "";
    
    // Set up DOM and rendering
    this.domElement = this.element.get(0); // Container
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true // required to support .toDataURL()
    });
    
    // Configure renderer
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create scene components
    const scene = this.model.scene;
    const skybox = new Skybox(scene);
    
    // Set up controls and HUD
    this.controls = new Controls(this.camera, this.domElement);
    this.hud = new HUD(this);
    
    // Set up controller
    this.controller = new Controller(
      this,
      this.model,
      this.camera,
      this.element,
      this.controls,
      this.hud
    );
    
    // Add renderer to DOM
    this.domElement.appendChild(this.renderer.domElement);
    
    // Handle window resizing
    this.updateWindowSize();
    if (this.options.resize) {
      $(window).resize(() => this.updateWindowSize());
    }
    
    // Set up camera
    this.centerCamera();
    this.model.floorplan.fireOnUpdatedRooms(() => this.centerCamera());
    
    // Set up lights and floorplan
    const lights = new Lights(scene, this.model.floorplan);
    this.floorplan = new ThreeFloorplan(scene, this.model.floorplan, this.controls);
    
    // Start animation
    this.animate();
    
    // Set up mouse events
    this.element
      .mouseenter(() => {
        this.mouseOver = true;
      })
      .mouseleave(() => {
        this.mouseOver = false;
      })
      .click(() => {
        this.hasClicked = true;
      });
  }

  /**
   * Spin the camera if enabled.
   */
  private spin() {
    if (this.options.spin && !this.mouseOver && !this.hasClicked) {
      const theta = 2 * Math.PI * this.options.spinSpeed * (Date.now() - this.lastRender);
      this.controls.rotateLeft(theta);
      this.controls.update();
    }
  }
  
  /**
   * Get a data URL of the current view.
   * @returns Data URL of the current view.
   */
  public dataUrl(): string {
    return this.renderer.domElement.toDataURL("image/png");
  }
  
  /**
   * Stop the camera from spinning.
   */
  public stopSpin(): void {
    this.hasClicked = true;
  }
  
  /**
   * Get the viewer options.
   * @returns The options object.
   */
  public getOptions(): any {
    return this.options;
  }
  
  /**
   * Get the model.
   * @returns The model.
   */
  public getModel(): Model {
    return this.model;
  }
  
  /**
   * Get the scene.
   * @returns The scene.
   */
  public getScene(): any {
    return this.model.scene;
  }
  
  /**
   * Get the controller.
   * @returns The controller.
   */
  public getController(): Controller {
    return this.controller;
  }
  
  /**
   * Get the camera.
   * @returns The camera.
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  /**
   * Mark the scene as needing an update.
   */
  public needsUpdate(): void {
    this.needsUpdate = true;
  }

  /**
   * Check if the scene needs to be rendered.
   * @returns Whether the scene needs rendering.
   */
  private shouldRender(): boolean {
    // Do we need to draw a new frame
    if (
      this.controls.needsUpdate ||
      this.controller.needsUpdate ||
      this.needsUpdate ||
      this.model.scene.needsUpdate
    ) {
      this.controls.needsUpdate = false;
      this.controller.needsUpdate = false;
      this.needsUpdate = false;
      this.model.scene.needsUpdate = false;
      return true;
    } else {
      return false;
    }
  }

  /**
   * Render the scene.
   */
  private render(): void {
    try {
      this.spin();
      if (this.shouldRender()) {
        this.renderer.clear();
        this.renderer.render(this.model.scene.getScene(), this.camera);
        this.renderer.clearDepth();
        this.renderer.render(this.hud.getScene(), this.camera);
      }
      this.lastRender = Date.now();
    } catch (error) {
      console.error('Error rendering scene:', error);
    }
  }

  /**
   * Start the animation loop.
   */
  private animate(): void {
    const delay = 50;
    setTimeout(() => {
      try {
        requestAnimationFrame(() => this.animate());
        this.render();
      } catch (error) {
        console.error('Error in animation loop:', error);
      }
    }, delay);
  }

  /**
   * Notify that the rotate button was pressed.
   */
  public rotatePressed(): void {
    this.controller.rotatePressed();
  }

  /**
   * Notify that the rotate button was released.
   */
  public rotateReleased(): void {
    this.controller.rotateReleased();
  }

  /**
   * Set the cursor style.
   * @param cursorStyle The CSS cursor style.
   */
  public setCursorStyle(cursorStyle: string): void {
    this.domElement.style.cursor = cursorStyle;
  }

  /**
   * Update the window size.
   */
  public updateWindowSize(): void {
    try {
      this.heightMargin = this.element.offset().top;
      this.widthMargin = this.element.offset().left;

      this.elementWidth = this.element.innerWidth();
      if (this.options.resize) {
        this.elementHeight = window.innerHeight - this.heightMargin;
      } else {
        this.elementHeight = this.element.innerHeight();
      }

      this.camera.aspect = this.elementWidth / this.elementHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.elementWidth, this.elementHeight);
      this.needsUpdate = true;
    } catch (error) {
      console.error('Error updating window size:', error);
    }
  }

  /**
   * Center the camera on the floorplan.
   */
  public centerCamera(): void {
    try {
      const yOffset = 150.0;

      const pan = this.model.floorplan.getCenter();
      pan.y = yOffset;

      this.controls.target = pan;

      const distance = this.model.floorplan.getSize().z * 1.5;

      const offset = pan.clone().add(new THREE.Vector3(0, distance, distance));
      this.camera.position.copy(offset);

      this.controls.update();
    } catch (error) {
      console.error('Error centering camera:', error);
    }
  }

  /**
   * Projects a 3D vector to 2D screen coordinates.
   * @param vec3 The 3D vector to project.
   * @param ignoreMargin Whether to ignore the margin.
   * @returns The 2D coordinates.
   */
  public projectVector(vec3: THREE.Vector3, ignoreMargin?: boolean): THREE.Vector2 {
    ignoreMargin = ignoreMargin || false;

    try {
      const widthHalf = this.elementWidth / 2;
      const heightHalf = this.elementHeight / 2;

      const vector = new THREE.Vector3();
      vector.copy(vec3);
      vector.project(this.camera);

      const vec2 = new THREE.Vector2();

      vec2.x = vector.x * widthHalf + widthHalf;
      vec2.y = -(vector.y * heightHalf) + heightHalf;

      if (!ignoreMargin) {
        vec2.x += this.widthMargin;
        vec2.y += this.heightMargin;
      }

      return vec2;
    } catch (error) {
      console.error('Error projecting vector:', error);
      return new THREE.Vector2();
    }
  }
}

// Export as default
export default Main;

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Three = (globalThis as any).BP3D.Three || {};
  (globalThis as any).BP3D.Three.Main = Main;
}
