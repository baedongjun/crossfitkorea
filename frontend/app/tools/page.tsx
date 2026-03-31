"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./tools.module.css";

const brzycki = (w: number, r: number) => w * (36 / (37 - r));

const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];

const EXERCISES = [
  "백스쿼트", "프론트스쿼트", "데드리프트", "클린",
  "스내치", "클린앤저크", "오버헤드스쿼트", "프레스",
  "푸시프레스", "벤치프레스",
];

export default function ToolsPage() {
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [exercise, setExercise] = useState(EXERCISES[0]);

  const w = parseFloat(weight);
  const r = parseInt(reps);
  const valid = !isNaN(w) && !isNaN(r) && w > 0 && r >= 1 && r <= 36;
  const avg1rm = valid ? Math.round(brzycki(w, r)) : 0;

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroLeft}>
            <div className={s.heroEyebrow}>
              <svg className={s.heroIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 20h.01M7 20v-4"/><path d="M12 20V10"/><path d="M17 20V4"/>
              </svg>
              <span className={s.heroTag}>Training Tools</span>
            </div>
            <h1 className={s.heroTitle}>도구</h1>
            <p className={s.heroSub}>1RM 계산기 — 무게와 반복 수로 예상 최대 중량 및 퍼센티지 표를 계산합니다</p>
          </div>
          <div className={s.heroRight}>
            <Link href="/wod/timer" className={s.timerBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              WOD 타이머
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={s.content}>
        <div className={s.calcLayout}>
          {/* ── 입력 카드 ── */}
          <div className={s.inputCard}>
            <div className={s.cardLabel}>INPUT</div>

            <div className={s.formRow}>
              <div className={s.field}>
                <label className={s.label}>운동 종목</label>
                <select
                  className={s.select}
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value)}
                >
                  {EXERCISES.map((ex) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>
              <div className={s.field}>
                <label className={s.label}>무게 (kg)</label>
                <input
                  type="number"
                  className={s.input}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="예: 80"
                  min={0}
                  step={0.5}
                />
              </div>
              <div className={s.field}>
                <label className={s.label}>반복 수 (회)</label>
                <input
                  type="number"
                  className={s.input}
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="예: 5"
                  min={1}
                  max={36}
                />
              </div>
            </div>

            {valid ? (
              <div className={s.result1rm}>
                <div className={s.result1rmMain}>
                  <span className={s.result1rmLabel}>예상 1RM</span>
                  <span className={s.result1rmValue}>
                    {avg1rm}<span className={s.result1rmUnit}> kg</span>
                  </span>
                </div>
                <span className={s.result1rmSub}>{exercise}</span>
              </div>
            ) : (
              <div className={s.inputHint}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                무게와 반복 수를 입력하면 1RM과 퍼센티지 표가 나타납니다
              </div>
            )}
          </div>

          {/* ── 퍼센티지 테이블 카드 ── */}
          <div className={s.tableCard}>
            <div className={s.cardLabel}>PERCENTAGE TABLE</div>
            {valid ? (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>%</th>
                      <th>무게 (kg)</th>
                      <th>예상 횟수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERCENTAGES.map((pct) => {
                      const wt = Math.round((avg1rm * pct) / 100 * 2) / 2;
                      const repGuide: Record<number, string> = {
                        100: "1", 95: "2", 90: "3", 85: "4-5",
                        80: "6", 75: "8", 70: "10-12", 65: "15",
                        60: "20", 55: "25", 50: "30+",
                      };
                      return (
                        <tr key={pct} className={pct === 100 ? s.rowMax : ""}>
                          <td className={s.tdPct}>{pct}%</td>
                          <td className={s.tdWeight}>{wt} kg</td>
                          <td className={s.tdReps}>{repGuide[pct]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={s.inputHint}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18"/>
                  <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
                1RM 계산 후 퍼센티지 표가 여기에 표시됩니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
