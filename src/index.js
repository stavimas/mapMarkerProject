// import csvToJson from 'csvtojson'
// import L from 'leaflet'
const L = require('leaflet')
let map = L.map('map');
map.setView([38.898321, -77.039882], 9, {animate: true});

L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';

const layerControl = L.control.layers().addTo(map);
const layerFirstGroup = L.layerGroup();
const layerSecondGroup = L.layerGroup();

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
      alert(typeof f.geometry.coordinates.reverse())
      alert(typeof f.geometry.coordinates.reverse()[0])
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


async function fetchSecondLayerData() {
  let response = await fetch('./portals.csv');
  let text = await response.text();
  return csvJSON(text.toString())
  //let text = await response.text();
  //let data = await csvToJson().fromString(text.toString());
  //let data = await csvToJson().fromFile("portals.csv")
  //let contData = JSON.stringify(data, null, 2);
  // let response = await fetch('./ruPortals.geojson');
  // let data = await response.json();
  //console.log(contData)
  return data;
}

function csvJSON(csv){
  var lines=csv.split("\n");
  var result = [];
  var headers=lines[0].split(";");
  for(var i=1;i<lines.length;i++){
      var obj = {};
      var currentline=lines[i].split(";");
      for(var j=0;j<headers.length;j++){
          obj[headers[j]] = currentline[j];
      }
      result.push(obj);
  }
  return result; //JavaScript object
  //return JSON.stringify(result); //JSON
}

async function initSecondLayerGroup() {
  let data = await fetchSecondLayerData()
  data.forEach((f) => {
    // alert(typeof f["lat"])
    // alert(parseFloat(f["lat"]))
    // alert(JSON.stringify(f))
    let f1 = parseFloat(f["lat"])
    let f2 = parseFloat(f["lon"])
    //console.log(f1, f2);
    //alert(typeof f1)
    if (f1 && f2) {
      layerSecondGroup.addLayer(
        L.circleMarker(L.latLng(f1, f2)).bindPopup(
          `<b>${f.name_ru}</b><br/>${f.name_en}`)
      );
    }
  });
  
    layerSecondGroup.addTo(map);
  
    layerControl.addBaseLayer(layerSecondGroup, "layer2");
}

async function initSecondLayerTable() {

  let data = await fetchSecondLayerData();
  let columnDefs = [];
  let rowData = [];

  columnDefs.push({field: 'name_en'});
  columnDefs.push({field: 'name_ru'});
  columnDefs.push({field: 'escalator'});
  columnDefs.push({field: 'lat'});
  columnDefs.push({field: 'lon'});
  columnDefs.push({field: 'min_rail_width'});

  columnDefs.find((item) => {
    if (item.field == 'name_ru') {
      item.filter = true;
    }
  })

  data.forEach(d => {
    rowData.push(d);
  })

  const placesGrid = document.querySelector('#grid');
  const gridOptions = {
    defaultColDef: { resizable: true },
    columnDefs: columnDefs,
    rowData: rowData,
  
    onRowClicked: function(e) {
      layerSecondGroup.eachLayer((layer) => {
          const coords = layer.getLatLng()
          if (coords.lat == e.data.lat && coords.lng == e.data.lon) {
            layer.openPopup()
            map.setView([e.data.lat, e.data.lon], 18, {animate: true})
          }
        })
      },

    onGridReady: (event) => event.api.sizeColumnsToFit(),

    //фильтрация на карте после фильтрации в таблице
    onFilterChanged: function() {
      layerSecondGroup.clearLayers(); 
      gridOptions.api.forEachNodeAfterFilter(node => {
        layerSecondGroup.addLayer(
          L.circleMarker([node.data.lon, node.data.lat]).bindPopup(
            `<b>${node.data.name_ru}</b><br/>${node.data.name_en}`
          )
        );
      });
    }
  };

  new agGrid.Grid(placesGrid, gridOptions);
  
  return 0;
}

// initFirstLayerGroup();
// initFirstLayerTable();
initSecondLayerGroup();
initSecondLayerTable();

// "start": "beefy index.js:bundle.js --live",
//     "bundle": "browserify index.js -o bundle.js"