"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

interface AddressResult {
  address: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter address",
  className,
  disabled = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<
    google.maps.places.PlacePrediction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const autocompleteSessionToken =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load Google Places API
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.warn(
        "Google Maps API key not configured. Address autocomplete disabled.",
      );
      return;
    }
    let cancelled = false;

    void loadGoogleMaps(["places"])
      .then(() => {
        if (cancelled || !window.google?.maps?.places) return;
        setIsGoogleLoaded(true);
        autocompleteSessionToken.current =
          new window.google.maps.places.AutocompleteSessionToken();
      })
      .catch((err) => {
        console.error("Failed to load Google Maps API", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = useCallback(async (input: string) => {
    if (!input || input.length < 3 || !window.google?.maps?.places) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      if (!autocompleteSessionToken.current) {
        autocompleteSessionToken.current =
          new window.google.maps.places.AutocompleteSessionToken();
      }

      const { AutocompleteSuggestion } = (await window.google.maps.importLibrary(
        "places",
      )) as google.maps.PlacesLibrary;

      const { suggestions: nextSuggestions } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          includedPrimaryTypes: ["street_address", "premise", "route"],
          sessionToken: autocompleteSessionToken.current,
        });

      const predictions = nextSuggestions
        .map((suggestion) => suggestion.placePrediction)
        .filter((prediction): prediction is google.maps.places.PlacePrediction =>
          Boolean(prediction),
        );
      setSuggestions(predictions);
      setShowSuggestions(predictions.length > 0);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce the search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (isGoogleLoaded) {
      debounceTimer.current = setTimeout(() => {
        searchAddress(newValue);
      }, 300);
    }
  };

  const handleSelectSuggestion = (
    prediction: google.maps.places.PlacePrediction,
  ) => {
    onChange(prediction.text.text);
    setShowSuggestions(false);
    setSuggestions([]);

    if (!onSelect) return;

    const selectedPrediction = prediction;
    void (async () => {
      try {
        const place = selectedPrediction.toPlace();
        await place.fetchFields({
          fields: ["formattedAddress", "addressComponents", "location"],
        });

        const result: AddressResult = {
          address:
            place.formattedAddress ||
            selectedPrediction.text.text ||
            value,
          city: "",
          country: "",
          placeId: selectedPrediction.placeId,
        };

        place.addressComponents?.forEach((component) => {
          const componentText = component.longText || component.shortText || "";
          if (component.types.includes("locality")) {
            result.city = componentText;
          } else if (
            component.types.includes("administrative_area_level_1") &&
            !result.city
          ) {
            result.city = componentText;
          }
          if (component.types.includes("country")) {
            result.country = componentText;
          }
        });

        if (place.location) {
          result.lat = place.location.lat();
          result.lng = place.location.lng();
        }

        onSelect(result);
        autocompleteSessionToken.current =
          new window.google.maps.places.AutocompleteSessionToken();
      } catch (error) {
        console.error("Error fetching selected place details:", error);
      }
    })();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black dark:text-white/50 pointer-events-none" />
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pl-9", isLoading && "pr-9", className)}
        />
        {isLoading && (
          <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {suggestion.mainText?.text || suggestion.text.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.secondaryText?.text || ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No API key message */}
      {!isGoogleLoaded && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-muted-foreground mt-1">
          Address autocomplete requires Google Maps API key
        </p>
      )}
    </div>
  );
}
