"use client";

import Link from "next/link";

export default function FloatingPsychologistChatTeaser() {
  return (
    <div
      className="floating-psychologist-chat-teaser"
      style={{
        position: "fixed",
        right: 24,
        bottom: 100,
        zIndex: 1050,
        maxWidth: "min(100vw - 32px, 320px)",
        pointerEvents: "auto",
      }}
      role="complementary"
      aria-label="Assistente para encontrar psicólogos (em breve)"
    >
      <div
        className="info-widget style-4 move-4 position-relative shadow"
        style={{
          padding: "12px 12px 12px 100px",
          margin: 0,
        }}
      >
        <div
          className="widget-media"
          style={{ width: 85, height: 85, top: 12, left: 12 }}
        >
          <video
            src="/assets/Mindzinho.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 10,
            }}
          />
        </div>
     
      </div>
    </div>
  );
}
