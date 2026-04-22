import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, User, ChevronRight } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

interface ContentCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: { name: string; slug: string } | null;
  author: string;
  published_at: string | null;
  featured_image: string | null;
  requires_acknowledgement: boolean;
}

interface PaginatedPages {
  data: ContentCard[];
  current_page: number;
  last_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface ContentIndexPageProps {
  pages: PaginatedPages;
  categories: Category[];
  filters: { category?: string; search?: string };
}

export default function ContentIndexPage({ pages, categories, filters }: ContentIndexPageProps) {
  const [search, setSearch] = useState(filters.search ?? "");

  const applyFilter = (params: Record<string, string>) => {
    router.get(
      "/content",
      { ...filters, ...params },
      { preserveScroll: true, replace: true },
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter({ search });
  };

  const selectCategory = (slug: string) => {
    applyFilter({ category: slug === filters.category ? "" : slug, search: "" });
    setSearch("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#1F6E4A]" />
          Content Library
        </h1>
        <p className="text-muted-foreground">Policies, guides, and resources for your team</p>
      </div>

      <div className="flex gap-6">
        {/* Category sidebar */}
        <aside className="hidden md:block w-56 shrink-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-2">
            Categories
          </p>
          <button
            onClick={() => applyFilter({ category: "", search: "" })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !filters.category
                ? "bg-[#1F6E4A] text-white"
                : "text-foreground hover:bg-muted"
            }`}
          >
            All Content
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                filters.category === cat.slug
                  ? "bg-[#1F6E4A] text-white"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span>{cat.name}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search content…"
                className="pl-9"
              />
            </div>
            <Button type="submit" className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white">
              Search
            </Button>
            {(filters.search || filters.category) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => { setSearch(""); applyFilter({ search: "", category: "" }); }}
              >
                Clear
              </Button>
            )}
          </form>

          {/* Results info */}
          <p className="text-sm text-muted-foreground">
            {pages.total} {pages.total === 1 ? "article" : "articles"} found
            {filters.category && ` in ${categories.find((c) => c.slug === filters.category)?.name ?? filters.category}`}
          </p>

          {/* Cards grid */}
          {pages.data.length === 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                No content found. Try a different search or category.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {pages.data.map((item) => (
                <Card
                  key={item.id}
                  className="border-2 border-border hover:border-[#1F6E4A] transition-all cursor-pointer hover:shadow-md"
                  onClick={() => router.visit(`/content/${item.slug}`)}
                >
                  {item.featured_image && (
                    <div className="h-36 overflow-hidden rounded-t-xl">
                      <img
                        src={item.featured_image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm leading-snug text-foreground line-clamp-2">
                        {item.title}
                      </CardTitle>
                      {item.requires_acknowledgement && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-500 shrink-0">
                          Ack required
                        </Badge>
                      )}
                    </div>
                    {item.category && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        {item.category.name}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-3">{item.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.author}
                      </span>
                      {item.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.published_at}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages.last_page > 1 && (
            <div className="flex justify-center gap-1 pt-2">
              {pages.links.map((link) => (
                <Button
                  key={link.label}
                  variant={link.active ? "default" : "outline"}
                  size="sm"
                  disabled={!link.url}
                  onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                  className={link.active ? "bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white" : ""}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(link.label) }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ContentIndexPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
