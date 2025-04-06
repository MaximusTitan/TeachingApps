import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "AI Ready School",
  description: "The Power of AI to Empower Everyone at the School",
};

export default function StoryGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>{children}</ClientLayout>
  );
}
