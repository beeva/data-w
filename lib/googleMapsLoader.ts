type GoogleLibrary = "places";

declare global {
  interface Window {
    google?: typeof google;
    __googleMapsLoadPromise?: Promise<typeof google> | null;
  }
}

const GOOGLE_MAPS_BASE = "https://maps.googleapis.com/maps/api/js";

function hasRequestedLibraries(libraries: GoogleLibrary[]) {
  if (!libraries.length) return true;
  const placesLoaded =
    typeof window !== "undefined" &&
    Boolean(window.google?.maps?.places);
  return libraries.every((library) =>
    library === "places" ? placesLoaded : true,
  );
}

export function loadGoogleMaps(
  libraries: GoogleLibrary[] = [],
): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in browser"));
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
  }

  if (window.google?.maps && hasRequestedLibraries(libraries)) {
    return Promise.resolve(window.google);
  }

  if (window.__googleMapsLoadPromise) {
    return window.__googleMapsLoadPromise;
  }

  const librariesQuery = libraries.length
    ? `&libraries=${encodeURIComponent(libraries.join(","))}`
    : "";
  const scriptSrc = `${GOOGLE_MAPS_BASE}?key=${encodeURIComponent(apiKey)}${librariesQuery}`;

  window.__googleMapsLoadPromise = new Promise<typeof google>(
    (resolve, reject) => {
      const existingScript = document.querySelector(
        'script[data-google-maps-loader="true"]',
      ) as HTMLScriptElement | null;

      const handleLoaded = () => {
        if (window.google?.maps && hasRequestedLibraries(libraries)) {
          resolve(window.google);
          return;
        }
        reject(new Error("Google Maps loaded without required libraries"));
      };

      const handleError = () => {
        window.__googleMapsLoadPromise = null;
        reject(new Error("Failed to load Google Maps JavaScript API"));
      };

      if (existingScript) {
        existingScript.addEventListener("load", handleLoaded, { once: true });
        existingScript.addEventListener("error", handleError, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.dataset.googleMapsLoader = "true";
      script.addEventListener("load", handleLoaded, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.appendChild(script);
    },
  );

  return window.__googleMapsLoadPromise;
}
