import Link from "next/link";
import s from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.grid}>
          <div>
            <span className={s.logo}>CF<span>KOREA</span></span>
            <p className={s.desc}>
              전국 크로스핏 박스를 한눈에 찾아보세요.<br />
              시간표, 후기, 코치 정보까지 제공합니다.
            </p>
          </div>

          <div>
            <p className={s.colTitle}>서비스</p>
            <div className={s.links}>
              <Link href="/boxes"        className={s.link}>박스 찾기</Link>
              <Link href="/wod"          className={s.link}>오늘의 WOD</Link>
              <Link href="/competitions" className={s.link}>대회 일정</Link>
              <Link href="/community"    className={s.link}>커뮤니티</Link>
            </div>
          </div>

          <div>
            <p className={s.colTitle}>내 계정</p>
            <div className={s.links}>
              <Link href="/my"           className={s.link}>마이페이지</Link>
              <Link href="/wod/records"  className={s.link}>내 WOD 기록</Link>
              <Link href="/my/box"       className={s.link}>박스 오너</Link>
              <Link href="/boxes/create" className={s.link}>박스 등록</Link>
            </div>
          </div>

          <div>
            <p className={s.colTitle}>정보</p>
            <div className={s.links}>
              <Link href="/terms"     className={s.link}>이용약관</Link>
              <Link href="/privacy"   className={s.link}>개인정보처리방침</Link>
            </div>
          </div>
        </div>

        <div className={s.bottom}>
          <p className={s.copyright}>© 2025 CrossFit Korea. All rights reserved.</p>
          <p className={s.trademark}>CrossFit is a registered trademark of CrossFit, LLC.</p>
        </div>
      </div>
    </footer>
  );
}
