/** Inline Leaflet map (OpenStreetMap tiles) for WebView — no Google APIs. */
export function buildAddressMapHtml(lat: number, lng: number, zoom = 16): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .hint {
      position: absolute; z-index: 1000; left: 12px; right: 12px; top: 12px;
      background: rgba(255,255,255,0.95); padding: 10px 12px; border-radius: 10px;
      font-family: system-ui, sans-serif; font-size: 13px; color: #1a2744;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12); text-align: center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="hint">Drag the pin to your exact shop location</div>
  <script>
    var startLat = ${lat};
    var startLng = ${lng};
    var map = L.map('map', { zoomControl: true }).setView([startLat, startLng], ${zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    var marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      postPosition(e.latlng.lat, e.latlng.lng);
    });
    marker.on('dragend', function() {
      var p = marker.getLatLng();
      postPosition(p.lat, p.lng);
    });
    function postPosition(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'move', lat: lat, lng: lng }));
      }
    }
    postPosition(startLat, startLng);
  </script>
</body>
</html>`;
}
