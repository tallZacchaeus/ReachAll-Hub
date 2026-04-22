import { Link } from "@inertiajs/react";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface PendingAcknowledgementsWidgetProps {
  count: number;
}

export function PendingAcknowledgementsWidget({ count }: PendingAcknowledgementsWidgetProps) {
  if (count === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          {count === 1
            ? "1 policy requires your acknowledgement"
            : `${count} policies require your acknowledgement`}
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
          Please read and confirm these policies at your earliest convenience.
        </p>
      </div>
      <Link
        href="/acknowledgements/pending"
        className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 shrink-0 mt-1"
      >
        Review Now
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
