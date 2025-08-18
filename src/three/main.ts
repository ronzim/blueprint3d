import * as THREE from 'three';
import { Controller } from './controller';
import { Floorplan } from './floorplan';
import { Lights } from './lights';
import { Skybox } from './skybox';
import { Controls } from './controls';
import { HUD } from './hud';
import { Model } from '../model';

export class Main {
  private options: any;
  private scene: any;
  private model: Model;
  public element: JQuery;
  private domElement: HTMLElement;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  public controls: any;
  private canvas: any;
  private controller: any;
  private floorplan: any;
  private needsUpdate: boolean = false;
  private lastRender: number = Date.now();
  private mouseOver: boolean = false;
  private hasClicked: boolean = false;
  private hud: any;
  public heightMargin: number;
  public widthMargin: number;
  public elementHeight: number;
  public elementWidth: number;

  public itemSelectedCallbacks = $.Callbacks();
  public itemUnselectedCallbacks = $.Callbacks();
  public wallClicked = $.Callbacks();
  public floorClicked = $.Callbacks();
  public nothingClicked = $.Callbacks();

  constructor(model: Model, element: string, canvasElement: string, opts: any) {
    this.model = model;
    this.element = $(element);
    this.domElement = this.element.get(0);
    this.scene = model.scene;

    this.options = {
      resize: true,
      pushHref: false,
      spin: true,
      spinSpeed: 0.00002,
      clickPan: true,
      canMoveFixedItems: false,
    };

    // override with manually set options
    for (const opt in this.options) {
      if (this.options.hasOwnProperty(opt) && opts.hasOwnProperty(opt)) {
        this.options[opt] = opts[opt];
      }
    }

    this.init();
  }

  private init() {
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // required to support .toDataURL()
    });
    this.renderer.autoClear = false;
    (this.renderer as any).shadowMapEnabled = true;
    (this.renderer as any).shadowMapType = THREE.PCFSoftShadowMap;

    const skybox = new Skybox(this.scene);

    this.controls = new Controls(this.camera, this.domElement);

    this.hud = new HUD(this);

    this.controller = new Controller(
      this,
      this.model,
      this.camera,
      this.element,
      this.controls,
      this.hud
    );

    this.domElement.appendChild(this.renderer.domElement);

    // handle window resizing
    this.updateWindowSize();
    if (this.options.resize) {
      $(window).resize(this.updateWindowSize);
    }

    // setup camera nicely
    this.centerCamera();
    this.model.floorplan.fireOnUpdatedRooms(this.centerCamera);

    const lights = new Lights(this.scene, this.model.floorplan);

    this.floorplan = new Floorplan(this.scene, this.model.floorplan, this.controls);

    this.animate();

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

  private spin() {
    if (this.options.spin && !this.mouseOver && !this.hasClicked) {
      const theta = 2 * Math.PI * this.options.spinSpeed * (Date.now() - this.lastRender);
      this.controls.rotateLeft(theta);
      this.controls.update();
    }
  }

  public dataUrl() {
    return this.renderer.domElement.toDataURL('image/png');
  }

  public stopSpin() {
    this.hasClicked = true;
  }

  public getOptions() {
    return this.options;
  }

  public getModel() {
    return this.model;
  }

  public getScene() {
    return this.scene;
  }

  public getController() {
    return this.controller;
  }

  public getCamera() {
    return this.camera;
  }

  public needsUpdate_() {
    this.needsUpdate = true;
  }

  private shouldRender() {
    // Do we need to draw a new frame
    if (
      (this.controls as any).needsUpdate ||
      this.controller.needsUpdate ||
      this.needsUpdate ||
      this.model.scene.needsUpdate
    ) {
      (this.controls as any).needsUpdate = false;
      this.controller.needsUpdate = false;
      this.needsUpdate = false;
      this.model.scene.needsUpdate = false;
      return true;
    }
    return false;
  }

  private render() {
    this.spin();
    if (this.shouldRender()) {
      this.renderer.clear();
      this.renderer.render(this.scene.getScene(), this.camera);
      this.renderer.clearDepth();
      this.renderer.render(this.hud.getScene(), this.camera);
    }
    this.lastRender = Date.now();
  }

  private animate() {
    const delay = 50;
    setTimeout(() => {
      requestAnimationFrame(() => this.animate());
    }, delay);
    this.render();
  }

  public rotatePressed() {
    this.controller.rotatePressed();
  }

  public rotateReleased() {
    this.controller.rotateReleased();
  }

  public setCursorStyle(cursorStyle: string) {
    this.domElement.style.cursor = cursorStyle;
  }

  public updateWindowSize = () => {
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
  };

  public centerCamera = () => {
    const yOffset = 150.0;

    const pan = this.model.floorplan.getCenter();
    pan.y = yOffset;

    this.controls.target = pan;

    const distance = this.model.floorplan.getSize().z * 1.5;

    const offset = pan.clone().add(new THREE.Vector3(0, distance, distance));
    this.camera.position.copy(offset);

    this.controls.update();
  };

  public projectVector(vec3: THREE.Vector3, ignoreMargin: boolean = false) {
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
  }
}
