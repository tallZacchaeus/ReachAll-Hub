import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { Toaster } from "@/components/ui/sonner";
import { usePage } from "@inertiajs/react";

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { url, props } = usePage();
    const auth = props.auth as { user?: { role?: string; employee_stage?: string } };
    const userRole = auth?.user?.role ?? "staff";
    const employeeStage = auth?.user?.employee_stage ?? "performer";
    const hasPettyCashFloat = (props.has_petty_cash_float as boolean) ?? false;

    // Get active page from URL
    const activePage = url.split('/')[1] || "dashboard";

    return (
        <>
            <div className="min-h-screen bg-background">
                <Sidebar
                    activePage={activePage}
                    userRole={userRole}
                    employeeStage={employeeStage}
                    hasPettyCashFloat={hasPettyCashFloat}
                />
                <div className="ml-64">
                    <TopBar
                        onViewAllNotifications={() => { }}
                        onViewProfile={() => { }}
                        userRole={userRole}
                        isTeamLead={["management", "superadmin"].includes(userRole)}
                    />
                    <main className="p-8">
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
