"use client";

import { useEffect, useRef } from "react";
import { isLoggedIn } from "./auth";

interface NotificationEvent {
  id: number;
  message: string;
  type: string;
  link: string;
}

export function useNotificationSse(onNotification: (event: NotificationEvent) => void) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isLoggedIn() || typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // EventSource는 헤더를 직접 못 보내므로 토큰을 쿼리 파라미터로 전달
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/notifications/subscribe?token=${token}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("notification", (e) => {
      try {
        const data = JSON.parse(e.data);
        onNotification(data);
      } catch {}
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [onNotification]);
}
