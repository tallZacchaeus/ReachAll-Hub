import {
  LayoutDashboard,
  Vote,
  MessageSquare,
  FileText,
  Settings,
  Shield,
  Upload,
  BarChart3,
  LogOut,
  Trophy,
  Users,
  CheckSquare,
  FolderKanban,
  Receipt,
  TrendingUp,
  CalendarCheck,
  UserPlus,
  UserSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";

interface SidebarProps {
  activePage: string;
  userRole: string;
}

export function Sidebar({ activePage, userRole }: SidebarProps) {
  // Define menu items based on role
  const getMenuItems = () => {
    // Staff menu items
    if (userRole === "staff") {
      return [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { id: "evaluation", label: "Evaluation", icon: Vote, href: "/evaluation" },
        { id: "results", label: "Results", icon: BarChart3, href: "/results" },
        { id: "leaderboard", label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
        { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/tasks" },
        { id: "peer-review", label: "Peer Reviews", icon: Users, href: "/peer-review" },
        { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
        { id: "requests", label: "Requests", icon: Receipt, href: "/requests" },
        { id: "leave", label: "Leave Requests", icon: FileText, href: "/leave" },
        { id: "attendance", label: "My Attendance", icon: CalendarCheck, href: "/attendance" },
        { id: "settings", label: "Settings", icon: Settings, href: "/settings/profile" },
      ];
    }

    // Base admin menu items
    const baseAdminItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { id: "staff-overview", label: "Staff Overview", icon: Users, href: "/staff-overview" },
      { id: "progress-report", label: "Progress Report", icon: TrendingUp, href: "/progress-report" },
      { id: "projects", label: "Projects", icon: FolderKanban, href: "/projects" },
      { id: "requests", label: "Requests", icon: Receipt, href: "/requests" },
      { id: "results", label: "Results", icon: BarChart3, href: "/results" },
      { id: "leaderboard", label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
      { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/tasks" },
      { id: "chat", label: "Team Chat", icon: MessageSquare, href: "/chat" },
      { id: "leave", label: "Leave Requests", icon: FileText, href: "/leave" },
      { id: "reports", label: "Reports", icon: FileText, href: "/reports" },
      { id: "attendance-upload", label: "Attendance", icon: Upload, href: "/attendance-upload" },
    ];

    // Add Staff Enrollment for Super Admin and HR only
    if (userRole === "superadmin" || userRole === "hr") {
      baseAdminItems.push({ id: "add-staff", label: "Staff Enrollment", icon: UserPlus, href: "/staff-enrollment" });
      baseAdminItems.push({ id: "profile-requests", label: "Profile Requests", icon: UserSearch, href: "/admin/profile-requests" });
    }

    baseAdminItems.push({ id: "settings", label: "Settings", icon: Settings, href: "/settings/profile" });

    return baseAdminItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 h-screen bg-white border-r border-[#e5e7eb] flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1F6E4A] rounded-lg flex items-center justify-center">
            <span className="text-white">RA</span>
          </div>
          <div>
            <h2 className="text-[#1F2937]">Tech Staff</h2>
            <p className="text-xs text-[#6b7280]">Evaluation Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? "bg-[#1F6E4A] text-white"
                : "text-[#1F2937] hover:bg-[#f0fdf4]"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#e5e7eb]">
        <Link
          href="/logout"
          method="post"
          as="button"
          className="w-full bg-white border border-[#e5e7eb] text-[#1F2937] hover:bg-red-50 hover:text-red-600 hover:border-red-200 inline-flex items-center justify-center rounded-md px-4 py-2"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Link>
      </div>
    </div>
  );
}
