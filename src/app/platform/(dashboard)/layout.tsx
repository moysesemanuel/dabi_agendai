import { PlatformShell } from "@/components/projects/platform/platform-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
