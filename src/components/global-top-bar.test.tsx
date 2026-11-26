import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GlobalTopBar } from "@/components/global-top-bar";
import { SearchProvider, useGlobalSearch } from "@/components/search-context";
import { SEEN_KEY } from "@/hooks/use-seen-indicator";
import {
  resetNotificationsStore,
  SessionExpiredError,
  refreshUnread,
  setUnreadFetcher,
  UNREAD_POLL_MS
} from "@/lib/notifications-store";
import { loginUrl } from "@/lib/session";
import { renderWithTheme, storedData } from "@/test-utils";

function QueryProbe() {
  const { query } = useGlobalSearch();
  return <output data-testid="query-probe">{query}</output>;
}

function installViewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const matches = max ? width <= Number(max[1]) : false;
    return {
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null
    };
  }) as unknown as typeof window.matchMedia;
}

function setup(props: Partial<React.ComponentProps<typeof GlobalTopBar>> = {}) {
  const view = renderWithTheme(
    <SearchProvider>
      <GlobalTopBar variant="board" {...props} />
      <QueryProbe />
    </SearchProvider>
  );
  return { user: userEvent.setup(), ...view };
}

async function badgeText() {
  return screen.getByTestId("notification-badge").textContent ?? "";
}

describe("GlobalTopBar", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.localStorage.clear();
    resetNotificationsStore();
    setUnreadFetcher(async () => 0);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    resetNotificationsStore();
    jest.useRealTimers();
  });

  describe("layout", () => {
    it("is a fixed 48px banner pinned to the top of the viewport", () => {
      setup();

      const bar = screen.getByRole("banner");
      const style = window.getComputedStyle(bar);
      expect(style.position).toBe("fixed");
      expect(style.top).toBe("0px");
      expect(style.height).toBe("48px");
    });

    it("orders left, center and right controls as the ticket requires", () => {
      setup();

      const names = within(screen.getByRole("banner"))
        .getAllByRole("button")
        .map(
          (button) => button.getAttribute("aria-label") ?? button.textContent
        );
      expect(names).toEqual([
        "App switcher",
        "Create",
        "Announcements, new",
        "Notifications",
        "Help, new content",
        "Account, Srikanth P"
      ]);
      expect(
        screen.getByRole("link", { name: "TaskFlow home" })
      ).toBeInTheDocument();
    });

    it("gives every icon button an accessible name", () => {
      setup();

      for (const button of within(screen.getByRole("banner")).getAllByRole(
        "button"
      )) {
        expect(button).toHaveAccessibleName();
      }
    });

    it("shows a tooltip for icon buttons on hover", async () => {
      const { user } = setup();

      await user.hover(screen.getByTestId("top-bar-apps"));

      expect(await screen.findByRole("tooltip")).toHaveTextContent(
        "App switcher"
      );
    });

    it("uses the translucent variant on boards and the light surface elsewhere", () => {
      const { unmount } = setup({ variant: "board" });
      expect(screen.getByTestId("global-top-bar")).toHaveAttribute(
        "data-variant",
        "board"
      );
      unmount();

      setup({ variant: "light" });
      expect(screen.getByTestId("global-top-bar")).toHaveAttribute(
        "data-variant",
        "light"
      );
    });
  });

  describe("navigation", () => {
    it("FR-02 links the logo and name to Home", () => {
      setup();

      expect(
        screen.getByRole("link", { name: "TaskFlow home" })
      ).toHaveAttribute("href", "/");
    });

    it("FR-01 opens the app switcher with the app destinations", async () => {
      const { user } = setup();

      await user.click(screen.getByRole("button", { name: "App switcher" }));

      const menu = await screen.findByRole("menu", { name: "App switcher" });
      expect(
        within(menu)
          .getAllByRole("menuitem")
          .map((item) => item.getAttribute("href"))
      ).toEqual(["/", "/archive", "/settings"]);
    });
  });

  describe("search", () => {
    it("FR-04 shares typed text with the page through the search context", async () => {
      const { user } = setup();

      await user.type(
        screen.getByRole("textbox", { name: "Search tasks" }),
        "ab"
      );

      expect(screen.getByTestId("query-probe")).toHaveTextContent("ab");
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    });
  });

  describe("create menu", () => {
    it("FR-03 lists Create Board, Start with a Template and Create Workspace", async () => {
      const { user } = setup();

      await user.click(screen.getByRole("button", { name: "Create" }));

      const menu = await screen.findByRole("menu", { name: "Create" });
      expect(
        within(menu)
          .getAllByRole("menuitem")
          .map((item) => item.textContent)
      ).toEqual(["Create Board", "Start with a Template", "Create Workspace"]);
    });

    it("FR-03 creates a board from Create Board", async () => {
      const { user } = setup();
      await waitFor(() => expect(storedData).toBeDefined());

      await user.click(screen.getByRole("button", { name: "Create" }));
      await user.click(await screen.findByTestId("create-board"));
      await user.type(await screen.findByTestId("board-name-input"), "Roadmap");
      await user.click(screen.getByTestId("board-name-submit"));

      await waitFor(() =>
        expect(storedData().boards.map((board) => board.name)).toContain(
          "Roadmap"
        )
      );
    });

    it("FR-03 calls the supplied handlers for template and workspace creation", async () => {
      const onStartFromTemplate = jest.fn();
      const onCreateWorkspace = jest.fn();
      const { user } = setup({ onStartFromTemplate, onCreateWorkspace });

      await user.click(screen.getByRole("button", { name: "Create" }));
      await user.click(await screen.findByTestId("create-template"));
      await user.click(screen.getByRole("button", { name: "Create" }));
      await user.click(await screen.findByTestId("create-workspace"));

      expect(onStartFromTemplate).toHaveBeenCalledTimes(1);
      expect(onCreateWorkspace).toHaveBeenCalledTimes(1);
    });

    it("FR-03 says so when a creation flow is not available yet", async () => {
      const { user } = setup();

      await user.click(screen.getByRole("button", { name: "Create" }));
      await user.click(await screen.findByTestId("create-workspace"));

      expect(
        await screen.findByText("Workspaces are not available yet")
      ).toBeVisible();
    });
  });

  describe("announcements and help indicators", () => {
    it("FR-05 shows an unseen dot, opens What's new and clears the dot for good", async () => {
      const { user, unmount } = setup();
      expect(screen.getAllByTestId("unseen-dot")).toHaveLength(2);

      await user.click(screen.getByTestId("top-bar-announcements"));

      expect(
        await screen.findByRole("dialog", { name: "What's new" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Announcements", hidden: true })
      ).toBeInTheDocument();
      expect(window.localStorage.getItem(SEEN_KEY)).toContain("announcements");
      unmount();

      setup();
      await waitFor(() =>
        expect(screen.getAllByTestId("unseen-dot")).toHaveLength(1)
      );
    });

    it("FR-07 lists Help Centre and Keyboard Shortcuts and clears the help dot", async () => {
      const { user } = setup();

      await user.click(screen.getByTestId("top-bar-help"));

      const menu = await screen.findByRole("menu", { name: "Help" });
      expect(
        within(menu)
          .getAllByRole("menuitem")
          .map((item) => item.textContent)
      ).toEqual(["Help Centre", "Keyboard Shortcuts"]);
      expect(window.localStorage.getItem(SEEN_KEY)).toContain("help");
    });

    it("FR-07 opens the shortcuts reference from Keyboard Shortcuts", async () => {
      const { user } = setup();

      await user.click(screen.getByTestId("top-bar-help"));
      await user.click(await screen.findByTestId("help-shortcuts"));

      expect(
        await screen.findByRole("dialog", { name: "Keyboard shortcuts" })
      ).toBeInTheDocument();
    });
  });

  describe("notifications badge", () => {
    it.each([
      [0, ""],
      [1, "1"],
      [9, "9"],
      [10, "9+"],
      [250, "9+"]
    ])("3.5 formats an unread count of %i as %p", async (count, text) => {
      setUnreadFetcher(async () => count);
      setup();

      await waitFor(async () => expect(await badgeText()).toBe(text));
      if (count === 0) {
        expect(
          screen
            .getByTestId("notification-badge")
            .querySelector(".MuiBadge-invisible")
        ).not.toBeNull();
      }
    });

    it("names the bell with the unread count", async () => {
      setUnreadFetcher(async () => 5);
      setup();

      expect(
        await screen.findByRole("button", { name: "Notifications, 5 unread" })
      ).toBeInTheDocument();
    });

    it("7 hides the badge instead of showing 0 when the request fails, and recovers on the next poll", async () => {
      jest.useFakeTimers();
      let fail = true;
      setUnreadFetcher(async () => {
        if (fail) throw new Error("boom");
        return 4;
      });
      setup();
      await act(async () => {
        await Promise.resolve();
      });

      expect(await badgeText()).toBe("");
      expect(screen.getByRole("banner")).toBeInTheDocument();

      fail = false;
      await act(async () => {
        jest.advanceTimersByTime(UNREAD_POLL_MS);
        await Promise.resolve();
      });

      expect(await badgeText()).toBe("4");
    });

    it("polls every 30 seconds with a single request per cycle", async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn(async () => 2);
      setUnreadFetcher(fetcher);
      setup();
      await act(async () => {
        await Promise.resolve();
      });
      expect(fetcher).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(UNREAD_POLL_MS);
        await Promise.resolve();
      });

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("FR-06 keeps the count live while the notifications panel is open", async () => {
      let count = 3;
      setUnreadFetcher(async () => count);
      const { user } = setup();
      await waitFor(async () => expect(await badgeText()).toBe("3"));

      await user.click(screen.getByTestId("top-bar-notifications"));
      const panel = await screen.findByRole("dialog", {
        name: "Notifications"
      });
      expect(panel).toHaveTextContent("3 unread");

      count = 7;
      await act(async () => {
        await refreshUnread();
      });

      expect(
        screen.getByTestId("notifications-panel-summary")
      ).toHaveTextContent("7 unread");
      expect(
        screen.getByRole("dialog", { name: "Notifications" })
      ).toBeInTheDocument();
    });

    it("FR-06 reflects the open state on the bell", async () => {
      const { user } = setup();

      await user.click(screen.getByTestId("top-bar-notifications"));

      expect(screen.getByTestId("top-bar-notifications")).toHaveAttribute(
        "aria-expanded",
        "true"
      );
    });

    it("Session expiry from the count request calls the session handler", async () => {
      const onSessionExpired = jest.fn();
      setUnreadFetcher(async () => {
        throw new SessionExpiredError();
      });
      setup({ onSessionExpired });

      await waitFor(() => expect(onSessionExpired).toHaveBeenCalled());
      expect(await badgeText()).toBe("");
    });

    it("builds the login redirect with the original URL as the return URL", () => {
      expect(loginUrl("/board?x=1#top")).toBe(
        "/login?returnUrl=%2Fboard%3Fx%3D1%23top"
      );
    });
  });

  describe("popover coordination", () => {
    it("FR-09 allows only one popover open at a time", async () => {
      const { user } = setup();

      await user.click(screen.getByTestId("top-bar-announcements"));
      await screen.findByRole("dialog", { name: "What's new" });
      fireEvent.click(screen.getByTestId("top-bar-notifications"));

      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: "What's new" })
        ).not.toBeInTheDocument()
      );
      expect(
        await screen.findByRole("dialog", { name: "Notifications" })
      ).toBeInTheDocument();
      expect(screen.queryAllByRole("menu")).toHaveLength(0);
    });

    it("FR-09 closes a popover with Escape and returns focus to its trigger", async () => {
      const { user } = setup();
      const trigger = screen.getByTestId("top-bar-help");

      await user.click(trigger);
      await screen.findByRole("menu", { name: "Help" });
      await user.keyboard("{Escape}");

      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument()
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it("FR-09 closes a popover on an outside click", async () => {
      const { user } = setup();

      await user.click(screen.getByTestId("top-bar-notifications"));
      await screen.findByRole("dialog", { name: "Notifications" });
      const backdrop = document.querySelector(".MuiBackdrop-root");
      expect(backdrop).not.toBeNull();
      await user.click(backdrop as Element);

      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: "Notifications" })
        ).not.toBeInTheDocument()
      );
    });
  });

  describe("account", () => {
    it("FR-08 shows initials and keeps the full name out of the visible bar", () => {
      setup({
        user: { name: "A Very Long Display Name Indeed", initials: "AV" }
      });

      const bar = screen.getByRole("banner");
      expect(within(bar).getByText("AV")).toBeInTheDocument();
      expect(
        within(bar).queryByText("A Very Long Display Name Indeed")
      ).toBeNull();
      expect(
        screen.getByRole("button", {
          name: "Account, A Very Long Display Name Indeed"
        })
      ).toBeInTheDocument();
    });

    it("FR-08 opens the account menu from the avatar", async () => {
      const { user } = setup();

      await user.click(screen.getByTestId("top-bar-account"));

      expect(
        await screen.findByRole("menu", { name: "Account" })
      ).toBeInTheDocument();
      expect(screen.getByTestId("account-menu-name")).toHaveTextContent(
        "Srikanth P"
      );
    });

    it("renders a profile image when one is provided", async () => {
      const OriginalImage = window.Image;
      class LoadingImage {
        onload: (() => void) | null = null;
        set src(_value: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      }
      window.Image = LoadingImage as unknown as typeof window.Image;
      try {
        setup({
          user: {
            name: "Sam",
            initials: "S",
            imageUrl: "https://example.test/a.png"
          }
        });

        await waitFor(() =>
          expect(
            screen.getByTestId("top-bar-account").querySelector("img")
          ).toHaveAttribute("src", "https://example.test/a.png")
        );
      } finally {
        window.Image = OriginalImage;
      }
    });
  });

  describe("responsive behavior", () => {
    it("3.7 collapses search to an icon on tablet and expands an overlay", async () => {
      installViewport(768);
      const { user } = setup();

      expect(
        screen.queryByRole("textbox", { name: "Search tasks" })
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Search" }));

      const input = await screen.findByRole("textbox", {
        name: "Search tasks"
      });
      expect(input).toHaveFocus();
      expect(screen.getByTestId("top-bar-search-overlay")).toBeInTheDocument();
    });

    it("3.7 dismisses the overlay with Escape and returns focus to the search icon", async () => {
      installViewport(768);
      const { user } = setup();

      await user.click(screen.getByRole("button", { name: "Search" }));
      await screen.findByRole("textbox", { name: "Search tasks" });
      await user.keyboard("{Escape}");

      await waitFor(() =>
        expect(
          screen.queryByTestId("top-bar-search-overlay")
        ).not.toBeInTheDocument()
      );
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Search" })).toHaveFocus()
      );
    });

    it("3.7 dismisses the overlay with its close button", async () => {
      installViewport(768);
      const { user } = setup();

      await user.click(screen.getByRole("button", { name: "Search" }));
      await user.click(
        await screen.findByRole("button", { name: "Close search" })
      );

      expect(
        screen.queryByTestId("top-bar-search-overlay")
      ).not.toBeInTheDocument();
    });

    it("3.7 keeps the full search field and Create label on desktop", () => {
      installViewport(1440);
      setup();

      expect(
        screen.getByRole("textbox", { name: "Search tasks" })
      ).toBeInTheDocument();
      expect(screen.getByTestId("top-bar-create")).toHaveTextContent("Create");
    });

    it("3.7 shows Create as a plus icon on mobile and moves Announcements and Help into the account menu", async () => {
      installViewport(375);
      const { user } = setup();

      expect(screen.getByTestId("top-bar-create")).toHaveAttribute(
        "aria-label",
        "Create"
      );
      expect(screen.getByTestId("top-bar-create")).toHaveTextContent("");
      expect(
        screen.queryByTestId("top-bar-announcements")
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("top-bar-help")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Search" })
      ).toBeInTheDocument();
      expect(screen.getByTestId("top-bar-notifications")).toBeInTheDocument();

      await user.click(screen.getByTestId("top-bar-account"));
      await user.click(await screen.findByTestId("account-announcements"));

      expect(
        await screen.findByRole("dialog", { name: "What's new" })
      ).toBeInTheDocument();
    });

    it("3.7 opens Help from the account menu on mobile", async () => {
      installViewport(375);
      const { user } = setup();

      await user.click(screen.getByTestId("top-bar-account"));
      await user.click(await screen.findByTestId("account-help"));

      expect(
        await screen.findByRole("menu", { name: "Help" })
      ).toBeInTheDocument();
    });
  });
});
