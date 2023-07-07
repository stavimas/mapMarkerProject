import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import * as agGrid from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './styles.css'
import { fetchFirstLayerData, fetchSecondLayerData } from './loadData.js'

let map = L.map('map');

//console.log(sessionStorage.getItem('lon'))
let lon = sessionStorage.getItem('lon') ? sessionStorage.getItem('lon') : 38.898321
let lat = sessionStorage.getItem('lat') ? sessionStorage.getItem('lat') : -77.039882
let activeBaseLayer = sessionStorage.getItem('activeBaseLayer') ? sessionStorage.getItem('activeBaseLayer'): 'layer1';
let maxZoom = sessionStorage.getItem('maxZoom') ? sessionStorage.getItem('maxZoom'): 9;

console.log(lon)
console.log(lat)
console.log(activeBaseLayer)

map.setView([lon, lat], maxZoom, {animate: true});

sessionStorage.setItem('activeBaseLayer', activeBaseLayer)
sessionStorage.setItem('lon', lon)
sessionStorage.setItem('lat', lat)
sessionStorage.setItem('maxZoom', maxZoom)

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


//Инициализация первого слоя
async function initFirstLayerGroup() {
  fetchFirstLayerData().then(data => {
    data.features.forEach((f) => {
      // alert(typeof f.geometry.coordinates.reverse())
      // alert(typeof f.geometry.coordinates.reverse()[0])
      layerFirstGroup.addLayer(
        L.circleMarker(f.geometry.coordinates.reverse()).bindPopup(
          `<b>${f.properties.name}</b><br/>${f.properties.address}`
        )
      );
    });
  
    if (activeBaseLayer == "layer1") {
      layerFirstGroup.addTo(map);
      initFirstLayerTable();
    }
  
    layerControl.addBaseLayer(layerFirstGroup, "layer1");
    sessionStorage.setItem('lon', 38.898321);
    sessionStorage.setItem('lat', -77.039882);
  })
}

//Инициализация таблицы первого слоя
async function initFirstLayerTable() {

  let data = await fetchFirstLayerData();
  data = data.features;
  let props = Object.keys(data[0].properties);
  let columnDefs = [];
  let rowData = [];

  props.forEach(p => {
    let a = {field: p};
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
      lat: d.geometry.coordinates[0],
      lng: d.geometry.coordinates[1]
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
            sessionStorage.setItem('lat', e.data.lat)
            sessionStorage.setItem('lon', e.data.lng)
            sessionStorage.setItem('maxZoom', 18)
            console.log(sessionStorage.getItem('lat'))
          }
        })
      },

    onGridReady: (event) => {
      event.api.sizeColumnsToFit();
      const filter = {name :{
        filter: sessionStorage.getItem('filterFirstLayer'),
        filterType: "text",
        type: "contains"
      }}
      gridOptions.api.setFilterModel(filter);
    },

    //фильтрация на карте после фильтрации в таблице
    onFilterChanged: function() {
      layerFirstGroup.clearLayers(); 
      gridOptions.api.forEachNodeAfterFilter(node => {
        if (gridOptions.api.getFilterModel().name?.filter) { sessionStorage.setItem('filterFirstLayer', gridOptions.api.getFilterModel().name.filter) }
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

//Инициализация второго слоя
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

    if (activeBaseLayer == "layer2") {
      layerSecondGroup.addTo(map);
      await initSecondLayerTable();
    }
    layerControl.addBaseLayer(layerSecondGroup, "layer2");
    sessionStorage.setItem('lat', 37.7162886)
    sessionStorage.setItem('lon', 55.7516306)
}

//Инициализация таблицы второго слоя
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
            sessionStorage.setItem('lat', e.data.lon)
            sessionStorage.setItem('lon', e.data.lat)
            sessionStorage.setItem('maxZoom', 18)
          }
        })
      },

    onGridReady: (event) => { 
      event.api.sizeColumnsToFit();
      const filter = {name_ru :{
        filter: sessionStorage.getItem('filterSecondLayer'),
        filterType: "text",
        type: "contains"
      }}
      gridOptions.api.setFilterModel(filter);
    },

    //фильтрация на карте после фильтрации в таблице
    onFilterChanged: function(e) {
      layerSecondGroup.clearLayers(); 
      // sessionStorage.setItem('lat', e.data.lon)
      // sessionStorage.setItem('lon', e.data.lat)
      //console.log(gridOptions.api.getFilterModel().name_ru.filter)
      if (gridOptions.api.getFilterModel().name_ru?.filter) { sessionStorage.setItem('filterSecondLayer', gridOptions.api.getFilterModel().name_ru.filter) }
      gridOptions.api.forEachNodeAfterFilter(node => {
        layerSecondGroup.addLayer(
          L.circleMarker([node.data.lat, node.data.lon]).bindPopup(
            `<b>${node.data.name_ru}</b><br/>${node.data.name_en}`
          )
        );
      });
    }
  };

  new agGrid.Grid(placesGrid, gridOptions);
  
  return 0;
}

