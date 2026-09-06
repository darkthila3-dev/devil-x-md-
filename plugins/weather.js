const { reply } = require('../lib/reply');
const config = require('../config');

const WEATHER_CODES = {
  0: '☀️ Clear sky', 1: '🌤️ Mostly clear', 2: '⛅ Partly cloudy', 3: '☁️ Overcast',
  45: '🌫️ Fog', 48: '🌫️ Fog', 51: '🌦️ Light drizzle', 61: '🌧️ Light rain',
  63: '🌧️ Rain', 65: '🌧️ Heavy rain', 71: '🌨️ Light snow', 73: '🌨️ Snow',
  80: '🌦️ Rain showers', 95: '⛈️ Thunderstorm',
};

module.exports = {
  command: 'weather',
  description: 'Get current weather for a city',
  handler: async ({ sock, msg, from, args }) => {
    const city = args.join(' ');
    if (!city) {
      await reply(sock, from, `⚠️ Usage: ${config.PREFIX}weather <city>`, msg);
      return;
    }

    try {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then(r => r.json());
      const place = geo?.results?.[0];

      if (!place) {
        await reply(sock, from, `❌ Couldn't find "${city}".`, msg);
        return;
      }

      const forecast = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true`
      ).then(r => r.json());

      const cw = forecast.current_weather;
      const desc = WEATHER_CODES[cw.weathercode] || '🌡️ Unknown';

      const text = `📍 *${place.name}, ${place.country}*\n\n${desc}\n🌡️ Temp: ${cw.temperature}°C\n💨 Wind: ${cw.windspeed} km/h`;
      await reply(sock, from, text, msg);
    } catch (err) {
      console.error('[WEATHER ERROR]', err.message);
      await reply(sock, from, '❌ Could not fetch weather right now.', msg);
    }
  }
};
