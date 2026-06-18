import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: "sm" | "xs";
}

export function CopyButton({ value, className, size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!value) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={handleCopy}
      className={cn(
        "shrink-0 text-muted-foreground hover:text-foreground transition-colors",
        size === "xs" ? "h-5 w-5" : "h-6 w-6",
        className
      )}
      title={copied ? "Tersalin!" : "Salin"}
    >
      {copied
        ? <Check className={cn(size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5", "text-emerald-500")} />
        : <Copy className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      }
    </Button>
  );
}
