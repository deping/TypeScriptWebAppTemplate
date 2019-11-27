// import math from 'mathjs';
// import _ from 'lodash';
// import { fabric } from 'fabric';

declare let _: any; // lodash.js
declare let math: any; // math.js
declare let fabric: any; // fabric.js
declare let rightHand: any; // fabric.ext.js

// fmod(-3.5, 1) = -0.5
// fmod(3.5, 1) = 0.5
// fmod(-3.5, -1) = -0.5
// fmod(3.5, -1) = 0.5
export function fmod(x: number, y: number) {
    if (y === 0)
        return undefined;
    return x - y * Math.trunc(x / y);
}

export interface IPoint {
    x: number;
    y: number;
}

export function makePoint(x: number, y: number): IPoint {
    return { x, y };
}

export function clonePoint(pt: IPoint): IPoint {
    return { x: pt.x, y: pt.y };
}

export function magnitude2(pt: IPoint): number {
    return pt.x * pt.x + pt.y * pt.y;
}

export function magnitude(pt: IPoint): number {
    return Math.sqrt(pt.x * pt.x + pt.y * pt.y);
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

export function normalize(vec: IPoint) {
    const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    if (len === 0)
        return undefined;
    return makePoint(vec.x / len, vec.y / len);
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

export function multPoint(pt: IPoint, scalar: number) {
    pt.x *= scalar;
    pt.y *= scalar;
    return pt;
}

export function midPoint(p1: IPoint, p2: IPoint): IPoint {
    return makePoint((p1.x + p2.x) / 2.0, (p1.y + p2.y) / 2.0);
}

export function mirrorPoint(pt: IPoint, l: Line): IPoint {
    const proj = l.projectOnLine(pt);
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

export function rotatePoint(cen: IPoint, pt: IPoint, angle: number/*radians*/) {
    const detX = pt.x - cen.x;
    const detY = pt.y - cen.y;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const detX2 = detX * cosAngle - detY * sinAngle;
    const detY2 = detX * sinAngle + detY * cosAngle;
    return makePoint(cen.x + detX2, cen.y + detY2);
}

export function rotatePoints(cen: IPoint, pts: IPoint[], angle: number/*radians*/): void {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    for (const pt of pts) {
        const detX = pt.x - cen.x;
        const detY = pt.y - cen.y;
        const detX2 = detX * cosAngle - detY * sinAngle;
        const detY2 = detX * sinAngle + detY * cosAngle;
        pt.x = cen.x + detX2;
        pt.y = cen.y + detY2;
    }
}

export function is3PointsCollinear(p1: IPoint, p2: IPoint, p3: IPoint) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dx2 = p3.x - p1.x;
    const dy2 = p3.y - p1.y;
    return math.equal(dx * dy2, dx2 * dy) as boolean;
}

// make angle in [-PI, PI]
export function normalizeAngle(angle: number/*radians*/) {
    const cycles = Math.floor(angle / (2 * Math.PI));
    angle -= cycles * 2 * Math.PI;
    if (angle > Math.PI)
        angle -= 2 * Math.PI;
    return angle;
}

export function toRad(angle: number) {
    return angle / 180 * Math.PI;
}

export function toDegree(angle: number) {
    return angle / Math.PI * 180;
}

// 要求angle,startAngle[-180,180]之间, sweepAngle === fmod(sweepAngle, 2 * Math.PI)
export function isAngleBetween(angle: number, startAngle: number, sweepAngle: number) {
    if (sweepAngle < 0) {
        [startAngle, sweepAngle] = [normalizeAngle(startAngle + sweepAngle), -sweepAngle]
    }
    const endAngle = startAngle + sweepAngle;
    if (angle < startAngle) {
        const a = (angle + 2 * Math.PI);
        return a <= endAngle;
    } else {
        return angle <= endAngle;
    }
}

export function xLineLine(a1: IPoint, a2: IPoint, a1a2IsLine: boolean, b1: IPoint, b2: IPoint, b1b2IsLine: boolean) {
    var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

    if (u_b != 0) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;

        if ((a1a2IsLine || 0 <= ua && ua <= 1) && (b1b2IsLine || 0 <= ub && ub <= 1)) {
            return makePoint(
                a1.x + ua * (a2.x - a1.x),
                a1.y + ua * (a2.y - a1.y)
            );
        } else {
            // No Intersection
        }
    } else {
        if (ua_t == 0 || ub_t == 0) {
            // Coincident
        } else {
            // Parallel
        }
    }

    return undefined;
}

//求直线 a1 x + b1 y + c1 = 0 与 a2 x + b2 y + c2 = 0 的交点
export function xEquationLineLine(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number) {
    if (a1 == 0.0 && b1 == 0.0)
        return undefined;
    if (a2 == 0.0 && b2 == 0.0)
        return undefined;
    const divisor = a1 * b2 - a2 * b1;
    const denominator = a1 * a2 + b1 * b2;
    if (denominator != 0.0) {
        const TAN_0_1_SECOND = 8.46097e-9;
        const tanPhei = Math.abs(divisor / denominator);
        if (tanPhei < TAN_0_1_SECOND)
            return undefined;
    }
    else {
        //因为denominator为0，而且a1,b1不同时为0，a2,b2不同时为0，
        //所以divisor必不为0，所以两直线垂直。
    }
    return makePoint((b1 * c2 - b2 * c1) / divisor, (a2 * c1 - a1 * c2) / divisor);
}

export function xLineCircle(a1: IPoint, a2: IPoint, isLine: boolean, c: IPoint, r: number) {
    var a = (a2.x - a1.x) * (a2.x - a1.x) +
        (a2.y - a1.y) * (a2.y - a1.y);
    var b = 2 * ((a2.x - a1.x) * (a1.x - c.x) +
        (a2.y - a1.y) * (a1.y - c.y));
    var cc = c.x * c.x + c.y * c.y + a1.x * a1.x + a1.y * a1.y -
        2 * (c.x * a1.x + c.y * a1.y) - r * r;
    var deter = b * b - 4 * a * cc;

    if (deter < 0) {
        // Outside
        return undefined;
    } else if (deter == 0) {
        // Tangent
        const line = Line.fromPoints(a1, a2);
        const proj = line.projectOnLine(c);
        if (proj === undefined) {
            return undefined; // impossible case, jus for TypeScript.
        } else {
            const [p, t] = proj;
            if (isLine || 0 <= t && t <= 1)
                return [proj[0]];
            return [] as IPoint[];
        }
    } else {
        const points: IPoint[] = [];
        var e = Math.sqrt(deter);
        var u1 = (-b + e) / (2 * a);
        var u2 = (-b - e) / (2 * a);
        const line = Line.fromPoints(a1, a2);
        if (isLine || 0 <= u1 && u1 <= 1)
            points.push(line.tPoint(u1));

        if (0 <= u2 && u2 <= 1)
            points.push(line.tPoint(u2));
        return points;
    }
};

export function xCircleCircle(c1: IPoint, r1: number, c2: IPoint, r2: number) {
    // Determine minimum and maximum radii where circles can intersect
    var r_max = r1 + r2;
    var r_min = Math.abs(r1 - r2);

    // Determine actual distance between circle circles
    var c_dist = distance(c1, c2);

    if (c_dist > r_max) {
        // Outside
        return undefined;
    } else if (c_dist < r_min) {
        // Inside
        return undefined;
    } else {
        var a = (r1 * r1 - r2 * r2 + c_dist * c_dist) / (2 * c_dist);
        var h = Math.sqrt(r1 * r1 - a * a);
        const line = Line.fromPoints(c1, c2);
        const p = line.tPoint(a / c_dist);
        var b = h / c_dist;
        if (math.equal(b, 0) as boolean) {
            return [p];
        }

        return [
            makePoint(
                p.x - b * (c2.y - c1.y),
                p.y + b * (c2.x - c1.x)
            ),
            makePoint(
                p.x + b * (c2.y - c1.y),
                p.y - b * (c2.x - c1.x)
            )
        ];
    }
};

function removePointsNotOnArc(points: IPoint[], center: IPoint, radius: number, startAngle: number, sweepAngle: number) {
    startAngle = normalizeAngle(startAngle);
    sweepAngle = fmod(sweepAngle, 2 * Math.PI) as number;
    const count = points.length;
    for (let i = count - 1; i >= 0; i--) {
        const dx = points[i].x - center.x;
        const dy = points[i].y - center.y;
        const angle = Math.atan2(dy, dx);
        if (!isAngleBetween(angle, startAngle, sweepAngle))
            points.splice(i, 1);
    }
}

export function xLineArc(start: IPoint, end: IPoint, isLine: boolean,
    center: IPoint, radius: number, startAngle: number, sweepAngle: number) {
    const x = xLineCircle(start, end, isLine, center, radius);
    if (x === undefined)
        return undefined;
    const points = x;
    removePointsNotOnArc(points, center, radius, startAngle, sweepAngle);
    return points;
}

export function xCircleArc(c1: IPoint, r1: number,
    c2: IPoint, r2: number, startAngle2: number, sweepAngle2: number) {
    const x = xCircleCircle(c1, r1, c2, r2);
    if (x === undefined)
        return undefined;
    const points = x;
    removePointsNotOnArc(points, c2, r2, startAngle2, sweepAngle2);
    return points;
};

export function xArcArc(c1: IPoint, r1: number, startAngle1: number, sweepAngle1: number,
    c2: IPoint, r2: number, startAngle2: number, sweepAngle2: number) {
    const x = xCircleCircle(c1, r1, c2, r2);
    if (x === undefined)
        return undefined;
    const points = x;
    removePointsNotOnArc(points, c1, r1, startAngle1, sweepAngle1);
    removePointsNotOnArc(points, c2, r2, startAngle2, sweepAngle2);
    return points;
};

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

    X(y: number) {
        const dety = this.p2.y - this.p1.y;
        if (dety == 0)
            return undefined;
        const dy = y - this.p1.y;
        const dx = dy / dety * (this.p2.x - this.p1.x);
        return this.p1.x + dx;
    }

    Y(x: number) {
        const detx = this.p2.x - this.p1.x;
        if (detx == 0)
            return undefined;
        const dx = x - this.p1.x;
        const dy = dx / detx * (this.p2.y - this.p1.y);
        return this.p1.y + dy;
    }

    dx() {
        return this.p2.x - this.p1.x;
    }

    dy() {
        return this.p2.y - this.p1.y;
    }

    vector() {
        return { x: this.p2.x - this.p1.x, y: this.p2.y - this.p1.y };
    }

    length() {
        return distance(this.p1, this.p2);
    }

    angle() { //-PI~PI
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        return Math.atan2(dy, dx);
    }

    //从this方向转到line方向的角度，-PI~PI
    xAngle(l: Line) {
        const a1 = this.angle();
        const a2 = l.angle();
        let result = a2 - a1;
        if (result > Math.PI)
            result -= 2 * Math.PI;
        else if (result <= -Math.PI)
            result += 2 * Math.PI;
        return result;
    }

    normalAngle() { //-PI~PI
        let result = this.angle();
        result += Math.PI / 2.0;
        if (result > Math.PI)
            result -= 2 * Math.PI;
        return result;
    }

    move(x: number, y: number) {
        movePoint(this.p1, x, y);
        return this;
    }

    tPoint(t: number) {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        return makePoint(this.p1.x + t * dx, this.p1.y + t * dy);
    }

    swap() {
        [this.p1, this.p2] = [this.p2, this.p1];
        return this;
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

    tValue(pt: IPoint): number | undefined {
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

    projectOnLine(pt: IPoint): [IPoint, number] | undefined {
        const t = this.tValue(pt);
        if (t === undefined) {
            return undefined;
        }
        return [this.tPoint(t), t];
    }

    distToLine(pt: IPoint) {
        const proj = this.projectOnLine(pt);
        if (proj === undefined) {
            return undefined;
        }
        const [p, t] = proj;
        return distance(pt, p);
    }

    distToSegment(pt: IPoint) {
        const proj = this.projectOnLine(pt);
        if (proj === undefined) {
            return distance(pt, midPoint(this.p1, this.p2));
        }
        const [p, t] = proj;
        if (t < 0) {
            return distance(this.p1, p);
        } else if (t > 1) {
            return distance(this.p2, p);
        } else {
            return distance(pt, p);
        }
    }

    isPointOnSegment(pt: IPoint, distEpsilon: number) {
        const proj = this.projectOnLine(pt);
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
        const proj = this.projectOnLine(pt);
        if (proj === undefined) {
            return false;
        }
        const [p, t] = proj;
        return distance(pt, p) <= distEpsilon;
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

    mirrorX(x: number): this {
        this.p1.x = 2 * x - this.p1.x;
        this.p2.x = 2 * x - this.p2.x;
        return this;
    }

    mirrorY(y: number): this {
        this.p1.y = 2 * y - this.p1.y;
        this.p2.y = 2 * y - this.p2.y;
        return this;
    }

    mirror(l: Line) {
        const p1 = mirrorPoint(this.p1, l);
        const p2 = mirrorPoint(this.p2, l);
        return Line.fromPoints(p1, p2);
    }

    offset(dist: number) {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        if (dx == 0.0 && dy == 0.0)
            return undefined;
        const len = Math.sqrt(dx * dx + dy * dy);
        const pp = dist / len;
        const detx = (-dy) * pp;
        const dety = dx * pp;
        this.p1.x += detx;
        this.p2.x += detx;
        this.p1.y += dety;
        this.p2.y += dety;
        return this;
    }

    exTrimStartX(x: number): this {
        const y = this.Y(x);
        if (y !== undefined) {
            this.p1.x = x;
            this.p1.y = y;
        }
        return this;
    }

    exTrimEndX(x: number): this {
        const y = this.Y(x);
        if (y !== undefined) {
            this.p2.x = x;
            this.p2.y = y;
        }
        return this;
    }

    exTrimStartY(y: number): this {
        const x = this.X(y);
        if (x !== undefined) {
            this.p1.x = x;
            this.p1.y = y;
        }
        return this;
    }

    exTrimEndY(y: number): this {
        const x = this.X(y);
        if (x !== undefined) {
            this.p2.x = x;
            this.p2.y = y;
        }
        return this;
    }

    exTrimStart(l: ILine): this {
        const x = xLineLine(this.p1, this.p2, true, l.p1, l.p2, true);
        if (x !== undefined) {
            this.p1 = x;
        }
        return this;
    }

    exTrimEnd(l: ILine): this {
        const x = xLineLine(this.p1, this.p2, true, l.p1, l.p2, true);
        if (x !== undefined) {
            this.p2 = x;
        }
        return this;
    }

    rotateAround(cen: IPoint, angle: number) {
        const p1 = rotatePoint(cen, this.p1, angle);
        const p2 = rotatePoint(cen, this.p2, angle);
        return Line.fromPoints(p1, p2);
    }


    lengthenStart(length: number): this {
        const dx = this.p1.x - this.p2.x;
        const dy = this.p1.y - this.p2.y;
        if (dx == 0.0 && dy == 0.0)
            return this;
        const len = Math.sqrt(dx * dx + dy * dy);
        const co = (length / len);
        this.p1.x += dx * co;
        this.p1.y += dy * co;
        return this;
    }

    lengthenEnd(length: number): this {
        return this.swap().lengthenStart(length).swap();
    }

    middleFitTo(length: number): this {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        if (dx == 0.0 && dy == 0.0)
            return this;
        const len = Math.sqrt(dx * dx + dy * dy);
        const co = (length / 2.0 / len);
        const dx2 = dx * co;
        const dy2 = dy * co;
        const midpoint = midPoint(this.p1, this.p2);
        this.p2.x = midpoint.x + dx2;
        this.p2.y = midpoint.y + dy2;
        this.p1.x = midpoint.x - dx2;
        this.p1.y = midpoint.y - dy2;
        return this;
    }

    startFitTo(length: number): this {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        if (dx == 0.0 && dy == 0.0)
            return this;
        const len = Math.sqrt(dx * dx + dy * dy);
        const co = (length / len);
        const dx2 = dx * co;
        const dy2 = dy * co;
        this.p2.x = this.p1.x + dx2;
        this.p2.y = this.p1.y + dy2;
        return this;
    }

    endFitTo(length: number): this {
        return this.swap().startFitTo(length).swap();
    }

    equalDistPoints(n: number/*int*/): IPoint[] {
        const points: IPoint[] = [];
        n = Math.floor(n);
        if (n < 2)
            return points;
        const dx = (this.p2.x - this.p1.x) / n;
        const dy = (this.p2.y - this.p1.y) / n;
        let point = this.p1;
        for (let i = 0; i < n - 1; ++i) {
            point = clonePoint(point);
            points.push(movePoint(point, dx, dy));
        }
        return points;
    }

}

export interface ICircle {
    center: IPoint;
    radius: number;
}

export class Circle implements ICircle {
    center: IPoint;
    radius: number;

    static fromDiameter(p1: IPoint, p2: IPoint) {
        const cen = midPoint(p1, p2);
        const rad = distance(p1, p2) / 2.0;
        return new Circle(cen, rad);
    }

    static fromRadius(cen: IPoint, p2: IPoint) {
        const rad = distance(cen, p2);
        return new Circle(cen, rad);
    }

    static fromP1P2Rad(pt1: IPoint, pt2: IPoint, rad: number, leftCircle: boolean) {
        const line = Line.fromPoints(pt1, pt2);
        const len = line.length();
        const square = rad * rad - len * len / 4.0;
        if (square < 0.0)
            return undefined;
        const dist = Math.sqrt(square);
        const lineThroughtCen = line.offset(leftCircle ? dist : -dist);
        if (lineThroughtCen === undefined)
            return undefined;
        const center = midPoint(lineThroughtCen.p1, lineThroughtCen.p2);
        return new Circle(center, rad);
    }

    static circumCircle(pt1: IPoint, pt2: IPoint, pt3: IPoint) {
        if (is3PointsCollinear(pt1, pt2, pt3)) {
            return undefined;
        }
        const m1x = (pt1.x + pt2.x) / 2.0;
        const m1y = (pt1.y + pt2.y) / 2.0;
        const m2x = (pt3.x + pt2.x) / 2.0;
        const m2y = (pt3.y + pt2.y) / 2.0;
        const a1 = pt2.x - pt1.x;
        const b1 = pt2.y - pt1.y;
        const a2 = pt3.x - pt2.x;
        const b2 = pt3.y - pt2.y;
        const c1 = -(a1 * m1x + b1 * m1y);
        const c2 = -(a2 * m2x + b2 * m2y);

        const center = xEquationLineLine(a1, b1, c1, a2, b2, c2);
        if (center === undefined)
            return undefined;
        const detx = pt1.x - center.x;
        const dety = pt1.y - center.y;
        const radius = Math.sqrt(detx * detx + dety * dety);
        return new Circle(center, radius);
    }

    static from3Points = Circle.circumCircle;

    static tangentCircle(pt1: IPoint, pt2: IPoint, pt3: IPoint) {
        if (is3PointsCollinear(pt1, pt2, pt3)) {
            return undefined;
        }
        const l1 = Line.fromPoints(pt2, pt1);
        l1.startFitTo(1);
        const l2 = Line.fromPoints(pt2, pt3);
        l2.startFitTo(1);
        const halfLine1 = Line.fromPoints(pt2, midPoint(l1.p2, l2.p2));

        const l3 = Line.fromPoints(pt1, pt2);
        l3.startFitTo(1);
        const l4 = Line.fromPoints(pt1, pt3);
        l4.startFitTo(1);
        const halfLine2 = Line.fromPoints(pt1, midPoint(l3.p2, l4.p2));
        const center = xLineLine(halfLine1.p1, halfLine1.p2, true, halfLine2.p1, halfLine2.p2, true);
        if (center === undefined)
            return undefined;
        const radius = l1.distToLine(center);
        return new Circle(center, radius);
    }

    static from2LinesRadius(pt1: IPoint, corner: IPoint, pt2: IPoint, radius: number) {
        //预防两边长差距过大，导致Is3PointsOnOneLine认为三点共线的情况
        const l1 = Line.fromPoints(corner, pt1);
        l1.startFitTo(1);
        const l2 = Line.fromPoints(corner, pt2);
        l2.startFitTo(1);
        if (is3PointsCollinear(l1.p2, corner, l2.p2))
            return undefined;

        const cen = midPoint(l1.p2, l2.p2);
        const dist = l1.distToLine(cen);
        if (dist === undefined)
            return undefined;
        const halfLine = Line.fromPoints(corner, cen);
        const len = halfLine.length() * (radius / dist);
        halfLine.startFitTo(len);
        return new Circle(halfLine.p2, radius);
    }

    constructor(cen: IPoint = { x: 0, y: 0 }, rad: number = 0) {
        this.center = clonePoint(cen);
        this.radius = rad;
    }

    clone() {
        return new Circle(this.center, this.radius);
    }

    move(x: number, y: number) {
        movePoint(this.center, x, y);
        return this;
    }

    rotateAround(cen: IPoint, angle: number) {
        this.center = rotatePoint(cen, this.center, angle);
        return this;
    }

    mirrorX(x: number) {
        this.center.x = 2 * x - this.center.x;
        return this;
    }

    mirrorY(y: number) {
        this.center.y = 2 * y - this.center.y;
        return this;
    }

    mirror(l: Line) {
        this.center = mirrorPoint(this.center, l);
        return this;
    }

    length() {
        return 2 * Math.PI * this.radius;
    }

    area() {
        return Math.PI * this.radius * this.radius;
    }

    point(angle: number/*radians*/) {
        return makePoint(this.center.x + this.radius * Math.cos(angle), this.center.y + this.radius * Math.sin(angle));
    }

    //0--east, 1--north, 2--west, 3--south
    quadrantPoint(index: number) {
        const result = clonePoint(this.center);
        switch (index) {
            case 0:
                result.x += this.radius;
                break;
            case 1:
                result.y += this.radius;
                break;
            case 2:
                result.x -= this.radius;
                break;
            case 3:
                result.y -= this.radius;
                break;
            default:
                return undefined;
        };
        return result;
    }

    nearestProjectOnCircle(point: IPoint) {
        if (equals(point, this.center))
            return undefined;
        let dx = point.x - this.center.x;
        let dy = point.y - this.center.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        dx = dx / len * this.radius;
        dy = dy / len * this.radius;
        return makePoint(this.center.x + dx, this.center.y + dy);
    }

    projectOnCircle(point: IPoint) {
        if (equals(point, this.center))
            return undefined;
        let dx = point.x - this.center.x;
        let dy = point.y - this.center.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        dx = dx / len * this.radius;
        dy = dy / len * this.radius;
        return [makePoint(this.center.x + dx, this.center.y + dy), makePoint(this.center.x - dx, this.center.y - dy)];
    }

    distance(pt: IPoint) {
        const p = this.nearestProjectOnCircle(pt);
        if (p === undefined)
            return this.radius;
        return distance(pt, p);
    }
}

// No IArc

export class Arc extends Circle {
    startAngle: number;
    sweepAngle: number;

    static fromCenterRadiusAngles(center: IPoint, radius: number, startAngle: number, endAngle: number, ccw: boolean) {
        startAngle = normalizeAngle(startAngle);
        endAngle = normalizeAngle(endAngle);
        let sweepAngle = endAngle - startAngle;
        if ((sweepAngle > 0) && !ccw)
            sweepAngle -= 2 * Math.PI;
        else if ((sweepAngle < 0) && ccw)
            sweepAngle += 2 * Math.PI;
        return new Arc(center, radius, startAngle, sweepAngle);
    }

    // 依次经过三点的圆弧
    static from3Points(p1: IPoint, p2: IPoint, p3: IPoint) {
        const c = Circle.circumCircle(p1, p2, p3);
        if (c === undefined)
            return undefined;
        const center = c.center;
        let detx = p1.x - center.x;
        let dety = p1.y - center.y;
        let startAngle = Math.atan2(dety, detx);
        detx = p3.x - center.x;
        dety = p3.y - center.y;
        const endAngle = Math.atan2(dety, detx);
        detx = p2.x - center.x;
        dety = p2.y - center.y;
        const angle = Math.atan2(dety, detx);
        let sweepAngle = endAngle - startAngle;
        if (sweepAngle >= 0) {
            if (!(angle >= startAngle && angle <= endAngle)) {
                sweepAngle -= 2 * Math.PI;
            }
        }
        else {
            if (!(angle >= endAngle && angle <= startAngle)) {
                sweepAngle += 2 * Math.PI;
            }
        }
        return new Arc(center, c.radius, startAngle, sweepAngle);
    }

    // 参数direction为圆弧在起点start的切线方向
    static fromStartDirSweepRadius(start: IPoint, direction: IPoint, sweepAngle: number, radius: number) {
        sweepAngle = normalizeAngle(sweepAngle);
        if (math.equal(direction.x, 0.0) && math.equal(direction.y, 0.0))
            return undefined;
        let dx: number, dy: number;
        if (sweepAngle < 0.0) {
            dx = direction.y;
            dy = -direction.x;
        }
        else {
            dx = -direction.y;
            dy = direction.x;
        }
        const len = magnitude(direction);
        const pp = radius / len;
        dx *= pp;
        dy *= pp;
        const cx = start.x + dx;
        const cy = start.y + dy;
        const startAngle = Math.atan2(-dy, -dx);
        return new Arc(makePoint(cx, cy), radius, startAngle, sweepAngle);
    }

    // 已知起始点和起点方向的圆弧
    static fromStartEndDir(start: IPoint, end: IPoint, startDirection: IPoint) {
        const a1 = startDirection.x;
        const b1 = startDirection.y;
        const a2 = end.x - start.x;
        const b2 = end.y - start.y;
        // crossProduct
        if (math.equal(a1 * b2 - b1 * a2, 0.0))
            return undefined;
        const c1 = -(a1 * start.x + b1 * start.y);
        const c2 = -(a2 * (start.x + end.x) / 2.0 + b2 * (start.y + end.y) / 2.0);
        const center = xEquationLineLine(a1, b1, c1, a2, b2, c2);
        if (center === undefined)
            return undefined;
        const detX = start.x - center.x;
        const detY = start.y - center.y;
        const radius = Math.sqrt(detX * detX + detY * detY);
        const startAngle = Math.atan2(detY, detX);
        const endAngle = Math.atan2(end.y - center.y, end.x - center.x);
        let sweepAngle = endAngle - startAngle;
        const smallArc = a1 * a2 + b1 * b2 >= 0.0;
        if (smallArc) {
            if (sweepAngle > Math.PI)
                sweepAngle -= 2 * Math.PI;
            else if (sweepAngle < -Math.PI)
                sweepAngle += 2 * Math.PI;
        }
        else {
            if (sweepAngle < 0.0) {
                if (sweepAngle > -Math.PI)
                    sweepAngle += 2 * Math.PI;
            }
            else {
                if (sweepAngle < Math.PI)
                    sweepAngle -= 2 * Math.PI;
            }
        }
        return new Arc(center, radius, startAngle, sweepAngle);
    }

    // 从start逆时针绕行到end的圆弧
    static fromStartCenterEnd(start: IPoint, center: IPoint, end: IPoint) {
        if (equals(start, end) || equals(start, center) || equals(center, end))
            return undefined;
        const detX = start.x - center.x;
        const detY = start.y - center.y;
        const startAngle = Math.atan2(detY, detX);
        const radius = Math.sqrt(detX * detX + detY * detY);
        const endAngle = Math.atan2(end.y - center.y, end.x - center.x);
        let sweepAngle = endAngle - startAngle;
        if (sweepAngle < 0.0) {
            sweepAngle += 2 * Math.PI;
        }
        return new Arc(center, radius, startAngle, sweepAngle);
    }

    // 从start逆时针绕行到end的圆弧
    static fromStartAngleCenterEnd(startAngle: number, center: IPoint, end: IPoint) {
        if (equals(center, end))
            return undefined;
        const detX = end.x - center.x;
        const detY = end.y - center.y;
        const radius = Math.sqrt(detX * detX + detY * detY);
        const endAngle = Math.atan2(detY, detX);
        let sweepAngle = endAngle - startAngle;
        if (sweepAngle < 0.0) {
            sweepAngle += 2 * Math.PI;
        }
        return new Arc(center, radius, startAngle, sweepAngle);
    }

    static fromStartEndSweepAngle(start: IPoint, end: IPoint, sweepAngle: number) {
        if (equals(start, end) || math.equal(sweepAngle, 0))
            return undefined;
        const detX = end.x - start.x;
        const detY = end.y - start.y;
        const halfLen = Math.sqrt(detX * detX + detY * detY) / 2.0;
        const radius = halfLen / Math.abs(Math.sin(sweepAngle / 2));
        const x = xCircleCircle(start, radius, end, radius);
        if (x === undefined)
            return undefined;
        const centers = x as IPoint[];
        const count = centers.length;
        const centerOnLeft = (sweepAngle > 0.0) && (sweepAngle <= Math.PI) ||
            (sweepAngle > -2 * Math.PI) && (sweepAngle <= -Math.PI);
        for (let i = 0; i < count; i++) {
            const detXc = centers[i].x - start.x;
            const detYc = centers[i].y - start.y;
            const thisCenterOnLeft = (detX * detYc - detXc * detY) >= 0.0;
            if (centerOnLeft === thisCenterOnLeft) {
                const center = centers[i];
                const startAngle = Math.atan2(-detYc, -detXc);
                return new Arc(center, radius, startAngle, sweepAngle);
            }
        }
        return undefined;
    }

    // 逆时针从起点到终点，已知弦高的圆弧
    static fromStartEndChordHeight(start: IPoint, end: IPoint, chordHeight: number) {
        if (equals(start, end) || chordHeight <= 0)
            return undefined;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const radius = chordHeight / 2 + len * len / (8.0 * chordHeight);
        let ccDist; //distance of chord and center
        if (chordHeight >= radius) {
            ccDist = chordHeight - radius;
        }
        else {
            ccDist = chordHeight + radius;
        }
        const pp = ccDist / len;
        const cx = (start.x + end.x) / 2.0 + dy * pp;
        const cy = (start.y + end.y) / 2.0 - dx * pp;
        const startAngle = Math.atan2(start.y - cy, start.x - cx);
        const endAngle = Math.atan2(end.y - cy, end.x - cx);
        let sweepAngle = endAngle - startAngle;
        if (sweepAngle > 0.0) {
            if (chordHeight < radius)
                sweepAngle -= 2 * Math.PI;
        }
        else {
            if (chordHeight >= radius)
                sweepAngle += 2 * Math.PI;
        }
        return new Arc(makePoint(cx, cy), radius, startAngle, sweepAngle);
    }

    // 逆时针从起点转到终点的劣弧
    static fromStartEndRadius(start: IPoint, end: IPoint, radius: number) {
        const SEx = end.x - start.x;
        const SEy = end.y - start.y;
        if ((SEx == 0.0 && SEy == 0.0) || radius == 0.0)
            return undefined;
        const x = xCircleCircle(start, radius, end, radius);
        if (x === undefined)
            return undefined;
        const centers = x as IPoint[];
        const count = centers.length;
        if (count == 0)
            return undefined;
        let center: IPoint;
        let startAngle: number;
        let endAngle: number;
        let sweepAngle: number;
        for (let i = 0; i < count; i++) {
            const CSx = start.x - centers[i].x;
            const CSy = start.y - centers[i].y;
            if (count === 1 || CSx * SEy - CSy * SEx > 0.0) {
                center = centers[i];
                startAngle = Math.atan2(CSy, CSx);
                const endAngle = Math.atan2(end.y - centers[i].y, end.x - centers[i].x);
                sweepAngle = endAngle - startAngle;
                if (sweepAngle < 0.0)
                    sweepAngle += 2 * Math.PI;
                return new Arc(center, radius, startAngle, sweepAngle);
            }
        }
        return undefined;
    }

    // 位于角落已知半径的圆弧
    static from2LinesRadius(p1: IPoint, corner: IPoint, p2: IPoint, radius: number) {
        const c = Circle.from2LinesRadius(p1, corner, p2, radius);
        if (c === undefined)
            return undefined;
        const l1 = Line.fromPoints(p1, corner);
        const l2 = Line.fromPoints(corner, p2);
        const proj = l1.projectOnLine(c.center);
        if (proj === undefined)
            return undefined;
        const foot = proj[0];
        const startAngle = Math.atan2(foot.y - c.center.y, foot.x - c.center.x);
        const sweepAngle = l1.xAngle(l2);
        return new Arc(c.center, radius, startAngle, sweepAngle);
    }

    constructor(cen: IPoint = { x: 0, y: 0 }, rad: number = 0, startAngle = 0, sweepAngle = Math.PI) {
        super(cen, rad);
        startAngle = normalizeAngle(startAngle);
        sweepAngle = fmod(sweepAngle, 2 * Math.PI) as number;
        this.startAngle = startAngle;
        this.sweepAngle = sweepAngle;
    }

    clone() {
        return new Arc(this.center, this.radius, this.startAngle, this.sweepAngle);
    }

    complement() {
        if (this.sweepAngle > 0)
            this.sweepAngle -= 2 * Math.PI;
        else
            this.sweepAngle += 2 * Math.PI;
        return this;
    }

    swap() {
        this.startAngle = normalizeAngle(this.startAngle + this.sweepAngle);
        this.sweepAngle = -this.sweepAngle;
        return this;
    }

    length() {
        return Math.abs(this.sweepAngle) * this.radius;
    }

    areaChord() {
        const fanarea = 0.5 * this.radius * this.radius * Math.abs(this.sweepAngle);//扇形面积
        const trianglearea = 0.5 * this.radius * this.radius * Math.abs(Math.sin(this.sweepAngle));//三角形面积
        return Math.abs(this.sweepAngle) > Math.PI ? (fanarea + trianglearea) : (fanarea - trianglearea);
    }

    areaFan() {
        return 0.5 * this.radius * this.radius * Math.abs(this.sweepAngle);
    }

    rotateAround(cen: IPoint, angle: number) {
        this.center = rotatePoint(cen, this.center, angle);
        this.startAngle = normalizeAngle(angle + this.startAngle);
        return this;
    }

    chordHeight() {
        return this.radius * (1.0 - Math.cos(this.sweepAngle / 2.0));
    }

    chordLength() {
        return 2.0 * this.radius * Math.abs(Math.sin(this.sweepAngle / 2.0));
    }

    startPoint() {
        return this.point(this.startAngle);
    }

    endPoint() {
        const ea = this.startAngle + this.sweepAngle;
        return this.point(ea);
    }

    midPoint() {
        const angle = (this.startAngle + this.sweepAngle) / 2.0;
        return this.point(angle);
    }

    tPoint(t: number) {
        const angle = this.startAngle + t * this.sweepAngle;
        return this.point(angle);
    }

    startTangentAngle() {
        return normalizeAngle(this.sweepAngle > 0 ? (this.startAngle + Math.PI / 2) : (this.startAngle - Math.PI / 2));
    }

    endTangentAngle() {
        const ea = this.startAngle + this.sweepAngle;
        return normalizeAngle(this.sweepAngle > 0 ? (ea + Math.PI / 2) : (ea - Math.PI / 2));
    }

    pointSweepAngle(point: IPoint) {
        const angle = Math.atan2(point.y - this.center.y, point.x - this.center.x);
        let result = angle - this.startAngle;
        if (this.sweepAngle > 0.0) {
            if (result < 0.0) {
                result += 2 * Math.PI;
            }
        }
        else {
            if (result > 0.0) {
                result -= 2 * Math.PI;
            }
        }
        return result;
    }

    mirrorX(x: number) {
        this.center.x = 2 * x - this.center.x;
        this.startAngle = this.startAngle >= 0.0 ? (Math.PI - this.startAngle) : (-Math.PI - this.startAngle);
        this.sweepAngle = -this.sweepAngle;
        return this;
    }

    mirrorY(y: number) {
        this.center.y = 2 * y - this.center.y;
        this.startAngle = -this.startAngle;
        this.sweepAngle = -this.sweepAngle;
        return this;
    }

    mirror(l: Line) {
        this.center = mirrorPoint(this.center, l);
        const axisAngle = l.angle();
        this.startAngle = normalizeAngle(2 * axisAngle - this.startAngle);
        this.sweepAngle = -this.sweepAngle;
        return this;
    }

    trimStart(line: ILine/*segment*/) {
        const x = xLineArc(line.p1, line.p2, false, this.center, this.radius, this.startAngle, this.sweepAngle);
        if (x === undefined || x.length === 0)
            return this;
        const points = x;
        const t = [] as number[];
        for (let pt of points) {
            t.push(this.pointSweepAngle(pt));
        }
        const newt = this.sweepAngle > 0 ? Math.min(...t) : Math.max(...t);
        this.startAngle = normalizeAngle(this.startAngle + newt);
        this.sweepAngle -= newt;
        return this;
    }

    trimEnd(line: ILine/*segment*/) {
        return this.swap().trimStart(line).swap();
    }

    extendStart(line: ILine/*segment*/) {
        const arc = this.complement();
        const x = xLineArc(line.p1, line.p2, false, arc.center, arc.radius, arc.startAngle, arc.sweepAngle);
        if (x === undefined || x.length === 0)
            return this;
        const points = x;
        const t = [] as number[];
        for (let pt of points) {
            t.push(this.pointSweepAngle(pt));
        }
        const newt = arc.sweepAngle > 0 ? Math.min(...t) : Math.max(...t);
        this.startAngle = normalizeAngle(this.startAngle + newt);
        this.sweepAngle -= newt;
        return this;
    }

    extendEnd(line: ILine/*segment*/) {
        return this.swap().extendStart(line).swap();
    }
}

export interface Polyline {
    points: IPoint[]
}

type CriticalPointType = 'line' | 'arc' | 'ease';

// 路线的圆弧应该都是劣弧
export class CriticalPoint {
    type: CriticalPointType;
    point: IPoint;
    radius: number;
    a?: number;

    static line(pt: IPoint) {
        return new CriticalPoint('line', pt, -1);
    }

    static arc(pt: IPoint, radius: number) {
        if (radius <= 0)
            return undefined;
        return new CriticalPoint('arc', pt, radius);
    }

    static ease(pt: IPoint, radius: number, a: number) {
        if (radius <= 0 && radius !== -1 || a <= 0)
            return undefined;
        return new CriticalPoint('ease', pt, radius, a);
    }

    copy(src: CriticalPoint) {
        this.type = src.type;
        this.point = clonePoint(src.point);
        this.radius = src.radius;
        this.a = src.a;
        return this;
    }

    private constructor(type: CriticalPointType, point: IPoint, radius: number, a?: number) {
        this.type = type;
        this.point = point;
        this.radius = radius;
        this.a = a;
    }
}

export class Route {
    private startAngle: number;
    private criticalPoints: CriticalPoint[];
    private offset2: number;
    private startMile: number;
    private endMile: number;
    private segmentMiles: number[]; // 不考虑Offset的曲线各段的里程长度
    private segmentLengths: number[]; // 考虑Offset的曲线各段的长度
    private invalidFlag: boolean[];
    private angles: number[];
    private static readonly da = Math.PI / 90; // 1度

    constructor(startAngle: number, criticalPoints: CriticalPoint[], startMile = 0, offset = 0) {
        this.startAngle = startAngle;
        if (criticalPoints.length === 1)
            this.criticalPoints = [];
        else
            this.criticalPoints = criticalPoints;
        this.invalidFlag = new Array<boolean>(this.criticalPoints.length);
        this.endMile = this.startMile = startMile;
        this.offset2 = offset;
        this.segmentMiles = [];
        this.segmentLengths = [];
        this.angles = [];
        this.initLens();
    }

    move(x: number, y: number) {
        for (let cp of this.criticalPoints) {
            movePoint(cp.point, x, y);
        }
        return this;
    }

    rotateAround(cen: IPoint, angle: number) {
        for (let cp of this.criticalPoints) {
            cp.point = rotatePoint(cen, cp.point, angle);
        }
        for (let i = 0; i < this.angles.length; ++i) {
            this.angles[i] = normalizeAngle(this.angles[i] + angle);
        }
        return this;
    }

    mirrorX(x: number) {
        for (let cp of this.criticalPoints) {
            cp.point.x = 2 * x - cp.point.x;
        }
        for (let i = 0; i < this.angles.length; ++i) {
            this.angles[i] = normalizeAngle(Math.PI - this.angles[i]);
        }
        return this;
    }

    mirrorY(y: number) {
        for (let cp of this.criticalPoints) {
            cp.point.y = 2 * y - cp.point.y;
        }
        for (let i = 0; i < this.angles.length; ++i) {
            this.angles[i] = normalizeAngle(-this.angles[i]);
        }
        return this;
    }

    mirror(l: Line) {
        for (let cp of this.criticalPoints) {
            cp.point = mirrorPoint(cp.point, l);
        }
        const a = l.angle();
        for (let i = 0; i < this.angles.length; ++i) {
            this.angles[i] = normalizeAngle(2 * a - this.angles[i]);
        }
        return this;
    }


    offset(dist: number) {
        this.offset2 += dist;
        this.initLens();
        return this;
    }

    length() {
        let sum = 0;
        for (let len of this.segmentLengths) {
            sum += len;
        }
        return sum;
    }

    mile() {
        return this.endMile - this.startMile;
    }

    getSegments() {
        const upper = this.criticalPoints.length - 1;
        const lines: Line[] = [];
        const arcs: Arc[] = [];
        const polylines: Polyline[] = [];
        for (let i = 0; i < upper; ++i) {
            const p1 = this.criticalPoints[i];
            const p2 = this.criticalPoints[i + 1];
            switch (p1.type) {
                case "line":
                default:
                    let l = Line.fromPoints(p1.point, p2.point);
                    l.offset(this.offset2);
                    if (l === undefined) {
                        break;
                    }
                    lines.push(l);
                    break;
                case "arc":
                    if (this.invalidFlag[i]) {
                        let l = Line.fromPoints(p1.point, p2.point);
                        l.offset(this.offset2);
                        if (l === undefined) {
                            break;
                        }
                        lines.push(l);
                    } else {
                        let arc = Arc.fromStartEndRadius(p1.point, p2.point, p1.radius) as Arc;
                        if (this.offset2 != 0) {
                            const line = Line.fromP1AngleLength(p1.point, this.angles[i]);
                            const increase = (line.whichSide(arc.center, 0) == 1) !== (this.offset2 > 0.0);
                            let det = Math.abs(this.offset2);
                            if (!increase)
                                det = -det;
                            arc.radius += det;
                        }
                        arcs.push(arc as Arc);
                    }
                    break;
                case 'ease':
                    const a = p1.a as number;
                    const A2 = a * a;
                    let l1 = Route.getStandardTangetAngleFromRad(A2, p1.radius);
                    let angle1 = Route.getStandardTangetAngleFromRad(A2, p1.radius);
                    let l2 = Route.getStandardTangetAngleFromRad(A2, p2.radius);
                    let angle2 = Route.getStandardTangetAngleFromRad(A2, p2.radius);
                    const mileLen = this.segmentMiles[i];
                    const [reverse, mirrored] = Route.getEaseBool(this.angles[i], p1, p2);
                    const detAngle = angle2 - angle1;
                    const pieceNum = Math.max(Math.abs(detAngle) / Route.da, 1);
                    const polyline = { points: [] as IPoint[] };
                    polyline.points.push(p1.point);
                    const da = detAngle / pieceNum;
                    const [start, startAngle] = this.getTransitionStartPoint(i, reverse, mirrored);
                    let angle = this.angles[i];
                    const end = reverse ? p1.point : p2.point;
                    for (let i = 1; i < pieceNum; ++i) {
                        // 计算出标准角度
                        angle += da;
                        let standardAngle = angle;
                        if (reverse)
                            standardAngle += Math.PI;
                        standardAngle -= startAngle;
                        if (mirrored)
                            standardAngle = -standardAngle;
                        standardAngle = normalizeAngle(standardAngle);
                        // 计算出标准里程
                        const mile = Route.getMileFromStandardTangetAngle(A2, standardAngle);
                        // 计算出偏移后的标准点
                        const sp = Route.getStandardPoint(a, mile, this.offset2);
                        // 计算出实际点
                        const pt = Route.standard2World(start.point, startAngle, end, sp);
                        polyline.points.push(pt);
                    }
                    polyline.points.push(p2.point);
                    polylines.push(polyline);
                    break;
            }
        }
        return { lines, arcs, polylines };
    }

    private initLens() {
        this.segmentMiles = [];
        this.segmentLengths = [];
        this.angles = [];
        let len: number, mile: number, totalMile = 0;
        const upper = this.criticalPoints.length - 1;
        let startAngle = this.startAngle;
        for (let i = 0; i < upper; ++i) {
            this.angles.push(startAngle);
            [mile, len, startAngle] = this.calcSegLength(startAngle, i);
            this.segmentMiles.push(mile);
            this.segmentLengths.push(len);
            totalMile += mile;
        }
        if (upper >= 0) {
            this.angles.push(startAngle);
            this.segmentMiles.push(0);
            this.segmentLengths.push(0);
            this.invalidFlag[upper] = false;
        }
        this.endMile = this.startMile + totalMile;
    }

    private calcSegLength(startAngle: number, index: number) {
        const p1 = this.criticalPoints[index];
        const p2 = this.criticalPoints[index + 1];
        this.invalidFlag[index] = false;
        let mileLen: number, len: number;
        switch (p1.type) {
            case "line":
            default:
                const detX = p2.point.x - p1.point.x;
                const detY = p2.point.y - p1.point.y;
                mileLen = len = Math.sqrt(detX * detX + detY * detY);
                const startAngle2 = Math.atan2(detY, detX);
                if (Math.abs(startAngle2 - startAngle) > 0.01) {
                    this.invalidFlag[index] = true;
                }
                break;
            case "arc":
                {
                    let arc = Arc.fromStartEndRadius(p1.point, p2.point, p1.radius);
                    if (arc === undefined)
                        this.invalidFlag[index] = true;
                    else {
                        // startAngle not match startTangentAngle
                        if (Math.abs(arc.startTangentAngle() - startAngle) > 0.01) {
                            const line = Line.fromPoints(p1.point, p2.point);
                            arc.mirror(line);
                            if (Math.abs(arc.startTangentAngle() - startAngle) > 0.01) {
                                this.invalidFlag[index] = true;
                            }
                        }
                    }
                    // 无效的情况当做线段处理
                    if (this.invalidFlag[index]) {
                        const detX = p2.point.x - p1.point.x;
                        const detY = p2.point.y - p1.point.y;
                        mileLen = len = Math.sqrt(detX * detX + detY * detY);
                        startAngle = Math.atan2(detY, detX);
                    } else {
                        arc = arc as Arc;
                        const angle = Math.abs(arc.sweepAngle);
                        mileLen = arc.radius * angle;
                        if (arc.sweepAngle > 0)//Left
                        {
                            len = (arc.radius - this.offset2) * angle;
                        } else {
                            len = (arc.radius + this.offset2) * angle;
                        }
                        startAngle = arc.endTangentAngle();
                    }
                }
                break;
            case 'ease':
                {
                    const a = p1.a as number;
                    const A2 = a * a;
                    let l1 = Route.getStandardTangetAngleFromRad(A2, p1.radius);
                    let angle1 = Route.getStandardTangetAngleFromRad(A2, p1.radius);
                    let l2 = Route.getStandardTangetAngleFromRad(A2, p2.radius);
                    let angle2 = Route.getStandardTangetAngleFromRad(A2, p2.radius);
                    mileLen = len = Math.abs(l2 - l1);
                    const [reverse, mirrored] = Route.getEaseBool(startAngle, p1, p2);
                    if (this.offset2 != 0) {
                        const tempLine = Line.fromP1AngleLength(p1.point, startAngle);

                        let increase = this.offset2 < 0.0;
                        if (reverse)
                            increase = !increase;
                        if (mirrored)
                            increase = !increase;
                        len = Route.getOffsetLength(len, this.offset2, angle2 - angle1, increase);
                    }
                    let detAngle = angle2 - angle1;
                    if (mirrored)
                        detAngle = -detAngle;
                    startAngle += detAngle;
                    startAngle = normalizeAngle(startAngle);
                }
                break;
        }
        return [mileLen, len, startAngle];
    }

    private static getMileFromStandardTangetAngle(A2: number, standardAngle: number) {
        return Math.sqrt(2 * A2 * standardAngle);
    }

    private static getStandardTangetAngleFromMile(A2: number, mile: number) {
        return mile * mile / (2 * A2);
    }

    private static getStandardTangetAngleFromRad(A2: number, radius: number) {
        if (radius <= 0)
            return 0;
        return A2 / (2 * radius * radius);
    }

    private static getLength(A2: number, radius: number) {
        if (radius <= 0)
            return 0;
        return A2 / radius;
    }

    private static getOffsetLength(len: number, offset: number, detAngle: number, increase: boolean) {
        const detLen = Math.abs(offset * detAngle);
        return increase ? (len + detLen) : (len - detLen);
    }

    private static getEaseBool(startAngle: number, p1: CriticalPoint, p2: CriticalPoint) {
        // p1.type === 'ease'
        let reverse: boolean;
        let mirrored: boolean;
        if (p1.radius === -1) {
            reverse = false;
        } else if (p2.radius == -1) {
            reverse = true;
        } else {
            reverse = p2.radius > p1.radius;
        }

        const tempLine = Line.fromP1AngleLength(p1.point, startAngle);
        mirrored = tempLine.whichSide(p2.point, 0) === -1; // right
        if (reverse) {
            mirrored = !mirrored;
        }
        return [reverse, mirrored];
    }

    private static getStandardPoint(A: number, mile: number, offset: number = 0) {
        const x = mile - Math.pow(mile, 5) / (40 * Math.pow(A, 4)) + Math.pow(mile, 9) / (3456 * Math.pow(A, 8));
        const y = Math.pow(mile, 3) / (6 * A * A) - Math.pow(mile, 7) / (336 * Math.pow(A, 6)) + Math.pow(mile, 11) / (42240 * Math.pow(A, 10));
        if (offset === 0.0)
            return makePoint(x, y);
        const angle = Route.getStandardTangetAngleFromMile(A * A, mile);
        const line = Line.fromP1AngleLength(makePoint(x, y), angle);
        line.offset(offset);
        return line.p1;
    }

    private static standard2World(start: IPoint, startAngle: number, end: IPoint, standardPoint: IPoint) {
        const axisX = Line.fromP1AngleLength(start, startAngle);
        const turnleft = axisX.whichSide(end, 0) == 1;
        return Route.standard2World2(start, startAngle, turnleft, standardPoint);
    }

    private static standard2World2(start: IPoint, startAngle: number, turnleft: boolean, standardPoint: IPoint) {
        //1.镜像
        if (!turnleft)//回旋线右转
        {
            standardPoint.y = -standardPoint.y;
        }
        //2.旋转
        const cosAx = Math.cos(startAngle);
        const sinAx = Math.sin(startAngle);
        let X = standardPoint.x * cosAx - standardPoint.y * sinAx;
        let Y = standardPoint.x * sinAx + standardPoint.y * cosAx;
        //3.平移
        X += start.x;
        Y += start.y;
        return makePoint(X, Y);
    }

    private static world2Standard(start: IPoint, startAngle: number, end: IPoint, worldPoint: IPoint) {
        const axisX = Line.fromP1AngleLength(start, startAngle);
        const turnleft = axisX.whichSide(end, 0) == 1;
        return Route.world2Standard2(start, startAngle, turnleft, worldPoint);
    }

    private static world2Standard2(start: IPoint, startAngle: number, turnleft: boolean, worldPoint: IPoint) {
        //1.平移
        worldPoint.x -= start.x;
        worldPoint.y -= start.y;
        //2.旋转
        const cosAx = Math.cos(startAngle);
        const sinAx = Math.sin(startAngle);
        const X = worldPoint.x * cosAx + worldPoint.y * sinAx;
        let Y = -worldPoint.x * sinAx + worldPoint.y * cosAx;
        //3.镜像
        if (!turnleft)//回旋线右转
        {
            Y = -Y;
        }
        return makePoint(X, Y);
    }

    // 缓和曲线半径为无穷大的点
    private getTransitionStartPoint(index: number, reverse: boolean, mirrored: boolean): [CriticalPoint, number] {
        let p1: CriticalPoint = this.criticalPoints[index];
        let p2: CriticalPoint = this.criticalPoints[index + 1];
        let startAngle: number;
        let start = CriticalPoint.ease(makePoint(0, 0), 1, 1) as CriticalPoint;
        start.copy(p1);
        if (p1.radius === -1) {
            startAngle = this.angles[index];
        }
        else if (p2.radius == -1) {
            start.radius = p2.radius;
            start.point = p2.point;
            startAngle = this.angles[index + 1] + Math.PI;
        } else {
            const a = p1.a as number;
            const A2 = a * a;
            const dMile1 = A2 / p1.radius;
            let sp1 = Route.getStandardPoint(a, dMile1);
            const dMile2 = A2 / p2.radius;
            let sp2 = Route.getStandardPoint(a, dMile2);
            if (mirrored) {
                sp1.y = -sp1.y;
                sp2.y = -sp2.y;
            }
            if (reverse) {
                [sp1, sp2] = [sp2, sp1];
                [p1, p2] = [p2, p1];
            }

            const l1 = Line.fromPoints(sp1, sp2);
            const l2 = Line.fromPoints(p1.point, p2.point);
            startAngle = l1.xAngle(l2);
            start.point.x = p1.point.x - sp1.x;
            start.point.y = p1.point.y - sp1.y;
            start.point = rotatePoint(p1.point, start.point, startAngle);
            start.radius = -1;
        }
        return [start, startAngle];
    }
}

// translate to fabric.Object

export function line2fabric(l: Line, options: any) {
    options = options || {};
    const coords = [l.p1.x, l.p1.y, l.p2.x, l.p2.y];
    return rightHand.makeLine(coords, options);
}

export function circle2fabric(c: Circle, options: any) {
    options = options || {};
    options.angle = 0;
    options.top = c.center.x;
    options.left = c.center.y;
    options.radius = c.radius;
    options.startAngle = 0;
    options.endAngle = 2 * Math.PI;

    return rightHand.makeCircle(options);
}

export function arc2fabric(a: Arc, options: any) {
    options = options || {};
    options.angle = 0;
    options.top = a.center.x;
    options.left = a.center.y;
    options.radius = a.radius;

    options.startAngle = a.startAngle;
    options.endAngle = a.startAngle + a.sweepAngle;
    if (a.sweepAngle < 0)
        [options.startAngle, options.endAngle] = [options.endAngle, options.startAngle]

    return rightHand.makeCircle(options);
}

export function polyline2fabric(p: Polyline, options: any) {
    options = options || {};

    return rightHand.makePolyline(p.points, options);
}

export function route2fabric(r: Route, options: any) {
    const ar = [];
    const { lines, arcs, polylines } = r.getSegments();
    for (let l of lines) {
        ar.push(line2fabric(l, options));
    }
    for (let a of arcs) {
        ar.push(arc2fabric(a, options));
    }
    for (let p of polylines) {
        ar.push(polyline2fabric(p, options));
    }
    const g = new fabric.Group(ar, {
        perPixelTargetFind: true,
        hasBorders: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
        hoverCursor: 'pointer',
    });
    g.addWithUpdate();
    return g;
}
