"use client";

import { useEffect, useRef } from "react";

interface BoxDetailMapProps {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
}

export default function BoxDetailMap({ name, address, latitude, longitude }: BoxDetailMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const initMap = () => {
      if (!mapRef.current || !window.kakao?.maps) return;
      window.kakao.maps.load(() => {
        const latlng = new window.kakao.maps.LatLng(latitude, longitude);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: latlng,
          level: 4,
        });
        new window.kakao.maps.Marker({ map, position: latlng, title: name });
      });
    };

    if (window.kakao?.maps) {
      initMap();
      return;
    }

    const existing = document.querySelector(`script[src*="dapi.kakao.com"]`);
    if (existing) {
      existing.addEventListener("load", initMap);
      return () => existing.removeEventListener("load", initMap);
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }, [latitude, longitude, name]);

  if (!latitude || !longitude) {
    return (
      <div style={{
        height: 180,
        background: "var(--bg-card-2)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>지도 정보 없음</p>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={mapRef}
        style={{ width: "100%", height: 200, border: "1px solid var(--border)" }}
      />
      <a
        href={`https://map.kakao.com/?q=${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          textAlign: "center",
          padding: "8px",
          fontSize: 12,
          color: "var(--muted)",
          borderTop: "none",
          border: "1px solid var(--border)",
          borderTop: "none",
          background: "var(--bg-card-2)",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
      >
        카카오맵에서 보기 →
      </a>
    </div>
  );
}
