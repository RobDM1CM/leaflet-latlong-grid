# leaflet-latlong-grid
Leaflet-based Latitude / Longitude Grid with automatic level-of-detail switching on map zoom

A lightweight, dependency-free Leaflet plugin for drawing Latitude and Longitude grid lines and labels, with automatic level-of-detail switching.

Designed for general Leaflet map applications.

## Features

- Draws Latitude and Longitude grid lines and labels at different levels of detail depending on zoom:
- Smooth “parachute redraw” logic to avoid flicker and double-rendering
- Works across the antemeridian / date line (_at least as well as Leaflet can manage!_)
- Pure Leaflet, no external libraries
- Efficient redraws on pan/zoom

## Installation
```
<link rel="stylesheet" href="leaflet.css">
<script src="leaflet.js"></script>

<script src="locator-grid-leaflet.js"></script>
<link rel="stylesheet" href="locator-grid-leaflet.css">
```

## Usage

Add the grid directly to the map:
```
var gridOptions = { color: "#00a",
                    opacity: 0.4
                  };
var map = L.map('map', { });
const locGrid = new LocatorGrid(gridOptions);
locGrid.addTo(map);
```

Add the grid as an overlay in ```L.control.layers```:
```
var map = L.map('map', { });
var gridOptions = { color: "#00a",
                    opacity: 0.4
                  };
const locGrid = new LocatorGrid(gridOptions);
...
...
var baseMaps = {
    "OpenStreetMap": osm,
    "OpenStreetMap.HOT": osmHOT
};

var overlays = {
    "Locator Grid": locGrid
};

var layerControl = L.control.layers(baseMaps, overlays).addTo(map);
```

## API

```LocatorGrid.addTo(map)```

Adds the grid to the map and starts automatic redraw handling.

```LocatorGrid.remove()```

Removes all grid elements and event listeners.

## Performance Notes

- Redraw fires only on moveend, not on every pan step.
- Zoom work is batched to avoid the “double-opacity” issue common in DOM-based layers.
- Antemeridian drawing is handled gracefully but may show minor artifacts depending on the base map — a minor problem inherent to Leaflet.

## License

MIT




