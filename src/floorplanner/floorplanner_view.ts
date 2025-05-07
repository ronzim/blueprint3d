import $ from 'jquery';
import * as Utils from '../core/utils';
import { Dimensioning } from '../core/dimensioning';

// Import types to avoid circular dependencies
import type { Floorplan } from '../model/floorplan';
import type { HalfEdge } from '../model/half_edge';
import type { Corner } from '../model/corner';
import type { Wall } from '../model/wall';
import type { Room } from '../model/room';

// Import from floorplanner.ts, using type import to avoid circular dependencies
import { floorplannerModes } from './floorplanner';
import type { Floorplanner } from './floorplanner';

// grid parameters
export const gridSpacing = 20; // pixels
export const gridWidth = 1;
export const gridColor = "#f1f1f1";

// room config
export const roomColor = "#f9f9f9";

// wall config
export const wallWidth = 5;
export const wallWidthHover = 7;
export const wallColor = "#dddddd";
export const wallColorHover = "#008cba";
export const edgeColor = "#888888";
export const edgeColorHover = "#008cba";
export const edgeWidth = 1;

export const deleteColor = "#ff0000";

// corner config
export const cornerRadius = 0;
export const cornerRadiusHover = 7;
export const cornerColor = "#cccccc";
export const cornerColorHover = "#008cba";

/**
 * The View to be used by a Floorplanner to render in/interact with.
 */
/**
 * The View to be used by a Floorplanner to render in/interact with.
 */
export class FloorplannerView {
  /** The canvas element. */
  private canvasElement: HTMLCanvasElement;

  /** The 2D context. */
  private context: CanvasRenderingContext2D;

  /**
   * Creates a new FloorplannerView.
   * @param floorplan The floorplan to render.
   * @param viewmodel The floorplanner viewmodel.
   * @param canvas The canvas element ID.
   */
  constructor(
    private floorplan: Floorplan,
    private viewmodel: Floorplanner,
    private canvas: string
  ) {
    this.canvasElement = <HTMLCanvasElement>document.getElementById(canvas);
    this.context = this.canvasElement.getContext("2d");

    var scope = this;
    $(window).resize(() => {
      scope.handleWindowResize();
    });
    this.handleWindowResize();
  }

  /** */
  public handleWindowResize() {
    var canvasSel = $("#" + this.canvas);
    var parent = canvasSel.parent();
    canvasSel.height(parent.innerHeight());
    canvasSel.width(parent.innerWidth());
    this.canvasElement.height = parent.innerHeight();
    this.canvasElement.width = parent.innerWidth();
    this.draw();
  }

  /** */
  public draw() {
    this.context.clearRect(
      0,
      0,
      this.canvasElement.width,
      this.canvasElement.height
    );

    this.drawGrid();

    this.floorplan.getRooms().forEach(room => {
      this.drawRoom(room);
    });

    this.floorplan.getWalls().forEach(wall => {
      this.drawWall(wall);
    });

    this.floorplan.getCorners().forEach(corner => {
      this.drawCorner(corner);
    });

    if (this.viewmodel.mode == floorplannerModes.DRAW) {
      this.drawTarget(
        this.viewmodel.targetX,
        this.viewmodel.targetY,
        this.viewmodel.lastNode
      );
    }

    this.floorplan.getWalls().forEach(wall => {
      this.drawWallLabels(wall);
    });
  }

  /** */
  /** Draw wall dimensions. */
  private drawWallLabels(wall: Wall) {
    // we'll just draw the shorter label... idk
    if (wall.backEdge && wall.frontEdge) {
      if (wall.backEdge.interiorDistance < wall.frontEdge.interiorDistance) {
        this.drawEdgeLabel(wall.backEdge);
      } else {
        this.drawEdgeLabel(wall.frontEdge);
      }
    } else if (wall.backEdge) {
      this.drawEdgeLabel(wall.backEdge);
    } else if (wall.frontEdge) {
      this.drawEdgeLabel(wall.frontEdge);
    }
  }

