"use client";

import { useEffect, useRef } from "react";
import { Box } from "@/types";

interface BoxMapProps {
  boxes: Box[];
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
}

export default function BoxMap({ boxes }: BoxMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clustererRef = useRef<any>(null);

  // 항상 최신 boxes를 가리키는 ref — 렌더마다 동기 업데이트
  const boxesRef = useRef<Box[]>(boxes);
  boxesRef.current = boxes;

  // 마커 갱신
  const updateMarkers = (bxs: Box[]) => {
    const clusterer = clustererRef.current;
    const map = mapInstanceRef.current;
    if (!clusterer || !map) return;

    clusterer.clear();

    const markers = bxs
      .filter((box) => box.latitude && box.longitude)
      .map((box) => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(box.latitude, box.longitude),
          title: box.name,
        });

        const infoWindow = new window.kakao.maps.InfoWindow({
          content: `
            <div style="padding:10px 14px;min-width:160px;background:#1a1a1a;border:1px solid rgba(255,255,255,0.08)">
              <p style="font-family:'Black Han Sans',sans-serif;font-size:14px;color:#f5f0e8;margin:0 0 4px">${box.name}</p>
              <p style="font-size:12px;color:#888;margin:0">${box.address}</p>
              <a href="/boxes/${box.id}" style="display:block;margin-top:8px;font-size:12px;color:#e8220a;font-weight:700;text-decoration:none">상세 보기 →</a>
            </div>
          `,
        });

        window.kakao.maps.event.addListener(marker, "click", () => {
          infoWindow.open(map, marker);
        });

        return marker;
      });

    clusterer.addMarkers(markers);
  };

  // 지도 초기화 — boxesRef.current로 항상 최신 boxes 사용
  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(37.5665, 126.978),
      level: 10,
    });
    mapInstanceRef.current = map;

    const clusterer = new window.kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 6,
      disableClickZoom: false,
      styles: [{
        width: "53px",
        height: "52px",
        background: "rgba(232, 34, 10, 0.8)",
        color: "#f5f0e8",
        textAlign: "center",
        fontWeight: "bold",
        lineHeight: "52px",
        fontSize: "14px",
      }],
    });
    clustererRef.current = clusterer;

    // 클로저의 stale boxes 대신 ref로 최신 boxes 사용
    updateMarkers(boxesRef.current);
  };

  // 카카오 SDK 로드 및 지도 초기화 (마운트 시 1회)
  useEffect(() => {
    const load = () => {
      // maps.Map이 이미 존재하면 완전히 로드된 상태 → 직접 초기화
      if (window.kakao.maps.Map) {
        initMap();
      } else {
        window.kakao.maps.load(initMap);
      }
    };

    if (window.kakao && window.kakao.maps) {
      load();
      return;
    }

    // 이미 다른 페이지에서 스크립트가 삽입돼 있으면 load 이벤트 대기
    const existing = document.querySelector(`script[src*="dapi.kakao.com/v2/maps"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", load);
      return () => existing.removeEventListener("load", load);
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`;
    script.async = true;
    document.head.appendChild(script);
    script.onload = load;

    return () => {
      mapInstanceRef.current = null;
      clustererRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // boxes 변경 시 마커 갱신
  useEffect(() => {
    updateMarkers(boxes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "600px", border: "1px solid var(--border)" }}
      />
      {boxes.length === 0 && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--bg-card)",
        }}>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}
