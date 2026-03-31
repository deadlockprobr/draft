"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useDraftWs } from "@/hooks/use-draft-ws";
import { HeroCard, getHeroImageUrl } from "@/components/draft/hero-card";
import { HeroRoulette } from "@/components/draft/hero-roulette";
import { TimerDisplay } from "@/components/draft/timer-display";
import { HEROES_API_URL } from "@/lib/draft";
import { useI18n } from "@/i18n/context";
import { LanguageDropdown } from "@/components/navbar";

export default function TeamPage() {
    const params = useParams<{ code_url: string; code_team: string }>();
    const { t } = useI18n();
    const { draft, connected, emit } = useDraftWs(params.code_url);
    const [heroes, setHeroes] = useState<any[]>([]);
    const [selectedHero, setSelectedHero] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [readyLoading, setReadyLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch(HEROES_API_URL)
            .then((r) => r.json())
            .then((data) =>
                setHeroes(
                    (data ?? [])
                        .filter((h: any) => !h.disabled && !h.in_development)
                        .sort((a: any, b: any) => a.name.localeCompare(b.name)),
                ),
            )
            .catch(() => {});
    }, []);

    const teamCode = useMemo(() => {
        if (!draft) return null;
        if (draft.code_a === params.code_team) return "a" as const;
        if (draft.code_b === params.code_team) return "b" as const;
        return null;
    }, [draft, params.code_team]);

    const opponentCode = teamCode === "a" ? "b" : "a";
    const teamName = draft && teamCode ? draft[`name_${teamCode}`] : "";
    const opponentName = draft ? draft[`name_${opponentCode}`] : "";
    const teamReady = draft && teamCode ? draft[`ready_${teamCode}`] : false;
    const opponentReady = draft ? draft[`ready_${opponentCode}`] : false;

    const steps = draft?.steps ?? [];
    const currentStep = steps.find((s: any) => s.current);
    const isFinished = draft?.status === "finished";
    const isMyTurn = currentStep?.team === teamCode;

    // Set team-colored favicon
    useEffect(() => {
        if (!teamCode) return;
        const color = teamCode === "a" ? "#c4862e" : "#6688cc";
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        const url = canvas.toDataURL("image/png");
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
        }
        link.href = url;
    }, [teamCode]);

    // Update page title with timer/status
    useEffect(() => {
        if (!draft) return;
        if (!teamReady || !opponentReady) {
            document.title = `${teamName} vs ${opponentName} - Draft`;
            return;
        }
        if (isFinished) {
            document.title = `${t("finished")} - Draft`;
        } else if (isMyTurn) {
            const action = currentStep?.type === "ban" ? t("ban") : t("pick");
            if (draft.timer !== null && draft.timer_seconds > 0) {
                const mins = Math.floor(draft.timer / 60);
                const secs = draft.timer % 60;
                document.title = `${mins}:${String(secs).padStart(2, "0")} ${action} - Draft`;
            } else {
                document.title = `${action} - Draft`;
            }
        } else {
            document.title = `${t("waiting_team", { name: opponentName })} - Draft`;
        }
    }, [draft?.timer, isMyTurn, isFinished, teamReady, opponentReady]);

    const usedHeroIds = useMemo(() => {
        const ids = new Set<number>();
        for (const item of draft?.items ?? []) {
            if (item?.hero?.key) ids.add(item.hero.key);
        }
        return ids;
    }, [draft?.items]);

    // Deselect when turn changes or selected hero gets used
    useEffect(() => {
        if (!selectedHero) return;
        if (!isMyTurn || usedHeroIds.has(selectedHero.id)) {
            setSelectedHero(null);
        }
    }, [isMyTurn, usedHeroIds]);

    // Notify server of hero selection for auto-pick fallback
    useEffect(() => {
        if (!draft) return;
        emit("select-hero", {
            draftId: draft.id,
            hero: selectedHero
                ? { key: selectedHero.id, collection: "deadlock_heroes" }
                : null,
        });
    }, [selectedHero, draft?.id]);

    const availableHeroes = useMemo(() => {
        return heroes.filter((h) => !usedHeroIds.has(h.id));
    }, [heroes, usedHeroIds]);

    const filteredHeroes = useMemo(() => {
        return heroes.filter((h) => {
            if (search && !h.name.toLowerCase().includes(search.toLowerCase()))
                return false;
            return true;
        });
    }, [heroes, search]);

    async function handleReady() {
        if (!draft || readyLoading) return;
        setReadyLoading(true);
        try {
            await fetch(`/api/internal/draft/${draft.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [`ready_${teamCode}`]: true }),
            });
        } catch {}
        setReadyLoading(false);
    }

    async function confirmHeroSelect() {
        if (!selectedHero || !isMyTurn || !draft || !currentStep) return;
        setActionLoading(true);
        try {
            await fetch(`/api/internal/draft/${draft.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hero: {
                        key: selectedHero.id,
                        collection: "deadlock_heroes",
                    },
                    team: teamCode,
                }),
            });
            setSelectedHero(null);
        } catch {}
        setActionLoading(false);
    }

    // --- Loading ---
    if (!connected || !draft) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Spinner />
                <span className="text-sm">{t("connecting")}</span>
            </div>
        );
    }

    // --- Invalid team code ---
    if (!teamCode) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">404</span>
                <span className="text-sm text-muted-foreground">Not found</span>
            </div>
        );
    }

    // --- Ready screen ---
    if (!teamReady || !opponentReady) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <div className="rounded-2xl border border-border p-6 text-center bg-card space-y-5">
                        <div>
                            <div className="text-lg font-bold">{teamName}</div>
                            <div className="text-sm text-muted-foreground">
                                vs {opponentName}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <ReadyBadge name={teamName} ready={teamReady} />
                            <ReadyBadge
                                name={opponentName}
                                ready={opponentReady}
                            />
                        </div>

                        {teamReady && !opponentReady && (
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Spinner className="w-4 h-4" />
                                {t("waiting_opponent")}
                            </div>
                        )}

                        {!teamReady && (
                            <button
                                disabled={readyLoading}
                                onClick={handleReady}
                                className="w-full h-11 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center"
                                style={{
                                    background: "#4ade80",
                                    color: "#052e16",
                                }}
                            >
                                {readyLoading ? (
                                    <Spinner className="w-4 h-4" />
                                ) : (
                                    t("ready")
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- Draft ---
    const teamColor = teamCode === "a" ? TEAM_A : TEAM_B;
    const opponentColor = opponentCode === "a" ? TEAM_A : TEAM_B;

    return (
        <div className="min-h-screen flex justify-center">
            <div className="w-full max-w-350 min-h-screen flex flex-col border-x border-border/50">
                {/* Header */}
                <header className="shrink-0 border-b border-border/50 bg-card/40 px-5 py-2.5 flex items-center gap-4">
                    <span className="text-sm font-bold tracking-tight">
                        {t("draft")}
                    </span>
                    <div className="flex-1 flex items-center justify-center">
                        {!isFinished &&
                            draft.timer !== null &&
                            draft.timer_seconds > 0 && (
                                <TimerDisplay
                                    seconds={draft.timer}
                                    className="text-xl"
                                />
                            )}
                        {isFinished && (
                            <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                                {t("finished")}
                            </span>
                        )}
                    </div>
                    <LanguageDropdown />
                </header>

                {/* Step indicator */}
                {!isFinished && (
                    <div className="shrink-0 border-b border-border/50 bg-card/20 px-4 py-4 overflow-x-auto">
                        <div className="flex gap-1.5 min-w-max justify-center">
                            {steps.map((step: any, idx: number) => {
                                const isFilled =
                                    idx < (draft.items?.length ?? 0);
                                const isCurrent = !!step.current;
                                const color =
                                    step.team === "a" ? TEAM_A : TEAM_B;
                                const heroData = step.hero?.key
                                    ? heroes.find(
                                          (h: any) => h.id === step.hero.key,
                                      )
                                    : null;

                                return (
                                    <div
                                        key={idx}
                                        className="relative flex flex-col items-center gap-1"
                                        style={{
                                            opacity:
                                                !isFilled && !isCurrent
                                                    ? 0.25
                                                    : 1,
                                        }}
                                    >
                                        {isCurrent && (
                                            <div
                                                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full animate-pulse z-10"
                                                style={{
                                                    background: color.main,
                                                }}
                                            />
                                        )}
                                        <div
                                            className="group/step rounded-md overflow-hidden border-b-[3px] flex items-center justify-center relative"
                                            style={{
                                                width: 54,
                                                height: 90,
                                                borderColor:
                                                    step.type === "ban"
                                                        ? "#ef4444"
                                                        : color.main,
                                                background:
                                                    isFilled && heroData
                                                        ? undefined
                                                        : isCurrent
                                                          ? undefined
                                                          : color.bg,
                                            }}
                                        >
                                            {isFilled && heroData ? (
                                                <HeroCard
                                                    hero={heroData}
                                                    variant={
                                                        step.type === "ban"
                                                            ? "banned"
                                                            : "default"
                                                    }
                                                    imageOpacity={
                                                        step.type === "ban"
                                                            ? 0.4
                                                            : undefined
                                                    }
                                                    imageClassName={
                                                        step.type === "ban"
                                                            ? "w-full h-full object-cover transition-transform duration-400 ease-out translate-y-[20%] group-hover/step:translate-y-0"
                                                            : undefined
                                                    }
                                                    className="rounded-none"
                                                    style={{
                                                        width: 54,
                                                        height: 90,
                                                    }}
                                                />
                                            ) : isCurrent &&
                                              availableHeroes.length > 0 ? (
                                                <HeroRoulette
                                                    heroes={availableHeroes}
                                                    imageOpacity={0.4}
                                                    className="rounded-none"
                                                    style={{
                                                        width: 54,
                                                        height: 90,
                                                    }}
                                                />
                                            ) : (
                                                <span
                                                    className="text-[9px] font-bold uppercase"
                                                    style={{
                                                        color: color.muted,
                                                    }}
                                                >
                                                    {step.type === "ban"
                                                        ? t("ban_label")
                                                        : t("pick_label")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main content */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left sidebar: My team */}
                    <aside className="lg:w-80 xl:w-85 shrink-0 border-b lg:border-b-0 lg:border-r border-border/50 bg-card/15 p-4 overflow-y-auto">
                        <TeamPicks
                            name={teamName}
                            color={teamColor}
                            steps={steps}
                            teamCode={teamCode!}
                            heroes={heroes}
                            tag={t("you")}
                            gloat
                        />
                    </aside>

                    {/* Center: Hero grid or finished */}
                    {!isFinished ? (
                        <main className="flex-1 flex flex-col min-w-0 relative">
                            {/* Turn indicator */}
                            <div
                                className="shrink-0 px-4 py-2.5 text-center text-sm font-bold border-b border-border/50"
                                style={{
                                    background: isMyTurn
                                        ? `${teamColor.main}10`
                                        : `${opponentColor.main}08`,
                                    color: isMyTurn
                                        ? teamColor.main
                                        : opponentColor.muted,
                                }}
                            >
                                {isMyTurn ? (
                                    <>
                                        {t("your_turn")}{" "}
                                        <span
                                            style={{
                                                color:
                                                    currentStep?.type === "ban"
                                                        ? "#f87171"
                                                        : "#4ade80",
                                            }}
                                        >
                                            {currentStep?.type === "ban"
                                                ? t("ban_hero")
                                                : t("pick_hero")}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {t("waiting_team", {
                                            name: opponentName,
                                        })}
                                    </>
                                )}
                            </div>

                            {/* Search */}
                            <div className="shrink-0 px-4 py-2 border-b border-border/50">
                                <input
                                    type="text"
                                    placeholder={t("search_hero")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg bg-secondary/60 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 outline-none focus:ring-2 focus:ring-ring/20"
                                />
                            </div>

                            {/* Hero grid */}
                            <div className="flex-1 overflow-y-auto relative px-3 py-5">
                                {!isMyTurn && (
                                    <div
                                        className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[3px]"
                                        style={{
                                            background: "rgba(20,22,30,0.6)",
                                        }}
                                    >
                                        <div
                                            className="flex flex-col items-center gap-3 px-6 py-4 rounded-xl"
                                            style={{
                                                background:
                                                    "rgba(15,17,25,0.7)",
                                            }}
                                        >
                                            <Spinner className="w-7 h-7 text-muted-foreground" />
                                            <span className="text-sm font-medium text-foreground/80">
                                                {t("waiting_team", {
                                                    name: opponentName,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                                <div
                                    className="flex flex-wrap gap-1.5 justify-center"
                                    onClick={(e) => {
                                        if (
                                            e.target === e.currentTarget &&
                                            selectedHero
                                        )
                                            setSelectedHero(null);
                                    }}
                                >
                                    {filteredHeroes.map((hero) => {
                                        const isUsed = usedHeroIds.has(hero.id);
                                        const isSelected =
                                            selectedHero?.id === hero.id;
                                        const isDimmed =
                                            selectedHero && !isSelected;
                                        return (
                                            <div
                                                key={hero.id}
                                                className="relative"
                                                style={{
                                                    width: 72,
                                                    height: 120,
                                                }}
                                            >
                                                <button
                                                    disabled={
                                                        isUsed ||
                                                        !isMyTurn ||
                                                        actionLoading
                                                    }
                                                    onClick={() => {
                                                        if (isDimmed) {
                                                            setSelectedHero(
                                                                null,
                                                            );
                                                            return;
                                                        }
                                                        if (!isUsed)
                                                            setSelectedHero(
                                                                hero,
                                                            );
                                                    }}
                                                    onMouseEnter={() => {
                                                        if (isUsed || !isMyTurn)
                                                            return;
                                                        const isBan =
                                                            currentStep?.type ===
                                                            "ban";
                                                        const url =
                                                            getHeroImageUrl(
                                                                hero,
                                                                isBan
                                                                    ? "banned"
                                                                    : "default",
                                                                !isBan,
                                                            );
                                                        if (url) {
                                                            const img =
                                                                new Image();
                                                            img.src = url;
                                                        }
                                                    }}
                                                    className={`absolute inset-0 rounded-lg overflow-hidden transition-all duration-200 ${
                                                        isUsed
                                                            ? `${isDimmed ? 'opacity-[0.08]' : 'opacity-20'} cursor-not-allowed grayscale`
                                                            : isSelected
                                                              ? "z-20 scale-[1.3] shadow-2xl shadow-black/60 brightness-110"
                                                              : isDimmed
                                                                ? "opacity-25 grayscale-50 cursor-pointer"
                                                                : "cursor-pointer hover:scale-110 hover:z-10 hover:shadow-lg hover:shadow-black/40 hover:brightness-110"
                                                    }`}
                                                >
                                                    <HeroCard
                                                        hero={hero}
                                                        gloat={
                                                            isSelected &&
                                                            currentStep?.type !==
                                                                "ban"
                                                        }
                                                        variant={
                                                            isSelected &&
                                                            currentStep?.type ===
                                                                "ban"
                                                                ? "banned"
                                                                : "default"
                                                        }
                                                        className="rounded-none"
                                                        style={{
                                                            width: 72,
                                                            height: 120,
                                                        }}
                                                    />
                                                    {isSelected && (
                                                        <div
                                                            className="absolute inset-0 rounded-lg pointer-events-none"
                                                            style={{
                                                                boxShadow:
                                                                    currentStep?.type ===
                                                                    "ban"
                                                                        ? "inset 0 0 0 2px #ef4444, 0 0 20px rgba(239,68,68,0.3)"
                                                                        : "inset 0 0 0 2px #4ade80, 0 0 20px rgba(74,222,128,0.3)",
                                                            }}
                                                        />
                                                    )}
                                                </button>

                                                {/* Action buttons below selected hero */}
                                                {isSelected &&
                                                    (() => {
                                                        const remaining =
                                                            draft.timer ?? 0;
                                                        const total =
                                                            draft.timer_seconds ??
                                                            0;
                                                        const pct =
                                                            total > 0
                                                                ? Math.max(
                                                                      0,
                                                                      Math.min(
                                                                          100,
                                                                          (remaining /
                                                                              total) *
                                                                              100,
                                                                      ),
                                                                  )
                                                                : 100;
                                                        const isBan =
                                                            currentStep?.type ===
                                                            "ban";
                                                        const btnColor = isBan
                                                            ? "#ef4444"
                                                            : "#4ade80";
                                                        const isLow =
                                                            remaining <= 5 &&
                                                            total > 0;

                                                        return (
                                                            <div
                                                                className="absolute top-full mt-8 left-1/2 -translate-x-1/2 z-30"
                                                                style={{
                                                                    width: 90,
                                                                }}
                                                            >
                                                                {/* Confirm button - full width */}
                                                                <button
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                    onClick={
                                                                        confirmHeroSelect
                                                                    }
                                                                    className="relative w-full h-9 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-40 overflow-hidden transition-opacity hover:opacity-90 flex items-center justify-center"
                                                                    style={{
                                                                        background:
                                                                            btnColor,
                                                                        color: isBan
                                                                            ? "white"
                                                                            : "#052e16",
                                                                    }}
                                                                >
                                                                    {actionLoading ? (
                                                                        <Spinner className="w-3.5 h-3.5" />
                                                                    ) : total >
                                                                      0 ? (
                                                                        `${isBan ? t("ban") : t("pick")} (${String(remaining).padStart(2, "0")})`
                                                                    ) : isBan ? (
                                                                        t("ban")
                                                                    ) : (
                                                                        t(
                                                                            "pick",
                                                                        )
                                                                    )}
                                                                    <div
                                                                        className="absolute bottom-0 left-0 right-0 h-1"
                                                                        style={{
                                                                            background:
                                                                                "rgba(0,0,0,0.3)",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="h-full"
                                                                            style={{
                                                                                width: `${pct}%`,
                                                                                background:
                                                                                    isLow
                                                                                        ? "white"
                                                                                        : "rgba(255,255,255,0.6)",
                                                                                transition:
                                                                                    "width 1s linear",
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </button>
                                                                {/* X button - absolute left */}
                                                                <button
                                                                    onClick={() =>
                                                                        setSelectedHero(
                                                                            null,
                                                                        )
                                                                    }
                                                                    className="absolute right-full mr-1.5 top-0 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:brightness-125"
                                                                    style={{
                                                                        background:
                                                                            "var(--secondary)",
                                                                        color: "var(--muted-foreground)",
                                                                    }}
                                                                >
                                                                    <XIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </main>
                    ) : (
                        <main className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center space-y-4">
                                <div className="text-5xl">{t("gg")}</div>
                                <p className="text-muted-foreground">
                                    {t("draft_finished")}
                                </p>
                            </div>
                        </main>
                    )}

                    {/* Right sidebar: Opponent */}
                    <aside className="lg:w-80 xl:w-85 shrink-0 border-t lg:border-t-0 lg:border-l border-border/50 bg-card/15 p-4 overflow-y-auto">
                        <TeamPicks
                            name={opponentName}
                            color={opponentColor}
                            steps={steps}
                            teamCode={opponentCode}
                            heroes={heroes}
                            align="right"
                        />
                    </aside>
                </div>
            </div>
        </div>
    );
}

// --- Constants ---

const TEAM_A = {
    main: "#c4862e",
    bg: "rgba(196,134,46,0.12)",
    muted: "rgba(196,134,46,0.5)",
    border: "rgba(196,134,46,0.25)",
};
const TEAM_B = {
    main: "#6688cc",
    bg: "rgba(102,136,204,0.12)",
    muted: "rgba(102,136,204,0.5)",
    border: "rgba(102,136,204,0.25)",
};

// --- Sub-components ---

function TeamLabel({
    name,
    color,
    tag,
    align,
}: {
    name: string;
    color: string;
    tag?: string;
    align?: "right";
}) {
    return (
        <div
            className={`flex items-center gap-2 min-w-0 ${align === "right" ? "flex-row-reverse" : ""}`}
        >
            <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: color }}
            />
            <span className="font-bold text-sm truncate">{name}</span>
            {tag && (
                <span className="text-xs text-muted-foreground shrink-0">
                    {tag}
                </span>
            )}
        </div>
    );
}

const FACTION_IMAGES = {
    a: "/images/hidden-king-logo.png",
    b: "/images/archmother-logo.png",
};

function TeamPicks({
    name,
    color,
    steps,
    teamCode,
    heroes,
    tag,
    align = "left",
    gloat = false,
}: {
    name: string;
    color: typeof TEAM_A;
    steps: any[];
    teamCode: string;
    heroes: any[];
    tag?: string;
    align?: "left" | "right";
    gloat?: boolean;
}) {
    const picks = steps.filter(
        (s: any) => s.team === teamCode && s.type === "pick",
    );
    const bans = steps.filter(
        (s: any) => s.team === teamCode && s.type === "ban",
    );
    const alignRight = align === "right";
    const { t } = useI18n();
    const factionImg = FACTION_IMAGES[teamCode as "a" | "b"];

    return (
        <div className="space-y-4">
            {/* Faction logo */}
            {factionImg && (
                <div
                    className={`flex ${alignRight ? "justify-end" : "justify-start"}`}
                >
                    <div
                        className="h-12 w-auto opacity-40"
                        style={{
                          backgroundColor: color.main,
                          maskImage: `url(${factionImg})`,
                          WebkitMaskImage: `url(${factionImg})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: alignRight ? 'right' : 'left',
                          WebkitMaskPosition: alignRight ? 'right' : 'left',
                          aspectRatio: '4/1',
                        }}
                    />
                </div>
            )}
            <div
                className={`flex items-center gap-2 ${alignRight ? "flex-row-reverse" : ""}`}
            >
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: color.main }}
                />
                <span className="font-bold">{name}</span>
                {tag && (
                    <span className="text-xs text-muted-foreground">{tag}</span>
                )}
            </div>

            {/* Picks */}
            <div className="space-y-2">
                <span
                    className={`text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block ${alignRight ? "text-right" : ""}`}
                >
                    {t("picks")}
                </span>
                <div
                    className={`flex flex-wrap gap-2 ${alignRight ? "flex-row-reverse" : ""}`}
                >
                    {picks.map((item: any, i: number) => {
                        const heroData = item.hero?.key
                            ? heroes.find((h: any) => h.id === item.hero.key)
                            : null;
                        return (
                            <div
                                key={i}
                                className="rounded-lg overflow-hidden border-2"
                                style={{
                                    borderColor: heroData
                                        ? color.border
                                        : "var(--border)",
                                    width: 72,
                                    height: 120,
                                }}
                            >
                                <HeroCard
                                    hero={heroData ?? undefined}
                                    gloat={gloat}
                                    className="rounded-none"
                                    style={{ width: 68, height: 116 }}
                                >
                                    {!heroData && item.current && (
                                        <div
                                            className="absolute inset-0 animate-pulse"
                                            style={{ background: color.bg }}
                                        />
                                    )}
                                    {item.auto && heroData && (
                                        <div className="absolute top-1 right-1">
                                            <span className="text-[7px] bg-yellow-500/80 text-black font-bold px-1 rounded">
                                                {t("auto")}
                                            </span>
                                        </div>
                                    )}
                                </HeroCard>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bans */}
            {bans.length > 0 && (
                <div className="space-y-2">
                    <span
                        className={`text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block ${alignRight ? "text-right" : ""}`}
                    >
                        {t("bans")}
                    </span>
                    <div
                        className={`flex flex-wrap gap-2 ${alignRight ? "flex-row-reverse" : ""}`}
                    >
                        {bans.map((item: any, i: number) => {
                            const heroData = item.hero?.key
                                ? heroes.find(
                                      (h: any) => h.id === item.hero.key,
                                  )
                                : null;
                            return (
                                <div
                                    key={i}
                                    className="rounded-lg overflow-hidden opacity-60"
                                    style={{ width: 72, height: 120 }}
                                >
                                    <HeroCard
                                        hero={heroData ?? undefined}
                                        variant="banned"
                                        className="rounded-none"
                                        style={{ width: 72, height: 120 }}
                                    >
                                        {!heroData && item.current && (
                                            <div className="absolute inset-0 animate-pulse bg-red-500/10" />
                                        )}
                                        {item.auto && heroData && (
                                            <div className="absolute top-1 right-1">
                                                <span className="text-[6px] bg-yellow-500/80 text-black font-bold px-0.5 rounded">
                                                    {t("auto")}
                                                </span>
                                            </div>
                                        )}
                                    </HeroCard>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function ReadyBadge({ name, ready }: { name: string; ready: boolean }) {
    return (
        <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={
                ready
                    ? {
                          background: "rgba(74,222,128,0.12)",
                          color: "#4ade80",
                          border: "1px solid rgba(74,222,128,0.25)",
                      }
                    : {
                          background: "rgba(255,255,255,0.05)",
                          color: "#8ba5a8",
                          border: "1px solid rgba(255,255,255,0.1)",
                      }
            }
        >
            {ready ? (
                <CheckIcon className="w-3 h-3" />
            ) : (
                <div className="w-3 h-3 rounded-full border border-current opacity-40" />
            )}
            <span className="truncate max-w-20">{name}</span>
        </div>
    );
}

function Spinner({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            className={`animate-spin ${className}`}
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                className="opacity-25"
            />
            <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                className="opacity-75"
            />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
    );
}
