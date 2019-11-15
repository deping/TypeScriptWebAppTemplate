import math from 'mathjs';
import _ from 'lodash';
import { geoDistance } from 'd3';

// declare let _: any; // lodash.js
// declare let math: any; // math.js

export interface IPoint {
    x: number;
    y: number;
}

export function makePoint(x: number, y: number) {
    return { x, y };
}

export function clonePoint(pt: IPoint) {
    return { x: pt.x, y: pt.y };
}

export function equals(p1: IPoint, p2: IPoint): boolean {
    return (math.equal(p1.x, p2.x) && math.equal(p1.y, p2.y)) as boolean;
}

// @return = distance * distance
export function distance2(p1: IPoint, p2: IPoint) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return dx * dx + dy * dy;
}

export function distance(p1: IPoint, p2: IPoint) {
    return Math.sqrt(distance2(p1, p2));
}

// @return > 0, abs(angle) < 90; < 0, abs(angle) > 90
export function dotProduct(p1: IPoint, p2: IPoint) {
    return math.dot([p1.x, p1.y], [p2.x, p2.y]);
}

// @return > 0, positive Z; < 0, negative Z
export function crossProduct(p1: IPoint, p2: IPoint): number {
    return p1.x * p2.y - p2.x * p1.y;
}

export function isOrigin(pt: IPoint): boolean {
    return pt.x === 0 && pt.y === 0;
}

export function movePoint(pt: IPoint, dx: number, dy: number) {
    pt.x += dx;
    pt.y += dy;
    return pt;
}

export function addPoint(pt: IPoint, det: IPoint) {
    pt.x += det.x;
    pt.y += det.y;
    return pt;
}

export function diffPoint(pt: IPoint, det: IPoint) {
    pt.x -= det.x;
    pt.y -= det.y;
    return pt;
}

export function midPoint(p1: IPoint, p2: IPoint): IPoint {
    return makePoint((p1.x + p2.x) / 2.0, (p1.y + p2.y) / 2.0);
}

export function mirrorPoint(pt: IPoint, l: Line): IPoint {
    const proj = l.projectPointOnLine(pt);
    let mp: IPoint;
    if (proj === undefined) {
        mp = midPoint(l.p1, l.p2);
    }

    [mp] = proj as [IPoint, number];
    return makePoint(2 * mp.x - pt.x, 2 * mp.y - pt.y);
}

export function scalePoint(basePt: IPoint, pt: IPoint, scale: number) {
    const dx = pt.x - basePt.x;
    const dy = pt.y - basePt.y;
    return makePoint(basePt.x + scale * dx, basePt.y + scale * dy);
}

export function rotatePoint(basePt: IPoint, pt: IPoint, angle: number/*radians*/) {
    const detX = pt.x - basePt.x;
    const detY = pt.y - basePt.y;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const detX2 = detX * cosAngle - detY * sinAngle;
    const detY2 = detX * sinAngle + detY * cosAngle;
    return makePoint(basePt.x + detX2, basePt.y + detY2);
}

export function rotatePoints(basePt: IPoint, pts: IPoint[], angle: number/*radians*/): void {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    for (const pt of pts) {
        const detX = pt.x - basePt.x;
        const detY = pt.y - basePt.y;
        const detX2 = detX * cosAngle - detY * sinAngle;
        const detY2 = detX * sinAngle + detY * cosAngle;
        pt.x = basePt.x + detX2;
        pt.y = basePt.y + detY2;
    }
}

export interface ILine {
    p1: IPoint;
    p2: IPoint;
}

export class Line implements ILine {
    p1: IPoint;
    p2: IPoint;

    static fromPoints(p1: IPoint = { x: 0, y: 0 }, p2: IPoint = { x: 0, y: 0 }) {
        return new Line(p1.x, p1.y, p2.x, p2.y);
    }

    static fromLine(l: ILine) {
        return Line.fromPoints(l.p1, l.p2);
    }

    static fromP1Diff(p1: IPoint, dx: number, dy: number) {
        return new Line(p1.x, p1.y, p1.x + dx, p1.y + dy);
    }

    static fromP2Diff(p2: IPoint, dx: number, dy: number) {
        return new Line(p2.x + dx, p2.y + dy, p2.x, p2.y);
    }

    static fromP1AngleLength(p1: IPoint, angle: number/*radians*/, len: number = 1.0) {
        const dx = length * Math.cos(angle);
        const dy = length * Math.sin(angle);
        return new Line(p1.x, p1.y, p1.x + dx, p1.x + dy);
    }

