'use client'

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";

interface LocationViewerProps {
  lat: number;
  lon: number;
  showRadius?: boolean;
  radiusMeters?: number;
}

// 위치 표시 마커 아이콘
const locationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:24px;height:24px;
      border-radius:50%;
      background:#3b82f6;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.4);
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        width:8px;height:8px;
        background:white;
        border-radius:50%;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function LocationViewer({ 
  lat, 
  lon, 
  showRadius = true, 
  radiusMeters = 30
}: LocationViewerProps) {
  return (
    <div className="relative">
      <style jsx global>{`
        .location-viewer-container .leaflet-container {
          height: 300px;
        }
      `}</style>
      
      <div className="location-viewer-container">
        <MapContainer
          center={[lat, lon]}
          zoom={16}
          className="w-full h-full rounded-lg"
          scrollWheelZoom={false}
          dragging={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* 위치 마커 */}
          <Marker
            position={[lat, lon]}
            icon={locationIcon}
          />
          
          {/* 반경 표시 */}
          {showRadius && (
            <Circle
              center={[lat, lon]}
              radius={radiusMeters}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}