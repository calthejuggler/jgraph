import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { BuilderCanvas } from "@/components/builder/builder-canvas";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { builderSchema, UI_MAX_HEIGHT, type BuilderValues } from "@/lib/schemas";
import { useConfigQuery } from "@/queries/config";
import { Route } from "@/routes/_authed/builder";

export function BuilderPage() {
  const { data: config } = useConfigQuery();
  const effectiveMax = config?.max_max_height ?? UI_MAX_HEIGHT;

  const { num_props, max_height } = Route.useSearch();
  const navigate = Route.useNavigate();

  const submitted: BuilderValues = { num_props, max_height };

  const form = useForm<BuilderValues>({
    resolver: zodResolver(builderSchema(effectiveMax)),
    defaultValues: submitted,
    mode: "onChange",
  });

  const navigateToSearch = useCallback(
    (values: BuilderValues) => {
      navigate({ search: (prev) => ({ ...prev, ...values }), replace: true });
    },
    [navigate],
  );

  const debouncedNavigate = useDebouncedCallback(navigateToSearch, 400);

  async function onFieldChange() {
    const isValid = await form.trigger();
    if (isValid) {
      debouncedNavigate(form.getValues());
    }
  }

  return (
    <div className="h-full w-full">
      <BuilderCanvas
        key={`${num_props}-${max_height}`}
        form={form}
        onFieldChange={onFieldChange}
        numProps={num_props}
        maxHeight={max_height}
        effectiveMax={effectiveMax}
      />
    </div>
  );
}
