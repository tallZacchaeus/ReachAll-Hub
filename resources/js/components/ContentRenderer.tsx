import { sanitizeHtml } from "@/lib/sanitize";

interface ContentRendererProps {
  content: string;
}

export function ContentRenderer({ content }: ContentRendererProps) {
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert
        prose-headings:text-foreground prose-p:text-foreground
        prose-a:text-[#1F6E4A] prose-strong:text-foreground
        prose-blockquote:border-[#1F6E4A] prose-blockquote:text-muted-foreground
        prose-code:text-foreground prose-code:bg-muted prose-code:rounded prose-code:px-1"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}
