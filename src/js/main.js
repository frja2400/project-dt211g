"use strict";

//En händelselyssnare som körs när hela HTML har laddats.
document.addEventListener('DOMContentLoaded', () => {

    //Hämtar sökknapp och lägger till en händelselyssnare som anropar funktionen fetchWeatherAndMap vid klick.
    document.getElementById('searchButton').addEventListener('click', fetchWeatherAndMap);

    //Anropar funktionen initializeMap för att visa kartan när HTML har laddats.
    initializeMap();

    //Händelselyssnare för input-fält som kör fetchWeatherAndMap vid tryck av enter.
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                fetchWeatherAndMap();
            }
        });
    } else {
        console.error('Element med ID locationInput hittades inte.');
    }
});

//Variabler för karta och markör.
let map;
let marker;

/**
 * Initialiserar kartan med Leaflet, sätter koordinater och zoomnivå.
 */
function initializeMap() {
    map = L.map('map').setView([60.0, 18.0], 5);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

/**
 * Hämtar väderdata och uppdaterar kartan baserat på den angivna platsen.
 */
function fetchWeatherAndMap() {
    const location = document.getElementById('locationInput').value; //Hämtar sökplats

    //Anropar två funktioner med den angivna platsen som argument.
    fetchWeather(location);
    searchLocation(location);
}

/**
 * Hämtar väderdata baserat på den angivna platsen.
 * @param {string} location - Platsen att hämta väderdata för.
 */
function fetchWeather(location) {

    //Lagra URL som hämtar lon och lat från Nominatim baserat på angiven plats.
    const geocoderUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;

    //Gör ett AJAX-anrop
    fetch(geocoderUrl)
        .then(response => response.json())
        .then(data => {

            //Kontrollera om det finns data och hämta lat och lon från svaret.
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;

                //Lagra URL som hämtar väderdata från Open Meteo API.
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

                //AJAX-anrop till Open Meteo.
                fetch(weatherUrl)
                    .then(response => response.json())
                    .then(weatherData => {
                        const weatherContainer = document.getElementById('weatherContainer');
                        //Hämta väderkod
                        const weatherCode = weatherData.current_weather.weathercode;
                        //Anropa funktion som översätter väderkod till beskrivande text.
                        const weatherDescription = getWeatherDescription(weatherCode);
                        //Anropa funktion som översätter väderkod till ikoner.
                        const weatherIconClass = getWeatherIconClass(weatherCode);

                        //Manipulera DOM och uppdatera med plats, temperatur, väder och ikon.
                        weatherContainer.innerHTML = `
                            <p><strong>Plats:</strong> ${location}</p>
                            <p><strong>Temperatur:</strong> ${weatherData.current_weather.temperature} °C</p>
                            <p><strong>Väder:</strong> ${weatherDescription}</p>
                            <em class="wi ${weatherIconClass} weather-icon"></em>
                        `;
                    })
                    .catch(error => console.error('Fel:', error));
            } else {
                console.error('Plats hittades inte.');
            }
        })
        .catch(error => console.error('Fel:', error));
}

/**
 * Översätter väderkod till beskrivande text.
 * @param {number} code - Väderkoden att översätta.
 * @returns {string} Den beskrivande texten för väderkoden.
 */
function getWeatherDescription(code) {
    //Skapar ett objekt som mappar väderkoder till text.
    const descriptions = {
        0: "Klart",
        1: "Mest klart",
        2: "Delvis molnigt",
        3: "Molnigt",
        45: "Dimma",
        48: "Frostdimma",
        51: "Lätt duggregn",
        53: "Duggregn",
        55: "Kraftigt duggregn",
        56: "Lätt underkylt duggregn",
        57: "Underkylt duggregn",
        61: "Lätt regn",
        63: "Regn",
        65: "Kraftigt regn",
        66: "Lätt underkylt regn",
        67: "Underkylt regn",
        71: "Lätt snöfall",
        73: "Snöfall",
        75: "Kraftigt snöfall",
        77: "Snöbyar",
        80: "Lätt regnskur",
        81: "Regnskur",
        82: "Kraftig regnskur",
        85: "Lätt snöby",
        86: "Snöby"
    };

    return descriptions[code] || "Okänt väder";
}

/**
 * Översätter väderkod till ikonklasser.
 * @param {number} code - Väderkoden att översätta.
 * @returns {string} CSS-klassen för väderikonen.
 */
function getWeatherIconClass(code) {
    //Objekt som mappar väderkoder till CSS-klasser för väderikoner.
    const iconClasses = {
        0: "wi-day-sunny spin",
        1: "wi-day-sunny-overcast pulse",
        2: "wi-day-cloudy pulse",
        3: "wi-cloudy slowMove",
        45: "wi-fog slowMove",
        48: "wi-fog slowMove",
        51: "wi-sprinkle shake",
        53: "wi-sprinkle shake",
        55: "wi-sprinkle shake",
        56: "wi-sprinkle shake",
        57: "wi-sprinkle shake",
        61: "wi-rain bounce",
        63: "wi-rain bounce",
        65: "wi-rain bounce",
        66: "wi-rain bounce",
        67: "wi-rain bounce",
        71: "wi-snow shake",
        73: "wi-snow shake",
        75: "wi-snow shake",
        77: "wi-snow shake",
        80: "wi-showers bounce",
        81: "wi-showers bounce",
        82: "wi-showers bounce",
        85: "wi-snow shake",
        86: "wi-snow shake"
    };

    return iconClasses[code] || "wi-na";
}

/**
 * Söker efter en plats och uppdaterar kartan baserat på sökresultatet.
 * @param {string} location - Platsen att söka efter.
 */
function searchLocation(location) {
    const geocoderUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;

    fetch(geocoderUrl)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                map.setView([lat, lon], 14);

                //Ta bort markör om det finns på kartan.
                if (marker) {
                    map.removeLayer(marker);
                }

                //Skapar ny markör med en popup som visar koordinater och namn.
                marker = L.marker([lat, lon]).addTo(map)
                    .bindPopup(`<b>${location}</b><br>Lat: ${lat}, Lon: ${lon}`)
                    .openPopup();
            } else {
                alert('Plats inte hittad');
            }
        })
        .catch(error => console.error('Fel:', error));
}
