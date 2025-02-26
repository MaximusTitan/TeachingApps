"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/components-app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userStatus, setUserStatus] = useState<string | null>(null);

  

  // Redirect to verification waiting page if status is disabled
  if (
    userStatus === "disabled" &&
    pathname !== "/verification-waiting" &&
    pathname !== "/sign-in"
  ) {
    window.location.href = "/verification-waiting";
    return null;
  }
  const showSidebar =
    pathname === "/" ||
    pathname.startsWith("/tools");
  return (
    <SidebarProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {showSidebar && (<AppSidebar />)}
        <main className="flex-1 flex flex-col">
          <div>{children}</div>
        </main>
      </ThemeProvider>
    </SidebarProvider>
  );
}
