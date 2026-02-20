import Image from "next/image";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-[1220px] flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-10">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Sekuire" width={22} height={22} />
          <span className="font-mono text-sm font-bold text-foreground">OAGS</span>
          <span className="text-sm text-muted-foreground">
            Open Agent Governance Specification
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/sekuire/oags"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://github.com/sekuire/oags/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Apache 2.0
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} OAGS Contributors
        </p>
      </div>
    </footer>
  );
}
