if (typeof exports !== 'undefined') {
  exports.fabric = fabric;
}

(function (global) {
  'use strict';

  var fabric = global.fabric;
  // Extend fabric.Object
  fabric.util.object.extend(fabric.Object.prototype, {
    name: '',
  });

  /**
   * Copy from fabric.js
   * @private
   * @param {CanvasRenderingContext2D} ctx Context to render on
   */
  fabric.Object.prototype._renderStroke = function (ctx) {
    if (!this.stroke || this.strokeWidth === 0) {
      return;
    }

    if (this.shadow && !this.shadow.affectStroke) {
      this._removeShadow(ctx);
    }

    ctx.save();
    if (this.strokeUniform) {
      var gzoom = this.canvas.getZoom();
      ctx.scale(1 / (this.scaleX * gzoom), 1 / (this.scaleY * gzoom));
    }
    this._setLineDash(ctx, this.strokeDashArray, this._renderDashedStroke);
    if (this.stroke.toLive && this.stroke.gradientUnits === 'percentage') {
      // need to transform gradient in a pattern.
      // this is a slow process. If you are hitting this codepath, and the object
      // is not using caching, you should consider switching it on.
      // we need a canvas as big as the current object caching canvas.
      this._applyPatternForTransformedGradient(ctx, this.stroke);
    }
    else {
      this._applyPatternGradientTransform(ctx, this.stroke);
    }
    ctx.stroke();
    ctx.restore();
  },

    // Extend fabric.Canvas
    fabric.util.object.extend(fabric.Canvas.prototype, {
      setHightlightColor: function (color/*string*/) {
        this.hightlightStroke = color;
      },

      setHightlightNames: function (names/*string or string array*/) {
        if (this.hightlightObjects instanceof Array) {
          if (this.hightlightObjects.length > 0) {
            this.requestRenderAll();
          }
          for (let i = 0; i < this.hightlightObjects.length; ++i) {
            let obj = this.hightlightObjects[i];
            obj.stroke = obj.originalStroke;
            obj.dirty = true;
          }
        }
        this.hightlightStroke = this.hightlightStroke || 'red';
        this.hightlightObjects = [];
        if (typeof names === 'string') {
          names = [names];
        }
        let map = {};
        for (let i = 0; i < names.length; ++i) {
          map[names[i]] = undefined;
        }
        this.forEachObject(function (obj, index, list) {
          if (obj.name in map) {
            obj.originalStroke = obj.stroke;
            obj.stroke = this.hightlightStroke;
            obj.dirty = true;
            this.hightlightObjects.push(obj);
          }
        }, this);
        if (this.hightlightObjects.length > 0) {
          this.requestRenderAll();
        }
      },

      getBoundingBox: function () {
        var points = [];
        this.forEachObject((obj) => {
          var coords = obj.getCoords(true, false);
          points = points.concat(coords);
        })
        return getBBox(points);
      },

      zoomToFit: function () {
        var bbox = this.getBoundingBox();
        if (bbox.width <= 0 || bbox.height <= 0) {
          return;
        }
        this.baseZoom = Math.min(this.width / bbox.width, this.height / bbox.height);
        var t = fabric.iMatrix.concat();
        t[0] = t[3] = this.baseZoom;
        // dx = Xpd - z * Xpl
        // dy = Ypd - z * Ypl
        var Xpd = this.width / 2.0, Ypd = this.height / 2.0;
        var Xpl = bbox.left + bbox.width / 2.0, Ypl = bbox.top + bbox.height / 2.0;
        t[4] = Xpd - this.baseZoom * Xpl;
        t[5] = Ypd - this.baseZoom * Ypl;
        this.setViewportTransform(t);
      },
      baseZoom: 1.0,
    });

  fabric.Canvas2 = fabric.util.createClass(fabric.Canvas, {
    initialize: function (el, options) {
      options || (options = {});
      var defaultValues = {
        // perPixelTargetFind: true,
        targetFindTolerance: 2,
        fireMiddleClick: true,
        fireRightClick: true,
        showCoord: false,
        rightHand: false,
      };
      options = Object.assign({}, defaultValues, options);
      this.callSuper('initialize', el, options);

      // zoom
      this.on('mouse:wheel', (opt) => {
        opt.e.preventDefault();
        opt.e.stopPropagation();
        const delta = opt.e.deltaY;
        const pointer = this.getPointer(opt.e);
        let zoom = this.getZoom();
        const times = Math.round(delta / (133 + 1 / 3));
        if (times > 0) {
          for (let i = 0; i < times; ++i) {
            zoom *= 0.8;
          }
        } else if (times < 0) {
          for (let i = 0; i < -times; ++i) {
            zoom *= 1.25;
          }

        } else {
          return;
        }
        zoom = Math.min(20 * this.baseZoom, zoom);
        zoom = Math.max(0.5 * this.baseZoom, zoom);
        this.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      });

      // zoom to fit
      this.on('mouse:dblclick2', (opt) => {
        this.zoomToFit();
      });

      // pan
      this.on('mouse:down:before', (e) => {
        if (e.e.buttons === 2 || e.e.buttons === 4) { // right button or middle button
          this.isDragging = true;
          this.lastPosX = e.e.clientX;
          this.lastPosY = e.e.clientY;
          e.e.preventDefault();
          e.e.stopPropagation();
        }
      });
      this.on('mouse:move', (opt) => {
        const e = opt.e;
        this.curPosToShow = { x: e.clientX, y: e.clientY };
        if (this.isDragging) {
          // fabric.Canvas#absolutePan can do the same thing, but not intuitive.
          this.viewportTransform[4] += e.clientX - this.lastPosX;
          this.viewportTransform[5] += e.clientY - this.lastPosY;
          this.setViewportTransform(this.viewportTransform);
          this.requestRenderAll();
          this.lastPosX = e.clientX;
          this.lastPosY = e.clientY;
          opt.e.preventDefault();
          opt.e.stopPropagation();
        }
        if (this.showCoord) {
          this.requestRenderAll();
        }
      });
      this.on('mouse:up:before', (opt) => {
        this.isDragging = false;
      });

      // generate mouse middle/right button dblclick
      this.on('mouse:up', (opt) => {
        if (!opt.isClick || opt.button === 1) {
          return;
        }
        if (this.mrDblClickId) {
          clearTimeout(this.mrDblClickId);
          if (Math.abs(opt.e.clientX - this.lastClickX) <= 2 && Math.abs(opt.e.clientY - this.lastClickY) <= 2) {
            this.mrDblClickId = undefined;
            this.fire('mouse:dblclick2', opt);
            return;
          }
        }
        this.mrDblClickId = setTimeout(() => {
          clearTimeout(this.mrDblClickId);
          this.mrDblClickId = undefined;
        }, 500);
        this.lastClickX = opt.e.clientX;
        this.lastClickY = opt.e.clientY;
      });

      // 显示当前坐标
      this.on('after:render', (opt) => {
        const ctx = opt.ctx;
        if (!this.curPosToShow || !ctx || !this.showCoord) {
          return;
        }
        var mInverse = fabric.util.invertTransform(this.viewportTransform);
        var pt = fabric.util.transformPoint(this.curPosToShow, mInverse);
        var y = this.rightHand ? -pt.y : pt.y;
        var coord = pt.x.toFixed(2) + ', ' + y.toFixed(2);
        ctx.fillText(coord, 2, 12);
      });
    },
  });

  fabric.DimAln = fabric.util.createClass(fabric.Object, {
    type: 'dimaln',

    initialize: function (options) {
      options || (options = {});

      this.callSuper('initialize', options);

      this.set('extColor', options.extColor || '#000');
      this.set('dimColor', options.dimColor || '#000');
      this.set('textColor', options.textColor || '#000');
      this.set('extOff', isFinite(options.extOff) ? options.extOff : 5);
      this.set('extExt', isFinite(options.extExt) ? options.extExt : 10);
      this.set('textGap', isFinite(options.textGap) ? options.textGap : 2);
      this.set(
        'textHeight',
        isFinite(options.textHeight) ? options.textHeight : 12
      );

      this.set('extPt1', options.extPt1 || { x: 100, y: 100 });
      this.set('extPt2', options.extPt2 || { x: 150, y: 100 });
      this.set('dimDist', options.dimDist || 5);

      this.set('fixed', isFinite(options.fixed) ? options.fixed : 2);
      this.set('prefix', options.prefix || '');
      this.set('suffix', options.suffix || '');
      if (options.text == undefined) {
        const pt1 = this.get('extPt1');
        const pt2 = this.get('extPt2');
        const dx = pt1.x - pt2.x;
        const dy = pt1.y - pt2.y;
        let len = Math.sqrt(dx * dx + dy * dy);
        this.set('text', len.toFixed(options.fixed));
      } else {
        this.set('text', options.text);
      }
      this.set('textPos', options.textPos || { x: 100, y: 100 });
      this.set('textAngle', options.textAngle | 0);
      this.build();
    },

    toObject: function () {
      return fabric.util.object.extend(this.callSuper('toObject'), {
        extPt1: this.get('extPt1'),
        extPt2: this.get('extPt2'),
        dimDist: this.get('dimDist'),
        dimColor: this.get('dimColor'),
        textColor: this.get('textColor'),
        extOff: this.get('extOff'),
        extExt: this.get('extExt'),
        textGap: this.get('textGap'),
        textHeight: this.get('textHeight'),
        text: this.get('text'),
        textPos: this.get('textPos'),
        textAngle: this.get('textAngle'),
      })
    },

    build: function () {
      const m_ExtLine1Point = this.get('extPt1');
      const m_ExtLine2Point = this.get('extPt2');
      const dimDist = this.get('dimDist');
      let extend = this.get('extExt');
      let gap = this.get('textGap');
      let offset = this.get('extOff');
      const dimLineAngle = lineAngle(m_ExtLine1Point, m_ExtLine2Point);
      this.dimLine = offsetLine(m_ExtLine1Point, m_ExtLine2Point, -dimDist);

      this.extLine1 = { p1: Object.assign({}, m_ExtLine1Point), p2: Object.assign({}, this.dimLine.p1) };
      this.extLine2 = { p1: Object.assign({}, m_ExtLine2Point), p2: Object.assign({}, this.dimLine.p2) };
      lengthenEnd(this.extLine1, extend);
      lengthenEnd(this.extLine2, extend);
      lengthenStart(this.extLine1, -offset);
      lengthenStart(this.extLine2, -offset);
      this.textRotation = dimLineAngle;
      if (this.textRotation > Math.PI / 2.0) {
        // gap = -gap;
        this.textRotation -= Math.PI;
      } else if (this.textRotation <= -Math.PI / 2.0) {
        // gap = -gap;
        this.textRotation += Math.PI;
      }
      const textHeight = this.get('textHeight');
      const textLine = offsetLine(this.dimLine.p1, this.dimLine.p2, -gap);
      const textLine2 = offsetLine(this.dimLine.p1, this.dimLine.p2, -(gap + textHeight));
      this.textPos = midPoint(midPoint(textLine.p1, textLine.p2), midPoint(textLine2.p1, textLine2.p2));

      var points = [];
      points.push(this.dimLine.p1, this.dimLine.p2, this.extLine1.p1, this.extLine1.p2, this.extLine2.p1, this.extLine2.p2, textLine2.p1, textLine2.p2);
      var bbox = getBBox(points);

      const dx = -(bbox.left + bbox.width / 2.0);
      const dy = -(bbox.top + bbox.height / 2.0);

      offsetPoint(this.dimLine.p1, dx, dy);
      offsetPoint(this.dimLine.p2, dx, dy);
      offsetPoint(this.extLine1.p1, dx, dy);
      offsetPoint(this.extLine1.p2, dx, dy);
      offsetPoint(this.extLine2.p1, dx, dy);
      offsetPoint(this.extLine2.p2, dx, dy);
      offsetPoint(this.textPos, dx, dy);

      this.set('textHeight', Math.abs(this.get('textHeight')));

      // 这个是必须的，否则图形不会显示
      this.set(bbox);
    },

    _render: function (ctx) {
      var gzoom = this.canvas.getZoom();

      ctx.beginPath();
      ctx.strokeStyle = this.get('dimColor');
      ctx.moveTo(this.dimLine.p1.x, this.dimLine.p1.y);
      ctx.lineTo(this.dimLine.p2.x, this.dimLine.p2.y);
      ctx.save();
      ctx.scale(1 / (this.scaleX * gzoom), 1 / (this.scaleY * gzoom));
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.strokeStyle = this.get('extColor');
      ctx.moveTo(this.extLine1.p1.x, this.extLine1.p1.y);
      ctx.lineTo(this.extLine1.p2.x, this.extLine1.p2.y);
      ctx.moveTo(this.extLine2.p1.x, this.extLine2.p1.y);
      ctx.lineTo(this.extLine2.p2.x, this.extLine2.p2.y);
      ctx.save();
      ctx.scale(1 / (this.scaleX * gzoom), 1 / (this.scaleY * gzoom));
      ctx.stroke();
      ctx.restore();

      const textHeight = this.get('textHeight');
      const text = this.get('prefix') + this.get('text') + this.get('suffix');
      ctx.save();
      ctx.fillStyle = this.get('textColor');
      ctx.font = textHeight + 'px sans-serif';
      ctx.translate(this.textPos.x, this.textPos.y);
      ctx.rotate(this.textRotation);
      ctx.textBaseline = "middle";
      ctx.textAlign = 'center';
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  });

  // add fabric.Polyline2 and fabric.Line2
  function changePointsDefaultValues(klass, type, defaultValues) {
    return fabric.util.createClass(klass, {
      type: type,

      initialize: function (points, options) {
        options || (options = {});
        options = Object.assign({}, defaultValues, options);
        this.callSuper('initialize', points, options);
      },
    });
  }

  function changeDefaultValues(klass, type, defaultValues) {
    return fabric.util.createClass(klass, {
      type: type,

      initialize: function (options) {
        options || (options = {});
        options = Object.assign({}, defaultValues, options);
        this.callSuper('initialize', options);
      },
    });
  }

  function changeTextDefaultValues(klass, type, defaultValues) {
    return fabric.util.createClass(klass, {
      type: type,

      initialize: function (text, options) {
        options || (options = {});
        options = Object.assign({}, defaultValues, options);
        this.callSuper('initialize', text, options);
      },
    });
  }

  var defaultValues = {
    perPixelTargetFind: true,
    hasBorders: false,
    hasControls: false,
    lockMovementX: true,
    lockMovementY: true,
    hoverCursor: 'pointer',
    fill: undefined,
  };

  fabric.Line2 = changePointsDefaultValues(fabric.Line, 'line2', defaultValues);
  fabric.Polyline2 = changePointsDefaultValues(fabric.Polyline, 'polyline2', defaultValues);
  fabric.Polygon2 = changePointsDefaultValues(fabric.Polygon, 'polygon2', defaultValues);

  fabric.Circle2 = changeDefaultValues(fabric.Circle, 'circle2', defaultValues);
  fabric.Rect2 = changeDefaultValues(fabric.Rect, 'rect2', defaultValues);
  fabric.Image2 = changeDefaultValues(fabric.Image, 'image2', defaultValues);
  fabric.DimAln2 = changeDefaultValues(fabric.DimAln, 'dimaln2', defaultValues);

  var defaultValues2 = {
    perPixelTargetFind: false,
    hasBorders: false,
    hasControls: false,
    lockMovementX: true,
    lockMovementY: true,
    hoverCursor: 'pointer',
    fill: undefined,
  };
  fabric.Text2 = changeTextDefaultValues(fabric.Text, 'text2', defaultValues2);
})(typeof exports !== 'undefined' ? exports : this);

(function (global) {
  'use strict';
  var fabric = global.fabric;
  var rightHand = global.rightHand = {};

  rightHand.makeLine = function (points, options) {
    options.originX = "center";
    options.originY = "center";
    options.angle = options.angle || 0;
    if (_.isFinite(options.angle)) {
      options.angle = -options.angle;
    }
    if (_.isArray(points)) {
      points = points.map(function (value, index) {
        return (index % 2 === 1) ? -value : value;
      });
    }
    var ret = new fabric.Line2(points, options);
    return ret;
  };

  rightHand.makeCircle = function (options) {
    options.angle = options.angle || 0;
    if (_.isFinite(options.angle)) {
      options.angle = -options.angle;
    }
    options.top = options.top || 0;
    if (_.isFinite(options.top)) {
      options.top = -options.top;
    }
    if (options.originY === "bottom") {
      options.top -= options.radius;
    } else if (options.originY !== "center") { // top
      options.top += options.radius;
    }
    options.left = options.left || 0;
    if (options.originX === "right") {
      options.left -= options.radius;
    } else if (options.originX !== "center") { // left
      options.left += options.radius;
    }
    options.originX = "center";
    options.originY = "center";
    options.startAngle = options.startAngle || 0;
    options.endAngle = options.endAngle || 2 * Math.PI;
    if (options.startAngle !== 0 && !math.equal(options.endAngle, 2 * Math.PI)) {
      if (_.isFinite(options.startAngle)) {
        options.startAngle = -options.startAngle;
      }
      if (_.isFinite(options.endAngle)) {
        options.endAngle = -options.endAngle;
      }
      var tmp = options.startAngle;
      options.startAngle = options.endAngle;
      options.endAngle = tmp;
    }
    var ret = new fabric.Circle2(options);
    return ret;
  };

  rightHand.makeRect = function (options) {
    options.angle = options.angle || 0;
    if (_.isFinite(options.angle)) {
      options.angle = -options.angle;
    }
    options.top = options.top || 0;
    if (_.isFinite(options.top)) {
      options.top = -options.top;
    }
    options.left = options.left || 0;
    if (options.originX === "right") {
      options.left -= options.width / 2.0;
    } else if (options.originX !== "center") { // left
      options.left += options.width / 2.0;
    }
    if (options.originY === "bottom") {
      options.top -= options.height / 2.0;
    } else if (options.originY !== "center") { // top
      options.top += options.height / 2.0;
    }
    options.originX = "center";
    options.originY = "center";
    var ret = new fabric.Rect2(options);
    return ret;
  };

  rightHand.makePolyline = function (points, options) {
    options.originX = "center";
    options.originY = "center";
    options.angle = options.angle || 0;
    if (_.isFinite(options.angle)) {
      options.angle = -options.angle;
    }
    if (_.isArray(points)) {
      points = points.map(function (value) {
        return { x: value.x, y: -value.y };
      });
    }
    var ret = new fabric.Polyline2(points, options);
    return ret;
  };

  rightHand.makePolygon = function (points, options) {
    options.originX = "center";
    options.originY = "center";
    options.angle = options.angle || 0;
    if (_.isFinite(options.angle)) {
      options.angle = -options.angle;
    }
    if (_.isArray(points)) {
      points = points.map(function (value) {
        return { x: value.x, y: -value.y };
      });
    }
    var ret = new fabric.Polygon2(points, options);
    return ret;
  };

  rightHand.makeText = function (text, options) {
    options.angle = options.angle || 0;
    if (_.isFinite(options.angle)) {
      options.angle = -options.angle;
    }
    options.top = options.top || 0;
    if (_.isFinite(options.top)) {
      options.top = -options.top;
    }
    var ret = new fabric.Text2(text, options);
    return ret;
  };

  rightHand.makeDimAln = function (options) {
    options.angle = options.angle || 0;
    if (_.isFinite(options.angle)) {
      options.angle = -options.angle;
    }
    options.top = options.top || 0;
    if (_.isFinite(options.top)) {
      options.top = -options.top;
    }
    options.dimDist = options.dimDist || 0;
    if (_.isFinite(options.dimDist)) {
      options.dimDist = -options.dimDist;
    }
    if (_.isObject(options.extPt1)) {
      options.extPt1.y = -options.extPt1.y;
    }
    if (_.isObject(options.extPt2)) {
      options.extPt2.y = -options.extPt2.y;
    }
    if (options.dimDist < 0) {
      options.textGap = isFinite(options.textGap) ? -options.textGap : -2;
      options.textHeight = isFinite(options.textHeight) ? -options.textHeight : -12;
    }
    var ret = new fabric.DimAln2(options);
    return ret;
  };

  rightHandle.loadTypeExtensions = []; // array of function(e)=>fabric.Object

  rightHand.loadObjects = function (ar) {
    var result = [];
    if (_.isArray(ar)) {
      return result;
    }
    for (let i = 0; i < ar.length; ++i) {
      const e = ar[i];
      if (_.isObject(e)) {
        switch (e.type) {
          case 'line':
            const p1p2 = e.coords;
            e.coords = undefined;
            var l = rightHand.makeLine(p1p2, e);
            if (l !== undefined)
              result.push(l);
            break;
          case 'circle':
            var c = rightHand.makeCircle(e);
            if (c !== undefined)
              result.push(c);
            break;
          case 'polyline':
            let points = e.points;
            e.points = undefined;
            var pl = rightHand.makePolyline(points, e);
            if (pl !== undefined)
              result.push(pl);
            break;
          case 'polygon':
            points = e.points;
            e.points = undefined;
            var pg = rightHand.makePolygon(points, e);
            if (pg !== undefined)
              result.push(pg);
            break;
          case 'rect':
            var t = rightHand.makeRect(e);
            if (t !== undefined)
              result.push(t);
            break;
          case 'text':
            const text = e.text;
            e.text = undefined;
            var t = rightHand.makePolygon(text, e);
            if (t !== undefined)
              result.push(t);
            break;
          case 'dimaln':
            var d = rightHand.makeDimAln(e);
            if (d !== undefined)
              result.push(d);
            break;
          default:
            var loadExtCount = rightHandle.loadTypeExtensions.length;
            for (let j = 0; j < loadExtCount; ++j) {
              var loadFunc = rightHandle.loadTypeExtensions[j];
              if (_.isFunction(loadFunc)) {
                var d = loadFunc(e);
                if (d !== undefined) {
                  if (_.isArray(d)) {
                    d.map(function (v) { result.push(v); });
                  } else {
                    result.push(d);
                  }
                  break;
                }
              }
            }
            break;
        }
      }
    }
    return result;
  };

})(typeof exports !== 'undefined' ? exports : this);

function offsetLine(p1, p2, distance) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (dx === 0.0 && dy === 0.0)
    return null;
  const len = Math.sqrt(dx * dx + dy * dy);
  const pp = distance / len;
  const detx = -dy * pp;
  const dety = dx * pp;
  return {
    p1: { x: p1.x + detx, y: p1.y + dety },
    p2: { x: p2.x + detx, y: p2.y + dety }
  };
}

