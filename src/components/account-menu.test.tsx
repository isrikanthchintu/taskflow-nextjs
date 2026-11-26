import { useState } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountMenu } from "@/components/account-menu";
import { THEME_SAVE_FAILED } from "@/hooks/use-theme-preference";
import type { CurrentUser } from "@/lib/current-user";
import { renderWithTheme, storedData } from "@/test-utils";

const USER: CurrentUser = {
  name: "Srikanth P",
  initials: "SP",
  email: "srikanth.p@example.com"
};

type Props = Partial<React.ComponentProps<typeof AccountMenu>>;

function Harness(props: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <button data-testid="trigger" onClick={(e) => setAnchor(e.currentTarget)}>
        open
      </button>
      <AccountMenu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        user={USER}
        features={{ switchAccounts: false, labs: false }}
        accountUrl=""
        helpUrl=""
        onOpenShortcuts={jest.fn()}
        onCreateWorkspace={jest.fn()}
        onLogout={jest.fn()}
        onToast={jest.fn()}
        {...props}
      />
    </>
  );
}

async function setup(props: Props = {}) {
  const user = userEvent.setup();
  renderWithTheme(<Harness {...props} />);
  await user.click(screen.getByTestId("trigger"));
  const menu = await screen.findByRole("menu", { name: "Account" });
  return { user, menu };
}

