import { Button } from "@/components/ui/button";

import { getLocale, locales, setLocale } from "@/paraglide/runtime.js";

export function LocaleToggle() {
  const current = getLocale();
  const next = locales.find((l) => l !== current) ?? locales[0];

  return (
    <Button variant="ghost" size="sm" onClick={() => setLocale(next)}>
      {current.toUpperCase()}
    </Button>
  );
}
