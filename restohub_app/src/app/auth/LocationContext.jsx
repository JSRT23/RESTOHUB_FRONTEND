import { createContext, useContext, useState, useEffect } from "react";

const LocationContext = createContext(null);

// Catálogo con aliases para matchear cualquier formato del gateway
// (código ISO, nombre completo, variantes en minúscula)
const ALL_COUNTRIES = [
  { code: "CO", name: "Colombia", flag: "🇨🇴", aliases: ["colombia", "co"] },
  {
    code: "MX",
    name: "México",
    flag: "🇲🇽",
    aliases: ["mexico", "méxico", "mx"],
  },
  { code: "PE", name: "Perú", flag: "🇵🇪", aliases: ["peru", "perú", "pe"] },
  { code: "AR", name: "Argentina", flag: "🇦🇷", aliases: ["argentina", "ar"] },
  {
    code: "BR",
    name: "Brasil",
    flag: "🇧🇷",
    aliases: ["brasil", "brazil", "br"],
  },
  { code: "CL", name: "Chile", flag: "🇨🇱", aliases: ["chile", "cl"] },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", aliases: ["ecuador", "ec"] },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", aliases: ["venezuela", "ve"] },
  {
    code: "ES",
    name: "España",
    flag: "🇪🇸",
    aliases: ["españa", "espana", "spain", "es"],
  },
  {
    code: "US",
    name: "Estados Unidos",
    flag: "🇺🇸",
    aliases: ["estados unidos", "united states", "usa", "us"],
  },
];

// Busca un país por código ISO o por cualquier alias (case-insensitive)
function findCountry(raw) {
  if (!raw) return null;
  const val = raw.toLowerCase().trim();
  return (
    ALL_COUNTRIES.find(
      (c) => c.code.toLowerCase() === val || c.aliases.includes(val),
    ) || null
  );
}

// Reverse geocoding via Nominatim (free, no API key)
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
  // restaurants → lista cruda de { id, nombre, pais, ciudad } del gateway
  const [restaurants, setRestaurants] = useState([]);
  const [country, setCountry] = useState(null);
  const [city, setCity] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Restaurar sesión previa
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

  // Países/ciudades derivados de los restaurantes reales del gateway
  // findCountry() matchea "colombia", "CO", "Colombia" → siempre encuentra la bandera
  const activeCountries = (() => {
    const map = {};
    restaurants.forEach((r) => {
      if (!r.pais) return;
      const meta = findCountry(r.pais);
      const key = meta ? meta.code : r.pais.toUpperCase();
      if (!map[key]) {
        map[key] = meta
          ? { ...meta, cities: new Set() }
          : { code: key, name: key, flag: "", cities: new Set() };
      }
      if (r.ciudad) map[key].cities.add(r.ciudad);
    });
    return Object.values(map).map((c) => ({
      code: c.code,
      name: c.name,
      flag: c.flag,
      cities: [...c.cities].sort(),
    }));
  })();

  const activeCodes = new Set(activeCountries.map((c) => c.code));
  const countries = activeCountries;
  const comingCountries = ALL_COUNTRIES.filter((c) => !activeCodes.has(c.code));

  const citiesForCountry = (countryCode) => {
    const found = activeCountries.find((c) => c.code === countryCode);
    return found ? found.cities : [];
  };

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
        const found = countries.find((c) => c.code === result.countryCode);
        if (!found) {
          setGeoError(
            restaurants.length === 0
              ? "Espera un momento mientras cargamos los países disponibles."
              : "RestoHub aún no está disponible en tu país. Elige manualmente.",
          );
          return;
        }
        // Normalizar: quitar tildes, lowercase, trim
        const norm = (s) =>
          (s || "")
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        const geoCity = norm(result.city);
        const cityMatch =
          found.cities.find((c) => norm(c) === geoCity) || // exact
          found.cities.find((c) => norm(c).includes(geoCity)) || // ciudad contiene lo del GPS
          found.cities.find((c) => geoCity.includes(norm(c))) || // GPS contiene la ciudad
          found.cities[0]; // fallback: primera ciudad
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
        countries,
        comingCountries,
        citiesForCountry,
        restaurants,
        setRestaurants,
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