    static fromP2AngleLength(p2: IPoint, angle: number/*radians*/, len: number = 1.0) {
        const dx = length * Math.cos(angle);
        const dy = length * Math.sin(angle);
        return new Line(p2.x - dx, p2.x - dy, p2.x, p2.y);
    }

    constructor(x1: number = 0, y1: number = 0, x2: number = 0, y2: number = 0) {
        this.p1 = makePoint(x1, y1);
        this.p2 = makePoint(x2, y2);
    }

    clone() {
        return Line.fromPoints(this.p1, this.p2);
    }

    equals(pt: ILine): boolean {
        return equals(this.p1, pt.p1) && equals(this.p2, pt.p2);
    }

    isZero(): boolean {
        return isOrigin(this.p1) && isOrigin(this.p2);
    }

    // 调用后保证start.x <= this.p2.x；如果start.x == this.p2.x，那么start.y <= this.p2.y
    normalize(): this {
        if (math.equal(this.p1.x, this.p2.x)) {
            if (this.p1.y > this.p2.y) {
                [this.p1, this.p2] = [this.p2, this.p1];
            }
        } else if (this.p1.x > this.p2.x) {
            [this.p1, this.p2] = [this.p2, this.p1];
        }
        return this;
    }

    projectOnLine(pt: IPoint): number | undefined {
        if (equals(this.p1, this.p2)) {
            return undefined;
        }
        // t = (v1 dot v2) / (v2 dot v2)
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        const lineLength = dx * dx + dy * dy;
        const dist = (pt.x - this.p1.x) * dx + (pt.y - this.p1.y) * dy;
        return dist / lineLength;
    }

    length() {
        return distance(this.p1, this.p2);
    }

    projectPointOnLine(pt: IPoint): [IPoint, number] | undefined {
        const t = this.projectOnLine(pt);
        if (t === undefined) {
            return undefined;
        }
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        return [makePoint(this.p1.x + t * dx, this.p1.y + t * dy), t];
    }

    distToLine(pt: IPoint) {
        const proj = this.projectPointOnLine(pt);
        if (proj === undefined) {
            return undefined;
        }
        const [p, t] = proj;
        return distance(pt, p);
    }

    isPointOnSegment(pt: IPoint, distEpsilon: number) {
        const proj = this.projectPointOnLine(pt);
        if (proj === undefined) {
            return false;
        }
        const [p, t] = proj;
        if (t < 0) {
            return distance(this.p1, p) <= distEpsilon;
        } else if (t > 1) {
            return distance(this.p2, p) <= distEpsilon;
        } else {
            return distance(pt, p) <= distEpsilon;
        }
    }

    isPointOnLine(pt: IPoint, distEpsilon: number) {
        const proj = this.projectPointOnLine(pt);
        if (proj === undefined) {
            return false;
        }
        const [p, t] = proj;
        return distance(pt, p) <= distEpsilon;
    }

    move(x: number, y: number) {
        movePoint(this.p1, x, y);
        return this;
    }

    vector() {
        return { x: this.p2.x - this.p1.x, y: this.p2.y - this.p1.y };
    }

    // 如果start与end相同，返回-2。否则：
    // 如果点在start-->end左侧，返回1；
    // 如果点在start-->end右侧，返回-1；
    // 如果点在直线上，返回0；
    whichSide(pt: IPoint, distEpsilon: number = 0.01) {
        const temp = this.clone();
        temp.move(-pt.x, -pt.y);
        const origin = makePoint(0, 0);

        const det = temp.vector();
        if (det.x === 0 && det.y === 0) {
            return -2;
        }
        const dist = temp.distToLine(origin);
        if (dist === undefined) {
            return -2;
        }
        if (dist <= distEpsilon) {
            return 0;
        }
        diffPoint(origin, temp.p1);
        const value = crossProduct(origin, det);
        if (value > 0) {
            return 1;
        } else if (value < 0) {
            return -1;
        } else {
            return 0;
        }
    }

    mirrorX(x: number) {
        this.p1.x = 2 * x - this.p1.x;
        this.p2.x = 2 * x - this.p2.x;
        return this;
    }

    mirrorY(y: number) {
        this.p1.y = 2 * y - this.p1.y;
        this.p2.y = 2 * y - this.p2.y;
        return this;
    }
}

export interface CriticalPoint {
    type: 'line' | 'arc' | 'ease';
    point: { x: number, y: number };
    radius: number;
    a: number;
}
