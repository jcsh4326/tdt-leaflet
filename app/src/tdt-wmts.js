L.TileLayer.TDTWMTS = L.TileLayer.extend({
	des: 'this is a layer for tdt wmts with cgsc2000',
	
	
	scales: [295829355.45,147914677.73,73957338.86,36978669.43,18489334.72,
					9244667.36,4622333.68,2311166.84,1155583.42,577791.71,
					288895.85,144447.93,72223.96,36111.98,18055.99,
					9028.00,4514.00,2257.00,1128.50,564.25],
					
	resolutions: [0.7031249999891485,0.35156249999999994,0.17578124999999997, 0.08789062500000014,0.04394531250000007,0.021972656250000007,
						0.01098632812500002,0.00549316406250001,0.0027465820312500017,
						0.0013732910156250009,0.000686645507812499,0.0003433227539062495,
						0.00017166137695312503,0.00008583068847656251,0.000042915344238281406,
						0.000021457672119140645,0.000010728836059570307,0.000005364418029785169,
						0.000002682210361715995, 0.0000013411051808579975],	
	
    defaultWmtsParams: {
        service: 'WMTS',
        request: 'GetTile',
        version: '1.0.0',		
        layer: '',
        style: '',
        tilematrixSet: '',
        format: 'image/jpeg'
    },

    initialize: function (url, options, sub) { // (String, Object)
        this._url = url;
		this.sub = sub||false;
        var wmtsParams = L.extend({}, this.defaultWmtsParams),
        tileSize = options.tileSize || this.options.tileSize;
        if (options.detectRetina && L.Browser.retina) {
            wmtsParams.width = wmtsParams.height = tileSize * 2;
        } else {
            wmtsParams.width = wmtsParams.height = tileSize;
        }
        for (var i in options) {
            // all keys that are not TileLayer options go to WMTS params
            if (!this.options.hasOwnProperty(i) && i!="matrixIds") {
                wmtsParams[i] = options[i];
            }
        }
        this.wmtsParams = wmtsParams;
		
        this.matrixIds = options.matrixIds||this.getDefaultMatrix();
		
        L.setOptions(this, options);
    },

    onAdd: function (map) {
        L.TileLayer.prototype.onAdd.call(this, map);
    },
	
	pixel2LonLat: function(point,zoom){
		var py = point.y, px = point.x;
		var lat = py/Math.pow(2,zoom)/256*360;
		lat = Math.abs(90-lat);
		var lng = px/Math.pow(2,zoom)/256*360;
		lng = lng - 180;
		return new L.LatLng(lat,lng);
	},
	
    getTileUrl: function (tilePoint, zoom) { // (Point, Number) -> String
        var map = this._map;
        zoom=map.getZoom();
		if(!this.matrixIds[zoom])
			return "";
        ident = this.matrixIds[zoom].identifier;
        url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});
        return url + L.Util.getParamString(this.wmtsParams, url) + "&tilematrix=" + ident + "&tilerow=" + tilePoint.y +"&tilecol=" + tilePoint.x ;
    },

    setParams: function (params, noRedraw) {
        L.extend(this.wmtsParams, params);
        if (!noRedraw) {
            this.redraw();
        }
        return this;
    },
    
    getDefaultMatrix : function () {
        /**
         * 江苏省只有 7-14 这8级的切片
         */
        var matrixIds = [];	
		var start = this.sub?14:7;
		var end = this.sub?20:20;		
		for(var i = start;i<=end;i++){
			matrixIds[i] = {
				identifier : "" + i,
				scale:this.scales[i],
				resolution:this.resolutions[i],
				topLeftCorner : new L.LatLng(-180,90)
			}
		}
        return matrixIds;
    }
});

L.tileLayer.tdtwmts = function (url, options) {
    return new L.TileLayer.TDTWMTS(url, options);
};
