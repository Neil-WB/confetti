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

// First, inject the confetti library
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
document.head.appendChild(script);

// Wait for script to load
script.onload = function() {
  console.log("[CaptchaConfetti] Confetti library loaded");
  init();
};

script.onerror = function() {
  console.error("[CaptchaConfetti] Failed to load confetti library");
};

function init() {
  // Add test function to window
  document.addEventListener('DOMContentLoaded', () => {
    window.testCaptchaConfetti = function() {
      console.log("[CaptchaConfetti] Testing confetti");
      const confettiScript = `
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      `;
      
      // Run the confetti script in the page context
      const scriptEl = document.createElement('script');
      scriptEl.textContent = confettiScript;
      document.body.appendChild(scriptEl);
      scriptEl.remove();
    };
    
    console.log("[CaptchaConfetti] Extension ready. Type window.testCaptchaConfetti() to test");
  });
  
  // Simple captcha detection 
  watchForCaptchas();
}

function triggerConfetti() {
  console.log("[CaptchaConfetti] 🎉 Triggering confetti!");
  const confettiScript = `
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  `;
  
  // Run the confetti script in the page context
  const scriptEl = document.createElement('script');
  scriptEl.textContent = confettiScript;
  document.body.appendChild(scriptEl);
  scriptEl.remove();
}

function watchForCaptchas() {
  // Watch for reCAPTCHA
  document.addEventListener('click', function(event) {
    // Check if clicked element might be a captcha checkbox or close to one
    const clickedEl = event.target;
    
    // Look for recaptcha nearby
    setTimeout(() => {
      const captchaBox = document.querySelector('.recaptcha-checkbox[aria-checked="true"]');
      if (captchaBox) {
        console.log("[CaptchaConfetti] Captcha completed detected via click!");
        triggerConfetti();
      }
    }, 1000); // Short delay to allow captcha to update
  });
  
  // Set up a mutation observer for the document
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'aria-checked' && 
          mutation.target.getAttribute('aria-checked') === 'true' &&
          (mutation.target.classList.contains('recaptcha-checkbox') || 
           mutation.target.classList.contains('checkbox'))) {
        console.log("[CaptchaConfetti] Captcha checkbox checked detected!");
        triggerConfetti();
      }
    });
  });
  
  // Periodically look for captcha elements to observe
  function findAndObserveCaptchas() {
    const captchaElements = document.querySelectorAll('.recaptcha-checkbox, .checkbox[aria-checked]');
    captchaElements.forEach(el => {
      observer.observe(el, { attributes: true });
    });
    
    // Also look for captcha iframes and forms
    const captchaIframes = document.querySelectorAll('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="cloudflare"]');
    if (captchaIframes.length > 0) {
      console.log("[CaptchaConfetti] Captcha iframes found:", captchaIframes.length);
    }
  }
  
  // Run immediately
  findAndObserveCaptchas();
  
  // And periodically
  setInterval(findAndObserveCaptchas, 2000);
  
  // Also watch for form submissions
  document.addEventListener('submit', function(event) {
    // If a form is being submitted and contains a captcha element, trigger confetti
    const form = event.target;
    if (form.querySelector('[class*="captcha"]') || 
        document.querySelector('iframe[src*="captcha"]')) {
      console.log("[CaptchaConfetti] Form with captcha submitted!");
      triggerConfetti();
    }
  });
}
