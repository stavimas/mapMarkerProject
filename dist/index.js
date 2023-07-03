let L = require('leaflet');

L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';

let map = L.map('map');
map.setView([38.898321, -77.039882], 9, {animate: true});

const layerControl = L.control.layers().addTo(map);
const layerFirstGroup = L.layerGroup();

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      tileSize: 256
    }
  ).addTo(map);


async function fetchFirstLayerData() {
  let response = await fetch('./bars.geojson');
  let data = await response.json();
  return data;
}

async function initFirstLayerGroup() {
  fetchFirstLayerData().then(data => {
    data.features.forEach((f) => {
      layerFirstGroup.addLayer(
        L.circleMarker(f.geometry.coordinates.reverse()).bindPopup(
          `<b>${f.properties.name}</b><br/>${f.properties.address}`
        )
      );
    });
  
    layerFirstGroup.addTo(map);
  
    layerControl.addBaseLayer(layerFirstGroup, "layer1");
  })
}

async function initFirstLayerTable() {

  let data = await fetchFirstLayerData();
  data = data.features;
  let props = Object.keys(data[0].properties);
  let columnDefs = [];
  let rowData = [];

  props.forEach(p => {
    let a = {field: `${p}`};
    columnDefs.push(a);
  })
  columnDefs.push({field: 'lat'});
  columnDefs.push({field: 'lng'});
  columnDefs.find((item) => {
    if (item.field == 'name') {
      item.filter = true;
    }
  })

  data.forEach(d => {
    let latLng = {
      lat: `${d.geometry.coordinates[0]}`,
      lng: `${d.geometry.coordinates[1]}`
    };
    latLng = Object.assign(latLng, d.properties)
    rowData.push(latLng);
  })

  const placesGrid = document.querySelector('#grid');
  const gridOptions = {
    defaultColDef: { resizable: true },
    columnDefs: columnDefs,
    rowData: rowData,
  
    onRowClicked: function(e) {
      layerFirstGroup.eachLayer((layer) => {
          const coords = layer.getLatLng()
          if (coords.lat == e.data.lng && coords.lng == e.data.lat) {
            layer.openPopup()
            map.setView([e.data.lng, e.data.lat], 18, {animate: true})
          }
        })
      },

    onGridReady: (event) => event.api.sizeColumnsToFit(),

    //фильтрация на карте после фильтрации в таблице
    onFilterChanged: function() {
      layerFirstGroup.clearLayers(); 
      gridOptions.api.forEachNodeAfterFilter(node => {
        layerFirstGroup.addLayer(
          L.circleMarker([node.data.lng, node.data.lat]).bindPopup(
            `<b>${node.data.name}</b><br/>${node.data.address}`
          )
        );
      });
    }
  };

  new agGrid.Grid(placesGrid, gridOptions);
  
  return 0;
}

// const nameInput = document.getElementById('filter-text-box')
// nameInput.addEventListener('input', filterGrid)

// async function filterGrid() {
//   let gridOptions = await initFirstLayerTable()
//   gridOptions.api.setQuickFilter(document.getElementById('filter-text-box').value)
// }

initFirstLayerGroup();
initFirstLayerTable();