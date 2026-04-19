import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function HlsVideoBackground({ src, overlayColor = "rgba(248, 210, 220, 0.78)" }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          // Retry once on next user interaction
          const retry = () => {
            video.play().catch(() => {});
            document.removeEventListener("touchstart", retry);
            document.removeEventListener("click", retry);
          };
          document.addEventListener("touchstart", retry, { once: true });
          document.addEventListener("click", retry, { once: true });
        });
      }
    };

    let hls;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: overlayColor }} />
    </div>
  );
}