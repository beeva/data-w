"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const COLLECTOR_PIN = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="#10b981"/>
    <circle cx="16" cy="16" r="8" fill="white"/>
  </svg>`,
)}`;

const REQUESTER_PIN = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="#0891b2"/>
    <circle cx="16" cy="16" r="8" fill="white"/>
  </svg>`,
)}`;

export interface ProposalLocationMapProps {
  collectorLat: number | null | undefined;
  collectorLng: number | null | undefined;
  requesterLat: number | null | undefined;
  requesterLng: number | null | undefined;
  className?: string;
}

function isValidCoord(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function ProposalLocationMap({
  collectorLat,
  collectorLng,
  requesterLat,
  requesterLng,
  className = "",
}: ProposalLocationMapProps) {
  const googleMapsMapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const createMarkerContent = (url: string) => {
    const img = document.createElement("img");
    img.src = url;
    img.width = 28;
    img.height = 35;
    img.style.width = "28px";
    img.style.height = "35px";
    return img;
  };

  const hasCollector = isValidCoord(collectorLat, collectorLng);
  const hasRequester = isValidCoord(requesterLat, requesterLng);
  const hasAny = hasCollector || hasRequester;

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;
    let cancelled = false;
    loadGoogleMaps(["marker"])
      .then(() => {
        if (!cancelled) setMapsLoaded(true);
      })
      .catch((err) => console.error("Failed to load Google Maps", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !window.google?.maps || !hasAny)
      return;

    const collectorPos =
      hasCollector && typeof collectorLat === "number" && typeof collectorLng === "number"
        ? { lat: collectorLat, lng: collectorLng }
        : null;
    const requesterPos =
      hasRequester && typeof requesterLat === "number" && typeof requesterLng === "number"
        ? { lat: requesterLat, lng: requesterLng }
        : null;

    if (!mapInstanceRef.current) {
      const center = collectorPos ?? requesterPos!;
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 10,
        mapId: googleMapsMapId,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
        gestureHandling: "greedy",
        keyboardShortcuts: false,
      });
    }

    const map = mapInstanceRef.current;
    markersRef.current.forEach((m) => {
      m.map = null;
    });
    markersRef.current = [];

    if (collectorPos) {
      const m = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: collectorPos,
        content: createMarkerContent(COLLECTOR_PIN),
        title: "Collector",
        zIndex: 2,
      });
      markersRef.current.push(m);
    }
    if (requesterPos) {
      const m = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: requesterPos,
        content: createMarkerContent(REQUESTER_PIN),
        title: "Requester / Project",
        zIndex: 1,
      });
      markersRef.current.push(m);
    }

    if (collectorPos && requesterPos) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(collectorPos);
      bounds.extend(requesterPos);
      map.fitBounds(bounds, { top: 24, right: 24, bottom: 24, left: 24 });
    } else if (collectorPos || requesterPos) {
      map.setCenter(collectorPos ?? requesterPos!);
      map.setZoom(12);
    }
  }, [
    mapsLoaded,
    hasCollector,
    hasRequester,
    hasAny,
    collectorLat,
    collectorLng,
    requesterLat,
    requesterLng,
  ]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground ${className}`}
        style={{ minHeight: 240 }}
      >
        Map unavailable
      </div>
    );
  }

  if (!hasAny) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground ${className}`}
        style={{ minHeight: 240 }}
      >
        No location data
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-xl border border-border overflow-hidden bg-muted/20 ${className}`}
      style={{ minHeight: 280 }}
    />
  );
}
