"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./tools.module.css";

const FORMULAS = [
  { name: "Brzycki", fn: (w: number, r: number) => w * (36 / (37 - r)) },
  { name: "Epley",   fn: (w: number, r: number) => w * (1 + r / 30) },
  { name: "Lander",  fn: (w: number, r: number) => (100 * w) / (101.3 - 2.67123 * r) },
  { name: "Lombardi",fn: (w: number, r: number) => w * Math.pow(r, 0.1) },
];

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

  const avg1rm = valid
    ? Math.round(FORMULAS.reduce((sum, f) => sum + f.fn(w, r), 0) / FORMULAS.length)
    : 0;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>1RM 계산기</h1>
            <p className={s.sub}>무게 × 반복 수 → 예상 1RM 및 퍼센티지 표</p>
          </div>
          <Link href="/wod/timer" className={s.timerBtn}>⏱ WOD 타이머</Link>
        </div>

        <div className={s.card}>
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

          {valid && (
            <>
              <div className={s.result1rm}>
                <span className={s.result1rmLabel}>예상 1RM</span>
                <span className={s.result1rmValue}>{avg1rm} kg</span>
                <span className={s.result1rmSub}>{exercise}</span>
              </div>

              <div className={s.formulaRow}>
                {FORMULAS.map((f) => (
                  <div key={f.name} className={s.formulaItem}>
                    <span className={s.formulaName}>{f.name}</span>
                    <span className={s.formulaVal}>{Math.round(f.fn(w, r))} kg</span>
                  </div>
                ))}
              </div>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
