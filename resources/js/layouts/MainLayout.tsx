import { usePage } from "@inertiajs/react";
import { ReactNode, useState } from "react";

import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

interface MainLayoutProps {
    children: ReactNode;
    activePage?: string;
    title?: string;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { url, props } = usePage();
    const auth = props.auth as { user?: { role?: string; employee_stage?: string } };
    const userRole = auth?.user?.role ?? "staff";
    const employeeStage = auth?.user?.employee_stage ?? "performer";
    const hasPettyCashFloat = (props.has_petty_cash_float as boolean) ?? false;

    const activePage = url.split("/")[1] || "dashboard";

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const sidebarProps = {
        activePage,
        userRole,
        employeeStage,
        hasPettyCashFloat,
    };

    return (
        <>
            <div className="min-h-screen bg-background">
                {/* Desktop sidebar — always visible on md+ */}
                <div className="hidden md:block">
                    <Sidebar {...sidebarProps} />
                </div>

                {/* Mobile sidebar — rendered inside a Sheet drawer */}
                <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                    <SheetContent side="left" className="w-64 p-0 border-r border-border">
                        <Sidebar {...sidebarProps} onNavigate={() => setMobileSidebarOpen(false)} />
                    </SheetContent>
                </Sheet>

                {/* Main content area — margin only applies on desktop */}
                <div className="md:ml-64">
                    <TopBar
                        onViewAllNotifications={() => {}}
                        onViewProfile={() => {}}
                        userRole={userRole}
                        isTeamLead={["management", "superadmin"].includes(userRole)}
                        onMenuToggle={() => setMobileSidebarOpen(true)}
                    />
                    <main className="p-4 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
            <Toaster />
        </>
    );
}
