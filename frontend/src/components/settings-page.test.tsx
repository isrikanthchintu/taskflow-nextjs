import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPage } from "@/components/settings-page";
import { ACCENT_PRESETS, BACKGROUND_PRESETS } from "@/lib/theme-presets";
import { renderWithTheme, storedData } from "@/test-utils";

async function renderReady() {
  const user = userEvent.setup();
  const view = renderWithTheme(<SettingsPage />);
  await waitFor(() =>
    expect(
      screen.queryByText("Loading your settings...")
    ).not.toBeInTheDocument()
  );
  return { user, view };
}

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("FR5.1 chooses a mode that applies at once, is saved, and is announced", async () => {
    const { user } = await renderReady();

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(screen.getByTestId("setting-mode-status")).toHaveTextContent(
      "Dark mode selected"
    );
    expect(storedData().settings.mode).toBe("dark");
  });

  it("FR5.1 starts on the system mode on first visit", async () => {
    await renderReady();

    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
  });

  it("FR5.2 chooses an accent by its name and saves it", async () => {
    const { user } = await renderReady();

    await user.click(screen.getByRole("radio", { name: "Purple" }));

    expect(storedData().settings.accentId).toBe("purple");
    expect(screen.getByText("Selected: Purple")).toBeInTheDocument();
  });

  it("FR5.4 chooses density and corner style and saves them", async () => {
    const { user } = await renderReady();

    await user.click(screen.getByRole("radio", { name: "Compact" }));
    await user.click(screen.getByRole("radio", { name: "Extra large" }));

    expect(storedData().settings).toMatchObject({
      density: "compact",
      corners: "xl"
    });
  });

  it("FR5.3 chooses a background for the open board only and saves it", async () => {
    const { user } = await renderReady();

    await user.click(screen.getByRole("radio", { name: "Sunset background" }));

    expect(storedData().boards[0].backgroundId).toBe("sunset");
    expect(screen.getByText("Selected: Sunset")).toBeInTheDocument();
  });

  it("FR5.5 keeps every choice after the page is opened again", async () => {
    const first = await renderReady();
    await first.user.click(screen.getByRole("radio", { name: "Dark" }));
    await first.user.click(screen.getByRole("radio", { name: "Green" }));
    first.view.unmount();

    await renderReady();

    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Green" })).toBeChecked();
  });

  it("FR5.5 shows a live preview of a list with two cards", async () => {
    await renderReady();

    const preview = screen.getByTestId("settings-preview");
    expect(preview).toHaveTextContent("Sample list");
    expect(preview).toHaveTextContent("Write the plan");
    expect(preview).toHaveTextContent("Review the plan");
  });

  it("NFR3 names every accent and background swatch in words, never by color alone", async () => {
    await renderReady();

    ACCENT_PRESETS.forEach((preset) =>
      expect(
        screen.getByRole("radio", { name: preset.name })
      ).toBeInTheDocument()
    );
    BACKGROUND_PRESETS.forEach((preset) =>
      expect(
        screen.getByRole("radio", { name: `${preset.name} background` })
      ).toBeInTheDocument()
    );
  });

  it("NFR3 makes Back to board the first focusable element and groups each choice in a fieldset", async () => {
    const { user } = await renderReady();

    await user.tab();

    expect(screen.getByRole("link", { name: "Back to board" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Back to board" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("main")).toBeInTheDocument();
    ["Mode", "Accent color", "Density", "Corners"].forEach((legend) =>
      expect(screen.getByRole("group", { name: legend })).toBeInTheDocument()
    );
  });

  it("FR1.4 reports a choice that could not be saved and keeps the earlier data", async () => {
    const { user } = await renderReady();
    const before = window.localStorage.getItem("taskflow.data.v2");
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(
      await screen.findByText(/Browser storage is full/)
    ).toBeInTheDocument();
    setItem.mockRestore();
    expect(window.localStorage.getItem("taskflow.data.v2")).toBe(before);
  });
});
