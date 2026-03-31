"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { LOCALE_LABELS, type Locale } from "@/i18n";

export function Navbar({ active }: { active?: "home" | "new" | "docs" }) {
    const { t } = useI18n();

    return (
        <nav className="shrink-0 border-b border-border/50 bg-card/40 backdrop-blur sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                <Link
                    href="/"
                    className="font-bold text-sm tracking-tight flex items-center gap-2"
                >
                    <Image
                        src="/images/favicon.png"
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5"
                    />
                    Deadlock Draft
                </Link>
                <div className="flex items-center gap-4">
                    <Link
                        href="/new"
                        className={`text-sm transition-colors ${active === "new" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {t("nav_create")}
                    </Link>
                    <Link
                        href="/docs"
                        className={`text-sm transition-colors ${active === "docs" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {t("nav_api")}
                    </Link>
                    <a
                        href="https://github.com/deadlockprobr/draft"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                    </a>
                    <LanguageDropdown />
                </div>
            </div>
        </nav>
    );
}

export function LanguageDropdown() {
    const [open, setOpen] = useState(false);
    const { locale, setLocale } = useI18n();
    const localeKeys = Object.keys(LOCALE_LABELS) as Locale[];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors hover:bg-accent"
                style={{ color: "var(--muted-foreground)" }}
            >
                <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {LOCALE_LABELS[locale]}
                <svg
                    className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>
            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className="absolute right-0 top-full mt-1 z-50 rounded-lg border overflow-hidden py-1"
                        style={{
                            background: "var(--card)",
                            borderColor: "var(--border)",
                        }}
                    >
                        {localeKeys.map((l) => (
                            <button
                                key={l}
                                onClick={() => {
                                    setLocale(l);
                                    setOpen(false);
                                }}
                                className="w-full px-4 py-1.5 text-xs text-left cursor-pointer transition-colors hover:bg-accent"
                                style={{
                                    color:
                                        l === locale
                                            ? "var(--foreground)"
                                            : "var(--muted-foreground)",
                                }}
                            >
                                {LOCALE_LABELS[l]}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
