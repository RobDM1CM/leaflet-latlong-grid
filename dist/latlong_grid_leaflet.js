  L.LatLongGrid = L.Layer.extend({

    initialize: function (options = {}) {
        L.setOptions(this, options);
    },

    onAdd(map) {

        this._map = map;
        this._container = L.DomUtil.create('div', 'latlng-grid-layer');
        this._map.getPanes().overlayPane.appendChild(this._container);
        this._redrawing = false;
        this.redraw();
        mapLatLngGridVisible = true;

    },

    onRemove(map) {

        this._clear();
        if (this._container) {
            L.DomUtil.remove(this._container);
        }
        this._map = null;
        mapLatLngGridVisible = false;

    },

    getEvents() {
        return {
            moveend: this.redraw,
            //zoomend: this.redraw
        };
    },

    redraw() {

        if (this._redrawing) return;
        this._redrawing = true;

        L.Util.requestAnimFrame(() => {
            const topLeft = this._map.containerPointToLayerPoint([0,0]);
            L.DomUtil.setPosition(this._container, topLeft);
            this._clear();
            this._drawGridLines();
            this._drawGridLabels();
            this._redrawing = false;
        });

    },

    _clear() {
        while (this._container.firstChild) {
            this._container.removeChild(this._container.firstChild);
        }
    },

    _drawGridLines() {

        let tLat, rLng, bLat, lLng, xl, xr, yt, yb, lineY, lineX, detLvl, line;
        let latLngStep;
        const secsPerDeg = 3600;
        const err = Math.pow(10, -4);


        // Get map bounds and top, right, bottom and left values.....
        const zoomLevel = this._map.getZoom();
        if (zoomLevel < 3) {
          return;
        }


        const bnds = this._map.getBounds();       // Geographical bounds visible in the current map view...
        const ne = bnds.getNorthEast();
        const sw = bnds.getSouthWest();
        tLat = ne.lat;
        bLat = sw.lat;
        lLng = sw.lng;
        rLng = ne.lng;
        if (tLat == bLat) { bLat = -90.0; tLat = 90.0; }
        if (lLng == rLng) { lLng = -180.0; rLng = 180.0; }


        // Get start and stop pixel-positions for lines.....
        // Full pixel dimensions of the map area in the browser window...
        // latLngToLayerPoint gives "...the corresponding pixel coordinate relative to the origin pixel."
        xl = Math.floor(this._map.latLngToContainerPoint(sw).x);
        xr = Math.floor(this._map.latLngToContainerPoint(ne).x);
        yt = Math.floor(this._map.latLngToContainerPoint(ne).y);
        yb = Math.floor(this._map.latLngToContainerPoint(sw).y);


        // For integer math.....
        tLat = parseInt(tLat * secsPerDeg);
        bLat = parseInt(bLat * secsPerDeg);
        rLng = parseInt(rLng * secsPerDeg);
        lLng = parseInt(lLng * secsPerDeg);


        // Level of grid detail shown depends on the zoom level.....
        if ((zoomLevel >= 3) && (zoomLevel < 4)) {
          latLngStep = 5 * secsPerDeg;     // lines at 5-degree steps...
          detLvl = 2;
        } else if ((zoomLevel >= 4) && (zoomLevel < 6)) {
          latLngStep = 1 * secsPerDeg;     // lines at 1-degree steps...
          detLvl = 3;
        } else if ((zoomLevel >= 6) && (zoomLevel < 7)) {
          latLngStep = secsPerDeg / 2;     // lines at 30-minute steps...
          detLvl = 4;
        } else if ((zoomLevel >= 7) && (zoomLevel < 10)) {
          latLngStep = secsPerDeg / 6;     // lines at 10-minute steps...
          detLvl = 5;
        } else if ((zoomLevel >= 10) && (zoomLevel < 13)) {
          latLngStep = secsPerDeg / 60;    // lines at 1-minute steps...
          detLvl = 6;
        } else if ((zoomLevel >= 13) && (zoomLevel < 16)) {
          latLngStep = secsPerDeg / 360;    // lines at 10-second steps...
          detLvl = 7;
        } else if (zoomLevel >= 16) {
          latLngStep = secsPerDeg / 3600;    // lines at 1-second steps...
          detLvl = 8;
        }


        // round iteration limits to the computed grid interval
        // These are lat and long values!!!!!
        tLat = Math.ceil(tLat / latLngStep) * latLngStep;
        bLat = Math.floor(bLat / latLngStep) * latLngStep;
        rLng = Math.ceil(rLng / latLngStep) * latLngStep;
        lLng = Math.floor(lLng / latLngStep) * latLngStep;
        if (rLng == lLng) lLng += latLngStep;
        if (rLng < lLng) rLng += 360.0 * secsPerDeg;



        // Latitude lines - normal.....
        let lngDegs = lLng / secsPerDeg;  // We could use any longitude here...
        for (let lineLat = bLat; lineLat <= tLat; lineLat += latLngStep) {
          thk = this._setLineThickness(lineLat, detLvl);
          ll = L.latLng(parseFloat(lineLat / secsPerDeg), lngDegs);
          lineY = this._map.latLngToContainerPoint(ll).y;
          this._addLatLine(lineY, xl, xr, thk);
        }


        // Latitude lines - Tropics, Arctic/Antarctic Circles.....
        /*  REFERENCE - from http://en.wikipedia.org/wiki/Circle_of_latitude... on 2020-04-06...
            Arctic Circle (66° 33' 48.0" N)
            Tropic of Cancer (23° 26' 12.0" N)
            Equator (0° latitude)
            Tropic of Capricorn (23° 26' 12.0" S)
            Antarctic Circle (66° 33' 48.0" S)
        */
        let arcticCircleLat = (66 * 3600) + (33 * 60) + 48.0;
        let tropicCancerLat = (23 * 3600) + (26 * 60) + 12.0;
        let tropicCapricornLat = -tropicCancerLat;
        let antArcticCircleLat = -arcticCircleLat;

        bkgImg = "map_red_dash";
        if ( (arcticCircleLat < tLat) || (arcticCircleLat > bLat) ) {
          ll = L.latLng(parseFloat(arcticCircleLat / secsPerDeg), lngDegs);
          lineY = this._map.latLngToContainerPoint(ll).y;
          this._addSpecialLatLine(lineY, xl, xr, 2, bkgImg);
        }
        if ( (tropicCancerLat < tLat) || (tropicCancerLat > bLat) ) {
          ll = L.latLng(parseFloat(tropicCancerLat / secsPerDeg), lngDegs);
          lineY = this._map.latLngToContainerPoint(ll).y;
          this._addSpecialLatLine(lineY, xl, xr, 2, bkgImg);
        }
        if ( (tropicCapricornLat < tLat) || (tropicCapricornLat > bLat) ) {
          ll = L.latLng(parseFloat(tropicCapricornLat / secsPerDeg), lngDegs);
          lineY = this._map.latLngToContainerPoint(ll).y;
          this._addSpecialLatLine(lineY, xl, xr, 2, bkgImg);
        }
        if ( (antArcticCircleLat < tLat) || (antArcticCircleLat > bLat) ) {
          ll = L.latLng(parseFloat(antArcticCircleLat / secsPerDeg), lngDegs);
          lineY = this._map.latLngToContainerPoint(ll).y;
          this._addSpecialLatLine(lineY, xl, xr, 2, bkgImg);
        }



        // Longitude lines.....
        let latDegs = bLat / secsPerDeg;    // We could use any latitude here...
        for (let lineLng = lLng; lineLng < rLng; lineLng += latLngStep) {
          thk = this._setLineThickness(lineLng, detLvl);
          ll = L.latLng(latDegs, parseFloat(lineLng / secsPerDeg));
          lineX = this._map.latLngToContainerPoint(ll).x;
          this._addLngLine(lineX, yt, yb, thk);
        }

    },

    _drawGridLabels() {

        var tLat, rLng, bLat, lLng, lblDiv;
        var dLat, dLng, locStr, px;
        const err = Math.pow(10, -4);
        const secsPerDeg = 3600;
        const zoomLevel = this._map.getZoom();

        if (zoomLevel < 3) {
          // Don't draw the grid.....
          return;
        }

        // Get bounds and top, right, bottom and left values.....
        const bnds = this._map.getBounds();
        const ne = bnds.getNorthEast();
        const sw = bnds.getSouthWest();
        tLat = ne.lat;
        bLat = sw.lat;
        lLng = sw.lng;
        rLng = ne.lng;

        // Which texts, and when to draw them, depends on the zoom level.....
        tLatSecs = parseInt(tLat * secsPerDeg);
        bLatSecs = parseInt(bLat * secsPerDeg);
        rLngSecs = parseInt(rLng * secsPerDeg);
        lLngSecs = parseInt(lLng * secsPerDeg);


        // Level of grid detail shown depends on the zoom level.....
        if ((zoomLevel >= 3) && (zoomLevel < 4)) {
          dLatLng = 5 * secsPerDeg;     // 5-degree steps...
          detLvl = 2;
        } else if ((zoomLevel >= 4) && (zoomLevel < 6)) {
          dLatLng = 1 * secsPerDeg;     // 1-degree steps...
          detLvl = 3;
        } else if ((zoomLevel >= 6) && (zoomLevel < 7)) {
          dLatLng = secsPerDeg / 2;     // 30-minute steps...
          detLvl = 4;
        } else if ((zoomLevel >= 7) && (zoomLevel < 10)) {
          dLatLng = secsPerDeg / 6;     // 10-minute steps...
          detLvl = 5;
        } else if ((zoomLevel >= 10) && (zoomLevel < 13)) {
          dLatLng = secsPerDeg / 60;    // 1-minute steps...
          detLvl = 6;
        } else if ((zoomLevel >= 13) && (zoomLevel < 16)) {
          dLatLng = secsPerDeg / 360;    // 10-second steps...
          detLvl = 7;
        } else if (zoomLevel >= 16) {
        dLatLng = secsPerDeg / 3600;    // 1-second steps...
          detLvl = 8;
        }


        // round iteration limits to the computed grid interval
        tLatSecs = Math.ceil(tLatSecs / dLatLng) * dLatLng;
        bLatSecs = Math.floor(bLatSecs / dLatLng) * dLatLng;
        rLngSecs = Math.ceil(rLngSecs / dLatLng) * dLatLng;
        lLngSecs = Math.floor(lLngSecs / dLatLng) * dLatLng;
        if (rLngSecs == lLngSecs) lLngSecs += dLatLng;
        if (rLngSecs < lLngSecs) rLngSecs += 360.0 * secsPerDeg;


        // Latitude labels - normal.......
        divX = 55;
        var lngDegs = parseFloat(lLng / secsPerDeg);     // We could use any longitude here...
        for (var lblLatSecs = bLatSecs; lblLatSecs <= tLatSecs; lblLatSecs += dLatLng) {
          latTxt = this._getLatText(lblLatSecs, zoomLevel);
          if (latTxt != "") {
            ll = L.latLng(parseFloat(lblLatSecs / secsPerDeg), lngDegs);
            divY = this._map.latLngToContainerPoint(ll).y;
            label = this._addLatLabel(divX, divY, latTxt, zoomLevel);
          }
        }


        // Latitude labels - Tropics, Arctic/Antarctic Circles.....
        /*  REFERENCE - from http://en.wikipedia.org/wiki/Circle_of_latitude... on 2020-04-06...
            Arctic Circle (66° 33' 48.0" N)
            Tropic of Cancer (23° 26' 12.0" N)
            Equator (0° latitude)
            Tropic of Capricorn (23° 26' 12.0" S)
            Antarctic Circle (66° 33' 48.0" S)
        */
        var arcticCircleLat = (66 * 3600) + (33 * 60) + 48.0;
        var tropicCancerLat = (23 * 3600) + (26 * 60) + 12.0;
        var tropicCapricornLat = -tropicCancerLat;
        var antArcticCircleLat = -arcticCircleLat;
        /* if ( (arcticCircleLat < t) || (arcticCircleLat > b) ) {           }
        if ( (tropicCancerLat < t) || (tropicCancerLat > b) ) {
        }
        if ( (tropicCapricornLat < t) || (tropicCapricornLat > b) ) {
        }
        if ( (antArcticCircleLat < t) || (antArcticCircleLat > b) ) {
        } */




        // Longitude labels.......
        var latDegs = parseFloat(tLat / secsPerDeg);     // We could use any latitude here...
        var divY = 55;
        for (var lblLngSecs = lLngSecs; lblLngSecs <= rLngSecs; lblLngSecs += dLatLng) {
          lngTxt = this._getLngText(lblLngSecs, zoomLevel);
          if (lngTxt != "") {
            ll = L.latLng(latDegs, parseFloat(lblLngSecs / secsPerDeg));
            divX = this._map.latLngToContainerPoint(ll).x;
            label = this._addLngLabel(divX, divY, lngTxt, zoomLevel);
          }
        }

    },

    _addLatLine(lineY, xl, xr, thk) {
        const div = L.DomUtil.create('div', 'xxx', this._container);
        div.style.left = this._npx(xl);
        div.style.top = this._npx(lineY - Math.floor(thk / 2));
        div.style.width = this._npx(Math.abs(xr - xl));
        div.style.height = this._npx(thk);
        div.style.background = mapLocatorGridColor;
        div.style.opacity = 0.3;
        div.style.position = "absolute";
    },

    _addSpecialLatLine(lineY, xl, xr, thk, bkgImg) {
        // For arctic/antarctic circles, and tropics lines...
        const div = L.DomUtil.create('div', 'xxx', this._container);
        div.style.left = this._npx(xl);
        div.style.top = this._npx(lineY - Math.floor(thk / 2));
        div.style.width = this._npx(Math.abs(xr - xl));
        div.style.height = this._npx(thk);
        div.style.background = "transparent url('grafx/" + bkgImg + ".png') repeat-x 0 0";
        div.style.opacity = 0.4;
        div.style.position = "absolute";
    },

    _addLngLine(lineX, yt, yb, thk) {
        const div = L.DomUtil.create('div', 'xxx', this._container);
        div.style.left = this._npx(lineX - Math.floor(thk / 2));
        div.style.top = this._npx(yt);
        div.style.width = this._npx(thk);
        div.style.height = this._npx(Math.abs(yb - yt));
        div.style.background = mapLocatorGridColor;
        div.style.opacity = 0.3;
        div.style.position = "absolute";
    },

    _setLineThickness (posSecs, detLvl) {

        // Set thickness of line according to level of detail.....
        const secsPerDeg = 3600;
        const err = Math.pow(10, -4);
        let thk = 1;

        switch (detLvl) {
        case 1:
          thk = 1;  // Each 10-degree lat/long...
          break;
        case 2:
          if (this._eqE((posSecs % (10 * secsPerDeg)), 0, err)) {
            thk = 2;   // Each 10-degree lat/long...
          } else {
            thk = 1;   // Each 5-degree lat/long...
          }
          break;
        case 3:
          //if ( (this._eqE((posSecs % 10), 0, err)) || (this._eqE((posSecs % 10), 10, err)) ) {
          if (this._eqE((posSecs % (10 * secsPerDeg)), 0, err)) {
            thk = 3;   // Each 10-degree lat/long...
          } else if (this._eqE((posSecs % (5 * secsPerDeg)), 0, err)) {
            thk = 2;   // Each 5-degree lat/long...
          } else {
            thk = 1;   // Each 1-degree lat/long...
          }
          break;
        case 4:
          // 30-minute steps....
          if (this._eqE((posSecs % (10 * secsPerDeg)), 0, err)) {
            thk = 3;   // Each 10-degree lat/long...
          } else if (this._eqE((posSecs % secsPerDeg), 0, err)) {
            thk = 2;   // Each 1-degree lat/long...
          } else {
            thk = 1;   // Each 30-minute lat/long...
          }
          break;
        case 5:
          // 10-minute steps.....
          if (this._eqE((posSecs % (10 * secsPerDeg)), 0, err)) {
            thk = 3;   // Each 10-degree lat/long...
          } else if (this._eqE((posSecs % secsPerDeg), 0, err)) {
            thk = 2;   // Each 1-degree lat/long...
          } else {
            thk = 1;   // Each 10-minute lat/long...
          }
          break;
        case 6:
          // 1-minute steps.....
          if (this._eqE((posSecs % secsPerDeg), 0, err)) {
            thk = 3;   // Each 1-degree lat/long...
          } else if (this._eqE((posSecs % (secsPerDeg / 6)), 0, err)) {
            thk = 2;   // Each 10-minute lat/long...
          } else {
            thk = 1;   // Each 1-minute lat/long...
          }
          break;
        case 7:
          // 10-second steps.....
          if (this._eqE((posSecs % secsPerDeg), 0, err)) {
            thk = 3;   // Each 1-degree lat/long...
          } else if (this._eqE((posSecs % (secsPerDeg / 60)), 0, err)) {
            thk = 2;   // Each 1-minute lat/long...
          } else {
            thk = 1;   // Each 10-second lat/long...
          }
          break;
        case 8:
          // 1-second steps.....
          if (this._eqE((posSecs % secsPerDeg), 0, err)) {
            thk = 4;   // Each 1-degree lat/long...
          } else if (this._eqE((posSecs % (secsPerDeg / 60)), 0, err)) {
            thk = 3;   // Each 1-minute lat/long...
          } else if (this._eqE((posSecs % (secsPerDeg / 360)), 0, err)) {
            thk = 2;   // Each 10-second lat/long...
          } else {
            thk = 1;   // Each 1-second lat/long...
          }
          break;
        }

        return thk;

    },

    _getLatText(latSecs, zoomLevel) {

        // Set text according to zoom level.....
        const secsPerDeg = 3600;
        const err = Math.pow(10, -4);
        let txt = "";

        if (zoomLevel < 3) {
          return;
        } else if ((zoomLevel >= 3) && (zoomLevel < 4)) {
          // 5-degree steps, label only each 10-degree interval.....
          if (this._eqE((latSecs % (10 * secsPerDeg)), 0, err)) {
            txt = parseInt(latSecs / secsPerDeg) + "&deg;";
          }
        } else if ((zoomLevel >= 4) && (zoomLevel < 6)) {
          // 1-degree steps, label only each 5-degree interval.....
          if (this._eqE((latSecs % (5 * secsPerDeg)), 0, err)) {
            txt = parseInt(latSecs / secsPerDeg) + "&deg;";
          }
        } else if ((zoomLevel >= 6) && (zoomLevel < 7)) {
          // 30-minute steps, label only each 1-degree interval.....
          if (this._eqE((latSecs % (1 * secsPerDeg)), 0, err)) {
            txt = parseInt(latSecs / secsPerDeg) + "&deg;";
          }
        } else if ((zoomLevel >= 7) && (zoomLevel < 10)) {
          // 10-minute steps, label only each 30-minute interval.....
          if (this._eqE((latSecs % (secsPerDeg / 2)), 0, err)) {
            txt = decimalDeg2DMS((latSecs / secsPerDeg), false, true, "DM");
          }
        } else if ((zoomLevel >= 10) && (zoomLevel < 13)) {
          // 1-minute steps, label only each 5-minute interval.....
          if (this._eqE((latSecs % (secsPerDeg / 12)), 0, err)) {
            txt = decimalDeg2DMS(((latSecs + 2) / secsPerDeg), false, true, "DM");
          }
        } else if ((zoomLevel >= 13) && (zoomLevel < 15)) {
          // 10-second steps, label only each 1-minute interval.....
          if (this._eqE((latSecs % (secsPerDeg / 60)), 0, err)) {
            txt = decimalDeg2DMS(((latSecs + 2) / secsPerDeg), false, true, "DM");
          }
        } else if ((zoomLevel >= 15) && (zoomLevel < 17)) {
          // 10-second steps, label only each 10-second interval.....
          if (this._eqE((latSecs % (secsPerDeg / 360)), 0, err)) {
            txt = decimalDeg2DMS(((latSecs) / secsPerDeg), false, true, "DMS");
          }
        } else if ((zoomLevel >= 17) && (zoomLevel < 19)) {
          // 10-second steps, label only each 5-second interval.....
          if (this._eqE((latSecs % (secsPerDeg / 720)), 0, err)) {
            txt = decimalDeg2DMS(((latSecs) / secsPerDeg), false, true, "DMS");
          }
        } else if (zoomLevel >= 19) {
          // 1-second steps, label each.....
          txt = decimalDeg2DMS(((latSecs) / secsPerDeg), false, true, "DMS");
        }

        return txt;

    },

    _getLngText(lngSecs, zoomLevel) {

        // Set text according to zoom level.....
        const secsPerDeg = 3600;
        const err = Math.pow(10, -4);
        let txt = "";
        let bodge = ((lngSecs < 0) ? -2 : 2);

        // Only applicable to longitudes.....
        if (lngSecs > (180 * secsPerDeg)) lngSecs -= 360 * secsPerDeg;

        if (zoomLevel < 3) {
          return;
        } else if ((zoomLevel >= 3) && (zoomLevel < 4)) {
          // 5-degree steps, label only each 10-degree interval.....
          if (this._eqE((lngSecs % (10 * secsPerDeg)), 0, err)) {
            txt = parseInt(lngSecs / secsPerDeg) + "&deg;";
          }
        } else if ((zoomLevel >= 4) && (zoomLevel < 6)) {
          // 1-degree steps, label only each 5-degree interval.....
          if (this._eqE((lngSecs % (5 * secsPerDeg)), 0, err)) {
            txt = parseInt(lngSecs / secsPerDeg) + "&deg;";
          }
        } else if ((zoomLevel >= 6) && (zoomLevel < 7)) {
          // 30-minute steps, label only each 2-degree interval.....
          if (this._eqE((lngSecs % (2 * secsPerDeg)), 0, err)) {
            txt = parseInt(lngSecs / secsPerDeg) + "&deg;";
          }
        } else if ((zoomLevel >= 7) && (zoomLevel < 10)) {
          // 10-minute steps, label only each 1-degree interval.....
          if (this._eqE((lngSecs % secsPerDeg), 0, err)) {
            txt = decimalDeg2DMS((lngSecs / secsPerDeg), false, true, "DM");
          }
        } else if ((zoomLevel >= 10) && (zoomLevel < 13)) {
          // 1-minute steps, label only each 10-minute interval.....
          if (this._eqE((lngSecs % (secsPerDeg / 6)), 0, err)) {
            txt = decimalDeg2DMS(((lngSecs + bodge) / secsPerDeg), false, true, "DM");
          }
        } else if ((zoomLevel >= 13) && (zoomLevel < 15)) {
          // 10-second steps, label only each 1-minute interval.....
          if (this._eqE((lngSecs % (secsPerDeg / 60)), 0, err)) {
            txt = decimalDeg2DMS(((lngSecs + bodge) / secsPerDeg), false, true, "DM");
          }
        } else if ((zoomLevel >= 15) && (zoomLevel < 17)) {
          // 10-second steps, label only each 20-second interval.....
          if (this._eqE((lngSecs % (secsPerDeg / 180)), 0, err)) {
            txt = decimalDeg2DMS(((lngSecs) / secsPerDeg), false, true, "DMS");
          }
        } else if ((zoomLevel >= 17) && (zoomLevel < 19)) {
          // 10-second steps, label only each 10-second interval.....
          if (this._eqE((lngSecs % (secsPerDeg / 360)), 0, err)) {
            txt = decimalDeg2DMS(((lngSecs) / secsPerDeg), false, true, "DMS");
          }
        } else if (zoomLevel >= 19) {
          // 1-second steps, label each.....
          txt = decimalDeg2DMS(((lngSecs) / secsPerDeg), false, true, "DMS");
        }

        return txt;
    },

    _addLatLabel(x, y, txt, zLvl) {

      if (txt !== "") {   // Check for text when labels have a border...

        /*** Fixed width for latitude texts ***/
        if (zLvl < 7) {
          lblW = 35;   // For whole degrees only...
        } else if ((zLvl >= 7) && (zLvl < 15)) {
          lblW = 60;  // For degrees and minutes only...
        } else if (zLvl >= 15) {
          lblW = 85;  // For degrees, minutes and seconds...
        }

        const lbl = L.DomUtil.create('div', 'ggg', this._container);
        lbl.style.position = 'absolute';
        lbl.style.left = this._npx(x);
        lbl.style.top = this._npx(y - 16);
        if (mapLatLngGridColor == "#333") {
          // Light map surface...
          lbl.style.background = "#666 url('grafx/dms_arrow_lite_down.png') 1px 5px no-repeat";
          lbl.style.color = "white";
          lbl.style.border = "1px solid #333";
        } else {
          // Dark map surface...
          lbl.style.background = "#fff url('grafx/dms_arrow_dark_down.png') 1px 5px no-repeat";
          lbl.style.color = "#333";
          lbl.style.border = "1px solid #333";
        }
        lbl.style.width = this._npx(lblW);
        lbl.style.fontFamily = 'Tahoma, Arial, Helvetica, sans-serif';
        lbl.style.fontSize = '9px';
        lbl.style.fontWeight = 'bold';
        lbl.style.padding = '0 2px';
        lbl.style.opacity = '0.6';
        lbl.style.textAlign = 'right';
        lbl.style.whiteSpace = 'nowrap';
        lbl.innerHTML = txt;
      }

    },

    _addLngLabel(x, y, txt, color, zLvl) {

      if ((txt !== "")) {   // Check for text when labels have a border...

        /*** NO fixed width for longitude texts ***/

        const lbl = L.DomUtil.create('div', 'ggg', this._container);
        lbl.style.position = 'absolute';
        lbl.style.left = this._npx(x + 1);
        lbl.style.top = this._npx(y);
        if (mapLatLngGridColor == "#333") {
          // Light map surface...
          lbl.style.background = "#666 url('grafx/dms_arrow_lite_left.png') 0 1px no-repeat";
          lbl.style.color = "white";
          lbl.style.border = "1px solid #333";
        } else {
          // Dark map surface...
          lbl.style.background = "#fff url('grafx/dms_arrow_dark_left.png') 0 1px no-repeat";
          lbl.style.color = "#333";
          lbl.style.border = "1px solid #333";
        }
        lbl.style.fontFamily = 'Tahoma, Arial, Helvetica, sans-serif';
        lbl.style.fontSize = '9px';
        lbl.style.fontWeight = 'bold';
        lbl.style.padding = '0 2px 0 9px';
        lbl.style.opacity = '0.6';
        lbl.style.textAlign = 'right';
        lbl.style.whiteSpace = 'nowrap';
        lbl.innerHTML = txt;
      }

    },

    _latLngToPixel(lat, lng) {
        return this._map.latLngToLayerPoint([lat, lng]);
    },

    _eqE(a, b, e) {
        if (!e) {
          e = Math.pow(10, -6);
        }
        if (Math.abs(a - b) < e) {
          return true;
        }
        return false;
    },

    _npx(n) {
        return n.toString() + 'px';
    }

  });


  L.latLongGrid = function () {
    return new L.LatLongGrid();
  };

