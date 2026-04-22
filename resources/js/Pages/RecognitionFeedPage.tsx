import MainLayout from "@/layouts/MainLayout";
import { router, useForm, usePage } from "@inertiajs/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  Users,
  Lightbulb,
  Crown,
  Megaphone,
  ArrowRight,
  PlusCircle,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitize";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecognitionCard {
  id: number;
  badge_type: string;
  message: string;
  is_public: boolean;
  created_at: string;
  sender: { name: string; department: string | null; position: string | null; initials: string };
  receiver: { name: string; department: string | null; position: string | null; initials: string };
}

interface UserOption {
  id: number;
  name: string;
  department: string | null;
  position: string | null;
  initials: string;
}

interface PaginatedRecognitions {
  data: RecognitionCard[];
  current_page: number;
  last_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface RecognitionFeedPageProps {
  recognitions: PaginatedRecognitions;
  users: UserOption[];
  filters: { badge_type: string };
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; pill: string }
> = {
  shoutout:         { label: "Shout-out",       icon: Megaphone,  color: "text-blue-500",   pill: "bg-blue-100 text-blue-700 border-blue-200" },
  teamwork:         { label: "Teamwork",         icon: Users,      color: "text-[#1F6E4A]",  pill: "bg-green-100 text-green-700 border-green-200" },
  innovation:       { label: "Innovation",       icon: Lightbulb,  color: "text-amber-500",  pill: "bg-amber-100 text-amber-700 border-amber-200" },
  leadership:       { label: "Leadership",       icon: Crown,      color: "text-purple-500", pill: "bg-purple-100 text-purple-700 border-purple-200" },
  above_and_beyond: { label: "Above & Beyond",   icon: Star,       color: "text-yellow-500", pill: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

const BADGE_TABS = [
  { value: "all", label: "All" },
  ...Object.entries(BADGE_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
];

// ─── Give Recognition Dialog ──────────────────────────────────────────────────

function GiveRecognitionDialog({ users }: { users: UserOption[] }) {
  const [open, setOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const { flash } = usePage<{ flash?: { success?: string } }>().props;

  const { data, setData, post, processing, errors, reset } = useForm({
    to_user_id: "",
    badge_type: "",
    message: "",
  });

  useEffect(() => {
    if (flash?.success && open) {
      setOpen(false);
      reset();
      setUserSearch("");
    }
  }, [flash?.success]);

  const filteredUsers = userSearch.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          (u.department ?? "").toLowerCase().includes(userSearch.toLowerCase()),
      )
    : users;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/recognition", {
      onSuccess: () => toast.success("Recognition sent!"),
      onError: () => toast.error("Please fix the errors below."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white">
          <PlusCircle className="w-4 h-4 mr-2" />
          Give Recognition
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#FFD400]" />
            Give Recognition
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* User search */}
          <div className="space-y-1.5">
            <Label>Recognise someone *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or department…"
                className="pl-9 text-sm"
              />
            </div>
            <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No users found.</p>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setData("to_user_id", String(u.id));
                      setUserSearch(u.name);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors text-sm ${
                      data.to_user_id === String(u.id) ? "bg-[#1F6E4A]/10" : ""
                    }`}
                  >
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarFallback className="bg-[#1F6E4A] text-white text-xs">
                        {u.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{u.name}</p>
                      {u.department && (
                        <p className="text-xs text-muted-foreground truncate">{u.department}</p>
                      )}
                    </div>
                    {data.to_user_id === String(u.id) && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-[#1F6E4A] shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
            {errors.to_user_id && (
              <p className="text-xs text-destructive">{errors.to_user_id}</p>
            )}
          </div>

          {/* Badge type */}
          <div className="space-y-1.5">
            <Label>Badge *</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BADGE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const selected = data.badge_type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setData("badge_type", key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                      selected
                        ? "border-[#1F6E4A] bg-[#1F6E4A]/10"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                    <span className="text-foreground truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.badge_type && (
              <p className="text-xs text-destructive">{errors.badge_type}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message *</Label>
              <span className="text-xs text-muted-foreground">
                {data.message.length}/500
              </span>
            </div>
            <Textarea
              id="message"
              value={data.message}
              onChange={(e) => setData("message", e.target.value)}
              placeholder="Tell them why they deserve recognition…"
              rows={3}
              maxLength={500}
            />
            {errors.message && (
              <p className="text-xs text-destructive">{errors.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={processing}
            className="w-full bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
          >
            {processing ? "Sending…" : "Send Recognition"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecognitionFeedPage({
  recognitions,
  users,
  filters,
}: RecognitionFeedPageProps) {
  const applyFilter = (badge_type: string) => {
    router.get("/recognition", { badge_type }, { preserveState: true, replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-foreground flex items-center gap-3 mb-1">
            <Star className="w-8 h-8 text-[#FFD400]" />
            Recognition Feed
          </h1>
          <p className="text-muted-foreground">
            {recognitions.total} recognition{recognitions.total !== 1 ? "s" : ""} shared
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.visit("/recognition/mine")}
            className="text-sm"
          >
            My Recognitions
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <GiveRecognitionDialog users={users} />
        </div>
      </div>

      {/* Badge type filter */}
      <div className="flex gap-1 flex-wrap">
        {BADGE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => applyFilter(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filters.badge_type === tab.value
                ? "bg-[#1F6E4A] text-white border-[#1F6E4A]"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {recognitions.data.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
          No recognitions yet. Be the first to give a shout-out!
        </div>
      ) : (
        <div className="space-y-4">
          {recognitions.data.map((r) => {
            const badge = BADGE_CONFIG[r.badge_type] ?? BADGE_CONFIG.shoutout;
            const BadgeIcon = badge.icon;
            return (
              <div
                key={r.id}
                className="bg-card border-2 border-border rounded-xl p-5 space-y-3 hover:border-[#1F6E4A]/30 transition-colors"
              >
                {/* Sender → Receiver */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback className="bg-[#1F6E4A] text-white text-xs">
                      {r.sender.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-none">{r.sender.name}</p>
                    {r.sender.department && (
                      <p className="text-xs text-muted-foreground">{r.sender.department}</p>
                    )}
                  </div>

                  <BadgeIcon className={`w-5 h-5 mx-1 shrink-0 ${badge.color}`} />
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />

                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback className="bg-muted text-foreground text-xs">
                      {r.receiver.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-none">{r.receiver.name}</p>
                    {r.receiver.department && (
                      <p className="text-xs text-muted-foreground">{r.receiver.department}</p>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className={`ml-auto shrink-0 text-xs ${badge.pill}`}
                  >
                    <BadgeIcon className="w-3 h-3 mr-1" />
                    {badge.label}
                  </Badge>
                </div>

                {/* Message */}
                <p className="text-sm text-foreground leading-relaxed border-l-2 border-[#1F6E4A]/30 pl-3 italic">
                  "{r.message}"
                </p>

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground">{r.created_at}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {recognitions.last_page > 1 && (
        <div className="flex justify-center gap-1 pb-6">
          {recognitions.links.map((link) => (
            <Button
              key={link.label}
              variant={link.active ? "default" : "outline"}
              size="sm"
              disabled={!link.url}
              onClick={() => link.url && router.visit(link.url, { preserveState: true })}
              className={link.active ? "bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white" : ""}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(link.label) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

RecognitionFeedPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
