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
  BookOpen,
  Star,
  Briefcase,
  HelpCircle,
  Newspaper,
  Bell,
  Home,
  Target,
  Layers,
  Building2,
  GraduationCap,
  ListChecks,
  ScrollText,
  Megaphone,
  BookMarked,
  Globe,
  Archive,
  GitBranch,
  Hash,
  Wallet,
  ClipboardList,
  ClipboardCheck,
  PieChart,
  Lock,
  ShieldCheck,
  FolderOpen,
  Banknote,
  Calculator,
  Heart,
  Award,
} from "lucide-react";
import { Link } from "@inertiajs/react";
import { usePermissions } from "@/hooks/usePermissions";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  activePage: string;
  userRole: string;
  employeeStage?: string;
  hasPettyCashFloat?: boolean;
  onNavigate?: () => void;
}

const CROSS_LIFECYCLE: NavSection = {
  label: "General",
  items: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
    { id: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
    { id: "bulletins", label: "News & Bulletins", icon: Newspaper, href: "/bulletins" },
    { id: "newsletters", label: "Newsletters", icon: BookMarked, href: "/newsletters" },
    { id: "directory", label: "Directory", icon: Globe, href: "/directory" },
    { id: "faqs", label: "FAQs", icon: HelpCircle, href: "/faqs" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/notifications" },
  ],
};

const JOINER_SECTION: NavSection = {
  label: "Getting Started",
  items: [
    { id: "onboarding", label: "Welcome Hub", icon: Home, href: "/onboarding" },
    { id: "checklists", label: "Checklists", icon: ListChecks, href: "/checklists" },
    { id: "policies", label: "Policies", icon: ScrollText, href: "/content?category=policies" },
    { id: "learning", label: "Learning", icon: GraduationCap, href: "/learning" },
  ],
};

const PERFORMER_SECTION: NavSection = {
  label: "My Work",
  items: [
    { id: "evaluation", label: "My Performance", icon: Vote, href: "/evaluation" },
    { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/tasks" },
    { id: "projects", label: "Projects", icon: FolderKanban, href: "/projects" },
    { id: "learning", label: "Learning Hub", icon: GraduationCap, href: "/learning" },
    { id: "recognition", label: "Recognition", icon: Star, href: "/recognition" },
    { id: "jobs", label: "Job Openings", icon: Briefcase, href: "/jobs" },
    { id: "knowledge", label: "Knowledge Base", icon: Archive, href: "/content" },
  ],
};

const LEADER_SECTION: NavSection = {
  label: "Leadership",
  items: [
    { id: "team", label: "Team Dashboard", icon: Users, href: "/team" },
    { id: "okrs", label: "OKRs", icon: Target, href: "/okrs" },
    { id: "requests", label: "Approvals", icon: Receipt, href: "/requests" },
  ],
};

const PERSONAL_SECTION: NavSection = {
  label: "Personal",
  items: [
    { id: "leave", label: "Leave Requests", icon: FileText, href: "/leave" },
    { id: "attendance", label: "My Attendance", icon: CalendarCheck, href: "/attendance" },
    { id: "my-documents", label: "My Documents", icon: FolderOpen, href: "/my-documents" },
    { id: "my-payslips", label: "My Payslips", icon: Banknote, href: "/payroll/my-payslips" },
    { id: "my-benefits", label: "My Benefits", icon: Heart, href: "/benefits/my-benefits" },
    { id: "my-rewards", label: "My Rewards", icon: Award, href: "/compensation/my-rewards" },
    { id: "my-cases", label: "Support & Grievances", icon: Shield, href: "/employee-relations/my-cases" },
    { id: "my-compliance", label: "My Compliance", icon: ShieldCheck, href: "/compliance/my" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings/profile" },
  ],
};

const ADMIN_SECTION: NavSection = {
  label: "Admin",
  items: [
    { id: "staff-overview", label: "Staff Overview", icon: Users, href: "/staff-overview" },
    { id: "org-chart", label: "Org Chart", icon: GitBranch, href: "/admin/org/chart" },
    { id: "progress-report", label: "Progress Report", icon: TrendingUp, href: "/progress-report" },
    { id: "reports", label: "Reports", icon: BarChart3, href: "/reports" },
    { id: "department-analytics", label: "Dept. Analytics", icon: Building2, href: "/department-analytics" },
    { id: "attendance-upload", label: "Attendance Upload", icon: Upload, href: "/attendance-upload" },
    { id: "results", label: "Results", icon: BarChart3, href: "/results" },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
    { id: "peer-review", label: "Peer Reviews", icon: BookOpen, href: "/peer-review" },
    { id: "performance-review", label: "Performance", icon: TrendingUp, href: "/performance-review" },
  ],
};

const ADMIN_MANAGE_SECTION: NavSection = {
  label: "Manage",
  items: [
    { id: "staff-enrollment", label: "Staff Enrollment", icon: UserPlus, href: "/staff-enrollment" },
    { id: "profile-requests", label: "Profile Requests", icon: UserSearch, href: "/admin/profile-requests" },
    { id: "manage-content", label: "Manage Content", icon: Layers, href: "/admin/content" },
    { id: "manage-newsletters", label: "Manage Newsletters", icon: Newspaper, href: "/admin/newsletters" },
    { id: "manage-bulletins", label: "Manage Bulletins", icon: Megaphone, href: "/admin/bulletins" },
    { id: "ack-report", label: "Acknowledgement Report", icon: CheckSquare, href: "/admin/acknowledgements" },
    { id: "manage-checklists", label: "Manage Checklists", icon: ListChecks, href: "/admin/checklists" },
    { id: "manage-courses", label: "Manage Courses", icon: GraduationCap, href: "/admin/courses" },
    { id: "manage-jobs", label: "Manage Jobs", icon: Briefcase, href: "/admin/jobs" },
    { id: "manage-faqs", label: "Manage FAQs", icon: HelpCircle, href: "/admin/faqs" },
  ],
};

const FINANCE_REQUESTS_SECTION: NavSection = {
  label: "Finance",
  items: [
    { id: "finance-requisitions", label: "My Requests", icon: FileText, href: "/finance/requisitions" },
    { id: "finance-approvals", label: "Approvals Queue", icon: ClipboardList, href: "/finance/approvals" },
  ],
};

const PETTY_CASH_SECTION: NavSection = {
  label: "Petty Cash",
  items: [
    { id: "finance-petty-cash", label: "My Float", icon: Wallet, href: "/finance/petty-cash" },
  ],
};

const RECONCILIATION_SECTION: NavSection = {
  label: "Reconciliation",
  items: [
    { id: "finance-reconciliation", label: "Reconciliations", icon: ClipboardCheck, href: "/finance/reconciliation" },
  ],
};

const MATCHING_PAYMENTS_SECTION: NavSection = {
  label: "Payments",
  items: [
    { id: "finance-matching",  label: "Three-Way Match", icon: GitBranch, href: "/finance/matching" },
    { id: "finance-payments",  label: "Payments",        icon: Wallet,    href: "/finance/payments" },
  ],
};

const FINANCE_SECTION: NavSection = {
  label: "Finance Admin",
  items: [
    { id: "finance-cost-centres",  label: "Cost Centres",  icon: GitBranch, href: "/finance/admin/cost-centres" },
    { id: "finance-account-codes", label: "Account Codes", icon: Hash,      href: "/finance/admin/account-codes" },
    { id: "finance-vendors",       label: "Vendors",       icon: Building2, href: "/finance/admin/vendors" },
  ],
};

const FINANCE_ANALYTICS_SECTION: NavSection = {
  label: "Analytics",
  items: [
    { id: "finance-dashboard", label: "Finance Dashboard", icon: PieChart,  href: "/finance/dashboard" },
    { id: "finance-reports",   label: "Reports",           icon: BarChart3, href: "/finance/reports" },
  ],
};

const FINANCE_CLOSE_SECTION: NavSection = {
  label: "Period Management",
  items: [
    { id: "finance-period-close", label: "Period Close", icon: Lock, href: "/finance/period-close" },
  ],
};

const FINANCE_HELP_SECTION: NavSection = {
  label: "Finance Help",
  items: [
    { id: "finance-help-getting-started", label: "Getting Started",  icon: HelpCircle,  href: "/finance/help/getting-started" },
    { id: "finance-help-approvers",       label: "For Approvers",    icon: CheckSquare, href: "/finance/help/approvers" },
    { id: "finance-help-finance-team",    label: "Finance Team",     icon: BookOpen,    href: "/finance/help/finance-team" },
  ],
};

export function Sidebar({ activePage, userRole, employeeStage = "performer", hasPettyCashFloat = false, onNavigate }: SidebarProps) {
  const { can, canAny } = usePermissions();

  const isAdmin = can('admin.dashboard');
  const isFinanceAdmin = can('finance.admin');
  const hasFinanceAccess = canAny(['finance.admin', 'finance.reports']);
  const canManagePayroll  = can('payroll.manage');
  const canViewPayroll    = canAny(['payroll.manage', 'payroll.view']);
  const canManageBenefits      = can('benefits.manage');
  const canManageCompensation  = can('compensation.manage');
  const canViewCompensation    = canAny(['compensation.manage', 'compensation.view']);
  const canManageRecruitment   = can('recruitment.manage');
  const canViewRecruitment     = canAny(['recruitment.manage', 'recruitment.view', 'recruitment.interview']);
  const canManageER            = can('er.manage');
  const canViewER              = canAny(['er.manage', 'er.investigate']);
  const canManageCompliance    = can('compliance.manage');
  const canViewAuditLogs       = can('audit.view');

  const sections: NavSection[] = [];

  sections.push(CROSS_LIFECYCLE);

  if (isAdmin) {
    sections.push(
      { ...JOINER_SECTION, label: "Joiner Tools" },
      { ...PERFORMER_SECTION, label: "Performer Tools" },
      { ...LEADER_SECTION, label: "Leader Tools" },
      ADMIN_SECTION,
    );

    const canManageStaff = can('staff.enroll');
    const canManageRoles = can('roles.manage');
    const canManageOrg = can('org.manage');
    const canManageDocs = can('documents.manage');
    if (canManageStaff || canManageRoles || canManageOrg || canManageDocs || canManageBenefits || canViewAuditLogs) {
      const manageItems = [...ADMIN_MANAGE_SECTION.items];
      if (canManageDocs) {
        manageItems.push({ id: "document-vault", label: "Document Vault", icon: FolderOpen, href: "/admin/hr/documents" });
      }
      if (canManageBenefits) {
        manageItems.push({ id: "benefits-plans", label: "Benefit Plans", icon: Heart, href: "/benefits/plans" });
      }
      if (canManageOrg) {
        manageItems.push({ id: "org-structure", label: "Org Structure", icon: Building2, href: "/admin/org/departments" });
      }
      if (canManageRoles) {
        manageItems.push({ id: "roles", label: "Roles & Permissions", icon: ShieldCheck, href: "/admin/roles" });
      }
      if (canViewAuditLogs) {
        manageItems.push({ id: "audit-logs", label: "Audit Logs", icon: ClipboardList, href: "/admin/audit-logs" });
      }
      sections.push({ ...ADMIN_MANAGE_SECTION, items: manageItems });
    }
  } else {
    // Staff: show only their lifecycle stage section
    if (employeeStage === "joiner") {
      sections.push(JOINER_SECTION);
    } else if (employeeStage === "leader") {
      sections.push(LEADER_SECTION);
    } else {
      // Default to performer
      sections.push(PERFORMER_SECTION);
    }
  }

  // Payroll section — visible to those who can view or manage payroll
  if (canViewPayroll) {
    const payrollItems: NavItem[] = [
      { id: "payroll-runs",     label: "Payroll Runs",      icon: Banknote,    href: "/payroll/runs" },
    ];
    if (canManagePayroll) {
      payrollItems.push({ id: "payroll-salaries", label: "Salary Setup", icon: Calculator, href: "/payroll/salaries" });
    }
    sections.push({ label: "Payroll", items: payrollItems });
  }

  // Compensation — visible to managers and HR who can view or manage
  if (canViewCompensation) {
    const compItems: NavItem[] = [];
    if (canManageCompensation) {
      compItems.push({ id: "compensation-bands",   label: "Salary Bands",    icon: TrendingUp, href: "/compensation/bands" });
      compItems.push({ id: "compensation-reviews", label: "Review Cycles",   icon: TrendingUp, href: "/compensation/reviews" });
      compItems.push({ id: "compensation-bonus",   label: "Bonus Plans",     icon: Award,      href: "/compensation/bonus" });
    }
    if (compItems.length > 0) {
      sections.push({ label: "Compensation", items: compItems });
    }
  }

  // Recruitment / ATS — HR and managers who can view or manage recruitment
  if (canViewRecruitment) {
    const recItems: NavItem[] = [
      { id: "recruitment-pipeline", label: "Pipeline", icon: GitBranch, href: "/recruitment/pipeline" },
    ];
    if (canManageRecruitment) {
      recItems.unshift({ id: "recruitment-requisitions", label: "Requisitions",     icon: Briefcase,    href: "/recruitment/requisitions" });
      recItems.push(   { id: "recruitment-candidates",   label: "Talent Pool",      icon: UserSearch,   href: "/recruitment/candidates" });
    }
    sections.push({ label: "Recruitment", items: recItems });
  }

  // Employee Relations — HR managers and assigned investigators
  if (canViewER) {
    const erItems: NavItem[] = [
      { id: "er-cases", label: "Case Management", icon: Shield, href: "/employee-relations/cases" },
    ];
    sections.push({ label: "Employee Relations", items: erItems });
  }

  // Compliance — HR managers see full admin views
  if (canManageCompliance) {
    sections.push({
      label: "Compliance",
      items: [
        { id: "compliance-docs", label: "Compliance Documents", icon: ShieldCheck, href: "/compliance/documents" },
        { id: "compliance-dsr", label: "Data Subject Requests", icon: Lock, href: "/compliance/dsr" },
        { id: "compliance-trainings", label: "Compliance Trainings", icon: GraduationCap, href: "/compliance/trainings" },
        { id: "compliance-policies", label: "Compliance Policies", icon: ScrollText, href: "/compliance/policies" },
      ],
    });
  }

  // Finance module sections — all roles with finance access see My Requests + Approvals
  if (hasFinanceAccess) {
    sections.push(FINANCE_REQUESTS_SECTION);
  }
  // Petty Cash — only custodians with an active float
  if (hasPettyCashFloat) {
    sections.push(PETTY_CASH_SECTION);
  }
  // Reconciliation queue — Finance / CEO / Superadmin only
  if (isFinanceAdmin) {
    sections.push(RECONCILIATION_SECTION);
  }
  // Three-way matching + payments — Finance / CEO / Superadmin only
  if (isFinanceAdmin) {
    sections.push(MATCHING_PAYMENTS_SECTION);
  }
  // Finance admin section (cost centres, account codes, vendors) — restricted roles only
  if (isFinanceAdmin) {
    sections.push(FINANCE_SECTION);
  }
  // Analytics (Dashboard + Reports) — Finance / CEO / Superadmin / Management
  if (hasFinanceAccess) {
    sections.push(FINANCE_ANALYTICS_SECTION);
  }
  // Period Close — Finance / CEO / Superadmin only
  if (isFinanceAdmin) {
    sections.push(FINANCE_CLOSE_SECTION);
  }
  // Finance Help — all users with finance access
  if (hasFinanceAccess) {
    sections.push(FINANCE_HELP_SECTION);
  }

  sections.push(PERSONAL_SECTION);

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">HR</span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">HR Lifecycle</p>
            <p className="text-xs text-muted-foreground capitalize">
              {isAdmin ? `${userRole}` : employeeStage}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {section.label}
            </p>
            <div className="space-y-0.5 px-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <Link
                    key={`${section.label}-${item.id}`}
                    href={item.href}
                    onClick={onNavigate}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      isActive
                        ? "bg-brand text-brand-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border shrink-0">
        <Link
          href="/logout"
          method="post"
          as="button"
          className="w-full bg-background border border-border text-foreground hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 hover:border-red-200 dark:hover:border-red-800 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Link>
      </div>
    </div>
  );
}
