import { createContext, useContext, useState, useEffect } from "react";
import { ACTIVE_COUNTRIES } from "../data/restaurants";

const LocationContext = createContext(null);

// Intenta resolver coordenadas a país/ciudad usando Nominatim (gratuito, sin API key)
async function resolveCoords(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
      { headers: { "User-Agent": "RestoHub/1.0" } },
    );
    const data = await res.json();
    const countryCode = data.address?.country_code?.toUpperCase();
    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.municipality ||
      data.address?.county ||
      null;
    return { countryCode, city };
  } catch {
    return null;
  }
}

export function LocationProvider({ children }) {
  const [country, setCountry] = useState(null);
  const [city, setCity] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("rh_location");
    if (saved) {
      try {
        const { country: c, city: ci } = JSON.parse(saved);
        setCountry(c);
        setCity(ci);
        setConfirmed(true);
      } catch {
        setShowPicker(true);
      }
    } else {
      setShowPicker(true);
    }
  }, []);

  const confirm = (c, ci) => {
    setCountry(c);
    setCity(ci);
    setConfirmed(true);
    setShowPicker(false);
    sessionStorage.setItem(
      "rh_location",
      JSON.stringify({ country: c, city: ci }),
    );
  };

  const reset = () => {
    setCountry(null);
    setCity(null);
    setConfirmed(false);
    setShowPicker(true);
    sessionStorage.removeItem("rh_location");
    setGeoError(null);
  };

  // Geolocalización del navegador
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await resolveCoords(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        setGeoLoading(false);
        if (!result) {
          setGeoError("No pudimos identificar tu ubicación.");
          return;
        }
        // Buscar el país en nuestros activos
        const found = ACTIVE_COUNTRIES.find(
          (c) => c.code === result.countryCode,
        );
        if (!found) {
          setGeoError(
            `RestoHub aún no está disponible en tu país (${result.countryCode}). Elige manualmente.`,
          );
          return;
        }
        // Buscar ciudad más cercana en la lista
        const cityMatch =
          found.cities.find(
            (c) => c.toLowerCase() === (result.city || "").toLowerCase(),
          ) || found.cities[0];
        confirm(found, cityMatch);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1)
          setGeoError(
            "Permiso de ubicación denegado. Elige tu ciudad manualmente.",
          );
        else setGeoError("No pudimos obtener tu ubicación. Elige manualmente.");
      },
      { timeout: 8000, maximumAge: 300000 },
    );
  };

  return (
    <LocationContext.Provider
      value={{
        country,
        city,
        confirmed,
        showPicker,
        setShowPicker,
        confirm,
        reset,
        COUNTRIES: ACTIVE_COUNTRIES,
        geoLoading,
        geoError,
        setGeoError,
        detectLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
