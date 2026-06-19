"use client";

import {useEffect} from "react";

export default function LandingPointerGlow() {
  useEffect(() => {
    const landing = document.querySelector<HTMLElement>(".landing-main");

    if (!landing || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const updateGlow = (event: PointerEvent) => {
      const bounds = landing.getBoundingClientRect();
      landing.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
      landing.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
      landing.style.setProperty("--pointer-opacity", "1");
    };

    const hideGlow = () => landing.style.setProperty("--pointer-opacity", "0");

    landing.addEventListener("pointermove", updateGlow);
    landing.addEventListener("pointerleave", hideGlow);

    return () => {
      landing.removeEventListener("pointermove", updateGlow);
      landing.removeEventListener("pointerleave", hideGlow);
    };
  }, []);

  return null;
}
