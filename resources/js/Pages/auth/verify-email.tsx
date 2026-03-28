import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, Head } from "@inertiajs/react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface VerifyEmailProps {
    status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
    const { post, processing } = useForm({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/email/verification-notification");
    };

    const verificationLinkSent = status === "verification-link-sent";

    return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
            <Head title="Email Verification" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#1F6E4A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-foreground text-2xl font-bold">Verify Your Email</h2>
                    <p className="text-muted-foreground mt-2">Just one more step to get started</p>
                </div>

                <Card className="bg-card shadow-xl border-2 border-border">
                    <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-lg">Check your inbox</CardTitle>
                        <CardDescription>
                            Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you?
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
                                    A new verification link has been sent to the email address you provided during registration.
                                </p>
                            </motion.div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white py-6 text-lg font-semibold"
                            >
                                {processing ? "Sending..." : "Resend Verification Email"}
                                {!processing && <ArrowRight className="w-5 h-5 ml-2" />}
                            </Button>

                            <div className="flex items-center justify-center gap-4 pt-2">
                                <Button
                                    variant="link"
                                    className="text-[#1F6E4A]"
                                    onClick={() => post("/logout")}
                                >
                                    Log Out
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    If you didn't receive the email, we will gladly send you another.
                </p>
            </motion.div>
        </div>
    );
}
