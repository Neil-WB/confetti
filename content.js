// content.js
// Extension to detect captcha completion and trigger confetti
// Version: 1.0.0

// Debug mode flag - set to true to see verbose logging
const DEBUG = true;

// Helper function for logging
function debugLog(...args) {
  if (DEBUG) {
    console.log("%c[Captcha Confetti]", "color: #3498db; font-weight: bold", ...args);
  }
}

// Error logging
function errorLog(error) {
  console.error("%c[Captcha Confetti Error]", "color: #e74c3c; font-weight: bold", error);
}

// Initialization message
debugLog("Extension loaded and running");

// Try to access the confetti function from the library
try {
  // Check if confetti library is loaded
  if (typeof confetti !== 'function') {
    throw new Error("Confetti library not loaded properly");
  }
  debugLog("Confetti library loaded successfully");
} catch (error) {
  errorLog("Confetti library error:", error);
}

// Function to trigger confetti with error handling
function triggerConfetti() {
  try {
    debugLog("🎉 Triggering confetti celebration!");
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    debugLog("Confetti triggered successfully");
  } catch (error) {
    errorLog("Failed to trigger confetti:", error);
  }
}

// Keep track of observed elements to prevent duplicate observations
const observedElements = new Set();

// The MutationObserver for captcha state changes
const observer = new MutationObserver((mutations) => {
  try {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'aria-checked') {
        const captchaCheckbox = mutation.target;
        const isChecked = captchaCheckbox.getAttribute('aria-checked') === 'true';
        
        debugLog(`Captcha state changed: ${isChecked ? 'COMPLETED' : 'not completed yet'}`);
        
        if (isChecked) {
          triggerConfetti();
        }
      }
    });
  } catch (error) {
    errorLog("Error in mutation observer:", error);
  }
});

// For reCAPTCHA v2
function watchRecaptcha() {
  try {
    const recaptchaCheckboxes = document.querySelectorAll('.recaptcha-checkbox');
    if (recaptchaCheckboxes.length > 0) {
      debugLog(`Found ${recaptchaCheckboxes.length} reCAPTCHA elements`);
    }
    
    recaptchaCheckboxes.forEach(checkbox => {
      // Skip if already observing this element
      if (observedElements.has(checkbox)) return;
      
      observer.observe(checkbox, { attributes: true });
      observedElements.add(checkbox);
      debugLog("Now observing reCAPTCHA checkbox:", checkbox);
    });
  } catch (error) {
    errorLog("Error watching for reCAPTCHA:", error);
  }
}

// For hCaptcha
function watchHcaptcha() {
  try {
    // Try different potential hCaptcha selectors
    const selectors = [
      '.checkbox[aria-checked]', // Standard
      '.hcaptcha-checkbox', // Direct class
      '[data-hcaptcha-widget-id] .checkbox', // Widget ID based
      '#checkbox' // Basic ID that might be used
    ];
    
    let found = false;
    
    selectors.forEach(selector => {
      const hcaptchaCheckboxes = document.querySelectorAll(selector);
      if (hcaptchaCheckboxes.length > 0) {
        debugLog(`Found ${hcaptchaCheckboxes.length} hCaptcha elements with selector: ${selector}`);
        found = true;
        
        hcaptchaCheckboxes.forEach(checkbox => {
          // Skip if already observing this element
          if (observedElements.has(checkbox)) return;
          
          observer.observe(checkbox, { attributes: true });
          observedElements.add(checkbox);
          debugLog("Now observing hCaptcha checkbox:", checkbox);
        });
      }
    });
    
    if (!found && DEBUG) {
      debugLog("No hCaptcha elements found on this page");
    }
  } catch (error) {
    errorLog("Error watching for hCaptcha:", error);
  }
}

// Cloudflare Turnstile detection
function watchTurnstile() {
  try {
    const turnstileFrames = document.querySelectorAll('iframe[src*="challenges.cloudflare.com"]');
    if (turnstileFrames.length > 0) {
      debugLog(`Found ${turnstileFrames.length} Cloudflare Turnstile frames`);
      // We can't directly access iframe contents due to same-origin policy
      // But we can watch for the success callback
      
      // Check for turnstile callback functions
      if (window.turnstileCallback) {
        const originalCallback = window.turnstileCallback;
        window.turnstileCallback = function(token) {
          debugLog("Turnstile completed!", token);
          triggerConfetti();
          return originalCallback(token);
        };
        debugLog("Intercepted Turnstile callback");
      }
    }
  } catch (error) {
    errorLog("Error watching for Turnstile:", error);
  }
}

// For reCAPTCHA v3, which is invisible, we'd need to hook into network requests
// to see successful completion. That requires more permissions and complexity.

// Check for general forms with submit buttons that might have captchas
function watchFormSubmissions() {
  try {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (observedElements.has(form)) return;
      
      form.addEventListener('submit', (event) => {
        // This is a bit of a hack - we look for captcha elements and if they exist
        // and the form is submitting, we assume the captcha passed
        const hasCaptcha = 
          form.querySelector('.g-recaptcha') || 
          form.querySelector('.h-captcha') ||
          document.querySelector('iframe[src*="recaptcha"]') ||
          document.querySelector('iframe[src*="hcaptcha"]') ||
          document.querySelector('iframe[src*="challenges.cloudflare"]');
        
        if (hasCaptcha) {
          debugLog("Form with captcha being submitted - triggering confetti!");
          triggerConfetti();
        }
      });
      
      observedElements.add(form);
      debugLog("Watching form for submission:", form);
    });
  } catch (error) {
    errorLog("Error watching form submissions:", error);
  }
}

// Periodically check for captchas that may have been added to the page
function checkForCaptchas() {
  debugLog("Checking for captchas on the page...");
  watchRecaptcha();
  watchHcaptcha();
  watchTurnstile();
  watchFormSubmissions();
}

// Test function to manually trigger confetti (for debugging)
window.testCaptchaConfetti = function() {
  debugLog("Manual test triggered");
  triggerConfetti();
};

// Add a debug message in the console explaining how to test
if (DEBUG) {
  console.log(
    "%c[Captcha Confetti Extension]",
    "color: #3498db; font-weight: bold; font-size: 14px",
    "\n",
    "Extension is active and looking for captchas.",
    "\n",
    "To test confetti manually, run: window.testCaptchaConfetti()",
    "\n"
  );
}

// Run initial check
try {
  debugLog("Running initial captcha check");
  checkForCaptchas();
} catch (error) {
  errorLog("Error during initial captcha check:", error);
}

// Set up periodic checks for dynamically loaded captchas
const checkInterval = setInterval(() => {
  try {
    checkForCaptchas();
  } catch (error) {
    errorLog("Error during periodic captcha check:", error);
    // If we keep getting errors, stop checking
    if (error.message.includes("Maximum call stack size exceeded")) {
      errorLog("Critical error detected, stopping periodic checks");
      clearInterval(checkInterval);
    }
  }
}, 3000);

// Also watch for DOM changes that might add captchas
try {
  const bodyObserver = new MutationObserver((mutations) => {
    // Don't check on every tiny DOM change - only when new nodes are added
    const hasNewNodes = mutations.some(mutation => 
      mutation.type === 'childList' && mutation.addedNodes.length > 0
    );
    
    if (hasNewNodes) {
      setTimeout(checkForCaptchas, 500); // Small delay to let things render
    }
  });
  
  bodyObserver.observe(document.body, { childList: true, subtree: true });
  debugLog("DOM observer set up successfully");
} catch (error) {
  errorLog("Error setting up DOM observer:", error);
}
