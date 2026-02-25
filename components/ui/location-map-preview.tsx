"use client";

import { useEffect, useRef, useState } from "react";

interface LocationMapPreviewProps {
  lat: number;
  lng: number;
  radiusKm: number;
  className?: string;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function LocationMapPreview({
  lat,
  lng,
  radiusKm,
  className = "",
}: LocationMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (window.google?.maps) {
      setMapsLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[data-google-maps="true"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => setMapsLoaded(true));
      return () => {
        existingScript.removeEventListener("load", () => setMapsLoaded(true));
      };
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => setMapsLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !window.google?.maps) return;

    const center = { lat, lng };
    const radiusMeters = Math.max(radiusKm, 0) * 1000;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 18,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      markerRef.current = new window.google.maps.Marker({
        map: mapInstanceRef.current,
        position: center,
      });

      circleRef.current = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center,
        radius: radiusMeters,
        strokeColor: "#0891b2",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#06b6d4",
        fillOpacity: 0.16,
      });
    } else {
      markerRef.current?.setPosition(center);
      circleRef.current?.setCenter(center);
      circleRef.current?.setRadius(radiusMeters);
    }

    // Keep zoom stable while radius changes; only recenter map.
    mapInstanceRef.current.setCenter(center);
  }, [mapsLoaded, lat, lng, radiusKm]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={`w-full aspect-square rounded border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs text-muted-foreground ${className}`}
      >
        Google Maps preview requires API key
      </div>
    );
  }

  return <div ref={mapRef} className={`w-full aspect-square ${className}`} />;
}

