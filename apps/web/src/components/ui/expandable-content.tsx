"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ExpandableContentProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  contentToCopy?: string;
  copyLabel?: string;
  copiedLabel?: string;
  maxHeight?: string;
  extraActions?: React.ReactNode;
}

export function ExpandableContent({
  title,
  icon,
  children,
  contentToCopy,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  maxHeight = "120px",
  extraActions,
}: ExpandableContentProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const maxH = parseInt(maxHeight) || 120;
      setIsOverflowing(contentRef.current.scrollHeight > maxH);
    }
  }, [children, maxHeight]);

  const handleCopy = () => {
    if (!contentToCopy) return;
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col relative print:border-none print:shadow-none">
      <div className="border-b border-border/50 bg-muted/20 px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {contentToCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="text-xs">{copied ? copiedLabel : copyLabel}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <div 
          ref={contentRef}
          className={cn(
            "p-6 transition-all duration-300 ease-in-out overflow-hidden print:max-h-none",
            !expanded && isOverflowing && "relative"
          )}
          style={{ maxHeight: (expanded || !isOverflowing) ? "9999px" : maxHeight }}
        >
          {children}
          
          {!expanded && isOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card/80 to-transparent flex items-end justify-center pb-2 pointer-events-none print:hidden" />
          )}
        </div>

        {isOverflowing && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-card border border-border shadow-sm rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10 print:hidden"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Click to see more
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Spacer to account for the overlapping button */}
      {isOverflowing && <div className="h-4" />}
    </div>
  );
}
