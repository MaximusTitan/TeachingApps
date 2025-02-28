"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <main className="flex-1 flex flex-col ">
        <div>{children}</div>
      </main>
    </ThemeProvider>
  );
}
