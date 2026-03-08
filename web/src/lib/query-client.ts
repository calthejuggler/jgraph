import { QueryClient } from "@tanstack/react-query";

import { HttpError } from "./http-error";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < 3 &&
        !(error instanceof HttpError && error.status >= 400 && error.status < 500),
    },
  },
});
