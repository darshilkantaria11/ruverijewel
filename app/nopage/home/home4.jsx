"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const VIDEO_SRC =
  "https://res.cloudinary.com/dbupmfblp/video/upload/v1778086706/lv_0_20260506125250_1_m9cnps.mp4";

export default function VideoOnScrollSection() {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // ── Play attempt ─────────────────────────
  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, []);

  const pauseVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  }, []);

  // ── Intersection Observer ───────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.4 }
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // ── Visibility logic ────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    if (isVisible && !hasInteracted) {
      attemptPlay();
    } else if (!isVisible) {
      pauseVideo();
      setHasInteracted(false);
    }
  }, [isVisible, isLoaded, hasInteracted, attemptPlay, pauseVideo]);

  // ── Toggle ─────────────────────────────
  const handleToggle = async () => {
    if (isPlaying) {
      pauseVideo();
      setHasInteracted(true);
    } else {
      setHasInteracted(false);
      await attemptPlay();
    }
  };

  // ── Fix black screen (important) ───────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const fixFrame = () => {
      try {
        video.currentTime += 0.001;
      } catch {}
    };

    const onLoaded = () => {
      setIsLoaded(true);

      // force repaint trick
      video.style.opacity = "0.99";
      setTimeout(() => {
        video.style.opacity = "1";
      }, 50);

      fixFrame();
    };

    const onError = () => {
      setError(true);
    };

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
    };
  }, []);

  // ── Visibility change fix ───────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        video.currentTime += 0.001;
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return (
    <section className="w-full py-16 bg-[#F7F5F2]">
       <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-10 md:mb-14">
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-3 font-medium">
          Craftsmanship &amp; Detail
        </p>
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-light text-stone-800 leading-tight"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          Where every piece
          <br />
          <em className="not-italic text-stone-500">tells a story.</em>
        </h2>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div
          ref={wrapperRef}
          onClick={handleToggle}
          className={`relative w-full overflow-hidden rounded-2xl bg-black transition ${
            isVisible ? "opacity-100" : "opacity-0 translate-y-6"
          }`}
          style={{ aspectRatio: "16/9" }}
        >
          {/* VIDEO */}
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            preload="metadata"
            playsInline
            controls   // ✅ enable for debugging
            className="w-full h-full object-cover bg-black"
            style={{ transform: "translateZ(0)" }}
          />

          {/* Overlay button */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <button className="bg-white px-4 py-2 rounded">
                ▶
              </button>
            </div>
          )}

          {/* Error fallback */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black">
              Video failed to load — encoding issue likely
            </div>
          )}
        </div>
      </div>
    </section>
  );
}