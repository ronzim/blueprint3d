  
import * as THREE from 'three';
import $ from 'jquery';
import { Controller } from './controller';
import { Floorplan } from './floorplan';
import { Lights } from './lights';
import { Skybox } from './skybox';
import { Controls } from './controls';
import { HUD } from './hud';
import { Model } from '../model/model';
import { Scene as ModelScene } from '../model/scene';

export class Main {
  private element: JQuery;
  public controls: Controls;
  private controller: Controller;
  public itemSelectedCallbacks = $.Callbacks();
  public itemUnselectedCallbacks = $.Callbacks();
  public wallClicked = $.Callbacks();
  public floorClicked = $.Callbacks();
  public nothingClicked = $.Callbacks();
  public heightMargin: number;
  public widthMargin: number;
  public elementHeight: number;
  public elementWidth: number;

  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private floorplan: Floorplan;
  private scene: ModelScene;

  private needsUpdateState = false;
  private lastRender = Date.now();
  private mouseOver = false;
  private hasClicked = false;
  private hud: HUD;
  private domElement: HTMLElement;
  private model: Model;
  private options: any;

  constructor(model: Model, element: string, canvasElement: string, opts) {
    this.model = model;
    this.scene = model.scene;

    this.options = {
      resize: true,
      pushHref: false,
      spin: true,
      spinSpeed: 0.00002,
      clickPan: true,
      canMoveFixedItems: false
    };

    for (var opt in opts) {
      if (this.options.hasOwnProperty(opt) && opts.hasOwnProperty(opt)) {
        this.options[opt] = opts[opt];
      }
    }

    this.element = $(element);

    this.domElement = this.element.get(0);
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.autoClear = false;
    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapType = THREE.PCFSoftShadowMap;

    var skybox = new Skybox(this.scene);

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

    this.updateWindowSize();
    if (this.options.resize) {
      $(window).resize(this.updateWindowSize.bind(this));
    }

    this.centerCamera();
    this.model.floorplan.fireOnUpdatedRooms(this.centerCamera.bind(this));

    var lights = new Lights(this.scene, this.model.floorplan);

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
      var theta = 2 * Math.PI * this.options.spinSpeed * (Date.now() - this.lastRender);
      this.controls.rotateLeft(theta);
      this.controls.update();
    }
  }

  public dataUrl() {
    var dataUrl = this.renderer.domElement.toDataURL("image/png");
    return dataUrl;
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

  public needsUpdate() {
    this.needsUpdateState = true;
  }

  private shouldRender() {
    if (
      this.controls.needsUpdate ||
      this.controller.needsUpdate ||
      this.needsUpdateState ||
      this.model.scene.needsUpdate
    ) {
      this.controls.needsUpdate = false;
      this.controller.needsUpdate = false;
      this.needsUpdateState = false;
      this.model.scene.needsUpdate = false;
      return true;
    } else {
      return false;
    }
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
    var delay = 50;
    setTimeout(() => {
      requestAnimationFrame(this.animate.bind(this));
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

  public updateWindowSize() {
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
    this.needsUpdateState = true;
  }

  public centerCamera() {
    var yOffset = 150.0;

    var pan = this.model.floorplan.getCenter();
    pan.y = yOffset;

    this.controls.target = pan;

    var distance = this.model.floorplan.getSize().z * 1.5;

    var offset = pan.clone().add(new THREE.Vector3(0, distance, distance));
    this.camera.position.copy(offset);

    this.controls.update();
  }

  public projectVector(vec3: THREE.Vector3, ignoreMargin?: boolean) {
    ignoreMargin = ignoreMargin || false;

    var widthHalf = this.elementWidth / 2;
    var heightHalf = this.elementHeight / 2;

    var vector = new THREE.Vector3();
    vector.copy(vec3);
    vector.project(this.camera);

    var vec2 = new THREE.Vector2();

    vec2.x = vector.x * widthHalf + widthHalf;
    vec2.y = -(vector.y * heightHalf) + heightHalf;

    if (!ignoreMargin) {
      vec2.x += this.widthMargin;
      vec2.y += this.heightMargin;
    }

    return vec2;
  }
}

