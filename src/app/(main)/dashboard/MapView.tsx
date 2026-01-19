'use client'

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { CrosswalkMarkerWithPopup } from "@/components/dashboard/map/CrosswalkMarkerWithPopup";
import MapFilter, { type MapFilterValue } from "./MapFilter";
import type { Crosswalk } from "@/features/acc_calculate/types";
import type { ApiResponse } from "@/lib/api/account";

interface Acc {
    accidentId: number,
    districtCode: string,
    year: number,
    accidentCount: number,
    casualtyCount: number,
    fatalityCount: number,
    seriousInjuryCount: number,
    minorInjuryCount: number,
    reportedInjuryCount: number,
    accidentLat: number,
    accidentLon: number,
}

type MoveTarget = { lat: number; lon: number; zoom?: number } | null;

export type MapViewProps = {
    selectedCrosswalkId: string | null;
    onSelectCrosswalk: (cw: Crosswalk | null) => void;
    moveTo?: MoveTarget;
};

function MapFlyTo({ target }: { target?: MoveTarget }) {
    const map = useMap();

    useEffect(() => {
        if (!target) return;

        const lat = Number(target.lat);
        const lon = Number(target.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

        // ✅ target.zoom이 없으면 “현재 줌”이 아니라 “기본 줌”으로 내려서 이동이 확실히 보이게
        const z = Number.isFinite(target.zoom as number) ? (target.zoom as number) : 12;

        // 디버깅: 실제 호출 확인
        // console.log("[MapFlyTo] flyTo:", { lat, lon, z });

        // ✅ react-leaflet 렌더 타이밍 이슈 예방: 다음 프레임에 실행
        requestAnimationFrame(() => {
            try {
                map.flyTo([lat, lon], z, { duration: 0.8 });
            } catch {
                map.setView([lat, lon], z, { animate: true });
            }
        });
    }, [map, target?.lat, target?.lon, target?.zoom]);

    return null;
}

function validateCrosswalkData(data: unknown): data is Crosswalk[] {
    return Array.isArray(data) && data.every(item =>
        typeof item === 'object' &&
        item !== null &&
        'cw_uid' in item &&
        'hasSignal' in item &&
        typeof item.hasSignal === 'boolean' &&
        'crosswalk_lat' in item &&
        'crosswalk_lon' in item &&
        typeof item.crosswalk_lat === 'number' &&
        typeof item.crosswalk_lon === 'number'
    );
}

function validateAccHotspotData(data: unknown): data is Acc[] {
    return Array.isArray(data) && data.every(item =>
        typeof item === 'object' &&
        item !== null &&
        'accidentId' in item &&
        'accidentLat' in item &&
        'accidentLon' in item &&
        typeof item.accidentLat === 'number' &&
        typeof item.accidentLon === 'number'
    );
}

const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 'small';

    if (count < 10) {
        size = 'small';
    } else if (count < 100) {
        size = 'medium';
    } else {
        size = 'large';
    }

    return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `custom-marker-cluster custom-marker-cluster-${size}`,
        iconSize: L.point(50, 50, true),
    });
};

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
    "></div>
  `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
});

const iconAccTriangle = L.divIcon({
    className: "",
    html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <!-- 흰색 외곽(큰 삼각형) -->
      <div style="
        position:absolute; left:50%; top:50%;
        transform: translate(-50%,-50%);
        width:0;height:0;
        border-left: 12px solid transparent;
        border-right: 12px solid transparent;
        border-bottom: 22px solid white;
        filter: drop-shadow(0 1px 6px rgba(0,0,0,.35));
      "></div>

      <!-- 빨간 내부(작은 삼각형) -->
      <div style="
        position:absolute; left:50%; top:50%;
        transform: translate(-50%,-50%) translateY(2px);
        width:0;height:0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 18px solid #ef4444;
      "></div>

      <!-- 가운데 마이너스(—) -->
      <div style="
        position:absolute;
        left:50%; top:50%;
        transform: translate(-50%,-50%) translateY(4px);
        width:10px; height:2px;
        background:white;
        border-radius:1px;
      "></div>
    </div>
  `,
    iconSize: [24, 24],
    iconAnchor: [12, 2],  // 꼭짓점(아래) 기준
    popupAnchor: [0, -10],
});

