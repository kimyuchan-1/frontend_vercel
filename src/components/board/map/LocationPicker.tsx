'use client'

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lon: number, address: string) => void;
  initialLocation?: { lat: number; lon: number };
}

// 선택된 위치 마커 아이콘
const selectedLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:24px;height:24px;
      border-radius:50%;
      background:#ef4444;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.4);
      display:flex;
      align-items:center;
      justify-content:center;
      animation: pulse 2s infinite;
    ">
      <div style="
        width:8px;height:8px;
        background:white;
        border-radius:50%;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// 지도 클릭 이벤트 핸들러 컴포넌트
function MapClickHandler({ 
  onLocationSelect 
}: { 
  onLocationSelect: (lat: number, lon: number) => void 
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

// 주소 변환 함수 (실제로는 역지오코딩 API 사용)
const getAddressFromCoords = async (lat: number, lon: number): Promise<string> => {
  try {
    // 실제로는 카카오맵 API나 네이버맵 API 등을 사용해야 함
    // 여기서는 더미 주소 반환
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ko`
    );
    
    if (response.ok) {
      const data = await response.json();
      const originalAddress = data.display_name || `위도: ${lat.toFixed(6)}, 경도: ${lon.toFixed(6)}`;
      
      // 주소를 역순으로 변환
      return reverseAddress(originalAddress);
    }
  } catch (error) {
    console.error('주소 변환 실패:', error);
  }
  
  return `위도: ${lat.toFixed(6)}, 경도: ${lon.toFixed(6)}`;
};

// 주소를 역순으로 변환하는 함수
// 예: "세종대로19길, 태평로2가, 소공동, 중구, 서울특별시, 04524, 대한민국"
// -> "서울특별시 중구 소공동 태평로2가 세종대로19길"
const reverseAddress = (address: string): string => {
  // 쉼표로 분리
  const parts = address.split(',').map(part => part.trim());
  
  // 우편번호와 국가명 제거 (숫자만 있거나 "대한민국" 등)
  const filtered = parts.filter(part => {
    // 숫자만 있는 경우 (우편번호) 제거
    if (/^\d+$/.test(part)) return false;
    // "대한민국", "South Korea" 등 국가명 제거
    if (part === '대한민국' || part.toLowerCase().includes('korea')) return false;
    return true;
  });
  
  // 역순으로 변환하고 공백으로 연결
  return filtered.reverse().join(' ');
};

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation 
}: LocationPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lon] : null
  );
  const [loading, setLoading] = useState(false);

  // 위치 선택 핸들러
  const handleLocationClick = useCallback(async (lat: number, lon: number) => {
    setSelectedPosition([lat, lon]);
    setLoading(true);
    
    try {
      const address = await getAddressFromCoords(lat, lon);
      onLocationSelect(lat, lon, address);
    } catch (error) {
      console.error('주소 조회 실패:', error);
      onLocationSelect(lat, lon, `위도: ${lat.toFixed(6)}, 경도: ${lon.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  }, [onLocationSelect]);

  // 초기 위치 설정
  useEffect(() => {
    if (initialLocation) {
      setSelectedPosition([initialLocation.lat, initialLocation.lon]);
    }
  }, [initialLocation]);

  return (
    <div className="relative">
      <style jsx global>{`
        .location-picker-container .leaflet-container {
          height: 300px;
          cursor: crosshair;
        }
        
        .location-picker-container .leaflet-container:hover {
          cursor: crosshair;
        }
      `}</style>
      
      <div className="location-picker-container">
        <MapContainer
          center={selectedPosition || [37.5665, 126.978]} // 서울 시청 기본값
          zoom={15}
          className="w-full h-full rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler onLocationSelect={handleLocationClick} />
          
          {selectedPosition && (
            <Marker
              position={selectedPosition}
              icon={selectedLocationIcon}
            />
          )}
        </MapContainer>
      </div>

      {/* 로딩 인디케이터 */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            주소를 조회하는 중...
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700">
        📍 지도를 클릭하여 위치를 선택하세요
      </div>
    </div>
  );
}