"use client";

import React, { useEffect, useState } from 'react';
import Script from 'next/script';

export default function Turnstile({ siteKey, onSuccess }) {
  useEffect(() => {
    // Only run if window.turnstile is available
    const interval = setInterval(() => {
      if (window.turnstile) {
        window.turnstile.render('#turnstile-container', {
          sitekey: siteKey,
          callback: (token) => {
            onSuccess(token);
          },
        });
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [siteKey, onSuccess]);

  return (
    <>
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
        strategy="afterInteractive" 
      />
      <div id="turnstile-container" className="mx-auto" />
    </>
  );
}
