export class Utils {

  public static pointDistanceFromLine(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
    var tPoint = Utils.closestPointOnLine(x, y, x1, y1, x2, y2);
    var tDx = x - tPoint.x;
    var tDy = y - tPoint.y;
    return Math.sqrt(tDx * tDx + tDy * tDy);
  }

  static closestPointOnLine(x: number, y: number, x1: number, y1: number, x2: number, y2: number): { x: number, y: number } {
    var tA = x - x1;
    var tB = y - y1;
    var tC = x2 - x1;
    var tD = y2 - y1;

    var tDot = tA * tC + tB * tD;
    var tLenSq = tC * tC + tD * tD;
    var tParam = tDot / tLenSq;

    var tXx, tYy;

    if (tParam < 0 || (x1 == x2 && y1 == y2)) {
      tXx = x1;
      tYy = y1;
    }
    else if (tParam > 1) {
      tXx = x2;
      tYy = y2;
    }
    else {
      tXx = x1 + tParam * tC;
      tYy = y1 + tParam * tD;
    }

    return {
      x: tXx,
      y: tYy
    }
  }

  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(
      Math.pow(x2 - x1, 2) +
      Math.pow(y2 - y1, 2));
  }

  static angle(x1: number, y1: number, x2: number, y2: number): number {
    var tDot = x1 * x2 + y1 * y2;
    var tDet = x1 * y2 - y1 * x2;
    var tAngle = -Math.atan2(tDet, tDot);
    return tAngle;
  }

  static angle2pi(x1: number, y1: number, x2: number, y2: number) {
    var tTheta = Utils.angle(x1, y1, x2, y2);
    if (tTheta < 0) {
      tTheta += 2 * Math.PI;
    }
    return tTheta;
  }

  static isClockwise(points): boolean {
    let tSubX = Math.min(0, Math.min.apply(null, Utils.map(points, function (p) {
      return p.x;
    })))
    let tSubY = Math.min(0, Math.min.apply(null, Utils.map(points, function (p) {
      return p.y;
    })))

    var tNewPoints = Utils.map(points, function (p) {
      return {
        x: p.x - tSubX,
        y: p.y - tSubY
      }
    })

    var tSum = 0;
    for (var tI = 0; tI < tNewPoints.length; tI++) {
      var tC1 = tNewPoints[tI];
      var tC2: any;
      if (tI == tNewPoints.length - 1) {
        tC2 = tNewPoints[0];
      }
      else {
        tC2 = tNewPoints[tI + 1];
      }
      tSum += (tC2.x - tC1.x) * (tC2.y + tC1.y);
    }
    return (tSum >= 0);
  }

  static guid(): string {
    var tS4 = function () {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return tS4() + tS4() + '-' + tS4() + '-' + tS4() + '-' +
      tS4() + '-' + tS4() + tS4() + tS4();
  }

  static polygonPolygonIntersect(firstCorners, secondCorners): boolean {
    for (var tI = 0; tI < firstCorners.length; tI++) {
      var tFirstCorner = firstCorners[tI],
        tSecondCorner;

      if (tI == firstCorners.length - 1) {
        tSecondCorner = firstCorners[0];
      }
      else {
        tSecondCorner = firstCorners[tI + 1];
      }

      if (Utils.linePolygonIntersect(
        tFirstCorner.x, tFirstCorner.y,
        tSecondCorner.x, tSecondCorner.y,
        secondCorners)) {
        return true;
      }
    }
    return false;
  }

  static linePolygonIntersect(x1: number, y1: number, x2: number, y2: number, corners): boolean {
    for (var tI = 0; tI < corners.length; tI++) {
      var tFirstCorner = corners[tI],
        tSecondCorner;
      if (tI == corners.length - 1) {
        tSecondCorner = corners[0];
      }
      else {
        tSecondCorner = corners[tI + 1];
      }

      if (Utils.lineLineIntersect(x1, y1, x2, y2,
        tFirstCorner.x, tFirstCorner.y,
        tSecondCorner.x, tSecondCorner.y)) {
        return true;
      }
    }
    return false;
  }

  static lineLineIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
    function tCCW(p1, p2, p3) {
      var tA = p1.x,
        tB = p1.y,
        tC = p2.x,
        tD = p2.y,
        tE = p3.x,
        tF = p3.y;
      return (tF - tB) * (tC - tA) > (tD - tB) * (tE - tA);
    }

    var tP1 = { x: x1, y: y1 },
      tP2 = { x: x2, y: y2 },
      tP3 = { x: x3, y: y3 },
      tP4 = { x: x4, y: y4 };
    return (tCCW(tP1, tP3, tP4) != tCCW(tP2, tP3, tP4)) && (tCCW(tP1, tP2, tP3) != tCCW(tP1, tP2, tP4));
  }

  static pointInPolygon(x: number, y: number, corners, startX?: number, startY?: number): boolean {
    startX = startX || 0;
    startY = startY || 0;

    var tMinX = 0,
      tMinY = 0;

    if (startX === undefined || startY === undefined) {
      for (var tI = 0; tI < corners.length; tI++) {
        tMinX = Math.min(tMinX, corners[tI].x);
        tMinY = Math.min(tMinX, corners[tI].y);
      }
      startX = tMinX - 10;
      startY = tMinY - 10;
    }

    var tIntersects = 0;
    for (var tI = 0; tI < corners.length; tI++) {
      var tFirstCorner = corners[tI],
        tSecondCorner;
      if (tI == corners.length - 1) {
        tSecondCorner = corners[0];
      }
      else {
        tSecondCorner = corners[tI + 1];
      }

      if (Utils.lineLineIntersect(startX, startY, x, y,
        tFirstCorner.x, tFirstCorner.y,
        tSecondCorner.x, tSecondCorner.y)) {
        tIntersects++;
      }
    }
    return ((tIntersects % 2) == 1);
  }

  static polygonInsidePolygon(insideCorners, outsideCorners, startX: number, startY: number): boolean {
    startX = startX || 0;
    startY = startY || 0;

    for (var tI = 0; tI < insideCorners.length; tI++) {
      if (!Utils.pointInPolygon(
        insideCorners[tI].x, insideCorners[tI].y,
        outsideCorners,
        startX, startY)) {
        return false;
      }
    }
    return true;
  }

  static polygonOutsidePolygon(insideCorners, outsideCorners, startX: number, startY: number): boolean {
    startX = startX || 0;
    startY = startY || 0;

    for (var tI = 0; tI < insideCorners.length; tI++) {
      if (Utils.pointInPolygon(
        insideCorners[tI].x, insideCorners[tI].y,
        outsideCorners,
        startX, startY)) {
        return false;
      }
    }
    return true;
  }

  static forEach(array, action) {
    for (var tI = 0; tI < array.length; tI++) {
      action(array[tI]);
    }
  }

  static forEachIndexed(array, action) {
    for (var tI = 0; tI < array.length; tI++) {
      action(tI, array[tI]);
    }
  }

  static map(array, func) {
    var tResult = [];
    array.forEach((element) => {
      tResult.push(func(element));
    });
    return tResult;
  }

  static removeIf(array, func) {
    var tResult = [];
    array.forEach((element) => {
      if (!func(element)) {
        tResult.push(element);
      }
    });
    return tResult;
  }

  static cycle(arr, shift) {
    var tReturn = arr.slice(0);
    for (var tI = 0; tI < shift; tI++) {
      var tmp = tReturn.shift();
      tReturn.push(tmp);
    }
    return tReturn;
  }

  static unique(arr, hashFunc) {
    var tResults = [];
    var tMap = {};
    for (var tI = 0; tI < arr.length; tI++) {
      if (!tMap.hasOwnProperty(arr[tI])) {
        tResults.push(arr[tI]);
        tMap[hashFunc(arr[tI])] = true;
      }
    }
    return tResults;
  }

  static removeValue(array, value) {
    for (var tI = array.length - 1; tI >= 0; tI--) {
      if (array[tI] === value) {
        array.splice(tI, 1);
      }
    }
  }

  static hasValue = function (array, value): boolean {
    for (var tI = 0; tI < array.length; tI++) {
      if (array[tI] === value) {
        return true;
      }
    }
    return false;
  }

  static subtract(array, subArray) {
    return Utils.removeIf(array, function (el) {
      return Utils.hasValue(subArray, el);
    });
  }
}