const iconHasSelected = L.divIcon({
    className: "",
    html: `
    <div style="
      width:20px;height:20px;
      border-radius:9999px;
      background:#22c55e;
      border:3px solid #0ea5e9;
      box-shadow:0 0 0 4px rgba(14,165,233,.25), 0 2px 10px rgba(0,0,0,.35);
    "></div>
  `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
});

const iconNoneSelected = L.divIcon({
    className: "",
    html: `
    <div style="
      width:20px;height:20px;
      border-radius:9999px;
      background:#ef4444;
      border:3px solid #0ea5e9;
      box-shadow:0 0 0 4px rgba(14,165,233,.25), 0 2px 10px rgba(0,0,0,.35);
    "></div>
  `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
});

function BoundsFetcherAcc({ onData, onLoading }: { onData: (rows: Acc[]) => void; onLoading: (v: boolean) => void }) {
    useMapEvents({
        moveend: async (e) => {
            const map = e.target;
            const bound = map.getBounds();
            const bounds = `${bound.getSouth()},${bound.getWest()},${bound.getNorth()},${bound.getEast()}`;

            onLoading(true);

            try {
                const res = await fetch(
                    `/api/map/acc_hotspots?bounds=${encodeURIComponent(bounds)}`,
                    { cache: "no-store" }
                );

                const json = (await res.json()) as ApiResponse<unknown>;

                if (res.ok && json?.success) {
                    const data = json.data; // 여기서부터가 실제 payload
                    if (validateAccHotspotData(data)) {
                        onData(data);
                        return;
                    }
                }
                onData([]);
            } catch (apiError) {
                console.warn("[MapView] API acc_hotspot failed:", apiError);
                onData([]);
            } finally {
                onLoading(false);
            }
        },
    });
    return null;
}


function BoundsFetcher({ onData, onLoading }: { onData: (rows: Crosswalk[]) => void; onLoading: (v: boolean) => void }) {
    useMapEvents({
        moveend: async (e) => {
            const map = e.target;
            const bound = map.getBounds();
            const bounds = `${bound.getSouth()},${bound.getWest()},${bound.getNorth()},${bound.getEast()}`;

            onLoading(true);

            try {
                const res = await fetch(
                    `/api/map/crosswalks?bounds=${encodeURIComponent(bounds)}`,
                    { cache: "no-store" }
                );

                if (res.ok) {
                    const json = await res.json();
                    if (validateCrosswalkData(json)) {
                        onData(json);
                        return;
                    }
                }

                onData([]);

            } catch (err) {
                console.error("[MapView] Error:", err);
                onData([]);
            } finally {
                onLoading(false);
            }
        },
    });

    return null;
}

function MapClickDeselect({ onDeselect }: { onDeselect: () => void }) {
    useMapEvents({
        click: () => onDeselect(),
    });
    return null;
}

