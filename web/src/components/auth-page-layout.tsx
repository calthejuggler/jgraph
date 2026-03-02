import type { ReactNode } from "react";

import { LocaleToggle } from "@/components/locale-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthPageLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LocaleToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
