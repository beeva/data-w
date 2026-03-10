"use client";

import { useEffect, useRef, useState } from "react";

export interface MapJobPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  budget: number;
  category?: string;
  iconSvg?: string;
}

interface LocationMapPreviewProps {
  lat: number;
  lng: number;
  radiusKm: number;
  jobPins?: MapJobPin[];
  onSelectPin?: (id: string) => void;
  className?: string;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

const MAP_STYLES_LIGHT: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f0f4f8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#546e7a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c9d4dc" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#d1ead4" }],
  },
  { featureType: "poi.park", stylers: [{ visibility: "on" }] },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e2e8f0" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#f8fafc" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#e2e8f0" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#78909c" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#bfdbfe" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
];

const MAP_STYLES_DARK: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#14532d" }],
  },
  { featureType: "poi.park", stylers: [{ visibility: "on" }] },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#273549" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#2d3f55" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#0c2340" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
];

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function radiusToZoom(km: number): number {
  if (km <= 0) return 11;
  if (km <= 2) return 14;
  if (km <= 5) return 12;
  if (km <= 10) return 11;
  if (km <= 25) return 10;
  if (km <= 50) return 9;
  if (km <= 100) return 8;
  return 7;
}

const USER_MARKER_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
    <circle cx="15" cy="15" r="12" fill="#0891b2" stroke="white" stroke-width="3"/>
    <circle cx="15" cy="15" r="4.5" fill="white"/>
  </svg>`,
)}`;

// Colors match RequesterDashboard category palette exactly
const CATEGORY_COLORS: Record<string, { fill: string; highlight: string }> = {
  Photography: { fill: "#10b981", highlight: "#34d399" }, // emerald-500 / 400
  Video: { fill: "#0ea5e9", highlight: "#38bdf8" }, // sky-500 / 400
  Audio: { fill: "#a855f7", highlight: "#c084fc" }, // purple-500 / 400
  Text: { fill: "#f59e0b", highlight: "#fbbf24" }, // amber-500 / 400
  Survey: { fill: "#22c55e", highlight: "#4ade80" }, // green-500 / 400
  "Location Data": { fill: "#14b8a6", highlight: "#2dd4bf" }, // teal-500 / 400
  "Sensor Data": { fill: "#f97316", highlight: "#fb923c" }, // orange-500 / 400
  Other: { fill: "#06b6d4", highlight: "#22d3ee" }, // cyan-500 / 400
};

const DEFAULT_PIN_COLOR = { fill: "#06b6d4", highlight: "#22d3ee" }; // cyan-500 / 400

// Filled icon paths for map pin and info-window fallback (Material Design style, 24×24 viewBox)
const CATEGORY_ICON_PATHS: Record<string, string> = {
  Photography: `<path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>`,
  Video: `<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>`,
  Audio: `<path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>`,
  Text: `<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>`,
  Survey: `<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>`,
  "Location Data": `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>`,
  "Sensor Data": `<path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>`,
  Other: `<path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>`,
};

const DEFAULT_ICON_PATHS = CATEGORY_ICON_PATHS["Other"];

