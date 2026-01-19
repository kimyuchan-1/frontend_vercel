'use client';

import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Crosswalk } from '@/features/acc_calculate/types';

interface CrosswalkMarkerWithPopupProps {
  crosswalk: Crosswalk;
  onMarkerClick?: (crosswalk: Crosswalk) => void;
  icon?: L.DivIcon;
}

// 아이콘들(기존 그대로)
const iconHas = L.divIcon({
  className: "",
  html: `
    <div style="
      width:18px;height:18px;
      border-radius:9999px;
      background:#22c55e;
      border:2px solid white;
      box-shadow:0 1px 6px rgba(0,0,0,.35);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

const iconNone = L.divIcon({
  className: "",
  html: `
    <div style="
      width:18px;height:18px;
      border-radius:9999px;
      background:#ef4444;
      border:2px solid white;
      box-shadow:0 1px 6px rgba(0,0,0,.35);
      position:relative;
    ">
      <div style="
        position:absolute;
        top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:8px;height:2px;
        background:white;
        border-radius:1px;
      "></div>
    </div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

export function CrosswalkMarkerWithPopup({ crosswalk, onMarkerClick, icon }: CrosswalkMarkerWithPopupProps) {
  return (
    <Marker
      position={[crosswalk.crosswalk_lat, crosswalk.crosswalk_lon]}
      icon={icon}
      eventHandlers={{
        click: (e) => {
          e.originalEvent?.stopPropagation?.();
          onMarkerClick?.(crosswalk); 
        },
      }}
    >
    </Marker>
  );
}
