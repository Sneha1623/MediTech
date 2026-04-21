import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Ambulance,
  PhoneCall,
  ClipboardList,
  LineChart,
  Bell,
  Brain,
  ScanLine,
  Heart,
  FileSearch,
  UserCheck,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/ambulances", label: "Ambulances", icon: Ambulance },
  { href: "/book", label: "Book Ambulance", icon: PhoneCall },
  { href: "/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

const aiNavItems = [
  { href: "/ai", label: "AI Tools Hub", icon: Stethoscope },
  { href: "/ai/symptom-checker", label: "Symptom Checker", icon: Brain },
  { href: "/ai/image-detect", label: "Skin & Wound AI", icon: ScanLine },
  { href: "/ai/home-care", label: "Home Care", icon: Heart },
  { href: "/ai/prescription-scanner", label: "Prescription OCR", icon: FileSearch },
  { href: "/ai/specialist", label: "Find Specialist", icon: UserCheck },
];

export function SidebarNav() {
  const [location] = useLocation();

  const isActive = (href: string) =>
    href === "/ai"
      ? location === "/ai"
      : location === href || (location.startsWith(href) && href !== "/");

  return (
    <nav className="space-y-1 p-4">
      {mainNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}

      <div className="pt-3 pb-1">
        <div className="flex items-center gap-2 px-3 mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Health Tools</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">Beta</Badge>
        </div>
      </div>

      {aiNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
