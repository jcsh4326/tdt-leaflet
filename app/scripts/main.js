/*jslint browser: true*/
/*global L */

(function (window, document, L, undefined) {
	'use strict';

	L.Icon.Default.imagePath = 'images/';

	/* create leaflet map */
	var url = 'http://58.213.29.194/serviceaccess/wmts/';
	var layer = '0';
	var format = 'image/png';
	var tilematrixSetVec = 'JSMap7_14';
	var style = 'default';
	
	var vec = new L.TileLayer.TDTWMTS(url+tilematrixSetVec,{
		layer:layer,
		style:style,
		tilematrixSet:tilematrixSetVec,
		format:format
	});
	
	var crs = new L.Proj.CRS.TDT('EPSG:4490','+proj=longlat +ellps=GRS80 +no_defs',{
		origin:[-180,90]
	});
	
	var layers = [vec];
	var map = L.map('map',{
		crs:crs,
		center:[33.3047, 120.0386],
		zoom:8,
		minZoom:7,
		maxZoom:16,
		layers:layers
	});
	map.on('mousemove',function(){
		// do nothing
	});
}(window, document, L));