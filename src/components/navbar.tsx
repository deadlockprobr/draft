"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { LOCALE_LABELS, type Locale } from "@/i18n";

export function Navbar({ active }: { active?: "home" | "new" | "docs" }) {
    const { t } = useI18n();
    const [mobileOpen, setMobileOpen] = useState(false);

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

                {/* Desktop nav */}
                <div className="hidden sm:flex items-center gap-4">
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
                    <LanguageDropdown />
                </div>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="sm:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    aria-label="Menu"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {mobileOpen ? (
                            <path d="M18 6L6 18M6 6l12 12" />
                        ) : (
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="sm:hidden border-t border-border/50 bg-card/80 backdrop-blur">
                    <div className="max-w-5xl mx-auto px-6 py-3 flex flex-col gap-1">
                        <Link
                            href="/"
                            onClick={() => setMobileOpen(false)}
                            className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${active === "home" ? "text-foreground font-medium bg-accent/50" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`}
                        >
                            {t("nav_home")}
                        </Link>
                        <Link
                            href="/new"
                            onClick={() => setMobileOpen(false)}
                            className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${active === "new" ? "text-foreground font-medium bg-accent/50" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`}
                        >
                            {t("nav_create")}
                        </Link>
                        <Link
                            href="/docs"
                            onClick={() => setMobileOpen(false)}
                            className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${active === "docs" ? "text-foreground font-medium bg-accent/50" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`}
                        >
                            {t("nav_api")}
                        </Link>
                        <div className="px-3 py-2">
                            <LanguageDropdown />
                        </div>
                    </div>
                </div>
            )}
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
