import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AiAssistBar({
  ticketId,
  ticketType,
  onApply,
  showDescribe,
  showSuggest,
}) {
  const [description, setDescription] = useState("");
  const [composing, setComposing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [cached, setCached] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [fetched, setFetched] = useState(false);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [suggestions]);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  const fetchSuggestions = async (force = false) => {
    setLoadingSuggest(true);
    try {
      const res = await base44.functions.invoke("aiEmailAssist", {
        mode: "suggest",
        ticket_id: ticketId,
        ticket_type: ticketType,
        force_refresh: force,
      });
      setSuggestions(res.data.suggestions || []);
      setGeneratedAt(res.data.generated_at);
      setCached(res.data.cached);
      setFetched(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggest(false);
    }
  };

  useEffect(() => {
    if (showSuggest && !fetched) fetchSuggestions(false);
  }, [showSuggest]);

  const handleCompose = async () => {
    if (!description.trim()) return;
    setComposing(true);
    try {
      const res = await base44.functions.invoke("aiEmailAssist", {
        mode: "compose",
        ticket_id: ticketId,
        ticket_type: ticketType,
        description,
      });
      onApply(res.data.body_html);
    } catch (e) {
      console.error(e);
    } finally {
      setComposing(false);
    }
  };

  if (!showDescribe && !showSuggest) return null;

  return (
    <div className="border border-purple-200 bg-purple-50/50 rounded-lg p-3 space-y-3">
      {showDescribe && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-purple-900">
            Describe what you want to say
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Thank them for applying, let them know we'd love to schedule a quick intro call next week..."
            className="text-sm min-h-[60px] bg-white"
          />
          <Button
            size="sm"
            onClick={handleCompose}
            disabled={!description.trim() || composing}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
          >
            {composing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Generate
          </Button>
        </div>
      )}

      {showSuggest && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-900">
              {loadingSuggest
                ? "Generating suggestions..."
                : cached && generatedAt
                ? `Cached suggestions · generated ${formatDistanceToNow(new Date(generatedAt))} ago`
                : "Fresh suggestions"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fetchSuggestions(true)}
              disabled={loadingSuggest}
              title="Regenerate — uses AI credits"
              className="h-7 gap-1 text-purple-700 hover:text-purple-900"
            >
              <RefreshCw className={`w-3 h-3 ${loadingSuggest ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <div className="relative">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-full p-1 shadow-sm"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 text-purple-700" />
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollBy(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-full p-1 shadow-sm"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-purple-700" />
              </button>
            )}
            <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scroll-smooth">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onApply(s.body_html)}
                  className="flex-shrink-0 w-64 text-left bg-white border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all rounded-lg p-3"
                >
                  <div className="text-xs font-bold text-purple-700 mb-1.5">{s.label}</div>
                  <div
                    className="text-xs text-gray-700 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: s.body_html }}
                  />
                </button>
              ))}
              {!loadingSuggest && suggestions.length === 0 && fetched && (
                <div className="text-xs text-gray-500 italic">No suggestions returned.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}