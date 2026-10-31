"use client";

import { useEffect, useRef } from "react";

interface MapPickerProps {
  lat: number;
  lon: number;
  onLocationChange?: (lat: number, lon: number) => void;
  readOnly?: boolean;
  /** Tailwind height class, e.g. "h-64" or "h-48" */
  heightClass?: string;
}

/**
 * Interactive Leaflet map with draggable marker.
 * Safe for Next.js App Router — Leaflet is loaded only on the client
 * via dynamic import inside a useEffect. No SSR issues.
 */
export default function MapPicker({
  lat,
  lon,
  onLocationChange,
  readOnly = false,
  heightClass = "h-64",
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markerRef    = useRef<any>(null);
  const readyRef     = useRef(false);

  // Mount: initialise Leaflet
  useEffect(() => {
    if (!containerRef.current || readyRef.current) return;
    readyRef.current = true;

    // Inject Leaflet CSS once
    if (!document.getElementById("leaflet-css-link")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css-link";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const pinIcon = L.icon({
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize:    [25, 41],
        iconAnchor:  [12, 41],
        popupAnchor: [1, -34],
        shadowSize:  [41, 41],
      });

      const map = L.map(containerRef.current, {
        zoomControl:        true,
        attributionControl: true,
        scrollWheelZoom:    !readOnly,
        dragging:           !readOnly,
      }).setView([lat, lon], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lon], {
        draggable: !readOnly,
        icon:      pinIcon,
      }).addTo(map);

      if (!readOnly && onLocationChange) {
        marker.on("dragend", () => {
          const { lat: la, lng: lo } = marker.getLatLng();
          onLocationChange(Number(la.toFixed(6)), Number(lo.toFixed(6)));
        });
        map.on("click", (e: any) => {
          marker.setLatLng(e.latlng);
          onLocationChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        });
      }

      mapRef.current    = map;
      markerRef.current = marker;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current    = null;
        markerRef.current = null;
        readyRef.current  = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker + view when lat/lon props change
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
      mapRef.current.setView([lat, lon], 16, { animate: true });
    }
  }, [lat, lon]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${heightClass} rounded-2xl overflow-hidden relative z-0`}
    />
  );
}
