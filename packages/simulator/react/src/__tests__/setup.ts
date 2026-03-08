import { cleanup } from "@testing-library/react";
import { afterEach } from "bun:test";
import { GlobalWindow } from "happy-dom";

const window = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(window)) {
  if (key in globalThis) continue;
  // @ts-expect-error — dynamic global assignment
  globalThis[key] = window[key];
}
globalThis.document = window.document as unknown as Document;
globalThis.navigator = window.navigator as unknown as Navigator;

// RTL auto-cleanup doesn't detect Bun's test runner.
afterEach(cleanup);

// happy-dom doesn't implement Canvas API.
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

globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
  return setTimeout(() => cb(performance.now()), 0) as unknown as number;
};
globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
