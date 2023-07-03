let L = require('leaflet');
L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';

let map = L.map('map');
map.setView([47.63, -122.32], 11);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      tileSize: 256
    }
  ).addTo(map);