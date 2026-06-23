import Link from "next/link";
import { Workflow } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left Column: Branding / Marketing (Sleek Dark) */}
      <div className="hidden flex-col justify-between bg-zinc-950 p-12 text-zinc-50 lg:flex dark:bg-zinc-950/50">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Workflow className="h-6 w-6" />
          ShipFlow
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">
            Streamline your delivery lifecycle.
          </h1>
          <p className="text-zinc-400">
            From feature request to shipped product, leverage AI to automate
            PRDs, plan tasks, and review code seamlessly.
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          © {new Date().getFullYear()} ShipFlow Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column: Forms */}
      <div className="flex flex-col p-8 lg:p-12">
        <div className="flex flex-1 flex-col justify-center max-w-md mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
