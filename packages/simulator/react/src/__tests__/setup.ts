import { cleanup } from "@testing-library/react";
import { afterEach } from "bun:test";

import "@happy-dom/global-registrator/register.js";

afterEach(cleanup);

// happy-dom's getContext returns null — stub it for canvas tests.
globalThis.HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const canvas = this;
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "canvas") return canvas;
        return () => {};
      },
      set() {
        return true;
      },
    },
  ) as unknown as ReturnType<HTMLCanvasElement["getContext"]>;
} as typeof HTMLCanvasElement.prototype.getContext;