function getCategoryIcon(category?: string): { svg: string; bg: string } {
  const paths =
    (category && CATEGORY_ICON_PATHS[category]) ?? DEFAULT_ICON_PATHS;
  const bg =
    (category && CATEGORY_COLORS[category]?.fill) ?? DEFAULT_PIN_COLOR.fill;
  const svg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="white">${paths}</svg>`;
  return { svg, bg };
}

// Ripple canvas is 64×64; center at (32,32).
// The pin circle sits 22px above the geographic anchor (tip at pixel 36, circle at pixel 14).
// So we set the ripple anchor at Point(32, 32+22=54) to align rings with the pin circle.
function makeRippleUrl(category?: string): string {
  const { fill } =
    (category ? CATEGORY_COLORS[category] : undefined) ?? DEFAULT_PIN_COLOR;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="0" fill="none" stroke="${fill}" stroke-width="2.5">
        <animate attributeName="r" from="9" to="30" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.75;0" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="32" cy="32" r="0" fill="none" stroke="${fill}" stroke-width="1.8">
        <animate attributeName="r" from="9" to="30" dur="2s" begin="0.65s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0" dur="2s" begin="0.65s" repeatCount="indefinite"/>
      </circle>
      <circle cx="32" cy="32" r="0" fill="none" stroke="${fill}" stroke-width="1.2">
        <animate attributeName="r" from="9" to="30" dur="2s" begin="1.3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0" dur="2s" begin="1.3s" repeatCount="indefinite"/>
      </circle>
    </svg>`,
  )}`;
}

function makeJobMarkerUrl(category?: string, dark?: boolean) {
  const { fill, highlight } =
    (category ? CATEGORY_COLORS[category] : undefined) ?? DEFAULT_PIN_COLOR;
  const paths =
    (category && CATEGORY_ICON_PATHS[category]) ?? DEFAULT_ICON_PATHS;
  const innerCircle = dark ? "#0f172a" : "white";
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 8.732 14 22 14 22S28 22.732 28 14C28 6.268 21.732 0 14 0z" fill="${fill}"/>
      <path d="M14 1C6.82 1 1 6.82 1 14c0 8.2 13 21.1 13 21.1S27 22.2 27 14C27 6.82 21.18 1 14 1z" fill="${highlight}"/>
      <circle cx="14" cy="14" r="10" fill="${innerCircle}" opacity="0.95"/>
      <svg x="6.5" y="6.5" width="15" height="15" viewBox="0 0 24 24" fill="${fill}">${paths}</svg>
    </svg>`,
  )}`;
}

export function LocationMapPreview({
  lat,
  lng,
  radiusKm,
  jobPins = [],
  onSelectPin,
  className = "",
}: LocationMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const jobMarkersRef = useRef<google.maps.Marker[]>([]);
  const rippleMarkerRef = useRef<google.maps.Marker | null>(null);
  const waveCirclesRef = useRef<google.maps.Circle[]>([]);
  const waveAnimRef = useRef<number | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const onSelectPinRef = useRef(onSelectPin);
  const isDarkRef = useRef(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [isDark, setIsDark] = useState(isDarkMode);

  useEffect(() => {
    onSelectPinRef.current = onSelectPin;
  }, [onSelectPin]);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  // Watch for dark/light class toggle on <html>
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(isDarkMode());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Apply map styles whenever theme changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setOptions({
      styles: isDark ? MAP_STYLES_DARK : MAP_STYLES_LIGHT,
    });
  }, [isDark]);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (window.google?.maps) {
      setMapsLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[data-google-maps="true"]',
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

  // Init map + user marker + radius circle
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !window.google?.maps) return;

    const center = { lat, lng };
    const radiusMeters = Math.max(radiusKm, 0) * 1000;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: radiusToZoom(radiusKm),
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: "greedy",
        keyboardShortcuts: false,
        styles: isDark ? MAP_STYLES_DARK : MAP_STYLES_LIGHT,
      });

      userMarkerRef.current = new window.google.maps.Marker({
        map: mapInstanceRef.current,
        position: center,
        zIndex: 200,
        icon: {
          url: USER_MARKER_URL,
          scaledSize: new window.google.maps.Size(30, 30),
          anchor: new window.google.maps.Point(15, 15),
        },
        title: "Your location",
      });

      circleRef.current = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center,
        radius: radiusMeters,
        strokeColor: "#0891b2",
        strokeOpacity: 0.7,
        strokeWeight: 1.5,
        fillColor: "#06b6d4",
        fillOpacity: 0.08,
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();

      if (!document.getElementById("gm-iw-custom-styles")) {
        const style = document.createElement("style");
        style.id = "gm-iw-custom-styles";
        style.textContent = `
          .gm-style .gm-style-iw { padding: 0 !important; }
          .gm-style .gm-style-iw-chr { position: absolute; top: 0; right: 0; z-index: 10; pointer-events: none; }
          .gm-style .gm-style-iw-chr button { pointer-events: auto; }
          .gm-style .gm-style-iw-d { overflow: hidden !important; margin-top: 0 !important; padding: 0 !important; }
          .gm-style-cc, .gm-style a[href*="google.com/maps"], .gmnoprint { display: none !important; }
          a[href^="https://maps.google.com/maps"] { display: none !important; }
        `;
        document.head.appendChild(style);
      }
    } else {
      userMarkerRef.current?.setPosition(center);
      circleRef.current?.setCenter(center);
      circleRef.current?.setRadius(radiusMeters);
      mapInstanceRef.current.setCenter(center);
    }
  }, [mapsLoaded, lat, lng, radiusKm]);

  // Animated wave rings on the radius circle
  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    // Tear down previous animation
    if (waveAnimRef.current !== null) {
      cancelAnimationFrame(waveAnimRef.current);
      waveAnimRef.current = null;
    }
    waveCirclesRef.current.forEach((c) => c.setMap(null));
    waveCirclesRef.current = [];

    const maxRadius = Math.max(radiusKm, 0) * 1000; // metres
    if (maxRadius === 0) return;

    const map = mapInstanceRef.current;
    const center = { lat, lng };
    const WAVE_COUNT = 3;
    const DURATION = 6000; // ms per full cycle

    for (let i = 0; i < WAVE_COUNT; i++) {
      waveCirclesRef.current.push(
        new window.google.maps.Circle({
          map,
          center,
          radius: 0,
          strokeColor: "#0891b2",
          strokeOpacity: 0,
          strokeWeight: 1.5,
          fillOpacity: 0,
        }),
      );
    }

    let startTime: number | null = null;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = (ts - startTime) % DURATION;
      waveCirclesRef.current.forEach((circle, i) => {
        const phase = (elapsed / DURATION + i / WAVE_COUNT) % 1;
        circle.setRadius(maxRadius * phase);
        circle.setOptions({ strokeOpacity: (1 - phase) * 0.55 });
      });
      waveAnimRef.current = requestAnimationFrame(animate);
    };
    waveAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (waveAnimRef.current !== null) {
        cancelAnimationFrame(waveAnimRef.current);
        waveAnimRef.current = null;
      }
      waveCirclesRef.current.forEach((c) => c.setMap(null));
      waveCirclesRef.current = [];
    };
  }, [mapsLoaded, lat, lng, radiusKm]);

  // Sync job pin markers
  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    // Remove old job markers and any active ripple
    jobMarkersRef.current.forEach((m) => m.setMap(null));
    jobMarkersRef.current = [];
    rippleMarkerRef.current?.setMap(null);
    rippleMarkerRef.current = null;

    const map = mapInstanceRef.current;
    const validPins = jobPins.filter(
      (p) => typeof p.lat === "number" && typeof p.lng === "number",
    );

    validPins.forEach((pin, i) => {
      const marker = new window.google.maps.Marker({
        map,
        position: { lat: pin.lat, lng: pin.lng },
        zIndex: 10 + i,
        icon: {
          url: makeJobMarkerUrl(pin.category, isDark),
          scaledSize: new window.google.maps.Size(28, 36),
          anchor: new window.google.maps.Point(14, 36),
        },
        title: pin.title,
      });

      marker.addListener("click", () => {
        // Swap ripple to this pin
        rippleMarkerRef.current?.setMap(null);
        rippleMarkerRef.current = new window.google.maps.Marker({
          map,
          position: { lat: pin.lat, lng: pin.lng },
          zIndex: 9 + i,
          clickable: false,
          icon: {
            url: makeRippleUrl(pin.category),
            scaledSize: new window.google.maps.Size(64, 64),
            // center the ripple (32,32) exactly on the geographic position = pin tip
            anchor: new window.google.maps.Point(32, 32),
          },
        });

        if (infoWindowRef.current) {
          const { svg: fallbackSvg, bg: iconBg } = getCategoryIcon(pin.category);
          const iconSvg = pin.iconSvg ?? fallbackSvg;
          const dark = isDarkRef.current;
          const popupBg = dark ? "#1e293b" : "#ffffff";
          const titleColor = dark ? "#f1f5f9" : "#0f172a";
          const categoryColor = dark ? "#94a3b8" : "#64748b";
          infoWindowRef.current.setContent(
            `<div style="font-family:system-ui,-apple-system,sans-serif;padding:12px 48px 14px 14px;min-width:260px;max-width:320px;background:${popupBg}">
              <div style="display:flex;align-items:start;gap:14px">
                <div style="width:48px;height:48px;border-radius:14px;background:${iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px ${iconBg}50">
                  ${iconSvg}
                </div>
                <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
                  <div style="font-size:14px;font-weight:700;color:${titleColor};line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${pin.title}</div>
                  ${pin.category ? `<div style="font-size:11px;color:${categoryColor};font-weight:500">${pin.category}</div>` : ""}
                  <div style="font-size:16px;font-weight:700;color:${iconBg};margin-top:2px">$${pin.budget.toFixed(2)}</div>
                </div>
              </div>
              <button id="gm-view-detail-btn" style="margin-top:8px;padding:0;background:none;border:none;color:${iconBg};font-size:13px;font-weight:600;cursor:pointer;text-decoration:underline;text-underline-offset:2px">View Detail</button>
            </div>`,
          );
          infoWindowRef.current.open(map, marker);

          // Wire up the "View Detail" button once the InfoWindow DOM is ready
          window.google.maps.event.addListenerOnce(
            infoWindowRef.current,
            "domready",
            () => {
              document
                .getElementById("gm-view-detail-btn")
                ?.addEventListener("click", () => {
                  infoWindowRef.current?.close();
                  onSelectPinRef.current?.(pin.id);
                });
            },
          );

          // Clear ripple when the info window is dismissed
          infoWindowRef.current.addListener("closeclick", () => {
            rippleMarkerRef.current?.setMap(null);
            rippleMarkerRef.current = null;
          });
        }
      });

      jobMarkersRef.current.push(marker);
    });

    // Fit map to show user location + all job pins
    if (validPins.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat, lng });
      validPins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 48, right: 24, bottom: 24, left: 24 });
    } else {
      map.setCenter({ lat, lng });
      map.setZoom(radiusToZoom(radiusKm));
    }
  }, [mapsLoaded, jobPins, lat, lng, radiusKm, isDark]);

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
