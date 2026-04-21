import { Link } from "wouter";
import { Activity, PhoneCall, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/lib/translations";

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हि" },
  { code: "od", label: "ଓଡ" },
];

export function Navbar() {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t.nav.toggleMenu}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">{t.nav.navigationMenu}</SheetTitle>
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                <Activity className="h-5 w-5" />
                MediTech
              </Link>
            </div>
            <SidebarNav />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 mr-4 hidden lg:flex">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Activity className="h-6 w-6" />
            <span>MediTech</span>
          </Link>
        </div>

        <div className="ml-auto flex items-center space-x-3">
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">{t.navbar.allSystemsOperational}</span>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 gap-0.5">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  lang === code
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={code === "en" ? "English" : code === "hi" ? "हिंदी" : "ଓଡ଼ିଆ"}
              >
                {label}
              </button>
            ))}
          </div>

          <PwaInstallButton />
          <Button variant="destructive" size="sm" className="gap-2 font-bold animate-in fade-in zoom-in" asChild>
            <a href="tel:+91112">
              <PhoneCall className="h-4 w-4" />
              +91 112
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
