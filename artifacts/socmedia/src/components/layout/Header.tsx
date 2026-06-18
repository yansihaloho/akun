import { User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 gap-3 bg-card flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="font-medium text-foreground">admin</span>
      </div>
    </header>
  );
}