  /** */
  /** Draw a wall. */
  private drawWall(wall: Wall) {
    var hover = wall === this.viewmodel.activeWall;
    var color = wallColor;
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor;
    } else if (hover) {
      color = wallColorHover;
    }
    this.drawLine(
      this.viewmodel.convertX(wall.getStartX()),
      this.viewmodel.convertY(wall.getStartY()),
      this.viewmodel.convertX(wall.getEndX()),
      this.viewmodel.convertY(wall.getEndY()),
      hover ? wallWidthHover : wallWidth,
      color
    );
    if (!hover && wall.frontEdge) {
      this.drawEdge(wall.frontEdge, hover);
    }
    if (!hover && wall.backEdge) {
      this.drawEdge(wall.backEdge, hover);
    }
  }

  /** */
  /** Draw an edge label. */
  private drawEdgeLabel(edge: HalfEdge) {
    var pos = edge.interiorCenter();
    var length = edge.interiorDistance();
    if (length < 60) {
      // dont draw labels on walls this short
      return;
    }
    this.context.font = "normal 12px Arial";
    this.context.fillStyle = "#000000";
    this.context.textBaseline = "middle";
    this.context.textAlign = "center";
    this.context.strokeStyle = "#ffffff";
    this.context.lineWidth = 4;
    this.context.strokeText(
      Dimensioning.cmToMeasure(length),
      this.viewmodel.convertX(pos.x),
      this.viewmodel.convertY(pos.y)
    );
    this.context.fillText(
      Dimensioning.cmToMeasure(length),
      this.viewmodel.convertX(pos.x),
      this.viewmodel.convertY(pos.y)
    );
  }

  /** */
  /** Draw an edge. */
  private drawEdge(edge: HalfEdge, hover: boolean) {
    var color = edgeColor;
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor;
    } else if (hover) {
      color = edgeColorHover;
    }
    var corners = edge.corners();
    const scope = this;
    this.drawPolygon(
      Utils.map(corners, function (corner) {
        return scope.viewmodel.convertX(corner.x);
      }),
      Utils.map(corners, function (corner) {
        return scope.viewmodel.convertY(corner.y);
      }),
      false,
      null,
      true,
      color,
      edgeWidth
    );
  }

  /** */
  /** Draw a room. */
  private drawRoom(room: Room) {
    const scope = this;
    this.drawPolygon(
      Utils.map(room.corners, (corner: Corner) => {
        return scope.viewmodel.convertX(corner.x);
      }),
      Utils.map(room.corners, (corner: Corner) => {
        return scope.viewmodel.convertY(corner.y);
      }),
      true,
      roomColor
    );
  }
  /** Draw a corner. */
  private drawCorner(corner: Corner) {
    var hover = corner === this.viewmodel.activeCorner;
    var color = cornerColor;
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor;
    } else if (hover) {
      color = cornerColorHover;
    }
    this.drawCircle(
      this.viewmodel.convertX(corner.x),
      this.viewmodel.convertY(corner.y),
      hover ? cornerRadiusHover : cornerRadius,
      color
    );
  }

  /** */
  private drawTarget(x: number, y: number, lastNode) {
    this.drawCircle(
      this.viewmodel.convertX(x),
      this.viewmodel.convertY(y),
      cornerRadiusHover,
      cornerColorHover
    );
    if (this.viewmodel.lastNode) {
      this.drawLine(
        this.viewmodel.convertX(lastNode.x),
        this.viewmodel.convertY(lastNode.y),
        this.viewmodel.convertX(x),
        this.viewmodel.convertY(y),
        wallWidthHover,
        wallColorHover
      );
    }
  }

  /** */
  private drawLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    width: number,
    color
  ) {
    // width is an integer
    // color is a hex string, i.e. #ff0000
    this.context.beginPath();
    this.context.moveTo(startX, startY);
    this.context.lineTo(endX, endY);
    this.context.lineWidth = width;
    this.context.strokeStyle = color;
    this.context.stroke();
  }

  /** */
  private drawPolygon(
    xArr,
    yArr,
    fill,
    fillColor,
    stroke?,
    strokeColor?,
    strokeWidth?
  ) {
    // fillColor is a hex string, i.e. #ff0000
    fill = fill || false;
    stroke = stroke || false;
    this.context.beginPath();
    this.context.moveTo(xArr[0], yArr[0]);
    for (var i = 1; i < xArr.length; i++) {
      this.context.lineTo(xArr[i], yArr[i]);
    }
    this.context.closePath();
    if (fill) {
      this.context.fillStyle = fillColor;
      this.context.fill();
    }
    if (stroke) {
      this.context.lineWidth = strokeWidth;
      this.context.strokeStyle = strokeColor;
      this.context.stroke();
    }
  }

  /** */
  private drawCircle(centerX, centerY, radius, fillColor) {
    this.context.beginPath();
    this.context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    this.context.fillStyle = fillColor;
    this.context.fill();
  }

  /** returns n where -gridSize/2 < n <= gridSize/2  */
  private calculateGridOffset(n) {
    if (n >= 0) {
      return ((n + gridSpacing / 2.0) % gridSpacing) - gridSpacing / 2.0;
    } else {
      return ((n - gridSpacing / 2.0) % gridSpacing) + gridSpacing / 2.0;
    }
  }

  /** */
  private drawGrid() {
    var offsetX = this.calculateGridOffset(-this.viewmodel.originX);
    var offsetY = this.calculateGridOffset(-this.viewmodel.originY);
    var width = this.canvasElement.width;
    var height = this.canvasElement.height;
    for (var x = 0; x <= width / gridSpacing; x++) {
      this.drawLine(
        gridSpacing * x + offsetX,
        0,
        gridSpacing * x + offsetX,
        height,
        gridWidth,
        gridColor
      );
    }
    for (var y = 0; y <= height / gridSpacing; y++) {
      this.drawLine(
        0,
        gridSpacing * y + offsetY,
        width,
        gridSpacing * y + offsetY,
        gridWidth,
        gridColor
      );
    }
  }
}


