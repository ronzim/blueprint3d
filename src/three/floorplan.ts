import * as THREE from 'three';
import { Floor } from './floor';
import { Edge } from './edge';
import { Floorplan as ModelFloorplan } from '../model/floorplan';
import { Scene as ModelScene } from '../model/scene';
import { Controls } from './controls';

export class Floorplan {
  private scene: ModelScene;
  private floorplan: ModelFloorplan;
  private controls: Controls;

  public floors: Floor[] = [];
  public edges: Edge[] = [];

  constructor(scene: ModelScene, floorplan: ModelFloorplan, controls: Controls) {
    this.scene = scene;
    this.floorplan = floorplan;
    this.controls = controls;

    this.floorplan.fireOnUpdatedRooms(this.redraw.bind(this));
  }

  private redraw() {
    this.floors.forEach((floor) => {
      floor.removeFromScene();
    });

    this.edges.forEach((edge) => {
      edge.remove();
    });
    this.floors = [];
    this.edges = [];

    this.floorplan.getRooms().forEach((room) => {
      var threeFloor = new Floor(this.scene, room);
      this.floors.push(threeFloor);
      threeFloor.addToScene();
    });

    this.floorplan.wallEdges().forEach((edge) => {
      var threeEdge = new Edge(
        this.scene, edge, this.controls);
      this.edges.push(threeEdge);
    });
  }
}
