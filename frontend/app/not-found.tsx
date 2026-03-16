import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      paddingTop: 64,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
    }}>
      <div style={{ textAlign: "center", padding: "0 24px" }}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(120px, 20vw, 200px)",
          lineHeight: 1,
          color: "rgba(232,34,10,0.06)",
          userSelect: "none",
          marginBottom: 0,
          letterSpacing: 4,
        }}>404</p>
        <h1 style={{
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(24px, 4vw, 40px)",
          color: "var(--text)",
          marginTop: -16,
          marginBottom: 12,
        }}>페이지를 찾을 수 없습니다</h1>
        <p style={{
          fontSize: 14,
          color: "var(--muted)",
          lineHeight: 1.9,
          marginBottom: 40,
          maxWidth: 360,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          요청하신 페이지가 존재하지 않거나 이동되었습니다.<br />
          아래 버튼을 통해 돌아가세요.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn-primary">홈으로</Link>
          <Link href="/boxes" className="btn-secondary">박스 찾기</Link>
        </div>
      </div>
    </div>
  );
}
