import { fireEvent, renderHook } from "@testing-library/react";
import { useHotkeys } from "@/hooks/use-hotkeys";

function press(key: string, init: KeyboardEventInit = {}, target?: Element) {
  fireEvent.keyDown(target ?? document.body, { key, ...init });
}

describe("useHotkeys", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("FR9.2 runs the handler for N, L, slash, B and question mark", () => {
    const handlers = {
      n: jest.fn(),
      l: jest.fn(),
      "/": jest.fn(),
      b: jest.fn(),
      "?": jest.fn()
    };
    renderHook(() => useHotkeys(handlers));

    press("n");
    press("l");
    press("/");
    press("b");
    press("?", { shiftKey: true });

    Object.values(handlers).forEach((handler) =>
      expect(handler).toHaveBeenCalledTimes(1)
    );
  });

  it("FR9.3 does not fire single keys while typing in an input, textarea or select", () => {
    const n = jest.fn();
    renderHook(() => useHotkeys({ n }));
    ["input", "textarea", "select"].forEach((tag) => {
      const field = document.createElement(tag);
      document.body.appendChild(field);
      press("n", {}, field);
    });

    expect(n).not.toHaveBeenCalled();
  });

  it("FR9.3 does not fire single keys while a dialog or menu is open", () => {
    const n = jest.fn();
    renderHook(() => useHotkeys({ n }));
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.appendChild(dialog);

    press("n");
    dialog.remove();
    const menu = document.createElement("ul");
    menu.setAttribute("role", "menu");
    document.body.appendChild(menu);
    press("n");

    expect(n).not.toHaveBeenCalled();
    menu.remove();
    press("n");
    expect(n).toHaveBeenCalledTimes(1);
  });

  it("FR9.1 opens the command menu with Ctrl+K and Cmd+K, even from a field", () => {
    const open = jest.fn();
    renderHook(() => useHotkeys({ "mod+k": open }));
    const field = document.createElement("input");
    document.body.appendChild(field);

    press("k", { ctrlKey: true }, field);
    press("k", { metaKey: true });

    expect(open).toHaveBeenCalledTimes(2);
  });

  it("FR9.3 ignores a single key pressed with Ctrl, Cmd or Alt", () => {
    const n = jest.fn();
    renderHook(() => useHotkeys({ n }));

    press("n", { ctrlKey: true });
    press("n", { metaKey: true });
    press("n", { altKey: true });

    expect(n).not.toHaveBeenCalled();
  });

  it("FR9.2 stops listening when switched off or unmounted", () => {
    const n = jest.fn();
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useHotkeys({ n }, enabled),
      { initialProps: { enabled: false } }
    );

    press("n");
    expect(n).not.toHaveBeenCalled();
    rerender({ enabled: true });
    press("n");
    expect(n).toHaveBeenCalledTimes(1);
    unmount();
    press("n");
    expect(n).toHaveBeenCalledTimes(1);
  });

  it("FR9.2 uses the latest handler after a re-render", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(
      ({ handler }) => useHotkeys({ n: handler }),
      {
        initialProps: { handler: first }
      }
    );

    rerender({ handler: second });
    press("n");

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
