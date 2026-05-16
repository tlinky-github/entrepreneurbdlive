import { useEffect, useRef } from 'react';

const Turnstile = ({ siteKey, onSuccess, onError, onExpire }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    // 1. Ensure the script is loaded
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        renderWidget();
      };
    } else {
      renderWidget();
    }

    function renderWidget() {
      if (!containerRef.current || !window.turnstile) return;
      
      // Cleanup previous widget if exists
      if (widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onSuccess(token),
        'error-callback': () => onError?.(),
        'expired-callback': () => onExpire?.(),
      });
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey, onSuccess, onError, onExpire]);

  return <div ref={containerRef} className="flex justify-center my-4" />;
};

export default Turnstile;
