import { Head, Link, router } from "@inertiajs/react";
import {
    Bell,
    Briefcase,
    Calendar,
    ChevronRight,
    Clock,
    FileText,
    Shield,
    Sparkles,
    UserCheck,
    X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type ComponentType } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MainLayout from "@/layouts/MainLayout";

type AnnouncementType = "info" | "urgent" | "update";

interface Announcement {
    id: string;
    title: string;
    preview: string;
    fullContent: string;
    timestamp: string;
    type: AnnouncementType;
}

interface BackendPolicy {
    id: string;
    name: string;
    slug: string;
    tag: string | null;
    href: string;
}

interface CeoMessage {
    body: string;
    authorName: string;
    authorTitle: string;
    imageUrl: string | null;
}

interface MyReachAllPageProps {
    userName: string;
    employeeStage: string;
    currentDate: string;
    announcements: Announcement[];
    pendingAckCount: number;
    policies: BackendPolicy[];
    ceoMessage: CeoMessage | null;
}

interface DisplayPolicy {
    id: string;
    name: string;
    href: string;
    tag: string | null;
    icon: ComponentType<{ className?: string }>;
}

/** Static fallback if the backend has no published, ack-required content yet. */
const FALLBACK_POLICIES: DisplayPolicy[] = [
    { id: "leave-policy", name: "Leave Policy", href: "/leave", icon: Calendar, tag: "Updated" },
    { id: "code-of-conduct", name: "Code of Conduct", href: "/content?category=policies", icon: Shield, tag: null },
    { id: "remote-work", name: "Remote Work", href: "/content?category=policies", icon: Briefcase, tag: "New" },
    { id: "performance-review", name: "Performance Review", href: "/performance/cycles", icon: UserCheck, tag: null },
];

const POLICY_ICONS: ComponentType<{ className?: string }>[] = [Calendar, Shield, Briefcase, UserCheck];

const FALLBACK_CEO: CeoMessage = {
    body:
        "I want to express my deepest gratitude for your exceptional performance this quarter. The results we've achieved together reflect the innovative spirit and dedication that defines ReachAll. Your commitment to excellence and collaborative approach has driven our success beyond expectations.\n\nAs we move forward into the next quarter, I'm confident that with your continued passion, expertise, and forward-thinking mindset, we will reach new heights together. I'm incredibly proud to lead such a talented and driven team. Thank you for your outstanding contributions.",
    authorName: "Charles Simmons",
    authorTitle: "Chief Executive Officer",
    imageUrl: null,
};

function announcementColor(type: AnnouncementType): string {
    switch (type) {
        case "urgent":
            return "#ef4444";
        case "update":
            return "#FFD400";
        default:
            return "#22c55e";
    }
}

function announcementHeadingClass(type: AnnouncementType): string {
    switch (type) {
        case "urgent":
            return "text-red-400";
        case "update":
            return "text-[#FFD400]";
        default:
            return "text-emerald-300";
    }
}

