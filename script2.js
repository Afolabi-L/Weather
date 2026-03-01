const searchInput = document.querySelector(".search-input");
const locationButton = document.querySelector(".location-button");
const currentWeatherDiv = document.querySelector(".current-weather");
const hourlyWeatherDiv = document.querySelector(".hourly-weather .weather-list");

// Open-Meteo weather codes mapped to your existing icons
const getWeatherIcon = (code) => {
    if (code === 0) return "clear";
    if ([1, 2, 3].includes(code)) return "clouds";
    if ([45, 48].includes(code)) return "mist";
    if ([51, 53, 55, 56, 57, 61, 63, 80, 81].includes(code)) return "rain";
    if ([65, 67, 82].includes(code)) return "moderate_heavy_rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
    if ([95].includes(code)) return "thunder";
    if ([96, 99].includes(code)) return "thunder_rain";
    return "clouds"; // default fallback
};

// Weather description from Open-Meteo code
const getWeatherDescription = (code) => {
    if (code === 0) return "Clear Sky";
    if (code === 1) return "Mainly Clear";
    if (code === 2) return "Partly Cloudy";
    if (code === 3) return "Overcast";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55].includes(code)) return "Drizzle";
    if ([56, 57].includes(code)) return "Freezing Drizzle";
    if ([61, 63].includes(code)) return "Rain";
    if ([65, 67].includes(code)) return "Heavy Rain";
    if ([71, 73, 75].includes(code)) return "Snow";
    if (code === 77) return "Snow Grains";
    if ([80, 81].includes(code)) return "Rain Showers";
    if (code === 82) return "Heavy Rain Showers";
    if ([85, 86].includes(code)) return "Snow Showers";
    if (code === 95) return "Thunderstorm";
    if ([96, 99].includes(code)) return "Thunderstorm with Hail";
    return "Unknown";
};

// Display hourly forecast for the next 24 hours
const displayHourlyForecast = (hourlyTimes, hourlyTemps, hourlyCodes) => {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const items = hourlyTimes
        .map((time, i) => ({ time, temp: hourlyTemps[i], code: hourlyCodes[i] }))
        .filter(({ time }) => {
            const t = new Date(time);
            return t >= now && t <= next24Hours;
        });

    hourlyWeatherDiv.innerHTML = items.map(({ time, temp, code }) => {
        const timeLabel = time.split("T")[1].substring(0, 5);
        const icon = getWeatherIcon(code);
        return `<li class="weather-item">
                    <p class="time">${timeLabel}</p>
                    <img src="icons/${icon}.svg" class="weather-icon">
                    <p class="temperature">${Math.floor(temp)}&deg;</p>
                </li>`;
    }).join("");
};

// Fetch weather using coordinates
const getWeatherDetails = async (latitude, longitude, locationName) => {
    document.body.classList.remove("show-no-results");

    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&hourly=temperature_2m,weathercode&temperature_unit=celsius&forecast_days=2`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Current weather
        const temperature = Math.floor(data.current.temperature_2m);
        const code = data.current.weathercode;
        const description = getWeatherDescription(code);
        const icon = getWeatherIcon(code);

        currentWeatherDiv.querySelector(".weather-icon").src = `icons/${icon}.svg`;
        currentWeatherDiv.querySelector(".temperature").innerHTML = `${temperature} <span>&deg;C</span>`;
        currentWeatherDiv.querySelector(".description").innerText = description;

        searchInput.value = locationName;

        // Hourly forecast
        displayHourlyForecast(
            data.hourly.time,
            data.hourly.temperature_2m,
            data.hourly.weathercode
        );

    } catch (error) {
        document.body.classList.add("show-no-results");
    }
};

// Convert city name to coordinates using Open-Meteo Geocoding API
const setupWeatherRequest = async (cityName) => {
    document.body.classList.remove("show-no-results");

    try {
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            document.body.classList.add("show-no-results");
            return;
        }

        const { latitude, longitude, name } = geoData.results[0];
        getWeatherDetails(latitude, longitude, name);

    } catch (error) {
        document.body.classList.add("show-no-results");
    }
};

// Search on Enter key
searchInput.addEventListener("keyup", (e) => {
    const cityName = searchInput.value.trim();
    if (e.key === "Enter" && cityName) {
        setupWeatherRequest(cityName);
    }
});

// Location button
locationButton.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherDetails(latitude, longitude, "Your Location");
        },
        () => {
            alert("Location access denied. Please enable permissions to use this feature.");
        }
    );
});

// Default city on load
setupWeatherRequest("Lagos");
