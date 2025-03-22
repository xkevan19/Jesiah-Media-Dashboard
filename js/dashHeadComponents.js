/* --- Table of Contents ---
 1. Time Update
    1.1. updateUserTime
 2. DOMContentLoaded Event
    2.1. Geolocation and Weather
        2.1.1. handleWeatherError
    2.2. Button Event Listeners (Live Preview, Docs, Support)
    2.3. Mobile Button Event Listeners
    2.4. Joke Button Event Listeners
    2.5  Joke Modal
    2.6. Emoji Rain Buttons
    2.7  Back to Top Button
 3. Emoji Rain
    3.1. triggerEmojiRain
 4. Keyframes (CSS)
--- END --- */

// 1. Time Update
// 1.1. updateUserTime
function updateUserTime() {
  const now = new Date();
  // Update both desktop and mobile time elements
  const timeFormat = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  // Get all time elements and update them
  const timeElements = document.querySelectorAll(".user-time-element");
  timeElements.forEach((element) => {
    element.textContent = now.toLocaleString(undefined, timeFormat);
  });
}

setInterval(updateUserTime, 1000);
updateUserTime();

document.addEventListener("DOMContentLoaded", () => {
  // 2. DOMContentLoaded Event

  // 2.1. Geolocation and Weather
  if (navigator.geolocation) {
    const locationTimeout = setTimeout(() => {
      handleWeatherError(
        "Location access timed out. Please check your permissions."
      );
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(locationTimeout);
        const { latitude, longitude } = position.coords;

        if (!latitude || !longitude) {
          handleWeatherError("Invalid geolocation data.");
          return;
        }

        try {
          let response = await fetch(
            `/.netlify/functions/weather?latitude=${latitude}&longitude=${longitude}`
          );

          if (!response.ok) {
            const errorData = await response.text();
            console.error("Weather API error:", errorData);
            document.getElementById("weatherInfo").textContent =
              "Error fetching weather data.";
            return;
          }

          const data = await response.json();

          document.getElementById(
            "weatherInfo"
          ).textContent = `${data.name}: ${data.main.temp}°C, ${data.weather[0].description}`;
          document.getElementById("weatherDetails").innerHTML = `
                        <strong>Temperature:</strong> ${data.main.temp}°C <br>
                        <strong>Humidity:</strong> ${data.main.humidity}% <br>
                        <strong>Wind Speed:</strong> ${data.wind.speed} m/s <br>
                        <strong>Pressure:</strong> ${
                          data.main.pressure
                        } hPa <br>
                        <strong>Sunrise:</strong> ${new Date(
                          data.sys.sunrise * 1000
                        ).toLocaleTimeString(undefined, { hour12: true })} <br>
                        <strong>Sunset:</strong> ${new Date(
                          data.sys.sunset * 1000
                        ).toLocaleTimeString(undefined, { hour12: true })}
                    `;
        } catch (error) {
          handleWeatherError("Error fetching weather data: " + error.message);
        }
      },
      (error) => {
        clearTimeout(locationTimeout);
        handleWeatherError("Geolocation error: " + error.message);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 30000,
      }
    );
  } else {
    handleWeatherError("Geolocation is not supported by this browser.");
  }

  // 2.1.1. handleWeatherError
  function handleWeatherError(message) {
    console.error(message);
    document.getElementById("weatherInfo").innerHTML = `
      <span class="text-yellow-400"><i class="fas fa-exclamation-triangle mr-2"></i>Weather unavailable</span>
    `;
    document.getElementById("weatherDetails").innerHTML = `
      <p>Sorry, we couldn't load weather data. Please:</p>
      <ul class="list-disc pl-5 mt-2">
        <li>Check your location permissions</li>
        <li>Ensure you're connected to the internet</li>
        <li>Try refreshing the page</li>
      </ul>
    `;
  }

  // 2.2. Button Event Listeners (Live Preview, Docs, Support)
  document
    .getElementById("livePreviewButton")
    .addEventListener("click", function () {
      window.open("https://jesiadmedia.netlify.app/", "_blank");
    });

  document
    .getElementById("visitDocsButton")
    .addEventListener("click", function () {
      window.open("https://jd-docs.netlify.app", "_blank");
    });

  document
    .getElementById("contactSupportButton")
    .addEventListener("click", function () {
      window.open("https://jd-docs.netlify.app/support.html", "_blank");
    });

  // 2.3. Mobile Button Event Listeners
  document
    .getElementById("mobileLivePreviewButton")
    .addEventListener("click", function () {
      window.open("https://jesiadmedia.netlify.app/", "_blank");
    });

  document
    .getElementById("mobileVisitDocsButton")
    .addEventListener("click", function () {
      window.open("https://jd-docs.netlify.app", "_blank");
    });

  document
    .getElementById("mobileContactSupportButton")
    .addEventListener("click", function () {
      window.open("https://jd-docs.netlify.app/support.html", "_blank");
    });

  // 2.4. Joke Button Event Listeners
  const jokeButtons = document.querySelectorAll(".joke-button");
  jokeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      fetch("https://v2.jokeapi.dev/joke/Dark?type=single")
        .then((response) => response.json())
        .then((data) => {
          const joke = data.joke || "No joke available right now.";
          document.getElementById("modalJoke").textContent = joke;
          document.getElementById("jokeModal").classList.remove("hidden");
        })
        .catch((error) => {
          console.error("Error fetching joke:", error);
        });
    });
  });

  // 2.5. Joke Modal
  document.getElementById("jokeModal").addEventListener("click", function (e) {
    if (e.target === this) {
      document.getElementById("jokeModal").classList.add("hidden");
    }
  });

  // 2.6. Emoji Rain Buttons
  document.getElementById("laughButton").addEventListener("click", function () {
    document.getElementById("jokeModal").classList.add("hidden");
    triggerEmojiRain("😂");
  });

  document.getElementById("sadButton").addEventListener("click", function () {
    document.getElementById("jokeModal").classList.add("hidden");
    triggerEmojiRain("😢");
  });

  // 2.7. Back to Top Button
  const backToTopBtn = document.getElementById("backToTopBtn");
  const mainContent = document.querySelector("main");

  mainContent.addEventListener("scroll", function () {
    if (mainContent.scrollTop > 300) {
      backToTopBtn.classList.remove("opacity-0", "invisible");
      backToTopBtn.classList.add("opacity-100", "visible");
    } else {
      backToTopBtn.classList.remove("opacity-100", "visible");
      backToTopBtn.classList.add("opacity-0", "invisible");
    }
  });

  backToTopBtn.addEventListener("click", function () {
    mainContent.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});

// 3. Emoji Rain

// 3.1. triggerEmojiRain
function triggerEmojiRain(emoji) {
  const emojiCount = 50;
  for (let i = 0; i < emojiCount; i++) {
    let emojiElement = document.createElement("span");
    emojiElement.textContent = emoji;
    emojiElement.style.position = "absolute";
    emojiElement.style.top = `${Math.random() * 100}%`;
    emojiElement.style.left = `${Math.random() * 100}%`;
    emojiElement.style.fontSize = `${Math.random() * 30 + 20}px`;
    emojiElement.style.opacity = "1";
    emojiElement.style.animation = "falling 1s ease-in-out forwards";
    document.getElementById("emojiRain").appendChild(emojiElement);

    setTimeout(() => {
      emojiElement.remove();
    }, 5000);
  }
}

// 4. Keyframes (CSS)
const style = document.createElement("style");
style.innerHTML = `
@keyframes falling {
    0% {
        transform: translateY(0);
        opacity: 1;
    }
    100% {
        transform: translateY(100vh);
        opacity: 0;
    }
}
`;
document.head.appendChild(style);
