import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { GraphCanvas } from "@/components/graph/graph-canvas";
import { useGraphs } from "@/hooks/use-graphs";
import { graphsSchema, type GraphsValues } from "@/lib/schemas";
import { Route } from "@/routes/_authed/index";

export function GraphsPage() {
  const { num_props, max_height } = Route.useSearch();
  const navigate = Route.useNavigate();

  const submitted: GraphsValues | null =
    num_props != null && max_height != null ? { num_props, max_height } : null;

  const form = useForm<GraphsValues>({
    resolver: zodResolver(graphsSchema),
    defaultValues: {
      num_props: num_props ?? 3,
      max_height: max_height ?? 5,
    },
  });

  const { data, error, isFetching } = useGraphs(submitted);

  const watched = useWatch({ control: form.control });
  const paramsMatch =
    data != null && data.num_props === watched.num_props && data.max_height === watched.max_height;

  function onSubmit(values: GraphsValues) {
    navigate({ search: values });
  }

  return (
    <div className="h-full w-full">
      <GraphCanvas
        data={data}
        form={form}
        onSubmit={onSubmit}
        isFetching={isFetching}
        error={error}
        paramsMatch={paramsMatch}
      />
    </div>
  );
}
