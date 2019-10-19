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
        if (this.isDragging) {
          const e = opt.e;
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
    },
  });

  // add fabric.Polyline2 and fabric.Line2
  function changeDefaultValues(klass, type, defaultValues) {
    return fabric.util.createClass(klass, {
      type: type,

      initialize: function (points, options) {
        options || (options = {});
        options = Object.assign({}, defaultValues, options);
        this.callSuper('initialize', points, options);
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

  fabric.Polyline2 = changeDefaultValues(fabric.Polyline, 'polyline2', defaultValues);
  fabric.Line2 = changeDefaultValues(fabric.Line, 'line2', defaultValues);
})(typeof exports !== 'undefined' ? exports : this);
