import { PropsWithChildren, useState } from "react";
import { Navbar } from "./navbar";
import { SidebarNav } from "./sidebar-nav";
import { useLocation } from "wouter";

export function AppLayout({ children }: PropsWithChildren) {
  const [location] = useLocation();
  const isHome = location === "/";

  if (isHome) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 border-r bg-card lg:block shrink-0 overflow-y-auto">
          <SidebarNav />
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
