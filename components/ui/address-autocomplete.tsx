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
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const placesDiv = useRef<HTMLDivElement | null>(null);
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
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();
        placesDiv.current = document.createElement("div");
        placesService.current = new window.google.maps.places.PlacesService(
          placesDiv.current,
        );
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
    if (!input || input.length < 3 || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      autocompleteService.current.getPlacePredictions(
        {
          input,
          types: ["address"],
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === "OK" && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        },
      );
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setIsLoading(false);
      setSuggestions([]);
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
    prediction: google.maps.places.AutocompletePrediction,
  ) => {
    onChange(prediction.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Get place details for city, country, and coordinates
    if (placesService.current && onSelect) {
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["address_components", "geometry", "formatted_address"],
        },
        (place, status) => {
          if (status === "OK" && place) {
            const result: AddressResult = {
              address: place.formatted_address || prediction.description,
              city: "",
              country: "",
              placeId: prediction.place_id,
            };

            // Extract city and country from address components
            place.address_components?.forEach((component) => {
              if (component.types.includes("locality")) {
                result.city = component.long_name;
              } else if (
                component.types.includes("administrative_area_level_1") &&
                !result.city
              ) {
                result.city = component.long_name;
              }
              if (component.types.includes("country")) {
                result.country = component.long_name;
              }
            });

            // Get coordinates
            if (place.geometry?.location) {
              result.lat = place.geometry.location.lat();
              result.lng = place.geometry.location.lng();
            }

            onSelect(result);
          }
        },
      );
    }
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
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {suggestion.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.structured_formatting.secondary_text}
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
