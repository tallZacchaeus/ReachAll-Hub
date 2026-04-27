import { SettingsPage } from "@/components/SettingsPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OtherPagesProps {
  page: string;
  userRole?: string;
}

export function OtherPages({ page, userRole = "staff" }: OtherPagesProps) {
  // Return Settings page if that's what's requested
  if (page === "settings") {
    return <SettingsPage userRole={userRole} />;
  }

  const pageConfig: { [key: string]: { title: string; description: string } } = {
    attendance: {
      title: "Attendance Management",
      description: "Track and manage employee attendance records",
    },
  };

  const config = pageConfig[page] || { title: "Page", description: "Content coming soon" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground mb-2">{config.title}</h1>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      <Card className="bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">{config.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-brand-subtle dark:bg-muted rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-brand"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              This feature is under development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
