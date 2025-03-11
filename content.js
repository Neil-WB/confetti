// manifest.json
{
  "manifest_version": 3,
  "name": "Captcha Confetti",
  "version": "1.0",
  "description": "Celebrates captcha completion with confetti",
  "permissions": ["activeTab"],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["confetti.js", "content.js"]
    }
  ]
}

// Simple version of content.js for Captcha Confetti
console.log("[CaptchaConfetti] Extension loaded");

// Inject a script tag with our code directly into the page
function injectScript(code) {
  const script = document.createElement('script');
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// Add the confetti library and our functions to the page
injectScript(`
  // First load the confetti library
  (function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
    script.onload = function() {
      console.log("[CaptchaConfetti] Confetti library loaded");
      
      // Add test function to window
      window.testCaptchaConfetti = function() {
        console.log("[CaptchaConfetti] Testing confetti");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      };
      
      console.log("[CaptchaConfetti] Test function ready: window.testCaptchaConfetti()");
    };
    document.head.appendChild(script);
  })();
`);

// Listen for messages from the page
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CAPTCHA_COMPLETED') {
    console.log("[CaptchaConfetti] Received captcha completion message");
    triggerConfetti();
  }
});

// Function to trigger confetti
function triggerConfetti() {
  console.log("[CaptchaConfetti] 🎉 Triggering confetti!");
  injectScript(`
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      console.error("[CaptchaConfetti] Confetti function not available");
    }
  `);
}

// Set up captcha detection
function setupCaptchaDetection() {
  injectScript(`
    // Function to watch for captcha completion
    function watchForCaptchas() {
      // Listen for clicks
      document.addEventListener('click', function(event) {
        // Check after a short delay to give captcha time to update
        setTimeout(() => {
          const captchaBox = document.querySelector('.recaptcha-checkbox[aria-checked="true"]');
          if (captchaBox) {
            console.log("[CaptchaConfetti] Captcha completed detected!");
            window.postMessage({ type: 'CAPTCHA_COMPLETED' }, '*');
          }
        }, 1000);
      });
      
      // Watch for form submissions
      document.addEventListener('submit', function(event) {
        if (document.querySelector('[class*="captcha"]') || 
            document.querySelector('iframe[src*="captcha"]')) {
          console.log("[CaptchaConfetti] Form with captcha submitted!");
          window.postMessage({ type: 'CAPTCHA_COMPLETED' }, '*');
        }
      });
      
      // Watch for attribute changes on captcha elements
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'aria-checked' && 
              mutation.target.getAttribute('aria-checked') === 'true') {
            if (mutation.target.classList.contains('recaptcha-checkbox') || 
               mutation.target.classList.contains('checkbox')) {
              console.log("[CaptchaConfetti] Captcha checkbox checked!");
              window.postMessage({ type: 'CAPTCHA_COMPLETED' }, '*');
            }
          }
        });
      });
      
      // Periodically look for captcha elements
      function findCaptchas() {
        const captchaElements = document.querySelectorAll('.recaptcha-checkbox, .checkbox[aria-checked]');
        captchaElements.forEach(el => {
          observer.observe(el, { attributes: true });
        });
      }
      
      // Run immediately and periodically
      findCaptchas();
      setInterval(findCaptchas, 2000);
    }
    
    // Start watching
    watchForCaptchas();
    console.log("[CaptchaConfetti] Captcha detection active");
  `);
}

// Start detection after a short delay to ensure the page is ready
setTimeout(setupCaptchaDetection, 1000);
