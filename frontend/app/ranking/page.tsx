"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { rankingApi } from "@/lib/api";
import { NamedWod, NamedWodCategory } from "@/types";
import s from "./ranking.module.css";

const CATEGORY_LABEL: Record<NamedWodCategory, string> = {
  GIRLS: "Girls WODs",
  HEROES: "Hero WODs",
  BENCHMARK: "Benchmark",
  CUSTOM: "Custom",
};

const CATEGORY_ORDER: NamedWodCategory[] = ["GIRLS", "HEROES", "BENCHMARK", "CUSTOM"];

export default function RankingPage() {
  const { data: wods = [], isLoading } = useQuery<NamedWod[]>({
    queryKey: ["ranking", "wods"],
    queryFn: async () => (await rankingApi.getWods()).data.data,
  });

  const grouped = CATEGORY_ORDER.reduce<Record<NamedWodCategory, NamedWod[]>>(
    (acc, cat) => {
      acc[cat] = wods.filter((w) => w.category === cat);
      return acc;
    },
    { GIRLS: [], HEROES: [], BENCHMARK: [], CUSTOM: [] }
  );

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <p className={s.heroTag}>CROSSFIT KOREA</p>
        <h1 className={s.heroTitle}>NAMED WOD RANKING</h1>
        <p className={s.heroDesc}>
          YouTube 영상으로 기록을 제출하고 박스 오너의 인증을 받아 랭킹에 이름을 올리세요.
        </p>
        <div className={s.heroSteps}>
          <div className={s.heroStep}>
            <span className={s.heroStepNum}>01</span>
            <span className={s.heroStepText}>아래 WOD 카드 클릭</span>
          </div>
          <span className={s.heroStepArrow}>→</span>
          <div className={s.heroStep}>
            <span className={s.heroStepNum}>02</span>
            <span className={s.heroStepText}>점수 + YouTube URL 제출</span>
          </div>
          <span className={s.heroStepArrow}>→</span>
          <div className={s.heroStep}>
            <span className={s.heroStepNum}>03</span>
            <span className={s.heroStepText}>박스 오너 인증 후 랭킹 등재</span>
          </div>
        </div>
      </div>

      <div className={s.content}>
        {isLoading ? (
          <div className={s.skeletonGrid}>
            {[...Array(8)].map((_, i) => <div key={i} className={s.skeleton} />)}
          </div>
        ) : wods.length === 0 ? (
          <div className={s.empty}>등록된 Named WOD가 없습니다.</div>
        ) : (
          CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => (
            <section key={cat} className={s.section}>
              <h2 className={s.sectionTitle}>{CATEGORY_LABEL[cat]}</h2>
              <div className={s.grid}>
                {grouped[cat].map((wod) => (
                  <Link key={wod.id} href={`/ranking/${wod.id}`} className={s.card}>
                    <div className={s.cardCategory}>{CATEGORY_LABEL[cat]}</div>
                    <h3 className={s.cardName}>{wod.name}</h3>
                    {wod.description && (
                      <p className={s.cardDesc}>{wod.description}</p>
                    )}
                    <div className={s.cardFooter}>
                      <span className={s.cardScore}>
                        {wod.scoreType === "TIME" ? "⏱ TIME" :
                         wod.scoreType === "REPS" ? "🔢 REPS" :
                         wod.scoreType === "WEIGHT" ? "🏋️ WEIGHT" : "🔄 ROUNDS"}
                        {wod.scoreUnit && ` (${wod.scoreUnit})`}
                      </span>
                      <span className={s.cardCount}>{wod.verifiedCount}개 기록</span>
                    </div>
                    <div className={s.cardCta}>기록 제출 / 랭킹 보기 →</div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
