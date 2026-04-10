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
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/ambulances", label: "Ambulances", icon: Ambulance },
  { href: "/book", label: "Book Ambulance", icon: PhoneCall },
  { href: "/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export function SidebarNav() {
  const [location] = useLocation();

  return (
    <nav className="space-y-1 p-4">
      {navItems.map((item) => {
        const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
