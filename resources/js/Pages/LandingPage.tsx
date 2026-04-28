import { Head } from "@inertiajs/react";
import {
    ArrowRight,
    Award,
    BarChart3,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    Globe,
    HeadphonesIcon,
    Rocket,
    Shield,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Public landing page (route GET /).
 *
 * Authenticated users are redirected to /my-reachall by routes/web.php
 * before this component renders.
 *
 * brand exception: this page is shown to guests with no theme cookie set,
 * so the design is locked to a light surface palette with deliberate
 * forest-green and amber gradient stops (`#1F6E4A`, `#15543a`, `#FFD400`).
 * These do not derive from the runtime `--brand` token because the page is
 * frozen against any future re-theme — the marketing visual must stay
 * pixel-stable across the app's dark-mode toggle.
 */
export default function LandingPage() {
    const features = [
        {
            icon: Users,
            title: "Employee Dashboard",
            description:
                "Centralized hub for all employee data, activities, and insights in real-time.",
        },
        {
            icon: BarChart3,
            title: "Performance Tracking",
            description:
                "Track goals, evaluations, and team performance with powerful analytics.",
        },
        {
            icon: Award,
            title: "Recognition System",
            description:
                "Celebrate achievements and build a culture of appreciation and growth.",
        },
        {
            icon: FileText,
            title: "Employee Records",
            description:
                "Secure, organized storage for all personnel files and documents.",
        },
    ];

    const targetAudience = [
        {
            icon: Rocket,
            title: "Startups",
            description:
                "Streamline HR from day one with easy setup and intuitive tools designed for agility.",
        },
        {
            icon: Building2,
            title: "Small Businesses",
            description:
                "Manage your growing team efficiently without the complexity of enterprise software.",
        },
        {
            icon: TrendingUp,
            title: "Growing Teams",
            description:
                "Scale seamlessly as you hire, with workflows that adapt to your team size.",
        },
        {
            icon: Globe,
            title: "Enterprises",
            description:
                "Enterprise-grade security and compliance with powerful customization options.",
        },
    ];

    const pricingPlans = [
        {
            name: "Basic plan",
            price: "$15",
            period: "per user",
            billing: "Billed monthly or $144 yearly",
            highlighted: false,
            features: [
                "Everything you need to get started",
                "Employee dashboard access",
                "Up to 25 individual users",
                "Up to 10 team members",
                "Email technical support",
                "Basic chat and email support",
            ],
        },
        {
            name: "Business plan",
            price: "$35",
            period: "per user",
            billing: "Billed monthly or $336 yearly",
            highlighted: true,
            features: [
                "Everything in Basic plan, plus...",
                "Advanced analytics dashboard",
                "Up to 100 individual users",
                "Up to 50 team members",
                "API access and integrations",
                "Priority chat and email support",
            ],
        },
        {
            name: "Enterprise plan",
            price: "$65",
            period: "per user",
            billing: "Billed monthly or $624 yearly",
            highlighted: false,
            features: [
                "Everything in Business plan, plus...",
                "Unlimited individual users",
                "Advanced custom fields",
                "Unlimited team members",
                "Personalized onboarding",
                "Personalized priority service",
            ],
        },
    ];

    const trustStats = [
        { icon: Clock, label: "24/7 Support", value: "Always here" },
        { icon: Zap, label: "Fast Setup", value: "5 minutes" },
        { icon: HeadphonesIcon, label: "Onboarding", value: "Included" },
        { icon: Award, label: "Satisfaction", value: "98%" },
    ];

    return (
        <div className="min-h-screen bg-[#F5F7F8] text-[#1F2937]">
            <Head title="ReachAll Hub — All-in-One HR Platform" />

            {/* ── Header ─────────────────────────────────────────────────── */}
            <header className="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
                <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
                    <div className="flex items-center justify-between">
                        <a href="/" className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1F6E4A] to-[#15543a] shadow-lg shadow-[#1F6E4A]/30">
                                <span className="font-bold text-white">RA</span>
                            </div>
                            <div>
                                <p className="text-base font-bold text-[#1F2937]">ReachAll</p>
                                <p className="text-xs text-gray-500">HR Platform</p>
                            </div>
                        </a>

                        <nav className="flex items-center gap-2 sm:gap-4">
                            <Button asChild variant="ghost" className="text-gray-700 hover:bg-transparent hover:text-[#1F6E4A]">
                                <a href="/login">Log in</a>
                            </Button>
                            <Button
                                asChild
                                className="bg-gradient-to-r from-[#1F6E4A] to-[#15543a] text-white shadow-lg shadow-[#1F6E4A]/30 hover:from-[#15543a] hover:to-[#0f3d28]"
                            >
                                <a href="/login">Get Started Free</a>
                            </Button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2419] via-[#0d3a2a] to-[#1F6E4A] pt-32 pb-20">
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                    }}
                />
                <div aria-hidden className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[#1F6E4A]/30 blur-3xl" />
                <div aria-hidden className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-[#15543a]/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        {/* Left — copy */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Badge className="mb-6 bg-[#FFD400] px-4 py-1 text-[#1F2937] hover:bg-[#FFD400]">
                                ✨ Trusted by 500+ Companies
                            </Badge>

                            <h1 className="mb-6 text-4xl leading-tight font-bold text-white md:text-5xl lg:text-6xl">
                                Your All-in-One HR Platform for Modern Teams
                            </h1>

                            <p className="mb-8 text-lg leading-relaxed text-white/80 md:text-xl">
                                Manage recruitment, payroll, performance, and employee data — all
                                in one place. Built to scale with your team.
                            </p>

                            <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-[#FFD400] px-8 font-semibold text-[#1F2937] shadow-xl shadow-[#FFD400]/30 hover:bg-[#e6c000]"
                                >
                                    <a href="/login">
                                        Get Started Free
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white px-8 font-semibold text-[#1F6E4A] shadow-lg hover:bg-white/90"
                                >
                                    <a href="/login">Book a Demo</a>
                                </Button>
                            </div>

                            <ul className="flex flex-wrap items-center gap-6 text-sm text-white/70">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-[#FFD400]" aria-hidden />
                                    <span>No credit card required</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-[#FFD400]" aria-hidden />
                                    <span>14-day free trial</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-[#FFD400]" aria-hidden />
                                    <span>Cancel anytime</span>
                                </li>
                            </ul>
                        </motion.div>

                        {/* Right — laptop mockup */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="relative hidden lg:block"
                        >
                            <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-2 shadow-2xl">
                                <div className="overflow-hidden rounded-lg border-4 border-gray-800 bg-[#0a0a0a]">
                                    <div className="aspect-video bg-gradient-to-br from-[#1F6E4A]/20 to-[#15543a]/10 p-4">
                                        <div className="h-full space-y-3 rounded-lg bg-[#0a0a0a] p-4">
                                            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1F6E4A] to-[#15543a]" />
                                                    <div>
                                                        <div className="h-2 w-20 rounded bg-gray-700" />
                                                        <div className="mt-1 h-1.5 w-16 rounded bg-gray-800" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[1, 2, 3].map((i) => (
                                                    <div
                                                        key={i}
                                                        className="rounded-lg border border-[#1F6E4A]/20 bg-gradient-to-br from-[#1F6E4A]/20 to-[#15543a]/10 p-2"
                                                    >
                                                        <div className="mb-2 h-1.5 w-12 rounded bg-gray-700" />
                                                        <div className="h-3 w-8 rounded bg-[#1F6E4A]" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-2">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="flex items-center gap-2 rounded bg-gray-900/50 p-2">
                                                        <div className="h-6 w-6 rounded bg-[#1F6E4A]/30" />
                                                        <div className="flex-1 space-y-1">
                                                            <div className="h-1.5 w-full rounded bg-gray-700" />
                                                            <div className="h-1 w-2/3 rounded bg-gray-800" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating chip — Performance */}
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-6 -left-6 rounded-2xl bg-white p-4 shadow-2xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1F6E4A] to-[#15543a]">
                                        <TrendingUp className="h-5 w-5 text-white" aria-hidden />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Performance</p>
                                        <p className="text-lg font-bold text-[#1F6E4A]">+25%</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Floating chip — Team Members */}
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -right-6 -bottom-6 rounded-2xl bg-white p-4 shadow-2xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD400] to-[#e6c000]">
                                        <Users className="h-5 w-5 text-[#1F2937]" aria-hidden />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Team Members</p>
                                        <p className="text-lg font-bold text-[#1F2937]">150+</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Features ──────────────────────────────────────────────── */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16 text-center"
                    >
                        <h2 className="mb-4 text-3xl font-bold text-[#1F2937] md:text-4xl">
                            Everything you need to manage your workforce
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
                            Powerful features designed to simplify HR management and empower your team
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="group h-full border-2 p-6 transition-all duration-300 hover:border-[#1F6E4A]/30 hover:shadow-xl">
                                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1F6E4A] to-[#15543a] transition-transform group-hover:scale-110">
                                            <Icon className="h-7 w-7 text-white" aria-hidden />
                                        </div>
                                        <h3 className="mb-3 text-xl font-semibold text-[#1F2937]">{feature.title}</h3>
                                        <p className="leading-relaxed text-gray-600">{feature.description}</p>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Trust card ────────────────────────────────────────────── */}
            <section className="bg-[#F5F7F8] py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-[#1F6E4A] to-[#15543a] p-8 text-white md:p-12">
                            <div
                                aria-hidden
                                className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage:
                                        "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
                                    backgroundSize: "30px 30px",
                                }}
                            />

                            <div className="relative grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                                <div>
                                    <Badge className="mb-4 bg-[#FFD400] text-[#1F2937] hover:bg-[#FFD400]">🔒 Trusted & Secure</Badge>
                                    <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                                        Join 500+ companies managing their teams with ReachAll
                                    </h2>
                                    <p className="mb-6 text-lg text-white/90 md:text-xl">
                                        Enterprise-grade security, compliance-ready, and built for teams that are
                                        serious about growth.
                                    </p>
                                    <div className="mb-8 flex flex-wrap items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-[#FFD400]" aria-hidden />
                                            <span className="text-white/90">SOC 2 Certified</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-[#FFD400]" aria-hidden />
                                            <span className="text-white/90">GDPR Compliant</span>
                                        </div>
                                    </div>
                                    <Button
                                        asChild
                                        size="lg"
                                        className="bg-[#FFD400] px-8 font-semibold text-[#1F2937] shadow-xl hover:bg-[#e6c000]"
                                    >
                                        <a href="/login">
                                            Start Your Free Trial
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </a>
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {trustStats.map((stat, index) => {
                                        const Icon = stat.icon;
                                        return (
                                            <motion.div
                                                key={stat.label}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: index * 0.1 }}
                                                className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm"
                                            >
                                                <Icon className="mb-2 h-7 w-7 text-[#FFD400]" aria-hidden />
                                                <p className="mb-1 text-xl font-bold">{stat.value}</p>
                                                <p className="text-sm text-white/80">{stat.label}</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* ── Product showcase ──────────────────────────────────────── */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16"
                    >
                        {/* Left — large dark dashboard mockup */}
                        <div className="relative">
                            <div className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-2xl">
                                <div className="space-y-4 bg-[#0a0a0a] p-6">
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded bg-[#1F6E4A]" />
                                            <div>
                                                <div className="h-2 w-24 rounded bg-gray-700" />
                                                <div className="mt-1 h-1.5 w-16 rounded bg-gray-800" />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-6 w-12 rounded bg-gray-800" />
                                            <div className="h-6 w-6 rounded-full bg-[#1F6E4A]/40" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="space-y-2 rounded-lg border border-[#1F6E4A]/30 bg-[#0d2418] p-3">
                                                <div className="h-1.5 w-10 rounded bg-gray-700" />
                                                <div className="h-4 w-14 rounded bg-[#1F6E4A]" />
                                                <div className="h-1 w-12 rounded bg-gray-800" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rounded-lg border border-gray-800 bg-[#111] p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="h-2 w-24 rounded bg-gray-700" />
                                            <div className="h-2 w-12 rounded bg-[#FFD400]/40" />
                                        </div>
                                        <div className="flex h-24 items-end gap-2">
                                            {[40, 65, 50, 80, 70, 90, 60].map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 rounded-t bg-gradient-to-t from-[#1F6E4A] to-[#1F6E4A]/40"
                                                    style={{ height: `${h}%` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="flex items-center gap-3 rounded bg-gray-900/40 p-2">
                                                <div className="h-7 w-7 rounded-full bg-[#1F6E4A]/40" />
                                                <div className="flex-1">
                                                    <div className="h-2 w-3/4 rounded bg-gray-700" />
                                                    <div className="mt-1 h-1.5 w-1/2 rounded bg-gray-800" />
                                                </div>
                                                <div className="h-2 w-10 rounded bg-gray-800" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div aria-hidden className="absolute -right-8 -bottom-8 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1F6E4A]/20 to-[#15543a]/10 blur-3xl" />
                        </div>

                        {/* Right — copy */}
                        <div>
                            <h2 className="mb-8 text-3xl font-bold text-[#1F2937] md:text-4xl">
                                Built to simplify your HR operations
                            </h2>
                            <div className="mb-8 space-y-6">
                                {[
                                    {
                                        icon: Users,
                                        title: "Centralized employee data",
                                        body: "Access all employee information, records, and activities from a single, unified dashboard.",
                                    },
                                    {
                                        icon: BarChart3,
                                        title: "Real-time analytics",
                                        body: "Make data-driven decisions with live insights into team performance and metrics.",
                                    },
                                    {
                                        icon: Users,
                                        title: "Seamless team collaboration",
                                        body: "Enable better communication and coordination across departments and teams.",
                                    },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.title} className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1F6E4A] to-[#15543a]">
                                                <Icon className="h-6 w-6 text-white" aria-hidden />
                                            </div>
                                            <div>
                                                <h3 className="mb-2 text-xl font-semibold text-[#1F2937]">{item.title}</h3>
                                                <p className="leading-relaxed text-gray-600">{item.body}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <Button
                                asChild
                                size="lg"
                                className="bg-gradient-to-r from-[#1F6E4A] to-[#15543a] px-8 text-white shadow-lg shadow-[#1F6E4A]/30 hover:from-[#15543a] hover:to-[#0f3d28]"
                            >
                                <a href="/login">
                                    Explore Features
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </a>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Audience tiers ────────────────────────────────────────── */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16 text-center"
                    >
                        <h2 className="mb-4 text-3xl font-bold text-[#1F2937] md:text-4xl">Built for teams of every size</h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
                            Whether you're a startup or an enterprise, ReachAll scales with your needs
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {targetAudience.map((audience, index) => {
                            const Icon = audience.icon;
                            return (
                                <motion.div
                                    key={audience.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#1F6E4A]/20 bg-gradient-to-br from-[#1F6E4A]/10 to-[#15543a]/5">
                                        <Icon className="h-10 w-10 text-[#1F6E4A]" aria-hidden />
                                    </div>
                                    <h3 className="mb-3 text-xl font-semibold text-[#1F2937]">{audience.title}</h3>
                                    <p className="leading-relaxed text-gray-600">{audience.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Pricing ───────────────────────────────────────────────── */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12 text-center"
                    >
                        <h2 className="mb-4 text-3xl font-bold text-[#1F2937] md:text-4xl">
                            We've got a plan that's perfect for you
                        </h2>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <Badge className="bg-[#1F2937] px-4 py-1.5 text-white hover:bg-[#1F2937]">Monthly billing</Badge>
                            <Badge variant="outline" className="border-gray-300 px-4 py-1.5 text-gray-600 hover:bg-gray-50">
                                Annual billing
                            </Badge>
                        </div>
                    </motion.div>

                    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
                        {pricingPlans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card
                                    className={`relative h-full border-2 p-8 ${
                                        plan.highlighted
                                            ? "bg-gradient-to-br from-[#1F6E4A] to-[#15543a] border-[#1F6E4A] text-white"
                                            : "border-gray-200 bg-white"
                                    }`}
                                >
                                    {plan.highlighted && (
                                        <Badge className="absolute -top-3 left-8 border-none bg-[#FFD400] px-3 py-1 text-[#1F2937] hover:bg-[#FFD400]">
                                            Popular
                                        </Badge>
                                    )}

                                    <div className="mb-8">
                                        <h3 className={`mb-6 text-lg font-semibold ${plan.highlighted ? "text-white" : "text-[#1F2937]"}`}>
                                            {plan.name}
                                        </h3>
                                        <div className="mb-2">
                                            <span className={`text-5xl font-bold ${plan.highlighted ? "text-white" : "text-[#1F2937]"}`}>
                                                {plan.price}
                                            </span>
                                            <span className={`ml-1 text-lg ${plan.highlighted ? "text-white/80" : "text-gray-600"}`}>
                                                {plan.period}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${plan.highlighted ? "text-white/70" : "text-gray-600"}`}>{plan.billing}</p>
                                    </div>

                                    <div className="mb-8 space-y-3">
                                        <Button
                                            asChild
                                            className={`w-full ${
                                                plan.highlighted
                                                    ? "bg-[#FFD400] font-semibold text-[#1F2937] shadow-lg hover:bg-[#e6c000]"
                                                    : "bg-[#1F2937] text-white hover:bg-[#15543a]"
                                            }`}
                                        >
                                            <a href="/login">Get started</a>
                                        </Button>
                                        <Button
                                            asChild
                                            variant={plan.highlighted ? "secondary" : "outline"}
                                            className={`w-full ${
                                                plan.highlighted
                                                    ? "bg-white font-semibold text-[#1F6E4A] hover:bg-white/90"
                                                    : "border-gray-300 bg-white text-[#1F2937] hover:bg-gray-50"
                                            }`}
                                        >
                                            <a href="/login">Chat to sales</a>
                                        </Button>
                                    </div>

                                    <div
                                        className="border-t pt-6"
                                        style={{ borderColor: plan.highlighted ? "rgba(255,255,255,0.2)" : "#e5e7eb" }}
                                    >
                                        <h4 className={`mb-4 text-sm font-semibold ${plan.highlighted ? "text-white" : "text-[#1F2937]"}`}>
                                            FEATURES
                                        </h4>
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <CheckCircle2
                                                        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${plan.highlighted ? "text-white" : "text-[#1F6E4A]"}`}
                                                        aria-hidden
                                                    />
                                                    <span className={`text-sm ${plan.highlighted ? "text-white/90" : "text-gray-600"}`}>
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer className="bg-gradient-to-br from-[#0a2419] via-[#0d3a2a] to-[#1F6E4A] py-16 text-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mb-12 grid grid-cols-2 gap-12 md:grid-cols-4">
                        <div>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFD400]">
                                    <span className="font-bold text-[#1F2937]">RA</span>
                                </div>
                                <div>
                                    <p className="text-base font-bold">ReachAll</p>
                                    <p className="text-xs text-white/60">HR Platform</p>
                                </div>
                            </div>
                            <p className="text-sm text-white/70">The all-in-one HR platform for modern teams.</p>
                        </div>

                        {[
                            { title: "Product", items: ["Features", "Pricing", "Security", "Roadmap"] },
                            { title: "Company", items: ["About", "Blog", "Careers", "Contact"] },
                            { title: "Support", items: ["Help Center", "Documentation", "API Reference", "Status"] },
                        ].map((col) => (
                            <div key={col.title}>
                                <h4 className="mb-4 font-semibold">{col.title}</h4>
                                <ul className="space-y-2 text-sm text-white/70">
                                    {col.items.map((item) => (
                                        <li key={item}>
                                            <a href="#" className="transition-colors hover:text-white">
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/10 pt-8">
                        <div className="flex flex-col items-center justify-between gap-4 text-sm text-white/60 md:flex-row">
                            <p>© {new Date().getFullYear()} ReachAll. All rights reserved.</p>
                            <div className="flex flex-wrap items-center gap-6">
                                <a href="#" className="transition-colors hover:text-white">Privacy Policy</a>
                                <a href="#" className="transition-colors hover:text-white">Terms of Service</a>
                                <a href="#" className="transition-colors hover:text-white">Cookie Policy</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
