import * as THREE from 'three';
import $ from 'jquery';
import * as Utils from '../core/utils';

// Import types to avoid circular dependencies
import type { Main } from './main';
import type { Model } from '../model/model';
import type { Controls } from './controls';
import type { HUD } from './hud';

// Define controller states
export enum ControllerStates {
  UNSELECTED = 0, // no object selected
  SELECTED = 1, // selected but inactive
  DRAGGING = 2, // performing an action while mouse depressed
  ROTATING = 3, // rotating with mouse down
  ROTATING_FREE = 4, // rotating with mouse up
  PANNING = 5
}

/**
 * The Controller handles all interaction between the user and the model.
 */
export class Controller {
  // Public properties
  public enabled: boolean = true;
  public needsUpdate: boolean = true;
  
  // Private references to external components
  private three: Main;
  private model: Model;
  private scene: any;  // Scene from the model
  private element: JQuery;
  private camera: THREE.Camera;
  private controls: Controls;
  private hud: HUD;
  
  // Intersection testing
  private plane: THREE.Mesh; // ground plane for intersection testing
  private mouse: THREE.Vector2;
  
  // Object selection and interaction state
  private intersectedObject: any = null;
  private mouseoverObject: any = null;
  private selectedObject: any = null;
  
  // Mouse state tracking
  private mouseDown: boolean = false;
  private mouseMoved: boolean = false;
  private rotateMouseOver: boolean = false;
  
  // Current controller state
  private state: ControllerStates = ControllerStates.UNSELECTED;
  /**
   * Constructor for the controller
   * @param three The main Three.js manager
   * @param model The model being edited
   * @param camera The camera
   * @param element The jQuery element containing the viewer
   * @param controls The orbit controls
   * @param hud The HUD overlay
   */
  constructor(
    three: Main,
    model: Model,
    camera: THREE.Camera,
    element: JQuery,
    controls: Controls,
    hud: HUD
  ) {
    this.three = three;
    this.model = model;
    this.scene = model.scene;
    this.element = element;
    this.camera = camera;
    this.controls = controls;
    this.hud = hud;
    
    this.mouse = new THREE.Vector2();
    
    this.init();
  }
  
  /**
   * Initialize the controller
   */
  private init(): void {
    // Set up event listeners
    this.element.mousedown(this.mouseDownEvent.bind(this));
    this.element.mouseup(this.mouseUpEvent.bind(this));
    this.element.mousemove(this.mouseMoveEvent.bind(this));
    
    // Add callbacks for item loading/removal
    this.scene.itemRemovedCallbacks.add(this.itemRemoved.bind(this));
    this.scene.itemLoadedCallbacks.add(this.itemLoaded.bind(this));
    
    // Set up ground plane for intersection testing
    this.setGroundPlane();
  }
  /**
   * Handle item loaded
   * @param item The loaded item
   */
  private itemLoaded(item: any): void {
    if (!item.position_set) {
      this.setSelectedObject(item);
      this.switchState(ControllerStates.DRAGGING);
      const pos = item.position.clone();
      pos.y = 0;
      const vec = this.three.projectVector(pos);
      this.clickPressed(vec);
    }
    item.position_set = true;
  }
  
  /**
   * Handle a click press on an item
   * @param vec2 Optional vector to use instead of mouse position
   */
  private clickPressed(vec2?: THREE.Vector2): void {
    vec2 = vec2 || this.mouse;
    const intersection = this.itemIntersection(vec2, this.selectedObject);
    if (intersection) {
      this.selectedObject.clickPressed(intersection);
    }
  }
  
  /**
   * Handle drag interaction
   * @param vec2 Optional vector to use instead of mouse position
   */
  private clickDragged(vec2?: THREE.Vector2): void {
    vec2 = vec2 || this.mouse;
    const intersection = this.itemIntersection(vec2, this.selectedObject);
    if (intersection) {
      if (this.isRotating()) {
        this.selectedObject.rotate(intersection);
      } else {
        this.selectedObject.clickDragged(intersection);
      }
    }
  }
  
