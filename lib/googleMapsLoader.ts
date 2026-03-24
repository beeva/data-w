type GoogleLibrary = "places" | "marker";

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
  const markerLoaded =
    typeof window !== "undefined" &&
    Boolean(window.google?.maps?.marker?.AdvancedMarkerElement);
  return libraries.every((library) =>
    library === "places" ? placesLoaded : markerLoaded,
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

  const ensureRequestedLibraries = async (maps: typeof google) => {
    if (!libraries.length || hasRequestedLibraries(libraries)) {
      return maps;
    }

    if (typeof window.google?.maps?.importLibrary === "function") {
      await Promise.all(
        libraries.map((library) => window.google!.maps.importLibrary(library)),
      );
      if (hasRequestedLibraries(libraries)) {
        return maps;
      }
    }

    throw new Error("Google Maps loaded without required libraries");
  };

  if (window.__googleMapsLoadPromise) {
    return window.__googleMapsLoadPromise.then(ensureRequestedLibraries);
  }

  const librariesQuery = libraries.length
    ? `&libraries=${encodeURIComponent(libraries.join(","))}`
    : "";
  const scriptSrc = `${GOOGLE_MAPS_BASE}?key=${encodeURIComponent(apiKey)}&loading=async${librariesQuery}`;

  window.__googleMapsLoadPromise = new Promise<typeof google>(
    (resolve, reject) => {
      const fail = (message: string) => {
        window.__googleMapsLoadPromise = null;
        reject(new Error(message));
      };

      const waitForLegacyLibraries = async (
        requestedLibraries: GoogleLibrary[],
        timeoutMs = 3000,
      ) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          if (hasRequestedLibraries(requestedLibraries)) return true;
          await new Promise((r) => setTimeout(r, 100));
        }
        return hasRequestedLibraries(requestedLibraries);
      };

      const resolveWithLibraries = async () => {
        if (!window.google?.maps) {
          fail("Google Maps loaded but maps object is unavailable");
          return;
        }
        if (!libraries.length) {
          resolve(window.google);
          return;
        }

        if (hasRequestedLibraries(libraries)) {
          resolve(window.google);
          return;
        }

        if (typeof window.google.maps.importLibrary === "function") {
          try {
            await ensureRequestedLibraries(window.google);
            resolve(window.google);
            return;
          } catch {
            fail("Google Maps loaded but required libraries failed to initialize");
            return;
          }
        }

        const librariesReady = await waitForLegacyLibraries(libraries);
        if (librariesReady) {
          resolve(window.google);
          return;
        }

        fail("Google Maps loaded without required libraries");
      };

      const existingScript = document.querySelector(
        'script[data-google-maps-loader="true"]',
      ) as HTMLScriptElement | null;

      const handleLoaded = () => {
        void resolveWithLibraries();
      };

      const handleError = () => {
        fail("Failed to load Google Maps JavaScript API");
      };

      if (existingScript) {
        if (window.google?.maps) {
          void resolveWithLibraries();
          return;
        }
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
