"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import s from "./timer.module.css";

type Mode = "amrap" | "fortime" | "emom" | "tabata" | "stopwatch";

const MODE_LABELS: Record<Mode, string> = {
  amrap: "AMRAP",
  fortime: "FOR TIME",
  emom: "EMOM",
  tabata: "TABATA",
  stopwatch: "STOPWATCH",
};

const MODE_DESC: Record<Mode, string> = {
  amrap: "제한 시간 내 최대 라운드",
  fortime: "최대한 빨리 완료",
  emom: "매 분마다 운동 시작",
  tabata: "20초 운동 / 10초 휴식 × 8",
  stopwatch: "자유 스탑워치",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export default function WodTimerPage() {
  const [mode, setMode] = useState<Mode>("amrap");
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  // Config
  const [minutes, setMinutes] = useState(20);
  const [seconds, setSeconds] = useState(0);
  const [emomMinutes, setEmomMinutes] = useState(20);
  const [tabataRounds, setTabataRounds] = useState(8);
  const [workSec, setWorkSec] = useState(20);
  const [restSec, setRestSec] = useState(10);

  // Runtime state
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [tabataPhase, setTabataPhase] = useState<"work" | "rest">("work");
  const [tabataRound, setTabataRound] = useState(1);
  const [tabataPhaseRemain, setTabataPhaseRemain] = useState(20);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beepRef = useRef<AudioContext | null>(null);

  const totalSeconds = minutes * 60 + seconds;

  const beep = useCallback((freq = 880, duration = 0.15) => {
    try {
      if (!beepRef.current) {
        beepRef.current = new AudioContext();
      }
      const ctx = beepRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setFinished(false);
    setElapsed(0);
    setRounds(0);
    setTabataPhase("work");
    setTabataRound(1);
    setTabataPhaseRemain(workSec);
    setRemaining(mode === "amrap" || mode === "emom" ? totalSeconds : 0);
  }, [mode, totalSeconds, workSec]);

  useEffect(() => { reset(); }, [mode]); // eslint-disable-line

  const start = useCallback(() => {
    if (finished) { reset(); return; }
    setRunning(true);
  }, [finished, reset]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;

        if (mode === "stopwatch") return next;

        if (mode === "amrap") {
          const rem = totalSeconds - next;
          setRemaining(rem);
          if (rem <= 3 && rem > 0) beep(660, 0.1);
          if (rem <= 0) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setFinished(true);
            beep(440, 0.5);
          }
        }

        if (mode === "fortime") {
          // counts up, user stops manually
        }

        if (mode === "emom") {
          const rem = emomMinutes * 60 - next;
          setRemaining(rem);
          if (next % 60 === 0 && next > 0) {
            setRounds((r) => r + 1);
            beep(880, 0.2);
          }
          if (rem <= 3 && rem > 0) beep(660, 0.1);
          if (rem <= 0) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setFinished(true);
            beep(440, 0.5);
          }
        }

        if (mode === "tabata") {
          setTabataPhaseRemain((phaseRem) => {
            const newRem = phaseRem - 1;
            if (newRem <= 0) {
              setTabataPhase((phase) => {
                if (phase === "work") {
                  beep(660, 0.2);
                  setTabataPhaseRemain(restSec);
                  return "rest";
                } else {
                  setTabataRound((r) => {
                    if (r >= tabataRounds) {
                      clearInterval(intervalRef.current!);
                      setRunning(false);
                      setFinished(true);
                      beep(440, 0.8);
                      return r;
                    }
                    beep(880, 0.2);
                    setTabataPhaseRemain(workSec);
                    return r + 1;
                  });
                  return "work";
                }
              });
              return 0;
            }
            if (newRem <= 3) beep(660, 0.05);
            return newRem;
          });
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [running, mode, totalSeconds, emomMinutes, tabataRounds, workSec, restSec, beep]);

  const getDisplayTime = () => {
    if (mode === "stopwatch" || mode === "fortime") return formatTime(elapsed);
    if (mode === "amrap" || mode === "emom") return formatTime(remaining);
    if (mode === "tabata") return formatTime(tabataPhaseRemain);
    return "00:00";
  };

  const getProgress = () => {
    if (mode === "amrap") return totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;
    if (mode === "emom") return emomMinutes > 0 ? (remaining / (emomMinutes * 60)) * 100 : 0;
    if (mode === "tabata") {
      const phaseDur = tabataPhase === "work" ? workSec : restSec;
      return phaseDur > 0 ? (tabataPhaseRemain / phaseDur) * 100 : 0;
    }
    return 0;
  };

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <h1 className={s.title}>WOD TIMER</h1>

        {/* Mode Select */}
        <div className={s.modeRow}>
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              className={`${s.modeBtn} ${mode === m ? s.modeBtnActive : ""}`}
              onClick={() => { if (!running) setMode(m); }}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <p className={s.modeDesc}>{MODE_DESC[mode]}</p>

        {/* Config Panel */}
        {!running && !finished && (
          <div className={s.config}>
            {(mode === "amrap" || mode === "fortime") && (
              <div className={s.configRow}>
                <label className={s.configLabel}>시간 설정</label>
                <div className={s.configInputs}>
                  <div className={s.configField}>
                    <input
                      type="number" min={0} max={99}
                      className={s.timeInput}
                      value={minutes}
                      onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                    />
                    <span className={s.timeUnit}>분</span>
                  </div>
                  <span className={s.timeSep}>:</span>
                  <div className={s.configField}>
                    <input
                      type="number" min={0} max={59}
                      className={s.timeInput}
                      value={seconds}
                      onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                    />
                    <span className={s.timeUnit}>초</span>
                  </div>
                </div>
              </div>
            )}
            {mode === "emom" && (
              <div className={s.configRow}>
                <label className={s.configLabel}>총 시간 (분)</label>
                <input
                  type="number" min={1} max={60}
                  className={s.timeInput}
                  value={emomMinutes}
                  onChange={(e) => setEmomMinutes(parseInt(e.target.value) || 1)}
                />
              </div>
            )}
            {mode === "tabata" && (
              <div className={s.configRow}>
                <label className={s.configLabel}>라운드</label>
                <input type="number" min={1} max={20} className={s.timeInput}
                  value={tabataRounds} onChange={(e) => setTabataRounds(parseInt(e.target.value) || 8)} />
                <label className={s.configLabel} style={{ marginLeft: 16 }}>운동 (초)</label>
                <input type="number" min={5} max={60} className={s.timeInput}
                  value={workSec} onChange={(e) => setWorkSec(parseInt(e.target.value) || 20)} />
                <label className={s.configLabel} style={{ marginLeft: 16 }}>휴식 (초)</label>
                <input type="number" min={5} max={60} className={s.timeInput}
                  value={restSec} onChange={(e) => setRestSec(parseInt(e.target.value) || 10)} />
              </div>
            )}
          </div>
        )}

        {/* Timer Display */}
        <div className={`${s.timerBox} ${finished ? s.timerFinished : ""} ${
          mode === "tabata" && running ? (tabataPhase === "work" ? s.timerWork : s.timerRest) : ""
        }`}>
          {mode === "tabata" && running && (
            <div className={s.tabataPhaseLabel}>
              {tabataPhase === "work" ? "운동" : "휴식"} — {tabataRound}/{tabataRounds} 라운드
            </div>
          )}
          <div className={s.timerDisplay}>{getDisplayTime()}</div>
          {finished && <div className={s.finishedLabel}>TIME!</div>}

          {mode === "emom" && running && (
            <div className={s.emomInfo}>현재 {Math.floor(elapsed / 60) + 1}분 / {emomMinutes}분</div>
          )}
          {(mode === "amrap" || mode === "emom") && running && (
            <div className={s.roundInfo}>ROUNDS: {rounds}</div>
          )}
          {mode === "stopwatch" && running && (
            <div className={s.lapInfo}>경과 시간</div>
          )}
        </div>

        {/* Progress Bar (countdown modes) */}
        {(mode === "amrap" || mode === "emom" || mode === "tabata") && (running || finished) && (
          <div className={s.progressBar}>
            <div
              className={`${s.progressFill} ${mode === "tabata" && tabataPhase === "rest" ? s.progressRest : ""}`}
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        )}

        {/* Controls */}
        <div className={s.controls}>
          {!running && !finished ? (
            <button className={s.btnStart} onClick={start}>START</button>
          ) : running ? (
            <>
              <button className={s.btnStop} onClick={() => setRunning(false)}>PAUSE</button>
              {(mode === "amrap" || mode === "emom") && (
                <button className={s.btnRound} onClick={() => setRounds((r) => r + 1)}>+ ROUND</button>
              )}
            </>
          ) : finished ? (
            <button className={s.btnStart} onClick={reset}>RESET</button>
          ) : null}
          {(running || (!running && elapsed > 0)) && (
            <button className={s.btnReset} onClick={reset}>RESET</button>
          )}
        </div>
      </div>
    </div>
  );
}
