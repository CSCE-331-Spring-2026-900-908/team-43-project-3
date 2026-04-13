/**
 * Compact weather summary for the kiosk and menu board.
 *
 * The widget fetches current weather data once on mount and maps the WMO
 * code to a readable description for display.
 *
 * @returns {JSX.Element | null}
 */
import { useState, useEffect } from "react";
import { api } from "../api";

const WMO_CODES = {
  0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime Fog", 51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
  61: "Light Rain", 63: "Rain", 65: "Heavy Rain", 71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
  80: "Light Showers", 81: "Showers", 82: "Heavy Showers", 95: "Thunderstorm",
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    api.getWeather().then(setWeather).catch(() => {});
  }, []);

  if (!weather?.current) return null;

  const cur = weather.current;
  const desc = WMO_CODES[cur.weathercode] || "Unknown";

  return (
    <div style={{ marginTop: "0.75rem", color: "var(--text-light)", fontSize: "0.95rem" }}>
      College Station: {Math.round(cur.temperature_2m)}°F — {desc}
    </div>
  );
}