function lineAngle(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx);
}

function distPointLine(point, start, end) {
  const tmp = calLineABC(start, end);
  if (tmp === null) {
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  let { a, b, c } = tmp;
  normalizeABC(a, b, c);
  const numerator = Math.abs(a * point.x + b * point.y + c);
  const denominator = Math.sqrt(a * a + b * b);
  return numerator / denominator;
}

// 计算p1p2直线方程ax+by+c参数a,b,c
function calLineABC(p1, p2) {
  let a = p1.y - p2.y;
  let b = p2.x - p1.x;
  if (Math.abs(a) <= 1e-8 && Math.abs(b) <= 1e-8)
    return null;
  c = p1.x * p2.y - p2.x * p1.y;
  return { a, b, c };
}

function normalizeABC(a, b, c) {
  if (a === 0 && b === 0) {
    return null;
  }
  const f = 1.0 / sqrt(a * a + b * b);
  a *= f;
  b *= f;
  c *= f;
  return { a, b, c };
}

function createLine(p1, angle, length) {
  const cx = length * Math.cos(angle);
  const cy = length * Math.sin(angle);
  const x = p1.x + cx;
  const y = p1.y + cy;
  return { p1: { x: p1.x, y: p1.y }, p2: { x, y } };
}

function intersectXLineXLine(a1, a2, b1, b2) {
  var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
  var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
  var u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

  if (u_b != 0) {
    var ua = ua_t / u_b;
    var ub = ub_t / u_b;

    return { x: a1.x + ua * (a2.x - a1.x), y: a1.y + ua * (a2.y - a1.y) };
  } else {
    // if ( ua_t == 0 || ub_t == 0 ) {
    //     // Coincident
    // } else {
    //     // Parallel
    // }
    return null;
  }
}

function lengthenStart(line, length) {
  const dx = line.p1.x - line.p2.x;
  const dy = line.p1.y - line.p2.y;
  if (dx == 0.0 && dy == 0.0)
    return;
  const len = Math.sqrt(dx * dx + dy * dy);
  const co = length / len;
  line.p1.x += dx * co;
  line.p1.y += dy * co;
}

function lengthenEnd(line, length) {
  const dx = line.p2.x - line.p1.x;
  const dy = line.p2.y - line.p1.y;
  if (dx === 0.0 && dy === 0.0)
    return;
  const len = Math.sqrt(dx * dx + dy * dy);
  const co = length / len;
  line.p2.x += dx * co;
  line.p2.y += dy * co;
}

function midPoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2.0,
    y: (p1.y + p2.y) / 2.0
  };
}

function getBBox(points) {
  if (points.length === 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }
  var xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (var i = 0; i < points.length; i++) {
    xMin = Math.min(points[i].x, xMin);
    xMax = Math.max(points[i].x, xMax);
    yMin = Math.min(points[i].y, yMin);
    yMax = Math.max(points[i].y, yMax);
  }
  return { left: xMin, top: yMin, width: xMax - xMin, height: yMax - yMin };
}

function offsetPoint(pt, dx, dy) {
  pt.x += dx;
  pt.y += dy;
}
