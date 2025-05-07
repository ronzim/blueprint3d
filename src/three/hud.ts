import * as THREE from 'three';
import * as Utils from '../core/utils';

// Import types to avoid circular dependencies
import type { Main } from './main';

/**
 * Drawings on "top" of the scene. e.g. rotate arrows
 */
export class HUD {
  // References
  private three: Main;
  private scene: THREE.Scene;
  
  // Selection state
  private selectedItem: any = null;
  private activeObject: THREE.Object3D = null;
  
  // Visual state
  private rotating: boolean = false;
  private mouseover: boolean = false;
  
  // Configuration
  private tolerance: number = 10;
  private height: number = 5;
  private distance: number = 20;
  private color: string = "#ffffff";
  private hoverColor: string = "#f1c40f";
  
  /**
   * Create a new HUD
   * @param three The main Three.js controller
   */
  constructor(three: Main) {
    this.three = three;
    this.scene = new THREE.Scene();
    
    // Initialize
    this.init();
  }
  
  /**
   * Get the HUD scene
   * @returns The THREE.Scene for the HUD
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }
  
  /**
   * Get the active object
   * @returns The active object or null
   */
  public getObject(): THREE.Object3D {
    return this.activeObject;
  }
  
  /**
   * Initialize the HUD
   */
  private init(): void {
    this.three.itemSelectedCallbacks.add(this.itemSelected.bind(this));
    this.three.itemUnselectedCallbacks.add(this.itemUnselected.bind(this));
  }
  
  /**
   * Reset the selected item
   */
  private resetSelectedItem(): void {
    this.selectedItem = null;
    if (this.activeObject) {
      this.scene.remove(this.activeObject);
      this.activeObject = null;
    }
  }
  
  /**
   * Handle item selection
   * @param item The selected item
   */
  private itemSelected(item: any): void {
    if (this.selectedItem != item) {
      this.resetSelectedItem();
      if (item.allowRotate && !item.fixed) {
        this.selectedItem = item;
        this.activeObject = this.makeObject(this.selectedItem);
        this.scene.add(this.activeObject);
      }
    }
  }
  
  /**
   * Handle item deselection
   */
  private itemUnselected(): void {
    this.resetSelectedItem();
  }
  /**
   * Set rotation state
   * @param isRotating Whether the item is rotating
   */
  public setRotating(isRotating: boolean): void {
    this.rotating = isRotating;
    this.setColor();
  }
  
  /**
   * Set mouseover state
   * @param isMousedOver Whether the mouse is over the item
   */
  public setMouseover(isMousedOver: boolean): void {
    this.mouseover = isMousedOver;
    this.setColor();
  }
  
  /**
   * Set the color of the HUD elements
   */
  private setColor(): void {
    if (this.activeObject) {
      this.activeObject.children.forEach((obj: THREE.Mesh) => {
        if (obj.material) {
          (obj.material as THREE.Material).color.set(this.getColor());
        }
      });
    }
    this.three.needsUpdate();
  }
  
  /**
   * Get the current color based on state
   * @returns The color string
   */
  private getColor(): string {
    return (this.mouseover || this.rotating) ? this.hoverColor : this.color;
  }
  
  /**
   * Update the HUD position
   */
  public update(): void {
    if (this.activeObject && this.selectedItem) {
      this.activeObject.rotation.y = this.selectedItem.rotation.y;
      this.activeObject.position.x = this.selectedItem.position.x;
      this.activeObject.position.z = this.selectedItem.position.z;
    }
  }
  /**
   * Create line geometry for rotation indicator
   * @param item The item to create geometry for
   * @returns A new THREE.Geometry
   */
  private makeLineGeometry(item: any): THREE.Geometry {
    const geometry = new THREE.Geometry();
    
    geometry.vertices.push(
      new THREE.Vector3(0, 0, 0),
      this.rotateVector(item)
    );
    
    return geometry;
  }
  
  /**
   * Calculate the vector for rotation indicator
   * @param item The item to calculate for
   * @returns A new THREE.Vector3
   */
  private rotateVector(item: any): THREE.Vector3 {
    return new THREE.Vector3(
      0, 0,
      Math.max(item.halfSize.x, item.halfSize.z) + 1.4 + this.distance
    );
  }
  
  /**
   * Create line material
   * @param rotating Whether the item is rotating
   * @returns A new THREE.LineBasicMaterial
   */
  private makeLineMaterial(rotating: boolean): THREE.LineBasicMaterial {
    return new THREE.LineBasicMaterial({
      color: this.getColor(),
      linewidth: 3
    });
  }
  
  /**
   * Create cone for rotation indicator
   * @param item The item to create for
   * @returns A new THREE.Mesh
   */
  private makeCone(item: any): THREE.Mesh {
    const coneGeo = new THREE.CylinderGeometry(5, 0, 10);
    const coneMat = new THREE.MeshBasicMaterial({
      color: this.getColor()
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(this.rotateVector(item));
    
    cone.rotation.x = -Math.PI / 2.0;
    
    return cone;
  }
  
  /**
   * Create sphere for rotation indicator
   * @param item The item to create for
   * @returns A new THREE.Mesh
   */
  private makeSphere(item: any): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(4, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: this.getColor()
    });
    return new THREE.Mesh(geometry, material);
  }
  /**
   * Create complete object for rotation indicator
   * @param item The item to create for
   * @returns A new THREE.Object3D
   */
  private makeObject(item: any): THREE.Object3D {
    const object = new THREE.Object3D();
    
    const line = new THREE.Line(
      this.makeLineGeometry(item),
      this.makeLineMaterial(this.rotating),
      THREE.LinePieces
    );
    
    const cone = this.makeCone(item);
    const sphere = this.makeSphere(item);
    
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

// Export as default
export default HUD;

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Three = (globalThis as any).BP3D.Three || {};
  (globalThis as any).BP3D.Three.HUD = HUD;
}
