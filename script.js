const apiKey="f1bad3ac453eeffb1db34e7fcb423367";

let map=L.map('map').setView([20,78],5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap'
}).addTo(map);

let marker;
let tempChart;

// Map click fetch
map.on("click",function(e){
    fetchWeatherByCoords(e.latlng.lat,e.latlng.lng);
});

// Search city
async function getWeather(){
    const city=document.getElementById("cityInput").value;
    fetchWeather(city);
}

// Fetch weather by city
async function fetchWeather(city){
    const res=await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
    const data=await res.json();
    displayWeather(data);
    fetchForecast(city);
    checkAlerts(data);
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat,lon){
    const res=await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    const data=await res.json();
    displayWeather(data);
    checkAlerts(data);
}

// Display weather info
function displayWeather(data){
    document.getElementById("weatherBox").style.display="block";
    document.getElementById("cityName").innerText=data.name;
    document.getElementById("temp").innerText=data.main.temp+"°C";
    document.getElementById("feels").innerText="Feels like "+data.main.feels_like+"°C";
    document.getElementById("desc").innerText=data.weather[0].description;
    document.getElementById("humidity").innerText=data.main.humidity+"%";
    document.getElementById("wind").innerText=data.wind.speed+" km/h";
    document.getElementById("pressure").innerText=data.main.pressure+" hPa";
    document.getElementById("sunrise").innerText=new Date(data.sys.sunrise*1000).toLocaleTimeString();
    document.getElementById("sunset").innerText=new Date(data.sys.sunset*1000).toLocaleTimeString();
    document.getElementById("icon").src=`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    generateAISuggestion(data);
    updateBackground(data.weather[0].main);

    map.setView([data.coord.lat,data.coord.lon],8);
    if(marker) map.removeLayer(marker);
    marker = L.marker([data.coord.lat,data.coord.lon]).addTo(map);
}

// AI Suggestion
function generateAISuggestion(data){
    let suggestion="";
    if(data.main.temp>30) suggestion="🥵 Wear light cotton clothes.";
    else if(data.main.temp<15) suggestion="🧥 Wear jacket or sweater.";
    else suggestion="🙂 Weather is pleasant.";
    document.getElementById("aiSuggestion").innerText="AI Suggestion: "+suggestion;
}

// Forecast chart
async function fetchForecast(city){
    const res=await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
    const data=await res.json();

    const temps=data.list.slice(0,8).map(i=>i.main.temp);
    const labels=data.list.slice(0,8).map(i=>i.dt_txt.split(" ")[1]);

    if(tempChart) tempChart.destroy();

    tempChart = new Chart(document.getElementById("tempChart"),{
        type:"line",
        data:{
            labels:labels,
            datasets:[{
                label:"Temp °C",
                data:temps,
                borderColor:"#fff",
                backgroundColor:"rgba(255,255,255,0.2)",
                fill:true
            }]
        },
        options:{
            responsive:true,
            plugins:{legend:{labels:{color:"white"}}},
            scales:{x:{ticks:{color:"white"}},y:{ticks:{color:"white"}}}
        }
    });
}

// Alerts
function checkAlerts(data){
    let alert="";
    switch(data.weather[0].main){
        case "Thunderstorm": alert="⚡ Thunderstorm Warning!"; break;
        case "Rain": alert="🌧 Rain Alert!"; break;
        case "Snow": alert="❄ Snow Alert!"; break;
        case "Extreme": alert="🔥 Extreme Temp Alert!"; break;
    }
    if(alert){
        document.getElementById("alerts").style.display="block";
        document.getElementById("alerts").innerText=alert;
    } else {
        document.getElementById("alerts").style.display="none";
    }

    document.getElementById("rain").style.display = data.weather[0].main==="Rain" ? "block" : "none";
}

// Favorites
function saveCity(){
    const city=document.getElementById("cityName").innerText;
    let cities=JSON.parse(localStorage.getItem("cities"))||[];
    if(!cities.includes(city)){
        cities.push(city);
        localStorage.setItem("cities",JSON.stringify(cities));
        loadSavedCities();
    }
}

function loadSavedCities(){
    const select=document.getElementById("savedCities");
    select.innerHTML="";
    let cities=JSON.parse(localStorage.getItem("cities"))||[];
    cities.forEach(city=>{
        select.innerHTML+=`<option>${city}</option>`;
    });
}

function loadSavedCity(){
    const city=document.getElementById("savedCities").value;
    fetchWeather(city);
}

// Geolocation
function getLocationWeather(){
    navigator.geolocation.getCurrentPosition(pos=>{
        fetchWeatherByCoords(pos.coords.latitude,pos.coords.longitude);
    });
}

// Dynamic Background
function updateBackground(weather){
    const body=document.body;
    switch(weather.toLowerCase()){
        case "rain": 
            body.style.background="linear-gradient(135deg,#0a0f14,#121b25,#1c2a38)"; 
            break;
        case "clear": 
            body.style.background="linear-gradient(135deg,#1c1c2c,#2a2a40)"; 
            break;
        case "clouds": 
            body.style.background="linear-gradient(135deg,#10121a,#1e2430)"; 
            break;
        case "snow": 
            body.style.background="linear-gradient(135deg,#1a1a2c,#2c2c44)"; 
            break;
        default: 
            body.style.background="linear-gradient(135deg,#0a0f14,#121b25,#1c2a38)";
    }
}

// Load saved cities on page load
window.onload = () => {
    loadSavedCities();
    let cities = JSON.parse(localStorage.getItem("cities"))||[];
    if(cities.length) fetchWeather(cities[0]);
};
