import * as THREE from 'three';
import $ from 'jquery';
import { Utils } from '../core/utils';
import { Item } from '../items/item';
import { Factory } from '../items/factory';
import { Model } from './model';

export class Scene {
  private scene: THREE.Scene;
  private items: Item[] = [];
  public needsUpdate = false;
  private loader: THREE.ObjectLoader;
  private itemLoadingCallbacks = $.Callbacks();
  private itemLoadedCallbacks = $.Callbacks();
  private itemRemovedCallbacks = $.Callbacks();

  constructor(private model: Model, private textureDir: string) {
    this.scene = new THREE.Scene();
    this.loader = new THREE.ObjectLoader();
  }

  public add(mesh: THREE.Mesh) {
    this.scene.add(mesh);
  }

  public remove(mesh: THREE.Mesh) {
    this.scene.remove(mesh);
    Utils.removeValue(this.items, mesh);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getItems(): Item[] {
    return this.items;
  }

  public itemCount(): number {
    return this.items.length;
  }

  public clearItems() {
    var items_copy = this.items;
    var scope = this;
    this.items.forEach(item => {
      scope.removeItem(item, true);
    });
    this.items = [];
  }

  public removeItem(item: Item, dontRemove?: boolean) {
    dontRemove = dontRemove || false;
    this.itemRemovedCallbacks.fire(item);
    item.removed();
    this.scene.remove(item);
    if (!dontRemove) {
      Utils.removeValue(this.items, item);
    }
  }

  public addItem(
    itemType: number,
    fileName: string,
    metadata,
    position: THREE.Vector3,
    rotation: number,
    scale: THREE.Vector3,
    fixed: boolean
  ) {
    itemType = itemType || 1;
    var scope = this;
    var loaderCallback = function (
      object: THREE.Object3D
    ) {
      var item = new (Factory.getClass(itemType))(
        scope.model,
        metadata,
        object,
        new THREE.MeshStandardMaterial(),
        position,
        rotation,
        scale
      );
      item.fixed = fixed || false;
      scope.items.push(item);
      scope.add(item);
      item.initObject();
      scope.itemLoadedCallbacks.fire(item);
    };

    this.itemLoadingCallbacks.fire();
    this.loader.load(
      fileName,
      loaderCallback,
      undefined
    );
  }
}
