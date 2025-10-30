import { Callbacks } from '../core/event_emitter';
import { Floorplan } from '../model/floorplan';
import { FloorplannerView } from './floorplanner_view';

export const snapTolerance = 25;

export class Floorplanner {
  static floorplannerModes = {
    MOVE: 0,
    DRAW: 1,
    DELETE: 2
  };
  public mode = 0;
  public activeWall = null;
  public activeCorner = null;
  public originX = 0;
  public originY = 0;
  public targetX = 0;
  public targetY = 0;
  public lastNode = null;
  private wallWidth: number;
  private modeResetCallbacks = new Callbacks();
  private canvasElement;
  private view: FloorplannerView;
  private mouseDown = false;
  private mouseMoved = false;
  private mouseX = 0;
  private mouseY = 0;
  private rawMouseX = 0;
  private rawMouseY = 0;
  private lastX = 0;
  private lastY = 0;
  private cmPerPixel: number;
  private pixelsPerCm: number;

  constructor(canvas: string, private floorplan: Floorplan) {
    this.canvasElement = $("#" + canvas);
    this.view = new FloorplannerView(this.floorplan, this, canvas);

    var cmPerFoot = 30.48;
    var pixelsPerFoot = 15.0;
    this.cmPerPixel = cmPerFoot * (1.0 / pixelsPerFoot);
    this.pixelsPerCm = 1.0 / this.cmPerPixel;

    this.wallWidth = 10.0 * this.pixelsPerCm;

    this.setMode(Floorplanner.floorplannerModes.MOVE);

    var scope = this;

    this.canvasElement.mousedown(() => {
      scope.mousedown();
    });
    this.canvasElement.mousemove(event => {
      scope.mousemove(event);
    });
    this.canvasElement.mouseup(() => {
      scope.mouseup();
    });
    this.canvasElement.mouseleave(() => {
      scope.mouseleave();
    });

    $(document).keyup(e => {
      if (e.keyCode == 27) {
        scope.escapeKey();
      }
    });

    floorplan.roomLoadedCallbacks.add(() => {
      scope.reset();
    });
  }

  private escapeKey() {
    this.setMode(Floorplanner.floorplannerModes.MOVE);
  }

  private updateTarget() {
    if (this.mode == Floorplanner.floorplannerModes.DRAW && this.lastNode) {
      if (Math.abs(this.mouseX - this.lastNode.x) < snapTolerance) {
        this.targetX = this.lastNode.x;
      } else {
        this.targetX = this.mouseX;
      }
      if (Math.abs(this.mouseY - this.lastNode.y) < snapTolerance) {
        this.targetY = this.lastNode.y;
      } else {
        this.targetY = this.mouseY;
      }
    } else {
      this.targetX = this.mouseX;
      this.targetY = this.mouseY;
    }

    this.view.draw();
  }

  private mousedown() {
    this.mouseDown = true;
    this.mouseMoved = false;
    this.lastX = this.rawMouseX;
    this.lastY = this.rawMouseY;

    if (this.mode == Floorplanner.floorplannerModes.DELETE) {
      if (this.activeCorner) {
        this.activeCorner.removeAll();
      } else if (this.activeWall) {
        this.activeWall.remove();
      } else {
        this.setMode(Floorplanner.floorplannerModes.MOVE);
      }
    }
  }

  private mousemove(event) {
    this.mouseMoved = true;

    this.rawMouseX = event.clientX;
    this.rawMouseY = event.clientY;

    this.mouseX =
      (event.clientX - this.canvasElement.offset().left) * this.cmPerPixel +
      this.originX * this.cmPerPixel;
    this.mouseY =
      (event.clientY - this.canvasElement.offset().top) * this.cmPerPixel +
      this.originY * this.cmPerPixel;

    if (
      this.mode == Floorplanner.floorplannerModes.DRAW ||
      (this.mode == Floorplanner.floorplannerModes.MOVE && this.mouseDown)
    ) {
      this.updateTarget();
    }

    if (this.mode != Floorplanner.floorplannerModes.DRAW && !this.mouseDown) {
      var hoverCorner = this.floorplan.overlappedCorner(
        this.mouseX,
        this.mouseY
      );
      var hoverWall = this.floorplan.overlappedWall(this.mouseX, this.mouseY);
      var draw = false;
      if (hoverCorner != this.activeCorner) {
        this.activeCorner = hoverCorner;
        draw = true;
      }
      if (this.activeCorner == null) {
        if (hoverWall != this.activeWall) {
          this.activeWall = hoverWall;
          draw = true;
        }
      } else {
        this.activeWall = null;
      }
      if (draw) {
        this.view.draw();
      }
    }

    if (this.mouseDown && !this.activeCorner && !this.activeWall) {
      this.originX += this.lastX - this.rawMouseX;
      this.originY += this.lastY - this.rawMouseY;
      this.lastX = this.rawMouseX;
      this.lastY = this.rawMouseY;
      this.view.draw();
    }

    if (this.mode == Floorplanner.floorplannerModes.MOVE && this.mouseDown) {
      if (this.activeCorner) {
        this.activeCorner.move(this.mouseX, this.mouseY);
        this.activeCorner.snapToAxis(snapTolerance);
      } else if (this.activeWall) {
        this.activeWall.relativeMove(
          (this.rawMouseX - this.lastX) * this.cmPerPixel,
          (this.rawMouseY - this.lastY) * this.cmPerPixel
        );
        this.activeWall.snapToAxis(snapTolerance);
        this.lastX = this.rawMouseX;
        this.lastY = this.rawMouseY;
      }
      this.view.draw();
    }
  }

  private mouseup() {
    this.mouseDown = false;

    if (this.mode == Floorplanner.floorplannerModes.DRAW && !this.mouseMoved) {
      var corner = this.floorplan.newCorner(this.targetX, this.targetY);
      if (this.lastNode != null) {
        this.floorplan.newWall(this.lastNode, corner);
      }
      if (corner.mergeWithIntersected() && this.lastNode != null) {
        this.setMode(Floorplanner.floorplannerModes.MOVE);
      }
      this.lastNode = corner;
    }
  }

  private mouseleave() {
    this.mouseDown = false;
  }

  private reset() {
    this.resizeView();
    this.setMode(Floorplanner.floorplannerModes.MOVE);
    this.resetOrigin();
    this.view.draw();
  }

  private resizeView() {
    this.view.handleWindowResize();
  }

  private setMode(mode: number) {
    this.lastNode = null;
    this.mode = mode;
    this.modeResetCallbacks.fire(mode);
    this.updateTarget();
  }

  private resetOrigin() {
    var centerX = this.canvasElement.innerWidth() / 2.0;
    var centerY = this.canvasElement.innerHeight() / 2.0;
    var centerFloorplan = this.floorplan.getCenter();
    this.originX = centerFloorplan.x * this.pixelsPerCm - centerX;
    this.originY = centerFloorplan.z * this.pixelsPerCm - centerY;
  }

  public convertX(x: number): number {
    return (x - this.originX * this.cmPerPixel) * this.pixelsPerCm;
  }

  public convertY(y: number): number {
    return (y - this.originY * this.cmPerPixel) * this.pixelsPerCm;
  }
}
