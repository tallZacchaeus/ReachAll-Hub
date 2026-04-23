import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { ContentRenderer } from "@/components/ContentRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Download, AlertCircle, CheckCircle, FileText, ImageIcon, File } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Attachment {
  path: string;
  name: string;
  size?: number;
  type?: string;
}

interface ContentViewPageProps {
  page: {
    id: number;
    title: string;
    slug: string;
    body: string;
    category: { name: string; slug: string } | null;
    author: string;
    author_initials: string;
    featured_image: string | null;
    attachments: Attachment[];
    requires_acknowledgement: boolean;
    acknowledgement_deadline: string | null;
    published_at: string | null;
    stage_visibility: string[];
    is_published: boolean;
  };
  hasAcknowledged: boolean;
  acknowledgedAt?: string | null;
}

export default function ContentViewPage({ page, hasAcknowledged, acknowledgedAt }: ContentViewPageProps) {
  const [acknowledged, setAcknowledged] = useState(hasAcknowledged);
  const [ackDate, setAckDate] = useState<string | null>(acknowledgedAt ?? null);
  const [acknowledging, setAcknowledging] = useState(false);

  const handleAcknowledge = () => {
    setAcknowledging(true);
    router.post(
      `/acknowledgements/${page.id}`,
      {},
      {
        onSuccess: () => {
          setAcknowledged(true);
          setAckDate(new Date().toISOString().split("T")[0]);
          toast.success("Policy acknowledged successfully.");
        },
        onError: () => toast.error("Failed to acknowledge. Please try again."),
        onFinish: () => setAcknowledging(false),
      },
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.visit("/content")}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Content Library
      </Button>

      {/* Featured image */}
      {page.featured_image && (
        <div className="h-56 md:h-72 overflow-hidden rounded-xl border-2 border-border">
          <img
            src={page.featured_image}
            alt={page.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Meta */}
      <div className="space-y-3">
        {page.category && (
          <Badge variant="secondary" className="text-xs">
            {page.category.name}
          </Badge>
        )}
        <h1 className="text-foreground leading-tight">{page.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="bg-brand text-white text-xs">
                {page.author_initials}
              </AvatarFallback>
            </Avatar>
            <span>{page.author}</span>
          </div>
          {page.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {page.published_at}
            </span>
          )}
          {page.requires_acknowledgement && (
            acknowledged ? (
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Acknowledged{ackDate ? ` on ${ackDate}` : ""}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-300 text-orange-500 text-xs">
                Acknowledgement required
              </Badge>
            )
          )}
        </div>
      </div>

      <Separator />

      {/* Body */}
      <ContentRenderer content={page.body} />

      {/* Downloads */}
      {page.attachments && page.attachments.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Downloads</h3>
            <div className="space-y-2">
              {page.attachments.map((attachment) => {
                const mime = attachment.type ?? "";
                const AttachIcon = mime.startsWith("image/")
                  ? ImageIcon
                  : mime.includes("pdf") || mime.includes("word") || mime.includes("document") || mime.includes("text")
                  ? FileText
                  : File;
                const sizeLabel = attachment.size
                  ? attachment.size < 1024 * 1024
                    ? `${Math.round(attachment.size / 1024)} KB`
                    : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
                  : null;
                return (
                  <a
                    key={attachment.path}
                    href={attachment.path}
                    download={attachment.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-brand transition-colors group"
                  >
                    <div className="w-9 h-9 rounded bg-brand/10 flex items-center justify-center shrink-0">
                      <AttachIcon className="w-4 h-4 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground group-hover:text-brand transition-colors truncate">
                        {attachment.name}
                      </p>
                      {sizeLabel && (
                        <p className="text-xs text-muted-foreground">{sizeLabel}</p>
                      )}
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-brand transition-colors shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Acknowledgement banner */}
      {page.requires_acknowledgement && !acknowledged && (
        <div className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">This policy requires your acknowledgement</p>
              {page.acknowledgement_deadline && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deadline: {page.acknowledgement_deadline}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="bg-brand hover:bg-brand/90 text-white shrink-0"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {acknowledging ? "Confirming…" : "I have read and understood this policy"}
          </Button>
        </div>
      )}
    </div>
  );
}

ContentViewPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
