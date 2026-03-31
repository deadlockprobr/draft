"use client";

import { useEffect, useState, useMemo } from "react";
import { useI18n } from "@/i18n/context";
import { useParams, useSearchParams } from "next/navigation";
import { useDraftWs } from "@/hooks/use-draft-ws";
import { HeroCard } from "@/components/draft/hero-card";
import { HeroRoulette } from "@/components/draft/hero-roulette";
import { HEROES_API_URL } from "@/lib/draft";

export default function StreamPage() {
    const params = useParams<{ code_url: string }>();
    const searchParams = useSearchParams();
    const chromakey = searchParams.get("bg") === "chromakey";
    const { draft } = useDraftWs(params.code_url);
    const { t } = useI18n();
    const [heroes, setHeroes] = useState<any[]>([]);

    useEffect(() => {
        if (draft) {
            document.title = `${draft.name_a} vs ${draft.name_b} - Deadlock Draft`;
        }
    }, [draft?.name_a, draft?.name_b]);

    useEffect(() => {
        fetch(HEROES_API_URL)
            .then((r) => r.json())
            .then((data) =>
                setHeroes(
                    (data ?? []).filter(
                        (h: any) => !h.disabled && !h.in_development,
                    ),
                ),
            )
            .catch(() => {});
    }, []);

    const steps = draft?.steps ?? [];
    const currentStep = steps.find((s: any) => s.current);

    function getSteps(teamCode: string, type: string) {
        return steps
            .filter((s: any) => s.team === teamCode && s.type === type)
            .map((s: any) => ({
                ...s,
                heroData: s.hero?.key
                    ? heroes.find((h) => h.id === s.hero.key)
                    : null,
            }));
    }

    const picksA = getSteps("a", "pick");
    const bansA = getSteps("a", "ban");
    const picksB = getSteps("b", "pick");
    const bansB = getSteps("b", "ban");

    const availableHeroes = useMemo(() => {
        const usedIds = new Set(
            (draft?.items ?? []).map((i: any) => i?.hero?.key).filter(Boolean),
        );
        return heroes.filter((h) => !usedIds.has(h.id));
    }, [heroes, draft?.items]);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-8"
            style={{ background: chromakey ? "#00ff00" : "#080706" }}
        >
            <div className="w-full max-w-5xl">
                {/* Timer progress bar */}
                {draft && draft.timer !== null && draft.timer_seconds > 0 && (
                    <TimerBar
                        remaining={draft.timer}
                        total={draft.timer_seconds}
                        color={
                            currentStep?.team === "b" ? "#6688cc" : "#c4862e"
                        }
                    />
                )}

                <div className="grid grid-cols-2 gap-8">
                    {/* Team A */}
                    <StreamTeam
                        name={draft?.name_a ?? ""}
                        color="#c4862e"
                        shadow="rgba(200,140,60,0.4)"
                        picks={picksA}
                        bans={bansA}
                        chromakey={chromakey}
                        emptyPickBg={
                            chromakey
                                ? "rgba(200,160,80,0.4)"
                                : "rgba(141,105,50,0.25)"
                        }
                        availableHeroes={availableHeroes}
                        factionImg="/images/hidden-king-logo.png"
                    />

                    {/* Team B */}
                    <StreamTeam
                        name={draft?.name_b ?? ""}
                        color="#6688cc"
                        shadow="rgba(70,100,180,0.4)"
                        picks={picksB}
                        bans={bansB}
                        chromakey={chromakey}
                        emptyPickBg={
                            chromakey
                                ? "rgba(100,140,220,0.4)"
                                : "rgba(55,79,153,0.25)"
                        }
                        availableHeroes={availableHeroes}
                        factionImg="/images/archmother-logo.png"
                    />
                </div>

                {/* Branding */}
                <div className="mt-10 flex items-center justify-center">
                    <a
                        href="https://draft.deadlock.pro.br"
                        target="_blank"
                        className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors no-underline"
                    >
                        draft.deadlock.pro.br
                    </a>
                </div>
            </div>
        </div>
    );
}

function TimerBar({
    remaining,
    total,
    color,
}: {
    remaining: number;
    total: number;
    color: string;
}) {
    // Bar starts at 100% and shrinks from both sides toward the center
    const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
    const isLow = remaining <= 5;
    const barColor = isLow ? "#ef4444" : color;
    const glow = isLow
        ? "0 0 14px rgba(239,68,68,0.7), 0 0 4px rgba(239,68,68,0.4)"
        : `0 0 10px ${color}50`;

    return (
        <div className="mb-6">
            <div
                className="w-full h-2 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)" }}
            >
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{
                        width: `${pct}%`,
                        background: barColor,
                        boxShadow: glow,
                    }}
                />
            </div>
        </div>
    );
}

function StreamTeam({
    name,
    color,
    shadow,
    picks,
    bans,
    chromakey,
    emptyPickBg,
    availableHeroes,
    factionImg,
}: {
    name: string;
    color: string;
    shadow: string;
    picks: any[];
    bans: any[];
    chromakey: boolean;
    emptyPickBg: string;
    availableHeroes: any[];
    factionImg: string;
}) {
    return (
        <div>
            <div className="flex justify-center mb-2">
                <div
                    className="h-18 opacity-50"
                    style={{
                        backgroundColor: color,
                        maskImage: `url(${factionImg})`,
                        WebkitMaskImage: `url(${factionImg})`,
                        maskSize: "contain",
                        WebkitMaskSize: "contain",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                        aspectRatio: "4/1",
                    }}
                />
            </div>
            {name && (
                <h2
                    className="text-3xl font-bold text-center mb-5 tracking-tight"
                    style={{ color, textShadow: `0 0 20px ${shadow}` }}
                >
                    {name}
                </h2>
            )}
            <div className="flex flex-wrap gap-2 justify-center mb-5">
                {picks.map((item: any, i: number) =>
                    item.current ? (
                        <HeroRoulette
                            key={i}
                            heroes={availableHeroes}
                            className="rounded-xl"
                        />
                    ) : (
                        <HeroCard
                            key={i}
                            hero={item.heroData ?? undefined}
                            className="rounded-xl"
                            style={
                                !item.heroData
                                    ? { background: emptyPickBg }
                                    : undefined
                            }
                        />
                    ),
                )}
            </div>
            {bans.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap">
                    {bans.map((item: any, i: number) =>
                        item.current ? (
                            <HeroRoulette
                                key={i}
                                heroes={availableHeroes}
                                className="opacity-60 rounded-xl"
                            />
                        ) : (
                            <HeroCard
                                key={i}
                                hero={item.heroData ?? undefined}
                                variant="banned"
                                className="opacity-50 rounded-xl"
                                style={
                                    !item.heroData
                                        ? { background: "rgba(80,80,80,0.4)" }
                                        : undefined
                                }
                            />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}
