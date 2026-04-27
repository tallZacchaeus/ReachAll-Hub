import { Link, useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginPageProps {
  canRegister?: boolean;
  canResetPassword?: boolean;
  status?: string;
}

export default function LoginPage({
  canRegister = false,
  canResetPassword = false,
  status,
}: LoginPageProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    employee_id: "",
    password: "",
    remember: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/login", {
      onFinish: () => reset("password"),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-brand rounded-full flex items-center justify-center mb-2">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-foreground">Welcome Back!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in with your employee ID or email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status && (
            <div className="mb-4 font-medium text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
              {status}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-foreground">
                Employee ID or Email
              </Label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter your employee ID or email"
                value={data.employee_id}
                onChange={(e) => setData("employee_id", e.target.value)}
                className="bg-card border-border"
              />
              {errors.employee_id && (
                <p className="text-sm text-red-500 mt-1">{errors.employee_id}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                className="bg-card border-border"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={processing}
              className="w-full bg-brand hover:bg-brand/90 text-white"
            >
              {processing ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          {(canResetPassword || canRegister) && (
            <div className="mt-6 flex flex-col gap-2 text-center text-sm">
              {canResetPassword && (
                <Link href="/forgot-password" className="text-brand hover:underline">
                  Forgot your password?
                </Link>
              )}
              {canRegister && (
                <Link href="/register" className="text-brand hover:underline">
                  Create an account
                </Link>
              )}
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Need help? Contact your administrator
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
