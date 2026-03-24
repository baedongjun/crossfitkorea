"use client";

import { useEffect } from "react";

interface AddressResult {
  address: string;   // 도로명 주소
  city: string;      // 시/도 (서울, 경기 ...)
  district: string;  // 구/군
}

interface Props {
  onSelect: (result: AddressResult) => void;
  buttonStyle?: React.CSSProperties;
  buttonClassName?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    daum: any;
  }
}

const SCRIPT_ID = "daum-postcode-script";
const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

// 시도 축약명 → 표준 지역명 매핑
const SIDO_MAP: Record<string, string> = {
  "서울특별시": "서울", "서울": "서울",
  "경기도": "경기", "경기": "경기",
  "부산광역시": "부산", "부산": "부산",
  "인천광역시": "인천", "인천": "인천",
  "대구광역시": "대구", "대구": "대구",
  "대전광역시": "대전", "대전": "대전",
  "광주광역시": "광주", "광주": "광주",
  "울산광역시": "울산", "울산": "울산",
  "세종특별자치시": "세종", "세종": "세종",
  "강원특별자치도": "강원", "강원도": "강원", "강원": "강원",
  "충청북도": "충북", "충북": "충북",
  "충청남도": "충남", "충남": "충남",
  "전라북도": "전북", "전북특별자치도": "전북", "전북": "전북",
  "전라남도": "전남", "전남": "전남",
  "경상북도": "경북", "경북": "경북",
  "경상남도": "경남", "경남": "경남",
  "제주특별자치도": "제주", "제주": "제주",
};

export default function AddressSearch({ onSelect, buttonStyle, buttonClassName }: Props) {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const openSearch = () => {
    const open = () => {
      new window.daum.Postcode({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oncomplete: (data: any) => {
          // 도로명 우선, 없으면 지번
          const address = data.roadAddress || data.jibunAddress;
          const sido = SIDO_MAP[data.sido] || data.sido;
          const district = data.sigungu || "";
          onSelect({ address, city: sido, district });
        },
      }).open();
    };

    if (window.daum?.Postcode) {
      open();
    } else {
      // 스크립트 로드 대기
      const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (script) {
        script.onload = open;
      } else {
        const s = document.createElement("script");
        s.id = SCRIPT_ID;
        s.src = SCRIPT_SRC;
        s.async = true;
        s.onload = open;
        document.head.appendChild(s);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={openSearch}
      className={buttonClassName}
      style={buttonStyle}
    >
      주소 검색
    </button>
  );
}
