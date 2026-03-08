import { render } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { Ball } from "../ball.js";
import { Hand, Hands } from "../hands.js";
import { Juggler } from "../juggler.js";

describe.each([
  { name: "Juggler", element: <Juggler /> },
  { name: "Ball", element: <Ball color="red" /> },
  { name: "Hand", element: <Hand /> },
  { name: "Hands", element: <Hands /> },
])("$name", ({ element }) => {
  test("renders nothing to the DOM", () => {
    const { container } = render(element);
    expect(container.innerHTML).toBe("");
  });
});

describe("Juggler", () => {
  test("accepts a render function as children", () => {
    const { container } = render(<Juggler>{() => {}}</Juggler>);
    expect(container.innerHTML).toBe("");
  });
});

describe("Ball", () => {
  test("accepts a render function as children", () => {
    const { container } = render(<Ball color="blue">{() => {}}</Ball>);
    expect(container.innerHTML).toBe("");
  });
});

describe("Hands", () => {
  test("renders nothing with Hand children", () => {
    const { container } = render(
      <Hands count={3}>
        <Hand />
        <Hand />
      </Hands>,
    );
    expect(container.innerHTML).toBe("");
  });
});
