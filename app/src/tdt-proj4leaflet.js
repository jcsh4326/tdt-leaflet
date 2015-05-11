(function (factory) {
	var L, proj4;
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['leaflet', 'proj4'], factory);
	} else if (typeof module !== 'undefined') {
		// Node/CommonJS
		L = require('leaflet');
		proj4 = require('proj4');
		module.exports = factory(L, proj4);
	} else {
		// Browser globals
		if (typeof window.L === 'undefined' || typeof window.proj4 === 'undefined')
			throw 'Leaflet and proj4 must be loaded first';
		factory(window.L, window.proj4);
	}
}(function (L, proj4) {

	L.Proj = {};

	L.Proj._isProj4Obj = function(a) {
		return (typeof a.inverse !== 'undefined' &&
			typeof a.forward !== 'undefined');
	};

	L.Proj.ScaleDependantTransformation = function(scaleTransforms) {
		this.scaleTransforms = scaleTransforms;
	};

	L.Proj.ScaleDependantTransformation.prototype.transform = function(point, scale) {
		return this.scaleTransforms[scale].transform(point, scale);
	};

	L.Proj.ScaleDependantTransformation.prototype.untransform = function(point, scale) {
		return this.scaleTransforms[scale].untransform(point, scale);
	};

	L.Proj.Projection = L.Class.extend({
		initialize: function(a, def) {
			if (L.Proj._isProj4Obj(a)) {
				this._proj = a;
			} else {
				var code = a;
				if (def) {
					proj4.defs(code, def);
				} else if (proj4.defs[code] === undefined) {
					var urn = code.split(':');
					if (urn.length > 3) {
						code = urn[urn.length - 3] + ':' + urn[urn.length - 1];
					}
					if (proj4.defs[code] === undefined) {
						throw 'No projection definition for code ' + code;
					}
				}
				this._proj = proj4(code);
			}
		},

		project: function (latlng) {
			var point = this._proj.forward([latlng.lng, latlng.lat]);
			return new L.Point(point[0], point[1]);
		},

		unproject: function (point, unbounded) {
			var point2 = this._proj.inverse([point.x, point.y]);
			return new L.LatLng(point2[1], point2[0], unbounded);
		}
	});

	L.Proj.CRS = L.Class.extend({
		includes: L.CRS,

		options: {
			transformation: new L.Transformation(1, 0, -1, 0)
		},

		initialize: function(a, b, c) {
			var code, proj, def, options;

			if (L.Proj._isProj4Obj(a)) {
				proj = a;
				code = proj.srsCode;
				options = b || {};

				this.projection = new L.Proj.Projection(proj);
			} else {
				code = a;
				def = b;
				options = c || {};
				this.projection = new L.Proj.Projection(code, def);
			}

			L.Util.setOptions(this, options);
			this.code = code;
			this.transformation = this.options.transformation;

			if (this.options.origin) {
				this.transformation =
					new L.Transformation(1, -this.options.origin[0],
						-1, this.options.origin[1]);
			}

			if (this.options.scales) {
				this._scales = this.options.scales;
			} else if (this.options.resolutions) {
				this._scales = [];
				for (var i = this.options.resolutions.length - 1; i >= 0; i--) {
					if (this.options.resolutions[i]) {
						this._scales[i] = 1 / this.options.resolutions[i];
					}
				}
			}
		},

		scale: function(zoom) {
			var iZoom = Math.floor(zoom),
				baseScale,
				nextScale,
				scaleDiff,
				zDiff;
			if (zoom === iZoom) {
				return this._scales[zoom];
			} else {
				// Non-integer zoom, interpolate
				baseScale = this._scales[iZoom];
				nextScale = this._scales[iZoom + 1];
				scaleDiff = nextScale - baseScale;
				zDiff = (zoom - iZoom);
				return baseScale + scaleDiff * zDiff;
			}
		},

		getSize: function(zoom) {
			var b = this.options.bounds,
			    s,
			    min,
			    max;

			if (b) {
				s = this.scale(zoom);
				min = this.transformation.transform(b.min, s);
				max = this.transformation.transform(b.max, s);
				return L.point(Math.abs(max.x - min.x), Math.abs(max.y - min.y));
			} else {
				// Backwards compatibility with Leaflet < 0.7
				s = 256 * Math.pow(2, zoom);
				return L.point(s, s);
			}
		},			
	});
	
	L.Proj.CRS.TDT = L.Proj.CRS.extend({
		
		inch2centimeter:0.0254,
		
		dpi:96,		
		
		earth:6378137,
		
		initialize: function(a, b, c) {
			var code, proj, def, options;

			if (L.Proj._isProj4Obj(a)) {
				proj = a;
				code = proj.srsCode;
				options = b || {};

				this.projection = new L.Proj.Projection(proj);
			} else {
				code = a;
				def = b;
				options = c || {};
				this.projection = new L.Proj.Projection(code, def);
			}

			L.Util.setOptions(this, options);
			this.code = code;
			this.transformation = this.options.transformation;

			if (this.options.origin) {
				this.transformation =
					new L.Transformation(1, -this.options.origin[0],
						-1, this.options.origin[1]);
			}

			if (this.options.scales) {
				this._scales = this.options.scales;
			} else if (this.options.resolutions) {
				this._scales = [];
				for (var i = this.options.resolutions.length - 1; i >= 0; i--) {
					if (this.options.resolutions[i]) {
						this._scales[i] = 1 / this.options.resolutions[i];
					}
				}
			} else {
				this._scales = [295829355.45,147914677.73,73957338.86,36978669.43,18489334.72,
					9244667.36,4622333.68,2311166.84,1155583.42,577791.71,
					288895.85,144447.93,72223.96,36111.98,18055.99,
					9028.00,4514.00,2257.00,1128.50,564.25];
			}
		},			
		
		latLngToPoint: function(latlng,zoom) {
			var lng = latlng.lng;
			var lat = latlng.lat;
			var z = zoom;
			lng = lng + 180;
			lat = 90 - lat;
			x = lng/360.0*256.0*Math.pow(2,z);
			y = lat/360.0*256.0*Math.pow(2,z);
			return new L.Point(x,y);
		},
		
		pointToLatLng: function(point,zoom) {	
			// projectedPoint 2 unprojectedPoint
			// var center = map.getCenter();
			// var clientH = map._container.clientHeight;
			// var clientW = map._container.clientWidth;
			var x = point.x;
			var y = point.y;
			var z = zoom;
			var lat = y/Math.pow(2,z)/256.0*360.0
			var lat = Math.abs(90 - lat)
			var lng = x/Math.pow(2,z)/256.0*360.0
			var lng = lng - 180			
			return new L.LatLng(lat,lng);
		}
	});	

	return L.Proj;
}));
