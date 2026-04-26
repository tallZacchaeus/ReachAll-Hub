import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Head, useForm, usePage } from "@inertiajs/react";
import { ArrowRight, CheckCircle2, KeyRound, Mail } from "lucide-react";
import { motion } from "motion/react";
import { SharedData } from "@/types";

interface VerifyEmailProps {
    status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
    const { auth } = usePage<SharedData>().props;
    const resendForm = useForm({});
    const codeForm = useForm({
        code: "",
    });

    const submitCode = (e: React.FormEvent) => {
        e.preventDefault();
        codeForm.post("/email/verify-code", {
            preserveScroll: true,
            onSuccess: () => codeForm.reset("code"),
        });
    };

    const resendVerification = (e: React.FormEvent) => {
        e.preventDefault();
        resendForm.post("/email/verification-notification");
    };

    const verificationLinkSent = status === "verification-link-sent";
    const email = auth.user?.email;

    return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
            <Head title="Email Verification" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-foreground text-2xl font-bold">Verify Your Email</h2>
                    <p className="text-muted-foreground mt-2">Just one more step to get started</p>
                </div>

                <Card className="bg-card shadow-xl border-2 border-border">
                    <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-lg">Check your inbox</CardTitle>
                        <CardDescription>
                            We sent a verification email{email ? ` to ${email}` : ""}. Use the email link or enter the 6-digit verification code below to unlock your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        {verificationLinkSent && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-start gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <p className="text-sm font-medium">
                                    A fresh verification email with both a link and a 6-digit code has been sent.
                                </p>
                            </motion.div>
                        )}

                        <form onSubmit={submitCode} className="space-y-4">
                            <div className="space-y-2 text-left">
                                <Label htmlFor="verification-code" className="text-foreground">
                                    6-digit verification code
                                </Label>
                                <div className="relative">
                                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="verification-code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        placeholder="Enter code"
                                        className="pl-10 tracking-[0.35em]"
                                        value={codeForm.data.code}
                                        onChange={(e) =>
                                            codeForm.setData("code", e.target.value.replace(/\D/g, "").slice(0, 6))
                                        }
                                    />
                                </div>
                                {codeForm.errors.code && (
                                    <p className="text-sm font-medium text-red-600">{codeForm.errors.code}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Codes expire after 15 minutes. Request a new email if this one times out.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={codeForm.processing}
                                className="w-full bg-brand hover:bg-brand/90 text-white py-6 text-lg font-semibold"
                            >
                                {codeForm.processing ? "Verifying..." : "Verify Email with Code"}
                                {!codeForm.processing && <ArrowRight className="w-5 h-5 ml-2" />}
                            </Button>
                        </form>

                        <div className="border-t border-border pt-4">
                            <form onSubmit={resendVerification} className="space-y-4">
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={resendForm.processing}
                                    className="w-full py-6 text-base"
                                >
                                    {resendForm.processing ? "Sending..." : "Resend Verification Email"}
                                </Button>

                                <div className="flex items-center justify-center gap-4 pt-2">
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="text-brand"
                                        onClick={() => resendForm.post("/logout")}
                                    >
                                        Log Out
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    If the email does not arrive, check spam first, then resend a new verification email.
                </p>
            </motion.div>
        </div>
    );
}
