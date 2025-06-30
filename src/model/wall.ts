import * as THREE from 'three';
import $ from 'jquery';
import { Configuration, configWallThickness, configWallHeight } from '../core/configuration';
import { Utils } from '../core/utils';
import { Item } from '../items/item';
import { Corner } from './corner';
import { HalfEdge } from './half_edge';

export const defaultWallTexture = {
  url: "rooms/textures/wallmap.png",
  stretch: true,
  scale: 0
};

export class Wall {
  private id: string;
  public frontEdge: HalfEdge = null;
  public backEdge: HalfEdge = null;
  public orphan = false;
  public items: Item[] = [];
  public onItems: Item[] = [];
  public frontTexture = defaultWallTexture;
  public backTexture = defaultWallTexture;
  public thickness = Configuration.getNumericValue(
    configWallThickness
  );
  public height = Configuration.getNumericValue(configWallHeight);
  private moved_callbacks = $.Callbacks();
  private deleted_callbacks = $.Callbacks();
  private action_callbacks = $.Callbacks();

  constructor(private start: Corner, private end: Corner) {
    this.id = this.getUuid();
    this.start.attachStart(this);
    this.end.attachEnd(this);
  }

  private getUuid(): string {
    return [this.start.id, this.end.id].join();
  }

  public resetFrontBack() {
    this.frontEdge = null;
    this.backEdge = null;
    this.orphan = false;
  }

  private snapToAxis(tolerance: number) {
    this.start.snapToAxis(tolerance);
    this.end.snapToAxis(tolerance);
  }

  public fireOnMove(func) {
    this.moved_callbacks.add(func);
  }

  public fireOnDelete(func) {
    this.deleted_callbacks.add(func);
  }

  public dontFireOnDelete(func) {
    this.deleted_callbacks.remove(func);
  }

  public fireOnAction(func) {
    this.action_callbacks.add(func);
  }

  public fireAction(action) {
    this.action_callbacks.fire(action);
  }

  private relativeMove(dx: number, dy: number) {
    this.start.relativeMove(dx, dy);
    this.end.relativeMove(dx, dy);
  }

  public fireMoved() {
    this.moved_callbacks.fire();
  }

  public fireRedraw() {
    if (this.frontEdge) {
      this.frontEdge.redrawCallbacks.fire();
    }
    if (this.backEdge) {
      this.backEdge.redrawCallbacks.fire();
    }
  }

  public getStart(): Corner {
    return this.start;
  }

  public getEnd(): Corner {
    return this.end;
  }

  public getStartX(): number {
    return this.start.getX();
  }

  public getEndX(): number {
    return this.end.getX();
  }

  public getStartY(): number {
    return this.start.getY();
  }

  public getEndY(): number {
    return this.end.getY();
  }

  public remove() {
    this.start.detachWall(this);
    this.end.detachWall(this);
    this.deleted_callbacks.fire(this);
  }

  public setStart(corner: Corner) {
    this.start.detachWall(this);
    corner.attachStart(this);
    this.start = corner;
    this.fireMoved();
  }

  public setEnd(corner: Corner) {
    this.end.detachWall(this);
    corner.attachEnd(this);
    this.end = corner;
    this.fireMoved();
  }

  public distanceFrom(x: number, y: number): number {
    return Utils.pointDistanceFromLine(
      x,
      y,
      this.getStartX(),
      this.getStartY(),
      this.getEndX(),
      this.getEndY()
    );
  }

  private oppositeCorner(corner: Corner): Corner {
    if (this.start === corner) {
      return this.end;
    } else if (this.end === corner) {
      return this.start;
    } else {
      console.log("Wall does not connect to corner");
    }
  }
}
