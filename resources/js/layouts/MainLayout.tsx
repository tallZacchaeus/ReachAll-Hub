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
    const auth = props.auth as any;
    const userRole = auth?.user?.role || "staff"; // Fallback to staff for now

    // Get active page from URL
    const activePage = url.split('/')[1] || "dashboard";

    return (
        <>
            <div className="min-h-screen bg-background">
                <Sidebar
                    activePage={activePage}
                    userRole={userRole}
                />
                <div className="ml-64">
                    <TopBar
                        onViewAllNotifications={() => { }}
                        onViewProfile={() => { }}
                        userRole={userRole}
                        isTeamLead={false} // Would need logic to determine this
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
