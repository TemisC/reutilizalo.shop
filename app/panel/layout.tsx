import { Suspense } from "react";
import { PanelSidebar } from "@/components/panel/panel-sidebar";

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return (
    <div className="flex flex-1">
      {/* El menú lee la sesión: va dentro de Suspense. */}
      <Suspense fallback={<div className="sticky top-0 hidden h-dvh w-62 shrink-0 bg-ink lg:block" />}>
        <PanelSidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
