import * as THREE from 'three';
import $ from 'jquery';

// Import types for type checking, but use dynamic imports for instantiation to avoid circular deps
import type { Floorplan } from './floorplan';
import type { Scene } from './scene';

/**
 * A Model connects a Floorplan and a Scene.
 */
export class Model {
  /** */
  public floorplan: Floorplan;

  /** */
  public scene: Scene;

  /** */
  private roomLoadingCallbacks = $.Callbacks();

  /** */
  private roomLoadedCallbacks = $.Callbacks();

  /** name */
  private roomSavedCallbacks = $.Callbacks();

  /** success (bool), copy (bool) */
  private roomDeletedCallbacks = $.Callbacks();

  /** Constructs a new model.
   * @param textureDir The directory containing the textures.
   */
  constructor(textureDir: string) {
    // Use dynamic imports to resolve circular dependencies
    const { Floorplan } = require('./floorplan');
    const { Scene } = require('./scene');
    
    this.floorplan = new Floorplan();
    this.scene = new Scene(this, textureDir);
  }

  /**
   * Load the model from a serialized JSON string
   * @param json The JSON string to load
   */
  public loadSerialized(json: string) {
    // TODO: better documentation on serialization format.
    // TODO: a much better serialization format.
    this.roomLoadingCallbacks.fire();

    const data = JSON.parse(json);
    this.newRoom(data.floorplan, data.items);

    this.roomLoadedCallbacks.fire();
  }

  /**
   * Export the model as a serialized JSON string
   * @returns The serialized model as a JSON string
   */
  public exportSerialized(): string {
    const items_arr = [];
    const objects = this.scene.getItems();
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      items_arr[i] = {
        item_name: object.metadata.itemName,
        item_type: object.metadata.itemType,
        model_url: object.metadata.modelUrl,
        xpos: object.position.x,
        ypos: object.position.y,
        zpos: object.position.z,
        rotation: object.rotation.y,
        scale_x: object.scale.x,
        scale_y: object.scale.y,
        scale_z: object.scale.z,
        fixed: object.fixed
      };
    }

    const room = {
      floorplan: this.floorplan.saveFloorplan(),
      items: items_arr
    };

    return JSON.stringify(room);
  }

  /**
   * Create a new room from floorplan and items data
   * @param floorplan The floorplan data to load
   * @param items The items to add to the scene
   */
  private newRoom(floorplan: string, items: any[]) {
    this.scene.clearItems();
    this.floorplan.loadFloorplan(floorplan);
    items.forEach(item => {
      const position = new THREE.Vector3(item.xpos, item.ypos, item.zpos);
      const metadata = {
        itemName: item.item_name,
        resizable: item.resizable,
        itemType: item.item_type,
        modelUrl: item.model_url
      };
      const scale = new THREE.Vector3(item.scale_x, item.scale_y, item.scale_z);
      this.scene.addItem(
        item.item_type,
        item.model_url,
        metadata,
        position,
        item.rotation,
        scale,
        item.fixed
      );
    });
  }
}

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Model.Model = Model;
}

// Export as default
export default Model;
