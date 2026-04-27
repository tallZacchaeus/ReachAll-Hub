import { Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import MainLayout from '@/layouts/MainLayout';
import type { PreboardingOffer } from '@/types/onboarding';

interface Props {
    offers: PreboardingOffer[];
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
                {completed}/{total}
            </span>
        </div>
    );
}

export default function PreboardingPage({ offers }: Props) {
    return (
        <MainLayout title="Pre-boarding">
            <div className="mx-auto max-w-7xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Pre-boarding</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Track onboarding checklist completion for accepted hires.
                    </p>
                </div>

                {offers.length === 0 ? (
                    <Card>
                        <CardContent className="py-14 text-center">
                            <p className="text-muted-foreground">
                                No accepted offers with outstanding pre-boarding tasks.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Pending Checklist ({offers.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Candidate</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {offers.map((offer) => (
                                        <TableRow key={offer.id}>
                                            <TableCell>
                                                <span className="font-medium">
                                                    {offer.candidate.name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {offer.position_title}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {offer.start_date
                                                    ? new Date(offer.start_date).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <ProgressBar
                                                    completed={offer.tasks_completed}
                                                    total={offer.tasks_total}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link
                                                        href={route(
                                                            'recruitment.preboarding.show',
                                                            offer.id,
                                                        )}
                                                    >
                                                        Manage
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
