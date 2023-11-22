var geoserverUrl = "http://127.0.0.1:8080/geoserver";
var selectedPoint = null;

var source = null;
var target = null;

// initialize our map
var map = L.map("map", {
	center: [19.1334, 72.9133],
	zoom: 16 //set the zoom level
});

//add openstreet map baselayer to the map
var OpenStreetMap = L.tileLayer(
	"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
	{
		maxZoom: 19,
		attribution:
			'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}
).addTo(map);

// empty geojson layer for the shortes path result
var pathLayer = L.geoJSON(null);

var greenIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
  });


  var orangeIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
  });

// draggable marker for starting point. Note the marker is initialized with an initial starting position
var sourceMarker = L.marker([19.132090, 72.917606], { icon: orangeIcon, draggable: true })
    .on("mouseover", function (e) {
        // Create and bind a popup with your label content
        var popupContent = "Source";
        e.target.bindPopup(popupContent).openPopup();
    })
    .on("mouseout", function (e) {
        // Close the popup when mouse leaves the marker
        e.target.closePopup();
    })
    .on("dragend", function (e) {
        selectedPoint = e.target.getLatLng();
        getVertex(selectedPoint);
        getRoute();
    })
    .addTo(map);

// draggbale marker for destination point.Note the marker is initialized with an initial destination positon
var targetMarker = L.marker([19.130714, 72.914262], { icon: greenIcon, draggable: true })
    .on("mouseover", function (e) {
        // Create and bind a popup with your label content
        var popupContent = "Destination";
        e.target.bindPopup(popupContent).openPopup();
    })
    .on("mouseout", function (e) {
        // Close the popup when mouse leaves the marker
        e.target.closePopup();
    })
    .on("dragend", function (e) {
        selectedPoint = e.target.getLatLng();
        getVertex(selectedPoint);
        getRoute();
    })
    .addTo(map);

// function to get nearest vertex to the passed point
function getVertex(selectedPoint) {
	var url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routing:nearest_vertex&outputformat=application/json&viewparams=x:${
		selectedPoint.lng
	};y:${selectedPoint.lat};`;
	$.ajax({
		url: url,
		async: false,
		success: function(data) {
			loadVertex(
				data,
				selectedPoint.toString() === sourceMarker.getLatLng().toString()
			);
		}
	});
}

// function to update the source and target nodes as returned from geoserver for later querying
function loadVertex(response, isSource) {
	var features = response.features;
	map.removeLayer(pathLayer);
	if (isSource) {
		source = features[0].properties.id;
	} else {
		target = features[0].properties.id;
	}
}

// function to get the shortest path from the give source and target nodes
function getRoute() {
	var url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routing:shortest_path&outputformat=application/json&viewparams=source:${source};target:${target};`;

	$.getJSON(url, function(data) {
		map.removeLayer(pathLayer);
		pathLayer = L.geoJSON(data);
		map.addLayer(pathLayer);
	});
}

getVertex(sourceMarker.getLatLng());
getVertex(targetMarker.getLatLng());
getRoute();
