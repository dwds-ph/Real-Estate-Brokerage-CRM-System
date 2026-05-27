import { useEffect } from "react";

/**
 * Analytics component — injects Google Analytics (gtag.js).
 * Enable by setting VITE_GA_MEASUREMENT_ID in .env.
 * Supports Plausible as a lightweight alternative.
 */
export function Analytics() {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;

  useEffect(() => {
    // Google Analytics
    if (gaId) {
      const script1 = document.createElement("script");
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement("script");
      script2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(script2);
    }

    // Plausible (lightweight alternative)
    if (plausibleDomain) {
      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.setAttribute("data-domain", plausibleDomain);
      script.src = "https://plausible.io/js/script.js";
      document.head.appendChild(script);
    }
  }, [gaId, plausibleDomain]);

  return null;
}