  /**
   * Handle item removal
   * @param item The item being removed
   */
  private itemRemoved(item: any): void {
    // invoked as a callback to event in Scene
    if (item === this.selectedObject) {
      this.selectedObject.setUnselected();
      this.selectedObject.mouseOff();
      this.setSelectedObject(null);
    }
  }
  /**
   * Set up the ground plane for intersection testing
   */
  private setGroundPlane(): void {
    // ground plane used to find intersections
    const size = 10000;
    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial()
    );
    this.plane.rotation.x = -Math.PI / 2;
    this.plane.visible = false;
    this.scene.add(this.plane);
  }
  
  /**
   * Check for wall and floor intersections
   */
  private checkWallsAndFloors(): void {
    try {
      // double click on a wall or floor brings up texture change modal
      if (this.state === ControllerStates.UNSELECTED && this.mouseoverObject === null) {
        // check walls
        const wallEdgePlanes = this.model.floorplan.wallEdgePlanes();
        const wallIntersects = this.getIntersections(
          this.mouse,
          wallEdgePlanes,
          true
        );
        
        if (wallIntersects.length > 0) {
          const wall = wallIntersects[0].object.edge;
          this.three.wallClicked.fire(wall);
          return;
        }
        
        // check floors
        const floorPlanes = this.model.floorplan.floorPlanes();
        const floorIntersects = this.getIntersections(this.mouse, floorPlanes, false);
        
        if (floorIntersects.length > 0) {
          const room = floorIntersects[0].object.room;
          this.three.floorClicked.fire(room);
          return;
        }
        
        this.three.nothingClicked.fire();
      }
    } catch (error) {
      console.error('Error checking walls and floors:', error);
    }
  }
  /**
   * Handle mouse move events
   * @param event The mouse event
   */
  private mouseMoveEvent(event: JQuery.MouseMoveEvent): void {
    if (!this.enabled) return;
    
    try {
      event.preventDefault();
      
      this.mouseMoved = true;
      
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
      
      if (!this.mouseDown) {
        this.updateIntersections();
      }
      
      switch (this.state) {
        case ControllerStates.UNSELECTED:
        case ControllerStates.SELECTED:
          this.updateMouseover();
          break;
        case ControllerStates.DRAGGING:
        case ControllerStates.ROTATING:
        case ControllerStates.ROTATING_FREE:
          this.clickDragged();
          this.hud.update();
          this.needsUpdate = true;
          break;
      }
    } catch (error) {
      console.error('Error in mouseMoveEvent:', error);
    }
  }
  /**
   * Handle mouse down events
   * @param event The mouse event
   */
  private mouseDownEvent(event: JQuery.MouseDownEvent): void {
    if (!this.enabled) return;
    
    try {
      event.preventDefault();
      
      this.mouseMoved = false;
      this.mouseDown = true;
      
      switch (this.state) {
        case ControllerStates.SELECTED:
          if (this.rotateMouseOver) {
            this.switchState(ControllerStates.ROTATING);
          } else if (this.intersectedObject != null) {
            this.setSelectedObject(this.intersectedObject);
            if (!this.intersectedObject.fixed) {
              this.switchState(ControllerStates.DRAGGING);
            }
          }
          break;
        case ControllerStates.UNSELECTED:
          if (this.intersectedObject != null) {
            this.setSelectedObject(this.intersectedObject);
            if (!this.intersectedObject.fixed) {
              this.switchState(ControllerStates.DRAGGING);
            }
          }
          break;
        case ControllerStates.DRAGGING:
        case ControllerStates.ROTATING:
          break;
        case ControllerStates.ROTATING_FREE:
          this.switchState(ControllerStates.SELECTED);
          break;
      }
    } catch (error) {
      console.error('Error in mouseDownEvent:', error);
    }
  }
  
  /**
   * Handle mouse up events
   * @param event The mouse event
   */
  private mouseUpEvent(event: JQuery.MouseUpEvent): void {
    if (!this.enabled) return;
    
    try {
      this.mouseDown = false;
      
      switch (this.state) {
        case ControllerStates.DRAGGING:
          this.selectedObject.clickReleased();
          this.switchState(ControllerStates.SELECTED);
          break;
        case ControllerStates.ROTATING:
          if (!this.mouseMoved) {
            this.switchState(ControllerStates.ROTATING_FREE);
          } else {
            this.switchState(ControllerStates.SELECTED);
          }
          break;
        case ControllerStates.UNSELECTED:
          if (!this.mouseMoved) {
            this.checkWallsAndFloors();
          }
          break;
        case ControllerStates.SELECTED:
          if (this.intersectedObject == null && !this.mouseMoved) {
            this.switchState(ControllerStates.UNSELECTED);
            this.checkWallsAndFloors();
          }
          break;
        case ControllerStates.ROTATING_FREE:
          break;
      }
    } catch (error) {
      console.error('Error in mouseUpEvent:', error);
    }
  }
  /**
   * Switch from one controller state to another
   * @param newState The new state to switch to
   */
  private switchState(newState: ControllerStates): void {
    try {
      if (newState != this.state) {
        this.onExit(this.state);
        this.onEntry(newState);
      }
      this.state = newState;
      this.hud.setRotating(this.isRotating());
    } catch (error) {
      console.error('Error switching state:', error);
    }
  }
  
  /**
   * Handle entry to a state
   * @param state The state to enter
   */
  private onEntry(state: ControllerStates): void {
    try {
      switch (state) {
        case ControllerStates.UNSELECTED:
          this.setSelectedObject(null);
          // Intentional fall-through
        case ControllerStates.SELECTED:
          this.controls.enabled = true;
          break;
        case ControllerStates.ROTATING:
        case ControllerStates.ROTATING_FREE:
          this.controls.enabled = false;
          break;
        case ControllerStates.DRAGGING:
          this.three.setCursorStyle("move");
          this.clickPressed();
          this.controls.enabled = false;
          break;
      }
    } catch (error) {
      console.error('Error in onEntry:', error);
    }
  }
  
  /**
   * Handle exit from a state
   * @param state The state to exit
   */
  private onExit(state: ControllerStates): void {
    try {
      switch (state) {
        case ControllerStates.UNSELECTED:
        case ControllerStates.SELECTED:
          break;
        case ControllerStates.DRAGGING:
          if (this.mouseoverObject) {
            this.three.setCursorStyle("pointer");
          } else {
            this.three.setCursorStyle("auto");
          }
          break;
        case ControllerStates.ROTATING:
        case ControllerStates.ROTATING_FREE:
          break;
      }
    } catch (error) {
      console.error('Error in onExit:', error);
    }
  }
  /**
   * Get the currently selected object
   * @returns The selected object or null
   */
  public getSelectedObject(): any {
    return this.selectedObject;
  }
  
  /**
   * Check if controller is in a rotating state
   * @returns True if in rotating state
   */
  public isRotating(): boolean {
    return this.state === ControllerStates.ROTATING || 
           this.state === ControllerStates.ROTATING_FREE;
  }
  
  /**
   * Updates the intersection with the plane at the mouse position
   * and updates the intersected object, both may be null if no intersection found
   */
  private updateIntersections(): void {
    try {
      // Check the rotate arrow
      const hudObject = this.hud.getObject();
      if (hudObject != null) {
        const hudIntersects = this.getIntersections(
          this.mouse,
          hudObject,
          false,
          false,
          true
        );
        if (hudIntersects.length > 0) {
          this.rotateMouseOver = true;
          this.hud.setMouseover(true);
          this.intersectedObject = null;
          return;
        }
      }
      this.rotateMouseOver = false;
      this.hud.setMouseover(false);
      
      // Check objects
      const items = this.model.scene.getItems();
      const intersects = this.getIntersections(this.mouse, items, false, true);
      
      if (intersects.length > 0) {
        this.intersectedObject = intersects[0].object;
      } else {
        this.intersectedObject = null;
      }
    } catch (error) {
      console.error('Error updating intersections:', error);
    }
  }
  
  /**
   * Normalize a 2D vector to a range of -1 to 1
   * @param vec2 The 2D vector to normalize
   * @returns The normalized vector
   */
  private normalizeVector2(vec2: THREE.Vector2): THREE.Vector2 {
    try {
      const retVec = new THREE.Vector2();
      
      retVec.x = ((vec2.x - this.three.widthMargin) / 
                  (window.innerWidth - this.three.widthMargin)) * 2 - 1;
                  
      retVec.y = -((vec2.y - this.three.heightMargin) / 
                  (window.innerHeight - this.three.heightMargin)) * 2 + 1;
                  
      return retVec;
    } catch (error) {
      console.error('Error normalizing vector:', error);
      return new THREE.Vector2();
    }
  }
  
  /**
   * Convert mouse coordinates to a 3D vector
   * @param vec2 The 2D mouse coordinates
   * @returns The 3D vector for raycasting
   */
  private mouseToVec3(vec2: THREE.Vector2): THREE.Vector3 {
    try {
      const normVec2 = this.normalizeVector2(vec2);
      const vector = new THREE.Vector3(normVec2.x, normVec2.y, 0.5);
      vector.unproject(this.camera);
      return vector;
    } catch (error) {
      console.error('Error converting mouse to vector:', error);
      return new THREE.Vector3();
    }
  }
  
  /**
   * Get the first intersection with an item
   * @param vec2 The 2D mouse coordinates
   * @param item The item to test for intersection
   * @returns The intersection or null
   */
  public itemIntersection(vec2: THREE.Vector2, item: any): THREE.Intersection | null {
    try {
      if (!item) return null;
      
      const customIntersections = item.customIntersectionPlanes();
      let intersections = null;
      
      if (customIntersections && customIntersections.length > 0) {
        intersections = this.getIntersections(vec2, customIntersections, true);
      } else {
        intersections = this.getIntersections(vec2, this.plane);
      }
      
      if (intersections.length > 0) {
        return intersections[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error in itemIntersection:', error);
      return null;
    }
  }
  
  /**
   * Get intersections with objects
   * Filter by normals will only return objects facing the camera
   * Objects can be an array of objects or a single object
   * @param vec2 The 2D mouse coordinates
   * @param objects The objects to test
   * @param filterByNormals Whether to filter by normals
   * @param onlyVisible Whether to only include visible objects
   * @param recursive Whether to recursively check children
   * @param linePrecision The line precision for the raycaster
   * @returns Array of intersections
   */
  public getIntersections(
    vec2: THREE.Vector2,
    objects: THREE.Object3D | THREE.Object3D[],
    filterByNormals: boolean = false,
    onlyVisible: boolean = false,
    recursive: boolean = false,
    linePrecision: number = 20
  ): THREE.Intersection[] {
    try {
      const vector = this.mouseToVec3(vec2);
      
      const direction = vector.sub(this.camera.position).normalize();
      const raycaster = new THREE.Raycaster(this.camera.position, direction);
      raycaster.linePrecision = linePrecision;
      
      let intersections;
      if (objects instanceof Array) {
        intersections = raycaster.intersectObjects(objects, recursive);
      } else {
        intersections = raycaster.intersectObject(objects, recursive);
      }
      
      // Filter by visible, if true
      if (onlyVisible) {
        intersections = Utils.removeIf(
          intersections,
          (intersection) => !intersection.object.visible
        );
      }
      
      // Filter by normals, if true
      if (filterByNormals) {
        intersections = Utils.removeIf(
          intersections,
          (intersection) => {
            if (!intersection.face) return false;
            const dot = intersection.face.normal.dot(direction);
            return dot > 0;
          }
        );
      }
      
      return intersections;
    } catch (error) {
      console.error('Error in getIntersections:', error);
      return [];
    }
  }
  
  /**
   * Set the selected object
   * @param object The object to select, or null to deselect
   */
  public setSelectedObject(object: any): void {
    try {
      if (this.state === ControllerStates.UNSELECTED) {
        this.switchState(ControllerStates.SELECTED);
      }
      
      if (this.selectedObject != null) {
        this.selectedObject.setUnselected();
      }
      
      if (object != null) {
        this.selectedObject = object;
        this.selectedObject.setSelected();
        this.three.itemSelectedCallbacks.fire(object);
      } else {
        this.selectedObject = null;
        this.three.itemUnselectedCallbacks.fire();
      }
      
      this.needsUpdate = true;
    } catch (error) {
      console.error('Error setting selected object:', error);
    }
  }
  
  /**
   * Update the mouseover status of objects
   */
  private updateMouseover(): void {
    try {
      if (this.intersectedObject != null) {
        if (this.mouseoverObject != null) {
          if (this.mouseoverObject !== this.intersectedObject) {
            this.mouseoverObject.mouseOff();
            this.mouseoverObject = this.intersectedObject;
            this.mouseoverObject.mouseOver();
            this.needsUpdate = true;
          }
          // If they're the same, do nothing - mouseover already set
        } else {
          this.mouseoverObject = this.intersectedObject;
          this.mouseoverObject.mouseOver();
          this.three.setCursorStyle("pointer");
          this.needsUpdate = true;
        }
      } else if (this.mouseoverObject != null) {
        this.mouseoverObject.mouseOff();
        this.three.setCursorStyle("auto");
        this.mouseoverObject = null;
        this.needsUpdate = true;
      }
    } catch (error) {
      console.error('Error updating mouseover:', error);
    }
  }
}

// Export as default
export default Controller;

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Three = (globalThis as any).BP3D.Three || {};
  (globalThis as any).BP3D.Three.Controller = Controller;
  (globalThis as any).BP3D.Three.ControllerStates = ControllerStates;
}
