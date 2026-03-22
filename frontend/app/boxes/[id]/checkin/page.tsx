"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import QRCode from "qrcode";
import { boxApi } from "@/lib/api";
import { Box } from "@/types";
import s from "./checkin.module.css";

export default function BoxCheckinPage() {
  const { id } = useParams<{ id: string }>();
  const boxId = Number(id);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  const { data: box } = useQuery({
    queryKey: ["box", boxId],
    queryFn: async () => (await boxApi.getBox(boxId)).data.data as Box,
  });

  const checkinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/boxes/${boxId}/scan`
    : `https://crossfitkorea.com/boxes/${boxId}/scan`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, checkinUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#f5f0e8",
        light: "#1a1a1a",
      },
    }).then(() => setQrGenerated(true));
  }, [checkinUrl]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `crossfit-checkin-${boxId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <Link href={`/boxes/${boxId}`} className={s.back}>← 박스로 돌아가기</Link>

        <div className={s.card}>
          <div className={s.header}>
            <h1 className={s.title}>QR 체크인</h1>
            {box && <p className={s.boxName}>{box.name}</p>}
          </div>

          <div className={s.qrWrap}>
            <canvas ref={canvasRef} className={s.qrCanvas} />
            {!qrGenerated && <div className={s.qrPlaceholder}>QR 생성 중...</div>}
          </div>

          <p className={s.desc}>
            회원이 이 QR 코드를 스캔하면 자동으로 출석이 기록됩니다.<br />
            인쇄하여 박스 입구에 부착해보세요.
          </p>

          <div className={s.urlBox}>
            <span className={s.urlLabel}>URL</span>
            <span className={s.url}>{checkinUrl}</span>
          </div>

          <div className={s.actions}>
            <button className="btn-primary" style={{ padding: "12px 32px", fontSize: 14 }} onClick={handleDownload}>
              QR 이미지 저장
            </button>
            <button
              className="btn-secondary"
              style={{ padding: "12px 24px", fontSize: 14 }}
              onClick={() => window.print()}
            >
              인쇄
            </button>
          </div>
        </div>

        <div className={s.infoCard}>
          <h3 className={s.infoTitle}>사용 방법</h3>
          <ol className={s.infoList}>
            <li>QR 코드를 인쇄하여 박스 입구에 부착</li>
            <li>회원이 스마트폰으로 QR 코드 스캔</li>
            <li>출석 체크인 자동 기록 (1시간 중복 방지)</li>
            <li>WOD 기록 작성 및 출석 완료</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
