'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parseLatLong, formatLatLong } from '@/lib/geo';

// Fix Leaflet default marker icons (broken by webpack bundling)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BANGKOK_CENTER: L.LatLngExpression = [13.7563, 100.5018];
const DEFAULT_ZOOM = 11;
const PLACED_ZOOM = 15;

interface MapPickerProps {
  value: string | null;
  onChange: (val: string | null) => void;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToHandler({ center }: { center: L.LatLngExpression | null }) {
  const map = useMap();
  const prevCenter = useRef<L.LatLngExpression | null>(null);

  useEffect(() => {
    if (center && center !== prevCenter.current) {
      prevCenter.current = center;
      map.flyTo(center, PLACED_ZOOM, { duration: 1 });
    }
  }, [center, map]);

  return null;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [flyTarget, setFlyTarget] = useState<L.LatLngExpression | null>(null);

  const coords = parseLatLong(value);
  const markerPosition: L.LatLngExpression | null = coords ? [coords.lat, coords.lng] : null;

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      onChange(formatLatLong(lat, lng));
      setFlyTarget(null); // don't fly on click, marker placed where user clicked
      setGeoError(null);
    },
    [onChange],
  );

  const handleMarkerDrag = useCallback(
    (e: L.DragEndEvent) => {
      const marker = e.target as L.Marker;
      const pos = marker.getLatLng();
      onChange(formatLatLong(pos.lat, pos.lng));
    },
    [onChange],
  );

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง');
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange(formatLatLong(latitude, longitude));
        setFlyTarget([latitude, longitude]);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('ไม่สามารถระบุตำแหน่งได้ในขณะนี้');
            break;
          case err.TIMEOUT:
            setGeoError('หมดเวลาในการระบุตำแหน่ง กรุณาลองใหม่');
            break;
          default:
            setGeoError('เกิดข้อผิดพลาดในการระบุตำแหน่ง');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
    setFlyTarget(null);
    setGeoError(null);
  }, [onChange]);

  return (
    <div className="space-y-2">
      {/* Geolocation button */}
      <button
        type="button"
        onClick={handleGeolocate}
        disabled={locating}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-warm-300 dark:border-warm-700 text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors disabled:opacity-50"
      >
        {locating ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
        {locating ? 'กำลังค้นหา...' : 'ใช้ตำแหน่งปัจจุบัน'}
      </button>

      {geoError && (
        <p className="text-xs text-red-500 dark:text-red-400">{geoError}</p>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-warm-300 dark:border-warm-700">
        <MapContainer
          center={markerPosition || BANGKOK_CENTER}
          zoom={markerPosition ? PLACED_ZOOM : DEFAULT_ZOOM}
          style={{ height: 300, width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <FlyToHandler center={flyTarget} />
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
          )}
        </MapContainer>
      </div>

      {/* Coordinate display & clear */}
      {coords && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-warm-50 dark:bg-warm-800 rounded-xl text-sm">
          <span className="text-warm-600 dark:text-warm-300 font-mono text-xs">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-warm-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
            title="ลบตำแหน่ง"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <p className="text-xs text-warm-500 dark:text-warm-400">
        คลิกบนแผนที่เพื่อปักหมุด หรือลากหมุดเพื่อเปลี่ยนตำแหน่ง
      </p>
    </div>
  );
}
