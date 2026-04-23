import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Download, FileText, PenLine, X, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { MyDocument } from "@/types/documents";

interface Props {
    documents: MyDocument[];
}

const SIG_STATUS_CONFIG = {
    pending:  { icon: Clock,         label: "Awaiting your signature", colour: "text-amber-600 dark:text-amber-400" },
    signed:   { icon: CheckCircle2,  label: "Signed",                  colour: "text-green-600 dark:text-green-400" },
    declined: { icon: XCircle,       label: "Declined",                colour: "text-red-600 dark:text-red-400" },
} as const;

function SignatureActions({ doc }: { doc: MyDocument }) {
    const [declineOpen, setDeclineOpen] = useState(false);

    const declineForm = useForm<{ reason: string }>({ reason: "" });

    function handleSign() {
        if (!confirm("Sign this document? Your name, timestamp, and IP will be recorded.")) return;
        router.post(`/my-documents/${doc.id}/sign`, {}, { preserveScroll: true });
    }

    function handleDecline(e: React.FormEvent) {
        e.preventDefault();
        declineForm.post(`/my-documents/${doc.id}/decline`, {
            onSuccess: () => setDeclineOpen(false),
        });
    }

    if (doc.signature_status !== "pending") return null;

    return (
        <>
            <div className="flex gap-2">
                <Button size="sm" className="gap-1.5" onClick={handleSign}>
                    <PenLine className="h-3.5 w-3.5" />
                    Sign
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setDeclineOpen(true)}
                >
                    <X className="h-3.5 w-3.5" />
                    Decline
                </Button>
            </div>

            <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Decline Signature</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDecline} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            You are declining to sign <strong>{doc.title}</strong>. Optionally explain why.
                        </p>
                        <div className="space-y-1.5">
                            <Label>Reason (optional)</Label>
                            <Textarea
                                value={declineForm.data.reason}
                                onChange={(e) => declineForm.setData("reason", e.target.value)}
                                rows={3}
                                placeholder="e.g. Contents require review by my manager first."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDeclineOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={declineForm.processing}
                            >
                                {declineForm.processing ? "Submitting…" : "Decline Signature"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function DocumentCard({ doc }: { doc: MyDocument }) {
    const sigConfig = doc.signature_status ? SIG_STATUS_CONFIG[doc.signature_status] : null;
    const SigIcon = sigConfig?.icon;

    const isExpired = doc.expires_at && new Date(doc.expires_at) < new Date();

    return (
        <Card className="relative">
            {doc.signature_status === "pending" && (
                <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        <Clock className="h-3 w-3" />
                        Action required
                    </span>
                </div>
            )}

            <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1 pr-20">
                        <CardTitle className="text-base leading-tight">{doc.title}</CardTitle>
                        <CardDescription className="mt-0.5">
                            {doc.category && <span>{doc.category}</span>}
                            {doc.version > 1 && <span className="ml-2 text-xs">v{doc.version}</span>}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Dates */}
                {(doc.effective_date || doc.expires_at) && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        {doc.effective_date && (
                            <span>Effective: <strong>{doc.effective_date}</strong></span>
                        )}
                        {doc.expires_at && (
                            <span className={isExpired ? "text-destructive font-medium" : ""}>
                                Expires: <strong>{doc.expires_at}</strong>
                                {isExpired && " (expired)"}
                            </span>
                        )}
                    </div>
                )}

                {/* Signature status */}
                {sigConfig && SigIcon && (
                    <div className={`flex items-center gap-1.5 text-sm ${sigConfig.colour}`}>
                        <SigIcon className="h-4 w-4 shrink-0" />
                        <span>{sigConfig.label}</span>
                        {doc.signed_at && (
                            <span className="text-xs text-muted-foreground ml-1">
                                — {new Date(doc.signed_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        asChild
                    >
                        <a href={doc.download_url} target="_blank" rel="noreferrer">
                            <Download className="h-3.5 w-3.5" />
                            Download
                        </a>
                    </Button>

                    <SignatureActions doc={doc} />
                </div>
            </CardContent>
        </Card>
    );
}

export default function MyDocumentsPage({ documents }: Props) {
    const pending   = documents.filter((d) => d.signature_status === "pending");
    const rest      = documents.filter((d) => d.signature_status !== "pending");

    return (
        <MainLayout activePage="my-documents">
            <Head title="My Documents" />

            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        HR documents issued to you. Sign or download from here.
                    </p>
                </div>

                {documents.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No documents yet</p>
                        <p className="text-sm mt-1">HR will upload documents here when they become available.</p>
                    </div>
                )}

                {/* Pending signatures — shown first */}
                {pending.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Awaiting your signature ({pending.length})
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {pending.map((doc) => (
                                <DocumentCard key={doc.id} doc={doc} />
                            ))}
                        </div>
                    </section>
                )}

                {/* All other documents */}
                {rest.length > 0 && (
                    <section className="space-y-3">
                        {pending.length > 0 && (
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Other Documents
                            </h2>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {rest.map((doc) => (
                                <DocumentCard key={doc.id} doc={doc} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </MainLayout>
    );
}
