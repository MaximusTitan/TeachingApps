"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/components-app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import path from "path";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [hasCognitiveAssessment, setHasCognitiveAssessment] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
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
    pathname.startsWith("/tools") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/chatbot") ||
    pathname.startsWith("/protected") ||
    pathname.startsWith("/schools") ||
    pathname.startsWith("/livebot") ||
    pathname.startsWith("/audiobot") ||
    pathname.startsWith("/learn-ai") ||
    pathname.startsWith("/payment") ||
    pathname.startsWith("/canvas") ||
    pathname.startsWith("/rooms") ||
    pathname.startsWith("/games") ||
    pathname.startsWith("/logs") ||
    pathname.startsWith("/roles") ||
    pathname.startsWith("/document-vault") ||
    pathname.startsWith("/connect-database") ||
    pathname.startsWith("/feedback") ||
    (pathname.startsWith("/profile") &&
      userRole === "Student" &&
      hasCognitiveAssessment);
  return (
    <SidebarProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {showSidebar && (console.log("Rendering Sidebar"), <AppSidebar />)}
        <main className="flex-1 flex flex-col">
          <div>{children}</div>
        </main>
        <Toaster />
      </ThemeProvider>
    </SidebarProvider>
  );
}
