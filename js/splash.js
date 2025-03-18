/* --- Table of Contents ---
 1. DOMContentLoaded Event
    1.1. Element Caching
    1.2. Particles.js Initialization
    1.3. Loading Dots Animation
    1.4. Pulse Animations
    1.5. Logo Animation Timeline
    1.6. Progress Bar Animation
    1.7. Loading Text Animation
    1.8. finishLoading Function
    1.9. Fallback Timeout
--- END --- */

document.addEventListener("DOMContentLoaded", function () {
  // 1. DOMContentLoaded Event

  // 1.1. Element Caching
  const splashContainer = document.getElementById("splash-container");
  const progressBar = document.getElementById("progress-bar");
  const loadingDots = document.getElementById("loading-dots");
  const logoImg = document.getElementById("logo-img");

  // 1.2. Particles.js Initialization
  particlesJS("particles-js", {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: "#7077FF" },
      shape: { type: "circle" },
      opacity: { value: 0.5, random: true },
      size: { value: 3, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#0037FF",
        opacity: 0.2,
        width: 1,
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: true,
        straight: false,
        out_mode: "out",
        bounce: false,
      },
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "repulse" },
        onclick: { enable: true, mode: "push" },
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push: { particles_nb: 4 },
      },
    },
  });

  // 1.3. Loading Dots Animation
  let dotsCount = 0;
  const animateDots = setInterval(() => {
    dotsCount = (dotsCount + 1) % 4;
    loadingDots.textContent = ".".repeat(dotsCount);
  }, 400);

  // 1.4. Pulse Animations
  const tl = gsap.timeline();
  gsap.set("#pulse1, #pulse2, #pulse3", { width: 250, height: 250 });
  const createPulseAnimation = (element, delay) => {
    gsap.to(element, {
      opacity: 0.7,
      scale: 1,
      duration: 2,
      delay: delay,
      ease: "power1.out",
      onComplete: () => {
        gsap.to(element, {
          opacity: 0,
          scale: 1.4,
          duration: 1.5,
          ease: "power1.out",
          onComplete: () => {
            gsap.set(element, { scale: 0 });
            createPulseAnimation(element, 0.2);
          },
        });
      },
    });
  };

  createPulseAnimation("#pulse1", 0.5);
  createPulseAnimation("#pulse2", 1.5);
  createPulseAnimation("#pulse3", 2.5);

  // 1.5. Logo Animation Timeline
  tl.to(".logo-image", {
    opacity: 1,
    scale: 1,
    duration: 1.2,
    ease: "elastic.out(1, 0.5)",
  })
    .to(
      ".logo-subtitle",
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=0.4"
    )
    .to(
      ".logo-outline, .logo-outline-2, .logo-outline-3",
      {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 20,
        ease: "none",
        repeat: -1,
      },
      0
    );

  // 1.6. Progress Bar Animation
  gsap.to("#progress-bar", {
    width: "100%",
    duration: 6,
    ease: "power1.inOut",
    onComplete: finishLoading,
  });

  // 1.7. Loading Text Animation
  const loadingTexts = [
    "Initializing",
    "Loading assets",
    "Preparing media",
    "Almost there",
  ];

  let textIndex = 0;
  const changeLoadingText = setInterval(() => {
    textIndex = (textIndex + 1) % loadingTexts.length;
    gsap.to(".loading-text", {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        const loadingTextEl = document.querySelector(".loading-text");
        loadingTextEl.innerHTML =
          loadingTexts[textIndex] +
          '<span class="dots" id="loading-dots">.</span>';
        const newLoadingDots = document.getElementById("loading-dots");

        let currentDotsCount = 0;
        const updateDots = () => {
          if (newLoadingDots) {
            currentDotsCount = (currentDotsCount + 1) % 4;
            newLoadingDots.textContent = ".".repeat(currentDotsCount);
          }
        };

        updateDots();

        gsap.to(".loading-text", { opacity: 1, duration: 0.3 });
      },
    });
  }, 2000);

  // 1.8. finishLoading Function
  function finishLoading() {
    clearInterval(animateDots);
    clearInterval(changeLoadingText);

    gsap.to(".loading-text", {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        document.querySelector(".loading-text").textContent = "Ready";
        gsap.to(".loading-text", { opacity: 1, duration: 0.3 });
      },
    });

    setTimeout(() => {
      splashContainer.classList.add("fade-out");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
    }, 1000);
  }

  // 1.9. Fallback Timeout
  setTimeout(() => {
    if (document.getElementById("splash-container")) {
      window.location.href = "login.html";
    }
  }, 8000);
});
