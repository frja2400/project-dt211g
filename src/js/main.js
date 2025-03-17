"use strict";

//En händelselyssnare som körs när hela HTML har laddats. 
document.addEventListener('DOMContentLoaded', () => {

    //Hämtar sökknapp och adderar händelselyssnare som anropar funktionen fetchWeatherAndMap vid klick.
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
        console.error('Element with ID locationInput not found.');
    }
});

//Variabler för karta och markör.
let map;
let marker;


//Funktion för att hämta karta med leaflet. Sätter koordinatorer och zoomnivå. 
function initializeMap() {
    map = L.map('map').setView([60.0, 18.0], 5);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

//Funktion för att hämta väder och uppdatera karta baserat på angiven plats. 
function fetchWeatherAndMap() {
    const location = document.getElementById('locationInput').value; //Hämtar sökplats
    
    //Anropar två funktioner med den angivna platsen som argument. 
    fetchWeather(location);
    searchLocation(location);
}

//Funktion som hämtar väder baserat på den angivna platsen.
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

                        //Manipluera DOM och uppdatera med plats, temperatur, väder och ikon.
                        weatherContainer.innerHTML = `
                            <p><strong>Plats:</strong> ${location}</p>
                            <p><strong>Temperatur:</strong> ${weatherData.current_weather.temperature} °C</p>
                            <p><strong>Väder:</strong> ${weatherDescription}</p>
                            <em class="wi ${weatherIconClass} weather-icon"></em>
                        `;
                    })
                    .catch(error => console.error('Error:', error));
            } else {
                console.error('Location not found.');
            }
        })
        .catch(error => console.error('Error:', error));
}

//Funktion som översätter väderkod till beskrivande text. 
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

//Funktion som översätter väderkod till ikoner
function getWeatherIconClass(code) {
    //Objekt som mappar väderkoder till CSS-klasser för väderikoner. 
    const iconClasses = {
        0: "wi-day-sunny",
        1: "wi-day-sunny-overcast",
        2: "wi-day-cloudy",
        3: "wi-cloudy",
        45: "wi-fog",
        48: "wi-fog",
        51: "wi-sprinkle",
        53: "wi-sprinkle",
        55: "wi-sprinkle",
        56: "wi-sprinkle",
        57: "wi-sprinkle",
        61: "wi-rain",
        63: "wi-rain",
        65: "wi-rain",
        66: "wi-rain",
        67: "wi-rain",
        71: "wi-snow",
        73: "wi-snow",
        75: "wi-snow",
        77: "wi-snow",
        80: "wi-showers",
        81: "wi-showers",
        82: "wi-showers",
        85: "wi-snow",
        86: "wi-snow"
    };

    return iconClasses[code] || "wi-na";
}

//Sökfunktion som uppdaterar kartan baserat på sökt plats. 
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
        .catch(error => console.error('Error:', error));
}