//изменение слоя
map.on("baselayerchange", function(e) {
  const hashArray = window.location.hash.split('/');
  hashArray[0] = e.name;
  sessionStorage.setItem('activeBaseLayer', e.name)
  window.location.hash = hashArray.join('/');
  const placesGrid = document.getElementById('grid');
  while (placesGrid.firstChild) {
    placesGrid.removeChild(placesGrid.lastChild);
  }

  let layers = [] 
  switch(e.name) {
    case 'layer1':
      layerFirstGroup.eachLayer(layer => layers.push(layer));
      initFirstLayerTable();
      sessionStorage.setItem('lat', -77.039882)
      sessionStorage.setItem('lon', 38.898321 )
      break;
    case 'layer2':
      layerSecondGroup.eachLayer(layer => layers.push(layer));
      initSecondLayerTable();
      sessionStorage.setItem('lat', 37.7162886);
      sessionStorage.setItem('lon', 55.7516306);
      break;
  }

  if (layers.length != 0) {
    let group = L.featureGroup(layers);
    map.fitBounds(group.getBounds());
  }
  stopPresentation();
});

//Отслеживание изменений карты
map.on('moveend', function (e) {
  sessionStorage.setItem('lat', map.getCenter().lng);
  sessionStorage.setItem('lon', map.getCenter().lat);
  sessionStorage.setItem('maxZoom', map.getZoom());
});

async function initAllLayers() {
  await initFirstLayerGroup();
  await initSecondLayerGroup();
}


//Презентация
const presBtn = document.getElementById('presentation_btn')
let timer;
let stopPresFlague = true;
let lastIndex = 0;


presBtn.addEventListener('click', (e) => {
  if (!stopPresFlague) {
    stopPresentation();
  }
  else {
    stopPresFlague = false;
    let btn = document.getElementById('presentation_btn')
    btn.textContent = "Stop presentation"
    showPresentation();
  }
})

function showPresentation() {
  const layers = []
  let activeLayerName = sessionStorage.getItem('activeBaseLayer');
  //console.log(activeLayerName)
  switch (activeLayerName) {
    case 'layer1':
      layerFirstGroup.eachLayer((layer) => layers.push(layer));
      break;
    case 'layer2':
      layerSecondGroup.eachLayer((layer) => layers.push(layer));
      break;
  }

  const layer = layers[lastIndex];
  const coordinates = layer.getLatLng();
  map.setView([coordinates.lat, coordinates.lng], 18);
  layer.togglePopup();
  lastIndex += 1;

  sessionStorage.setItem('lat', coordinates.lng)
  sessionStorage.setItem('lon', coordinates.lat)
  sessionStorage.setItem('maxZoom', 18)

  if (lastIndex === layers.length) {
    stopPresentation();
  }
  if (!stopPresFlague) {
    timer = setTimeout(() => showPresentation(), 1000);
  }
}

function stopPresentation() {
  clearTimeout(timer);
  lastIndex = 0;
  stopPresFlague = true;
  let btn = document.getElementById('presentation_btn')
  btn.textContent = "Play presentation"
}

//Проверка на перезагрузку страницы
// const pageAccessedByReload = (
//   (window.performance.navigation && window.performance.navigation.type === 1) ||
//     window.performance
//       .getEntriesByType('navigation')
//       .map((nav) => nav.type)
//       .includes('reload')
// );

// console.log(`Флаг перезагрузки страницы: ${pageAccessedByReload}`);

initAllLayers();
// import { testVar } from './test';
// console.log('olololoqweqweqwe', testVar);

// const object = {
//     first: 1,
//     second: 2
// }

// console.log(object?.third);
