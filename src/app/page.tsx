"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useI18n } from "@/i18n/context";

export default function HomePage() {
    const { t } = useI18n();

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar active="home" />

            {/* Hero */}
            <main className="flex-1 flex items-center justify-center py-16 p-6">
                <div className="max-w-3xl w-full text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                            {t("home_title")}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                            {t("home_subtitle")}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <Link
                            href="/new"
                            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                            style={{
                                background:
                                    "linear-gradient(135deg, #c4862e 0%, #6688cc 100%)",
                                color: "#fff",
                            }}
                        >
                            {t("home_create")}
                        </Link>
                        <Link
                            href="/docs"
                            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl font-bold text-sm bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                        >
                            {t("home_api")}
                        </Link>
                    </div>

                    {/* Preview */}
                    <div className="pt-8">
                        <div className="rounded-xl border border-border/50 overflow-hidden shadow-2xl shadow-black/30">
                            <Image
                                src="/images/preview.png"
                                alt="Draft tool preview"
                                width={1400}
                                height={800}
                                className="w-full h-auto"
                                priority
                            />
                        </div>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
                        <FeatureCard
                            title={t("home_feature_realtime")}
                            description={t("home_feature_realtime_desc")}
                        />
                        <FeatureCard
                            title={t("home_feature_stream")}
                            description={t("home_feature_stream_desc")}
                        />
                        <FeatureCard
                            title={t("home_feature_api")}
                            description={t("home_feature_api_desc")}
                        />
                    </div>
                </div>
            </main>

            <Footer showStats />
        </div>
    );
}

function FeatureCard({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-border/50 bg-card/30 p-5 text-left space-y-2">
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}
