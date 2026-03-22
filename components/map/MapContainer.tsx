'use client';

import { useCallback, useRef } from 'react';
import { Map, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MapControls } from './MapControls';
import { MarkerCluster } from './MarkerCluster';
import { MapNavBar } from './MapNavBar';
import { LeftPanel } from './LeftPanel';
import { useMapStore } from '@/stores/map-store';
import { useMapApartments } from '@/hooks/use-map-apartments';
import type { MapApartment } from '@/types/map.types';

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ??
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export function MapContainer() {
  const mapRef = useRef<MapRef>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    lat, lng, zoom, bounds, selectedComplexId,
    setViewport, setBounds, setSelectedComplex,
  } = useMapStore();

  const { data: apartments = [], isLoading } = useMapApartments(bounds, zoom);

  /** 뷰포트 이동 완료 시 (debounce 300ms) */
  const handleMoveEnd = useCallback(
    (evt: ViewStateChangeEvent) => {
      const { latitude, longitude, zoom: newZoom } = evt.viewState;
      setViewport(latitude, longitude, newZoom);

      if (debounceRef.current) {clearTimeout(debounceRef.current);}

      debounceRef.current = setTimeout(() => {
        const map = mapRef.current?.getMap();
        if (!map) {return;}

        const mapBounds = map.getBounds();
        setBounds({
          sw: { lat: mapBounds.getSouth(), lng: mapBounds.getWest() },
          ne: { lat: mapBounds.getNorth(), lng: mapBounds.getEast() },
        });
      }, 300);
    },
    [setViewport, setBounds]
  );

  /** 지도 초기 로드 시 bounds 설정 */
  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) {return;}

    const mapBounds = map.getBounds();
    setBounds({
      sw: { lat: mapBounds.getSouth(), lng: mapBounds.getWest() },
      ne: { lat: mapBounds.getNorth(), lng: mapBounds.getEast() },
    });
  }, [setBounds]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.getMap().zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.getMap().zoomOut({ duration: 300 });
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {return;}

    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 15,
          duration: 1500,
        });
      },
      () => {
        /* 위치 권한 거부 시 무시 */
      }
    );
  }, []);

  const handleClusterClick = useCallback(
    (_clusterId: number, clusterLat: number, clusterLng: number) => {
      mapRef.current?.flyTo({
        center: [clusterLng, clusterLat],
        zoom: Math.min(zoom + 2, 18),
        duration: 500,
      });
    },
    [zoom]
  );

  /** 마커 또는 좌측 패널에서 아파트 선택 → 지도 fly-to */
  const handleApartmentSelect = useCallback(
    (apt: MapApartment) => {
      setSelectedComplex(apt.id);
      mapRef.current?.flyTo({
        center: [apt.lng, apt.lat],
        zoom: Math.max(zoom, 15),
        duration: 800,
      });
    },
    [setSelectedComplex, zoom]
  );

  return (
    <div className="relative h-full w-full">
      {/* 상단 네비게이션 */}
      <MapNavBar />

      {/* 좌측 패널 */}
      <LeftPanel
        apartments={apartments}
        selectedId={selectedComplexId}
        onSelect={handleApartmentSelect}
        isLoading={isLoading}
      />

      {/* 지도 영역 — 상단 네비 높이(48px) 빼고, 데스크톱에서 좌측 패널(360px) 빼기 */}
      <div className="absolute inset-0 top-12 sm:left-[360px]">
        <Map
          ref={mapRef}
          initialViewState={{
            latitude: lat,
            longitude: lng,
            zoom,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          onMoveEnd={handleMoveEnd}
          onLoad={handleLoad}
          maxZoom={18}
          minZoom={8}
          attributionControl={false}
        >
          <MarkerCluster
            apartments={apartments}
            zoom={zoom}
            bounds={bounds}
            onApartmentClick={handleApartmentSelect}
            onClusterClick={handleClusterClick}
          />
        </Map>

        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocate={handleLocate}
        />
      </div>
    </div>
  );
}
