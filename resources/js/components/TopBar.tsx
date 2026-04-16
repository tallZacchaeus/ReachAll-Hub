import { useState, useEffect, useCallback } from "react";
import { Bell, User, Shield, Search } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { SharedData } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { router } from "@inertiajs/react";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "success" | "warning";
  read: boolean;
}

interface TopBarProps {
  onViewAllNotifications: () => void;
  onViewProfile: () => void;
  userRole?: string;
  isTeamLead?: boolean;
}

export function TopBar({ onViewAllNotifications, onViewProfile, userRole, isTeamLead = false }: TopBarProps) {
  const { auth } = usePage<SharedData>().props;
  const user = auth.user;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setSearchOpen(false);
      router.visit("/search", { data: { q: searchQuery.trim() } });
      setSearchQuery("");
    }
  };

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New Badge Earned! 🏅",
      message: "You've earned the 'Punctual Pro' badge for 100% attendance this month!",
      time: "2 min ago",
      type: "success",
      read: false,
    },
    {
      id: "2",
      title: "Voting Started 🗳️",
      message: "Voting has started for this month's awards! Cast your votes before Nov 15!",
      time: "1 hour ago",
      type: "info",
      read: false,
    },
    {
      id: "3",
      title: "Leave Request Approved ✓",
      message: "Your leave request for Nov 10-15 has been approved.",
      time: "3 hours ago",
      type: "success",
      read: false,
    },
    {
      id: "4",
      title: "New Announcement 📢",
      message: "Evaluation closes on Friday! Make sure to submit before deadline.",
      time: "5 hours ago",
      type: "warning",
      read: true,
    },
    {
      id: "5",
      title: "Achievement Unlocked ⭐",
      message: "You're now in the Top 5 on the leaderboard! Keep it up!",
      time: "1 day ago",
      type: "success",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "#1F6E4A";
      case "warning":
        return "#FFD400";
      default:
        return "#60a5fa";
    }
  };

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-end px-8 gap-3">
      {/* Search */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setSearchOpen(true)}
        title="Search (⌘K)"
      >
        <Search className="w-5 h-5 text-foreground" />
      </Button>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people, content, FAQs, courses…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">ESC</kbd>
            </div>
            {searchQuery.trim().length >= 2 && (
              <div className="px-4 py-3">
                <button
                  type="submit"
                  className="w-full text-left text-sm text-[#1F6E4A] hover:underline"
                >
                  Search for "{searchQuery.trim()}" →
                </button>
              </div>
            )}
            {searchQuery.trim().length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Start typing to search across all content
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef4444] rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs">{unreadCount}</span>
              </motion.div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-[#ef4444] text-white hover:bg-[#ef4444]">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-[#1F6E4A] hover:bg-muted p-0 h-auto"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            <div className="p-2">
              <AnimatePresence>
                {notifications.slice(0, 5).map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => handleMarkAsRead(notification.id)}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${notification.read
                      ? "bg-card hover:bg-muted"
                      : "bg-[#f0fdf4] dark:bg-muted hover:bg-[#dcfce7] dark:bg-green-950/30 dark:hover:bg-muted/80 border-l-4"
                      }`}
                    style={{
                      borderLeftColor: notification.read ? "transparent" : getNotificationColor(notification.type),
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{
                          backgroundColor: notification.read ? "#e5e7eb" : getNotificationColor(notification.type),
                        }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-[#1F6E4A] hover:bg-muted"
              onClick={() => router.visit('/notifications')}
            >
              View All Notifications
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Profile Button */}
      <Button
        onClick={() => router.visit('/profile')}
        variant="ghost"
        className="flex items-center gap-2 px-3"
      >
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-[#1F6E4A] text-white text-sm">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="text-left hidden md:block">
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground">{user.name}</p>
            {isTeamLead && (
              <Badge className="bg-[#FFD400] text-foreground hover:bg-[#FFD400] h-5 px-1.5">
                <Shield className="w-3 h-3 mr-1" />
                <span className="text-xs">Team Lead</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground capitalize">{userRole || "Staff"}</p>
        </div>
      </Button>
    </div>
  );
}