// Export as default
export default FloorplannerView;

// Add to global BP3D namespace for backward compatibility with existing code
if (typeof globalThis !== 'undefined' && (globalThis as any).BP3D) {
  (globalThis as any).BP3D.Floorplanner = (globalThis as any).BP3D.Floorplanner || {};
  (globalThis as any).BP3D.Floorplanner.FloorplannerView = FloorplannerView;

  // Export constants
  (globalThis as any).BP3D.Floorplanner.gridSpacing = gridSpacing;
  (globalThis as any).BP3D.Floorplanner.gridWidth = gridWidth;
  (globalThis as any).BP3D.Floorplanner.gridColor = gridColor;
  (globalThis as any).BP3D.Floorplanner.roomColor = roomColor;
  (globalThis as any).BP3D.Floorplanner.wallWidth = wallWidth;
  (globalThis as any).BP3D.Floorplanner.wallWidthHover = wallWidthHover;
  (globalThis as any).BP3D.Floorplanner.wallColor = wallColor;
  (globalThis as any).BP3D.Floorplanner.wallColorHover = wallColorHover;
  (globalThis as any).BP3D.Floorplanner.edgeColor = edgeColor;
  (globalThis as any).BP3D.Floorplanner.edgeColorHover = edgeColorHover;
  (globalThis as any).BP3D.Floorplanner.edgeWidth = edgeWidth;
  (globalThis as any).BP3D.Floorplanner.deleteColor = deleteColor;
  (globalThis as any).BP3D.Floorplanner.cornerRadius = cornerRadius;
  (globalThis as any).BP3D.Floorplanner.cornerRadiusHover = cornerRadiusHover;
  (globalThis as any).BP3D.Floorplanner.cornerColor = cornerColor;
  (globalThis as any).BP3D.Floorplanner.cornerColorHover = cornerColorHover;
}
