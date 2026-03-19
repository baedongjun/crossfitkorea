export default function OfflinePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 24,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>📵</div>
      <h1 style={{
        fontFamily: "'Black Han Sans', sans-serif",
        fontSize: 32,
        color: "var(--text)",
        margin: 0,
      }}>오프라인 상태입니다</h1>
      <p style={{ color: "var(--muted)", fontSize: 15, maxWidth: 360 }}>
        인터넷 연결을 확인해주세요. 연결이 복구되면 자동으로 다시 불러옵니다.
      </p>
      <button
        className="btn-primary"
        style={{ padding: "12px 32px", fontSize: 15 }}
        onClick={() => window.location.reload()}
      >
        다시 시도
      </button>
    </div>
  );
}
