const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { latitude, longitude } = event.queryStringParameters;

  if (!latitude || !longitude) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Latitude and longitude are required." }),
    };
  }

  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      console.error("Missing OpenWeather API key in environment variables.");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing API key" }),
      };
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

    console.log("Fetching weather data from:", weatherUrl);

    const response = await fetch(weatherUrl);
    const responseText = await response.text();

    console.log("Raw OpenWeather API Response:", responseText);

    if (response.status !== 200) {
      console.error("Error from OpenWeather API:", responseText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `API Error: ${responseText}` }),
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error(
        "Failed to parse JSON:",
        jsonError,
        "Response:",
        responseText
      );
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Invalid response from OpenWeather API",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch weather data" }),
    };
  }
};