export default function MapView(props: MapViewProps) {
    const { selectedCrosswalkId, onSelectCrosswalk, moveTo } = props;

    const [rows, setRows] = useState<Crosswalk[]>([]);
    const [accRows, setAccRows] = useState<Acc[]>([]);
    const [loadingCw, setLoadingCw] = useState(false);
    const [loadingAcc, setLoadingAcc] = useState(false);
    const [filter, setFilter] = useState<MapFilterValue>({
        signalHas: true,
        signalNone: true,
        accHotspot: true,
    });

    const loading = loadingCw || loadingAcc;

    const center = useMemo<[number, number]>(() => [37.531, 127.0066], []);

    const router = useRouter();
    function onHotspotClick(a: Acc) {
        const code = String(a.districtCode ?? "").slice(0, 5);
        if (!code) return;

        router.push(`/pedacc?region=${encodeURIComponent(code)}`);
    }

    const filteredCrosswalks = useMemo(() => {
        return rows.filter(cw => (cw.hasSignal ? filter.signalHas : filter.signalNone));
    }, [rows, filter.signalHas, filter.signalNone]);

    const filteredAcc = useMemo(() => {
        return filter.accHotspot ? accRows : [];
    }, [accRows, filter.accHotspot]);

    const deselectAll = () => {
        onSelectCrosswalk(null);
    };

    return (
        <section className="relative w-full h-full">
            <style jsx global>{`
                /* 지도 모노톤 스타일 */
                .map-grayscale {
                    filter: grayscale(100%) contrast(120%) brightness(110%);
                }
                
                .custom-marker-cluster {
                    background-color: #3b82f6;
                    border: 3px solid white;
                    border-radius: 50%;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .custom-marker-cluster div {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }
                
                .custom-marker-cluster span {
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                    line-height: 1;
                }
                
                .custom-marker-cluster-small {
                    width: 40px;
                    height: 40px;
                    background-color: #3b82f6;
                }
                
                .custom-marker-cluster-small span {
                    font-size: 14px;
                }
                
                .custom-marker-cluster-medium {
                    width: 50px;
                    height: 50px;
                    background-color: #2563eb;
                }
                
                .custom-marker-cluster-medium span {
                    font-size: 16px;
                }
                
                .custom-marker-cluster-large {
                    width: 60px;
                    height: 60px;
                    background-color: #1d4ed8;
                }
                
                .custom-marker-cluster-large span {
                    font-size: 18px;
                }
            `}</style>
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow">
                <MapContainer center={center} zoom={20} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapFlyTo target={moveTo ?? null} />

                    <MapClickDeselect onDeselect={deselectAll} />
                    <BoundsFetcher onData={setRows} onLoading={setLoadingCw} />
                    {filter.accHotspot && <BoundsFetcherAcc onData={setAccRows} onLoading={setLoadingAcc} />}
                    {filteredAcc.map((a) => {
                        return (
                            <Marker
                                key={a.accidentId}
                                position={[a.accidentLat, a.accidentLon]}
                                icon={iconAccTriangle}
                                eventHandlers={{
                                    click: (e) => {
                                        e.originalEvent?.stopPropagation?.();
                                        onSelectCrosswalk(null);
                                        onHotspotClick(a);
                                    },
                                }}
                            />
                        );
                    })}
                    <MarkerClusterGroup
                        chunkedLoading
                        iconCreateFunction={createClusterCustomIcon}
                        maxClusterRadius={30}
                        disableClusteringAtZoom={15}
                        removeOutsideVisibleBounds
                        spiderfyOnMaxZoom
                        showCoverageOnHover={false}
                        zoomToBoundsOnClick
                    >

                        {filteredCrosswalks.map((cw) => {
                            const isSelected = selectedCrosswalkId === cw.cw_uid;

                            const baseIcon = cw.hasSignal ? iconHas : iconNone;
                            const selectedIcon = cw.hasSignal ? iconHasSelected : iconNoneSelected;

                            return (
                                <CrosswalkMarkerWithPopup
                                    key={cw.cw_uid}
                                    crosswalk={cw}
                                    icon={isSelected ? selectedIcon : baseIcon}
                                    onMarkerClick={() => {
                                        onSelectCrosswalk(isSelected ? null : cw);
                                    }}
                                />
                            );
                        })}

                    </MarkerClusterGroup>
                </MapContainer>

                {/* 로딩 뱃지 */}
                <div
                    className={[
                        "pointer-events-none absolute right-3 bottom-3 z-100 rounded-full border bg-white/90 px-3 py-1 text-xs shadow transition-opacity",
                        loading ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                >
                    불러오는 중…
                </div>
                <MapFilter value={filter} onChange={setFilter} />
            </div>
        </section>
    );
}