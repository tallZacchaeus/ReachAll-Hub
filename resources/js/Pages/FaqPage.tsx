import { router } from "@inertiajs/react";
import { Search, ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MainLayout from "@/layouts/MainLayout";

interface FaqEntry {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface FaqPageProps {
  grouped: Record<string, FaqEntry[]>;
  flat: FaqEntry[];
  query: string;
  isSearching: boolean;
}

export default function FaqPage({ grouped = {}, flat = [], query = "", isSearching = false }: FaqPageProps) {
  const [search, setSearch] = useState(query);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => {
      router.visit("/faqs", {
        data: { q: value },
        preserveState: true,
        replace: true,
      });
    }, 350);
    setTimer(t);
  };

  const categoryColors: Record<string, string> = {
    General: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "IT & Access": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "Leave & Benefits": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "HR Processes": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  const getCategoryColor = (cat: string) =>
    categoryColors[cat] ?? "bg-muted text-muted-foreground";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">FAQs</h1>
            <p className="text-sm text-muted-foreground">Answers to common questions</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search FAQs…"
            className="pl-9"
          />
        </div>

        {/* Results */}
        {isSearching ? (
          // Flat search results
          <div className="space-y-2">
            {flat.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No FAQs matched "{query}"</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{flat.length} result{flat.length !== 1 ? "s" : ""} for "{query}"</p>
                <Accordion type="multiple" className="space-y-2">
                  {flat.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={String(faq.id)}
                      className="border border-border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-4">
                        <div className="flex items-start gap-3 flex-1 pr-2">
                          <Badge className={`text-xs shrink-0 mt-0.5 ${getCategoryColor(faq.category)}`} variant="secondary">
                            {faq.category}
                          </Badge>
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </>
            )}
          </div>
        ) : (
          // Grouped by category
          <div className="space-y-6">
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No FAQs available yet.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([category, faqs]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`text-xs ${getCategoryColor(category)}`} variant="secondary">
                      {category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{faqs.length} question{faqs.length !== 1 ? "s" : ""}</span>
                  </div>
                  <Accordion type="multiple" className="space-y-2">
                    {faqs.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={String(faq.id)}
                        className="border border-border rounded-lg px-4 bg-card"
                      >
                        <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-4">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            )}
          </div>
        )}
    </div>
  );
}

FaqPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