export default function MyReachAllPage({
    userName,
    currentDate,
    announcements,
    pendingAckCount,
    policies,
    ceoMessage,
}: MyReachAllPageProps) {
    const [selectedPolicy, setSelectedPolicy] = useState<DisplayPolicy | null>(null);
    const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);

    // Force dark mode on this route so the design matches the screenshot
    // regardless of the user's saved appearance. Restore the prior class on
    // unmount so the rest of the app keeps the user's preference.
    useEffect(() => {
        const html = document.documentElement;
        const wasDark = html.classList.contains("dark");
        if (!wasDark) html.classList.add("dark");
        return () => {
            if (!wasDark) html.classList.remove("dark");
        };
    }, []);

    const firstName = userName.split(" ")[0] ?? userName;
    const visibleAnnouncements = announcements.slice(0, 4);

    const displayPolicies: DisplayPolicy[] = useMemo(() => {
        if (policies.length === 0) return FALLBACK_POLICIES;
        return policies.map((p, index) => ({
            id: p.id,
            name: p.name,
            href: p.href,
            tag: p.tag,
            icon: POLICY_ICONS[index % POLICY_ICONS.length],
        }));
    }, [policies]);

    const ceo = ceoMessage ?? FALLBACK_CEO;
    const ceoParagraphs = ceo.body.split(/\n+/).filter((p) => p.trim().length > 0);

    return (
        <MainLayout activePage="my-reachall">
            <Head title="My ReachAll" />

            <div className="space-y-8">
                {/* Welcome header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-start justify-between gap-4"
                >
                    <div>
                        <h1 className="mb-1 text-3xl font-bold text-foreground md:text-4xl">
                            Welcome back, {firstName} <span aria-hidden>👋</span>
                        </h1>
                        <p className="text-base text-muted-foreground">Here's what's happening today</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">{currentDate}</p>
                        {pendingAckCount > 0 && (
                            <Badge
                                variant="outline"
                                className="mt-2 border-[#FFD400] text-[#FFD400]"
                            >
                                {pendingAckCount} {pendingAckCount === 1 ? "policy" : "policies"} pending
                            </Badge>
                        )}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                    {/* LEFT — Updates + Quick Policies */}
                    <div className="space-y-8 lg:col-span-7">
                        {/* Updates */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-lg">
                                    <Bell className="h-5 w-5 text-[#22c55e]" aria-hidden />
                                    <span className="text-[#22c55e] font-medium">Updates</span>
                                </h2>
                                <Button asChild variant="ghost" className="h-auto p-0 text-sm hover:bg-transparent">
                                    <Link href="/bulletins" className="text-muted-foreground hover:text-[#22c55e]">
                                        View All
                                    </Link>
                                </Button>
                            </div>

                            {visibleAnnouncements.length === 0 ? (
                                <Card className="border-dashed bg-card/40 p-8 text-center text-muted-foreground">
                                    No announcements right now. New bulletins will show up here.
                                </Card>
                            ) : (
                                <div>
                                    {visibleAnnouncements.map((announcement, index) => {
                                        const isExpanded = expandedAnnouncement === announcement.id;
                                        const isLast = index === visibleAnnouncements.length - 1;
                                        return (
                                            <motion.div
                                                key={announcement.id}
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.06 + index * 0.04 }}
                                            >
                                                <button
                                                    type="button"
                                                    aria-expanded={isExpanded}
                                                    onClick={() =>
                                                        setExpandedAnnouncement(isExpanded ? null : announcement.id)
                                                    }
                                                    className={`group -mx-2 w-full rounded-lg px-2 py-4 text-left transition-colors hover:bg-card/60 ${
                                                        isLast ? "" : "border-b border-border/60"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <motion.span
                                                            aria-hidden
                                                            className="mt-2 h-2 w-2 flex-shrink-0 rounded-full"
                                                            style={{ backgroundColor: announcementColor(announcement.type) }}
                                                            animate={
                                                                announcement.type === "urgent"
                                                                    ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                                                                    : {}
                                                            }
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <h3
                                                                className={`mb-1 text-base font-medium ${announcementHeadingClass(
                                                                    announcement.type,
                                                                )}`}
                                                            >
                                                                {announcement.title}
                                                            </h3>
                                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                                {isExpanded ? announcement.fullContent : announcement.preview}
                                                            </p>
                                                            {isExpanded && (
                                                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <Clock className="h-3 w-3" aria-hidden />
                                                                    <span>{announcement.timestamp}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <ChevronRight
                                                            aria-hidden
                                                            className={`mt-1 h-4 w-4 text-muted-foreground transition-transform ${
                                                                isExpanded ? "rotate-90" : ""
                                                            }`}
                                                        />
                                                    </div>
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.section>

                        {/* Quick Policies */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <h2 className="mb-4 flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5 text-[#22c55e]" aria-hidden />
                                <span className="font-medium text-foreground">Quick Policies</span>
                            </h2>

                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                {displayPolicies.map((policy, index) => {
                                    const Icon = policy.icon;
                                    return (
                                        <motion.div
                                            key={policy.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 + index * 0.05 }}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Card
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setSelectedPolicy(policy)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter" || event.key === " ") {
                                                        event.preventDefault();
                                                        setSelectedPolicy(policy);
                                                    }
                                                }}
                                                className="group h-full cursor-pointer border-border/60 bg-card/60 p-4 transition-all hover:border-[#22c55e]/50 hover:bg-card focus-visible:ring-2 focus-visible:ring-[#22c55e] focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                                            >
                                                <div className="flex h-full flex-col items-center text-center">
                                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#1F6E4A] transition-colors group-hover:bg-[#22c55e]">
                                                        <Icon className="h-6 w-6 text-white" aria-hidden />
                                                    </div>
                                                    {policy.tag && (
                                                        <Badge className="mb-2 bg-[#FFD400] px-2 py-0.5 text-xs text-[#1F2937] hover:bg-[#FFD400]">
                                                            {policy.tag}
                                                        </Badge>
                                                    )}
                                                    <p className="text-sm leading-tight font-medium text-foreground">
                                                        {policy.name}
                                                    </p>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.section>
                    </div>

                    {/* RIGHT — Message from the CEO */}
                    <motion.aside
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-5"
                    >
                        <Card className="h-full border-[#1F6E4A]/30 bg-gradient-to-br from-[#0d3a2a]/40 to-[#0a2419]/30 p-6">
                            <h3 className="mb-6 flex items-center gap-2 text-base font-medium text-foreground">
                                <Sparkles className="h-4 w-4 text-[#22c55e]" aria-hidden />
                                Message from the CEO
                            </h3>

                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 scale-110 rounded-full bg-[#1F6E4A]/30 blur-2xl" aria-hidden />
                                    <div className="relative h-40 w-40 overflow-hidden rounded-full border-2 border-[#1F6E4A]/50 shadow-2xl shadow-[#1F6E4A]/40 md:h-44 md:w-44">
                                        {ceo.imageUrl ? (
                                            // eslint-disable-next-line jsx-a11y/img-redundant-alt
                                            <img
                                                src={ceo.imageUrl}
                                                alt={`Portrait of ${ceo.authorName}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1F6E4A] to-[#15543a] text-4xl font-semibold text-white">
                                                {ceo.authorName
                                                    .split(" ")
                                                    .map((p) => p[0])
                                                    .join("")
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 text-left">
                                    {ceoParagraphs.map((paragraph, idx) => (
                                        <p key={idx} className="text-sm leading-relaxed text-muted-foreground">
                                            “{paragraph}”
                                        </p>
                                    ))}
                                </div>

                                <div className="mt-6 w-full border-t border-[#1F6E4A]/30 pt-4">
                                    <p className="text-base font-medium text-foreground">{ceo.authorName}</p>
                                    <p className="text-xs text-muted-foreground">{ceo.authorTitle}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.aside>
                </div>
            </div>

            {/* ── Policy side drawer ─────────────────────────────────────── */}
            <AnimatePresence>
                {selectedPolicy && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPolicy(null)}
                            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
                            aria-hidden
                        />
                        <motion.aside
                            role="dialog"
                            aria-modal="true"
                            aria-label={selectedPolicy.name}
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 26, stiffness: 220 }}
                            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl"
                        >
                            <div className="border-b border-[#1F6E4A]/30 bg-gradient-to-r from-[#1F6E4A] to-[#15543a] p-6 text-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                                            <selectedPolicy.icon className="h-6 w-6 text-white" aria-hidden />
                                        </div>
                                        <div>
                                            <h2 className="mb-1 text-xl">{selectedPolicy.name}</h2>
                                            <p className="text-sm text-white/80">Quick policy reference</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedPolicy(null)}
                                        aria-label="Close"
                                        className="text-white hover:bg-white/20"
                                    >
                                        <X className="h-5 w-5" aria-hidden />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                <p className="leading-relaxed text-muted-foreground">
                                    Open the full policy page for the most up-to-date version, including
                                    sections on eligibility, scope, and acknowledgement requirements.
                                </p>
                            </div>

                            <div className="flex gap-3 border-t border-border bg-muted/30 p-6">
                                <Button
                                    className="flex-1 bg-[#1F6E4A] text-white hover:bg-[#15543a]"
                                    onClick={() => {
                                        const href = selectedPolicy.href;
                                        setSelectedPolicy(null);
                                        router.visit(href);
                                    }}
                                >
                                    Open full page
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-2"
                                    onClick={() => setSelectedPolicy(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </MainLayout>
    );
}
