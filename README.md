# leaflet-latlong-grid
Leaflet-based Latitude / Longitude Grid with automatic level-of-detail switching on map zoom

A lightweight, dependency-free Leaflet plugin for drawing Latitude and Longitude grid lines and labels, with automatic level-of-detail switching.

Designed for general Leaflet map applications.

## Features

- Draws Latitude and Longitude grid lines and labels at different levels of detail depending on zoom
- Also draws Tropic of Cancer / Tropic of Capricorn lines, and Arctic and Antarctic Circle lines 
- Smooth “parachute redraw” logic to avoid flicker and double-rendering
- Works across the antemeridian / date line (_at least as well as Leaflet can manage!_)
- Pure Leaflet, no external libraries
- Efficient redraws on pan/zoom

## Installation
```
<link rel="stylesheet" href="leaflet.css">
<script src="leaflet.js"></script>

<script src="latlong_grid_leaflet.js"></script>
<link rel="stylesheet" href="latlong_grid_leaflet.css">
```

## Usage

Add the grid directly to the map:
```
var gridOptions = { color: "#00a",
                    opacity: 0.4
                  };
var map = L.map('map', { });
const llGrid = new LatLongGrid(gridOptions);
llGrid.addTo(map);
```

Add the grid as an overlay in ```L.control.layers```:
```
var map = L.map('map', { });
var gridOptions = { color: "#00a",
                    opacity: 0.4
                  };
const llGrid = new LatLongGrid(gridOptions);
...
...
var baseMaps = {
    "OpenStreetMap": osm,
    "OpenStreetMap.HOT": osmHOT
};

var overlays = {
    "Lat/Long Grid": llGrid
};

var layerControl = L.control.layers(baseMaps, overlays).addTo(map);
```

## API

```LatLongGrid.addTo(map)```

Adds the grid to the map and starts automatic redraw handling.

```LatLongGrid.remove()```

Removes all grid elements and event listeners.

## Performance Notes

- Redraw fires only on moveend, not on every pan step.
- Zoom work is batched to avoid the “double-opacity” issue common in DOM-based layers.
- Antemeridian drawing is handled gracefully but may show minor artifacts depending on the base map — a minor problem inherent to Leaflet.

## License

MIT




