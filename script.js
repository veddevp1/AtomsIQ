const $=id=>document.getElementById(id);
const weatherMap={
  0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
  45:["Foggy","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Heavy drizzle","🌧️"],
  56:["Freezing drizzle","🌧️"],57:["Freezing drizzle","🌧️"],61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
  66:["Freezing rain","🌧️"],67:["Freezing rain","🌧️"],71:["Light snow","🌨️"],73:["Snow","🌨️"],75:["Heavy snow","❄️"],
  77:["Snow grains","🌨️"],80:["Rain showers","🌦️"],81:["Rain showers","🌧️"],82:["Heavy showers","⛈️"],85:["Snow showers","🌨️"],86:["Heavy snow showers","❄️"],
  95:["Thunderstorm","⛈️"],96:["Thunderstorm & hail","⛈️"],99:["Thunderstorm & hail","⛈️"]
};
function info(code){return weatherMap[code]||["Weather conditions","🌤️"]}
function timeFmt(s){return s?new Date(s).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}
function dayFmt(s,opts={weekday:"short"}){return new Date(s+"T12:00:00").toLocaleDateString([] ,opts)}
function uvText(v){return v<3?"Low":v<6?"Moderate":v<8?"High":v<11?"Very high":"Extreme"}
function setStatus(t,err=false){$("status").textContent=t;$("status").className="status"+(err?" error":"")}
async function loadWeather(lat,lon,name){
  setStatus("Updating forecast…");$("app").classList.add("loading");
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&forecast_days=7&timezone=auto`;
    const r=await fetch(url);if(!r.ok)throw new Error("Weather service is unavailable. Please try again.");const d=await r.json();
    const c=d.current,day=d.daily,hr=d.hourly,idx=day.time.indexOf(c.time.slice(0,10)),w=info(c.weather_code);
    $("place").textContent=name;$("date").textContent=new Date().toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"});
    $("mainIcon").textContent=w[1];$("temperature").textContent=Math.round(c.temperature_2m);$("condition").textContent=w[0];$("feels").textContent=Math.round(c.apparent_temperature);
    $("high").textContent=Math.round(day.temperature_2m_max[idx]);$("low").textContent=Math.round(day.temperature_2m_min[idx]);
    $("humidity").textContent=c.relative_humidity_2m+"%";$("wind").textContent=Math.round(c.wind_speed_10m)+" km/h";$("windDir").textContent="Direction "+Math.round(c.wind_direction_10m)+"°";
    $("cloud").textContent=c.cloud_cover+"%";$("uv").textContent=day.uv_index_max[idx].toFixed(1);$("uvNote").textContent=uvText(day.uv_index_max[idx])+" UV today";
    $("sunrise").textContent=timeFmt(day.sunrise[idx]);$("sunset").textContent=timeFmt(day.sunset[idx]);
    $("description").textContent=`${w[0]} today, with temperatures between ${Math.round(day.temperature_2m_min[idx])}° and ${Math.round(day.temperature_2m_max[idx])}°C. ${day.precipitation_probability_max[idx]}% chance of precipitation.`;
    let start=hr.time.findIndex(t=>t>=c.time);if(start<0)start=0;
    $("hourly").innerHTML=Array.from({length:8},(_,i)=>{let j=start+i;if(j>=hr.time.length)return "";let wi=info(hr.weather_code[j]);return `<article class="card hour"><div class="hour-time">${i===0?"Now":timeFmt(hr.time[j])}</div><div class="hour-icon">${wi[1]}</div><div class="hour-temp">${Math.round(hr.temperature_2m[j])}°</div></article>`}).join("");
    $("daily").innerHTML=day.time.map((t,i)=>{let wi=info(day.weather_code[i]);return `<div class="day"><div class="day-name">${i===0?"Today":dayFmt(t)}</div><div class="day-cond"><span>${wi[1]}</span>${wi[0]}</div><div class="range"><span>${Math.round(day.temperature_2m_min[i])}°</span><div class="bar"></div><strong>${Math.round(day.temperature_2m_max[i])}°</strong></div><div class="day-rain">☂ ${day.precipitation_probability_max[i]}%</div></div>`}).join("");
    setStatus("Live forecast updated · "+new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}));
  }catch(e){setStatus(e.message,true)}finally{$("app").classList.remove("loading")}
}
async function searchCity(q){
  if(!q.trim())return;setStatus("Finding "+q+"…");
  try{const r=await fetch("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(q)+"&count=1&language=en&format=json");const d=await r.json();if(!d.results?.length)throw new Error("City not found. Try another spelling.");const p=d.results[0];await loadWeather(p.latitude,p.longitude,[p.name,p.admin1,p.country].filter(Boolean).join(", "));}
  catch(e){setStatus(e.message,true)}
}
$("searchForm").addEventListener("submit",e=>{e.preventDefault();searchCity($("cityInput").value)});
$("locBtn").addEventListener("click",()=>{if(!navigator.geolocation){setStatus("Location is not supported by this browser.",true);return}setStatus("Requesting your location…");navigator.geolocation.getCurrentPosition(async p=>{let name="Your location";try{let r=await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&language=en&format=json`);let d=await r.json();if(d.results?.[0])name=[d.results[0].name,d.results[0].admin1].filter(Boolean).join(", ")}catch{}loadWeather(p.coords.latitude,p.coords.longitude,name)},()=>setStatus("Location access was denied. Search for a city instead.",true),{timeout:10000})});
searchCity("Patna");
