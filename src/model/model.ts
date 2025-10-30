import * as THREE from 'three';
import { EventEmitter } from '../core/event_emitter';
import { Floorplan } from './floorplan';
import { Scene } from './scene';

export class Model extends EventEmitter {
  public floorplan: Floorplan;
  public scene: Scene;
  public roomLoadingCallbacks = {
    add: (listener: () => void) => this.on('roomLoading', listener),
    fire: () => this.emit('roomLoading')
  };
  public roomLoadedCallbacks = {
    add: (listener: () => void) => this.on('roomLoaded', listener),
    fire: () => this.emit('roomLoaded')
  };
  public roomSavedCallbacks = {
    add: (listener: () => void) => this.on('roomSaved', listener),
    fire: () => this.emit('roomSaved')
  };
  public roomDeletedCallbacks = {
    add: (listener: () => void) => this.on('roomDeleted', listener),
    fire: () => this.emit('roomDeleted')
  };

  constructor(textureDir: string) {
    super();
    this.floorplan = new Floorplan();
    this.scene = new Scene(this, textureDir);
  }

  private loadSerialized(json: string) {
    this.roomLoadingCallbacks.fire();
    var data = JSON.parse(json);
    this.newRoom(data.floorplan, data.items);
    this.roomLoadedCallbacks.fire();
  }

  private exportSerialized(): string {
    var items_arr = [];
    var objects = this.scene.getItems();
    for (var i = 0; i < objects.length; i++) {
      var object = objects[i];
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
    var room = {
      floorplan: this.floorplan.saveFloorplan(),
      items: items_arr
    };
    return JSON.stringify(room);
  }

  private newRoom(floorplan: string, items) {
    this.scene.clearItems();
    this.floorplan.loadFloorplan(floorplan);
    items.forEach(item => {
      var position = new THREE.Vector3(item.xpos, item.ypos, item.zpos);
      var metadata = {
        itemName: item.item_name,
        resizable: item.resizable,
        itemType: item.item_type,
        modelUrl: item.model_url
      };
      var scale = new THREE.Vector3(item.scale_x, item.scale_y, item.scale_z);
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
