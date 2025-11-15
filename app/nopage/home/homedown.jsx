"use client";

import { useEffect, useRef } from "react";
import Side1 from "./home1d";
import Side2 from "./home1e";
import Side3 from "./home1f";

export default function Page() {
    const containerRef = useRef(null);
    const animationRef = useRef(null);
    const isPausedRef = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Duplicate children for infinite scroll
        container.innerHTML += container.innerHTML;

        let scrollAmount = 0;
        const scrollSpeed = 1.5;

        const autoScroll = () => {
            if (!isPausedRef.current) {
                scrollAmount += scrollSpeed;

                if (scrollAmount >= container.scrollWidth / 2) {
                    scrollAmount = 0;
                }

                container.scrollLeft = scrollAmount;
            }

            animationRef.current = requestAnimationFrame(autoScroll);
        };

        // Start
        animationRef.current = requestAnimationFrame(autoScroll);

        // Pause on hover / touch
        const pauseScroll = () => {
            isPausedRef.current = true;
        };

        // Resume on leave / touch end
        const resumeScroll = () => {
            isPausedRef.current = false;
        };

        container.addEventListener("mouseenter", pauseScroll);
        container.addEventListener("mouseleave", resumeScroll);

        container.addEventListener("touchstart", pauseScroll);
        container.addEventListener("touchend", resumeScroll);

        return () => {
            cancelAnimationFrame(animationRef.current);
            container.removeEventListener("mouseenter", pauseScroll);
            container.removeEventListener("mouseleave", resumeScroll);
            container.removeEventListener("touchstart", pauseScroll);
            container.removeEventListener("touchend", resumeScroll);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="
                flex
                overflow-x-hidden
                space-x-4
                px-4
                scrollbar-none
                w-full
            "
        >
            {/* Original slides */}
            <div className="shrink-0 w-full md:w-1/2">
                <Side1 />
            </div>

            <div className="shrink-0 w-full md:w-1/2">
                <Side2 />
            </div>

            <div className="shrink-0 w-full md:w-1/2">
                <Side3 />
            </div>
        </div>
    );
}