describe("AccountMenu", () => {
  beforeEach(() => window.localStorage.clear());

  describe("layout and account section", () => {
    it("3.2 shows the ACCOUNT heading, avatar initials, full name and email", async () => {
      const { menu } = await setup();

      expect(within(menu).getByText("Account")).toBeInTheDocument();
      expect(screen.getByTestId("account-menu-name")).toHaveTextContent(
        "Srikanth P"
      );
      expect(screen.getByTestId("account-menu-email")).toHaveTextContent(
        "srikanth.p@example.com"
      );
      expect(
        within(screen.getByTestId("account-menu-user")).getByText("SP")
      ).toBeInTheDocument();
    });

    it("3.1 is 300px wide and limited to the viewport height minus 64px, scrolling inside", async () => {
      const { menu } = await setup();

      const paper = menu.closest(".MuiPaper-root") as HTMLElement;
      const style = window.getComputedStyle(paper);
      expect(style.width).toBe("300px");
      expect(style.maxHeight).toBe("calc(100vh - 64px)");
      expect(style.overflowY).toBe("auto");
    });

    it("FR-02 exposes the full email through a tooltip", async () => {
      const { user } = await setup();

      await user.hover(screen.getByTestId("account-menu-email"));

      expect(await screen.findByRole("tooltip")).toHaveTextContent(
        "srikanth.p@example.com"
      );
    });

    it("FR-02 truncates long names and emails instead of overflowing", async () => {
      await setup({
        user: {
          name: "A".repeat(120),
          initials: "AA",
          email: `${"b".repeat(120)}@example.com`
        }
      });

      expect(
        window.getComputedStyle(screen.getByTestId("account-menu-name"))
          .textOverflow
      ).toBe("ellipsis");
      expect(
        window.getComputedStyle(screen.getByTestId("account-menu-email"))
          .textOverflow
      ).toBe("ellipsis");
    });

    it("6.4 falls back to a generic name and hides the email when user data is missing", async () => {
      await setup({ user: { name: "", initials: "" } });

      expect(screen.getByTestId("account-menu-name")).toHaveTextContent(
        "Account"
      );
      expect(
        screen.queryByTestId("account-menu-email")
      ).not.toBeInTheDocument();
    });

    it("FR-03 hides Switch Accounts unless its feature is enabled", async () => {
      await setup();

      expect(screen.queryByTestId("account-switch")).not.toBeInTheDocument();
    });

    it("FR-03 shows Switch Accounts when enabled and starts the flow", async () => {
      const onSwitchAccounts = jest.fn();
      const { user } = await setup({
        features: { switchAccounts: true, labs: false },
        onSwitchAccounts
      });

      await user.click(screen.getByTestId("account-switch"));

      expect(onSwitchAccounts).toHaveBeenCalledTimes(1);
    });

    it("FR-04 links Manage Account to the configured URL with an external-link icon", async () => {
      await setup({ accountUrl: "https://accounts.example.test/me" });

      const item = screen.getByTestId("account-manage");
      expect(item).toHaveAttribute("href", "https://accounts.example.test/me");
      expect(item).toHaveAttribute("target", "_blank");
      expect(within(item).getByTestId("OpenInNewIcon")).toBeInTheDocument();
    });

    it("FR-04 disables Manage Account rather than hardcoding a URL when none is configured", async () => {
      await setup();

      const item = screen.getByTestId("account-manage");
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item).not.toHaveAttribute("href");
    });
  });

  describe("navigation", () => {
    it("3.3 lists the product links in order with their destinations", async () => {
      const { menu } = await setup();

      const links = ["profile", "activity", "cards", "settings"].map((id) =>
        screen.getByTestId(`account-${id}`)
      );
      expect(links.map((item) => item.textContent)).toEqual([
        "Profile and visibility",
        "Activity",
        "Cards",
        "Settings"
      ]);
      expect(links.map((item) => item.getAttribute("href"))).toEqual([
        "/profile",
        "/activity",
        "/cards",
        "/settings"
      ]);
      expect(within(menu).getByText("TaskFlow")).toBeInTheDocument();
    });

    it("FR-09 hides Labs unless its feature is enabled", async () => {
      await setup();

      expect(screen.queryByTestId("account-labs")).not.toBeInTheDocument();
    });

    it("FR-09 shows Labs with its badge when the flag is on", async () => {
      await setup({ features: { switchAccounts: false, labs: true } });

      const item = screen.getByTestId("account-labs");
      expect(item).toHaveAttribute("href", "/labs");
      expect(within(item).getByTestId("account-labs-badge")).toHaveTextContent(
        "Labs"
      );
    });

    it("FR-12 links Help to the configured help centre", async () => {
      await setup({ helpUrl: "https://help.example.test" });

      expect(screen.getByTestId("account-help")).toHaveAttribute(
        "href",
        "https://help.example.test"
      );
    });

    it("keeps the sections in the documented order", async () => {
      const { menu } = await setup();

      const order = within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent);
      expect(order).toEqual([
        "Manage Account",
        "Profile and visibility",
        "Activity",
        "Cards",
        "Settings",
        "Theme",
        "Create Workspace",
        "Help",
        "Shortcuts",
        "Log out"
      ]);
      expect(menu.querySelectorAll("hr, li[role='separator']")).toHaveLength(4);
    });
  });

  describe("theme submenu", () => {
    it("3.4 opens a nested Light, Dark and Match System submenu with swatches and one selected option", async () => {
      const { user } = await setup();

      await user.click(screen.getByTestId("account-theme"));

      const submenu = await screen.findByRole("menu", { name: "Theme" });
      const options = within(submenu).getAllByRole("menuitemradio");
      expect(options.map((item) => item.textContent)).toEqual([
        "Light",
        "Dark",
        "Match System"
      ]);
      for (const mode of ["light", "dark", "system"]) {
        expect(screen.getByTestId(`theme-swatch-${mode}`)).toBeInTheDocument();
      }
      expect(
        options.filter((item) => item.getAttribute("aria-checked") === "true")
      ).toHaveLength(1);
      expect(
        screen.getByRole("menu", { name: "Account", hidden: true })
      ).toBeInTheDocument();
    });

    it("FR-10 applies Dark immediately and persists it", async () => {
      const { user } = await setup();

      await user.click(screen.getByTestId("account-theme"));
      await user.click(await screen.findByTestId("theme-option-dark"));

      await waitFor(() => expect(storedData().settings.mode).toBe("dark"));
      await user.click(screen.getByTestId("account-theme"));
      expect(await screen.findByTestId("theme-option-dark")).toHaveAttribute(
        "aria-checked",
        "true"
      );
    });

    it("FR-10 stores Match System as the system mode", async () => {
      const { user } = await setup();

      await user.click(screen.getByTestId("account-theme"));
      await user.click(await screen.findByTestId("theme-option-system"));

      await waitFor(() => expect(storedData().settings.mode).toBe("system"));
    });

    it("3.4 opens the submenu with ArrowRight and closes it with ArrowLeft, returning focus to Theme", async () => {
      const { user } = await setup();
      const theme = screen.getByTestId("account-theme");

      theme.focus();
      await user.keyboard("{ArrowRight}");
      await screen.findByRole("menu", { name: "Theme" });
      await user.keyboard("{ArrowLeft}");

      await waitFor(() =>
        expect(
          screen.queryByRole("menu", { name: "Theme" })
        ).not.toBeInTheDocument()
      );
      await waitFor(() => expect(theme).toHaveFocus());
      expect(screen.getByRole("menu", { name: "Account" })).toBeInTheDocument();
    });

    it("3.4 closes only the submenu on Escape and returns focus to Theme", async () => {
      const { user } = await setup();
      const theme = screen.getByTestId("account-theme");

      await user.click(theme);
      await screen.findByRole("menu", { name: "Theme" });
      await user.keyboard("{Escape}");

      await waitFor(() =>
        expect(
          screen.queryByRole("menu", { name: "Theme" })
        ).not.toBeInTheDocument()
      );
      expect(screen.getByRole("menu", { name: "Account" })).toBeInTheDocument();
      await waitFor(() => expect(theme).toHaveFocus());
    });

    it("6.1 keeps the chosen theme and offers a retry when saving fails", async () => {
      const onToast = jest.fn();
      const { user } = await setup({ onToast });
      await user.click(screen.getByTestId("account-theme"));
      await screen.findByTestId("theme-option-light");
      const setItem = jest
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("quota");
        });

      await user.click(screen.getByTestId("theme-option-dark"));

      expect(onToast).toHaveBeenCalledWith(
        THEME_SAVE_FAILED,
        expect.any(Function)
      );
      expect(THEME_SAVE_FAILED).toBe("Couldn't save theme preference");
      await user.click(screen.getByTestId("account-theme"));
      expect(await screen.findByTestId("theme-option-dark")).toHaveAttribute(
        "aria-checked",
        "true"
      );

      setItem.mockRestore();
      const retry = onToast.mock.calls[0][1] as () => void;
      retry();

      await waitFor(() => expect(storedData().settings.mode).toBe("dark"));
    });
  });

  describe("actions", () => {
    it("FR-11 starts workspace creation", async () => {
      const onCreateWorkspace = jest.fn();
      const { user } = await setup({ onCreateWorkspace });

      await user.click(screen.getByTestId("account-create-workspace"));

      expect(onCreateWorkspace).toHaveBeenCalledTimes(1);
    });

    it("FR-13 opens the shortcuts dialog", async () => {
      const onOpenShortcuts = jest.fn();
      const { user } = await setup({ onOpenShortcuts });

      await user.click(screen.getByTestId("account-shortcuts"));

      expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
    });

    it("FR-14 logs out", async () => {
      const onLogout = jest.fn();
      const { user } = await setup({ onLogout });

      await user.click(screen.getByTestId("account-logout"));

      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("moves through items with the arrow keys and activates with Enter", async () => {
      const onLogout = jest.fn();
      const { user } = await setup({ onLogout });

      await user.keyboard("{ArrowUp}{Enter}");

      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("closes with Escape", async () => {
      const { user } = await setup();

      await user.keyboard("{Escape}");

      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument()
      );
    });

    it("renders extra items such as the mobile What's new entry", async () => {
      const onSelect = jest.fn();
      const { user } = await setup({
        extraItems: [{ id: "announcements", label: "What's new", onSelect }]
      });

      await user.click(screen.getByTestId("account-announcements"));

      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });
});
