import { useState, useEffect } from 'react';
import { Crosswalk, AccidentData } from '@/features/acc_calculate/types';
import { haversineMeters } from '@/features/acc_calculate/utils';

interface UseCrosswalkDetailsProps {
  crosswalk: Crosswalk | null;
  enabled?: boolean;
}

interface CrosswalkDetailsData {
  crosswalk: Crosswalk;
  nearbyAccidents: AccidentData[];
  loading: boolean;
  error: string | null;
}

function bboxAround(lat: number, lon: number, km: number) {
  const dLat = km / 111;
  const dLon = km / (111 * Math.cos((lat * Math.PI) / 180));
  return `${lat - dLat},${lon - dLon},${lat + dLat},${lon + dLon}`;
}

export function useCrosswalkDetails({ crosswalk, enabled = true }: UseCrosswalkDetailsProps) {
  const [data, setData] = useState<CrosswalkDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!crosswalk || !enabled) { setData(null); return; }

    const fetchCrosswalkDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const lat = crosswalk.crosswalk_lat;
        const lon = crosswalk.crosswalk_lon;

        const bounds = bboxAround(lat, lon, 1.0);

        let hotspots: any[] = [];
        const resp = await fetch(`/api/map/acc_hotspots?bounds=${bounds}`);
        if (resp.ok) {
          const json = await resp.json();
          // API가 { success: true, data: [...] } 형태로 반환
          if (json?.success && Array.isArray(json.data)) {
            hotspots = json.data;
          } else if (Array.isArray(json)) {
            // 혹시 배열로 직접 반환하는 경우
            hotspots = json;
          }
        }

        const within500m = hotspots.filter((h) => {
          const hLat = h.accidentLat;
          const hLon = h.accidentLon;
          if (typeof hLat !== 'number' || typeof hLon !== 'number') return false;
          return haversineMeters(lat, lon, hLat, hLon) <= 500;
        });

        setData({
          crosswalk,
          nearbyAccidents: within500m,
          loading: false,
          error: null
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        setData({ crosswalk, nearbyAccidents: [], loading: false, error: msg });
      } finally {
        setLoading(false);
      }
    };

    fetchCrosswalkDetails();
  }, [crosswalk, enabled]);

  return {
    data: data?.crosswalk || null,
    nearbyAccidents: data?.nearbyAccidents || [],
    loading,
    error
  };
}

// 횡단보도 데이터를 EnhancedCrosswalk 형태로 변환하는 유틸리티
export function convertToEnhancedCrosswalk(basicCrosswalk: any): Crosswalk {
  return {
    cw_uid: basicCrosswalk.cw_uid,
    address: basicCrosswalk.address,
    crosswalk_lat: basicCrosswalk.crosswalk_lat,
    crosswalk_lon: basicCrosswalk.crosswalk_lon,
    hasSignal: basicCrosswalk.hasSignal,
    isHighland: basicCrosswalk.isHighland,
    hasPedButton: basicCrosswalk.hasPedButton,
    hasPedSound: basicCrosswalk.hasPedSound,
    hasBump: basicCrosswalk.hasBump,
    hasBrailleBlock: basicCrosswalk.hasBrailleBlock,
    hasSpotlight: basicCrosswalk.hasSpotlight,
  };
}