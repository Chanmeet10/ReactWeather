import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API_KEY = "1adb0f9eeaa6c39a1d532d0420ea17c3";
const API_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

function App() {
  const [city, setCity] = useState(""); // For search bar city
  const [geoCity, setGeoCity] = useState(""); // For geolocation city
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("metric"); // Celsius by default
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem("recentSearches")) || []
  );
  const [background, setBackground] = useState("");

  // Use useCallback to memoize the fetchWeather function and prevent unnecessary re-renders
  const fetchWeather = useCallback(async (cityInput) => {
    const query = cityInput || city;
    if (!query) {
      setError("Please enter a city name or enable geolocation.");
      return;
    }

    try {
      setError("");
      const weatherResponse = await axios.get(API_URL, {
        params: {
          q: query,
          appid: API_KEY,
          units: unit,
        },
      });
      const forecastResponse = await axios.get(FORECAST_URL, {
        params: {
          q: query,
          appid: API_KEY,
          units: unit,
        },
      });

      setWeather(weatherResponse.data);
      setForecast(forecastResponse.data.list.slice(0, 5));

      // Save recent search to localStorage
      const updatedSearches = [query, ...recentSearches].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

      // Dynamic background image based on weather condition
      const weatherCondition = weatherResponse.data.weather[0].main.toLowerCase();
      setBackground(`https://source.unsplash.com/1600x900/?${weatherCondition}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("City not found. Please try again.");
      } else {
        setError("An error occurred. Please try again later.");
      }
      setWeather(null);
      setForecast(null);
    }
  }, [unit, recentSearches, city]); // Include unit, recentSearches, and city as dependencies

  // Fetch weather based on geolocation
  const fetchWeatherByLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Fetch both current weather and forecast based on geolocation
          const weatherResponse = await axios.get(API_URL, {
            params: {
              lat: latitude,
              lon: longitude,
              appid: API_KEY,
              units: unit,
            },
          });
          const forecastResponse = await axios.get(FORECAST_URL, {
            params: {
              lat: latitude,
              lon: longitude,
              appid: API_KEY,
              units: unit,
            },
          });

          setWeather(weatherResponse.data);
          setForecast(forecastResponse.data.list.slice(0, 5));

          // Update the geoCity state to track the location
          setGeoCity(weatherResponse.data.name);
        } catch (err) {
          setError("Failed to fetch weather data.");
        }
      });
    } else {
      setError("Geolocation not supported by this browser.");
    }
  };

  const toggleUnit = () => {
    const newUnit = unit === "metric" ? "imperial" : "metric";
    setUnit(newUnit);
    // Fetch weather again based on the correct city (either search or geolocation)
    fetchWeather(geoCity || city);
  };

  useEffect(() => {
    // Fetch weather when there's a city in the input
    if (city || geoCity) {
      fetchWeather(city || geoCity);
    }
  }, [city, geoCity, unit, fetchWeather]); // Include fetchWeather in the dependency array

  return (
    <div className="container" style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover' }}>
      <h1 className="title">Weather App</h1>

      <div className="search-box">
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button className="search-button" onClick={() => fetchWeather(city)}>Get Weather</button>
        <button className="location-button" onClick={fetchWeatherByLocation}>Use Current Location</button>
      </div>

      <div>
        <button className="unit-toggle" onClick={toggleUnit}>
          {unit === "metric" ? "Switch to Fahrenheit" : "Switch to Celsius"}
        </button>
      </div>

      {recentSearches.length > 0 && (
        <div className="recent-searches">
          <h4>Recent Searches</h4>
          <ul>
            {recentSearches.map((search, index) => (
              <li key={index} onClick={() => setCity(search)}>
                {search}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {weather && (
        <div className="weather-info">
          <h2>{weather.name}, {weather.sys.country}</h2>
          <img
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt={weather.weather[0].description}
          />
          <p className="temperature">
            Temperature: {weather.main.temp}°{unit === "metric" ? "C" : "F"}
          </p>
          <p className="description">Weather: {weather.weather[0].description}</p>
          <p>Humidity: {weather.main.humidity}%</p>
          <p>Wind Speed: {weather.wind.speed} m/s</p>
          <p>Sunrise: {new Date(weather.sys.sunrise * 1000).toLocaleTimeString()}</p>
          <p>Sunset: {new Date(weather.sys.sunset * 1000).toLocaleTimeString()}</p>
        </div>
      )}

      {forecast && (
        <div className="forecast">
          <h3>5-Day Forecast</h3>
          <div className="forecast-container">
            {forecast.map((item, index) => (
              <div key={index} className="forecast-item">
                <p>{new Date(item.dt_txt).toLocaleDateString()}</p>
                <img
                  src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                  alt={item.weather[0].description}
                />
                <p>{item.main.temp}°{unit === "metric" ? "C" : "F"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="footer">
        <p>© {new Date().getFullYear()} Chanmeet Singh Oberoi. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
