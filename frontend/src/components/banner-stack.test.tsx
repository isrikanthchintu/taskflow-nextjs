import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BannerStack, limitMessages } from "@/components/banner-stack";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UndoSnackbar } from "@/components/undo-snackbar";
import type { LimitReport } from "@/lib/board-ops";

const calm: LimitReport = {
  boards: { count: 1, limit: 5, warn: false, reached: false },
  lists: { count: 3, limit: 10, warn: false, reached: false },
  cards: { count: 20, limit: 200, warn: false, reached: false }
};

function setup(
  overrides: Partial<React.ComponentProps<typeof BannerStack>> = {}
) {
  const onDismissSaveError = jest.fn();
  const onDismissNotice = jest.fn();
  render(
    <BannerStack
      dataError={null}
      saveError={null}
      notice={null}
      limits={calm}
      onDismissSaveError={onDismissSaveError}
      onDismissNotice={onDismissNotice}
      {...overrides}
    />
  );
  return { onDismissSaveError, onDismissNotice };
}

describe("BannerStack", () => {
  it("renders nothing when there is nothing to report", () => {
    setup();

    expect(screen.queryByTestId("banner-stack")).not.toBeInTheDocument();
  });

  it("FR1.3 shows the unreadable-data message as an alert with no buttons", () => {
    setup({
      dataError: "Your saved data could not be read, so nothing will be saved."
    });

    const banner = screen.getByTestId("banner-data-error");
    expect(banner).toHaveAttribute("role", "alert");
    expect(banner).toHaveTextContent("Your saved data could not be read");
    expect(within(banner).queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers backup and confirmed reset on the unreadable-data alert", async () => {
    const user = userEvent.setup();
    const onBackupData = jest.fn(() => null);
    const onResetData = jest.fn(() => ({ ok: true }));
    setup({
      dataError: "Your saved data could not be read.",
      onBackupData,
      onResetData
    });

    await user.click(screen.getByRole("button", { name: "Download backup" }));
    expect(onBackupData).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("There is no saved data to download.")
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Reset saved data" }));
    expect(onResetData).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("confirm-cancel"));
    expect(onResetData).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: "Reset saved data" }));
    await user.click(screen.getByTestId("confirm-accept"));
    expect(onResetData).toHaveBeenCalledTimes(1);
  });

  it("shows why a reset failed", async () => {
    const user = userEvent.setup();
    setup({
      dataError: "Your saved data could not be read.",
      onBackupData: () => null,
      onResetData: () => ({
        ok: false,
        error: "Browser storage could not be cleared."
      })
    });

    await user.click(screen.getByRole("button", { name: "Reset saved data" }));
    await user.click(screen.getByTestId("confirm-accept"));

    expect(
      await screen.findByText("Browser storage could not be cleared.")
    ).toBeInTheDocument();
  });

  it("FR1.4 shows a failed save as an alert that can be dismissed", async () => {
    const user = userEvent.setup();
    const { onDismissSaveError } = setup({
      saveError: "Browser storage is full. This change was not saved."
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Browser storage is full"
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onDismissSaveError).toHaveBeenCalledTimes(1);
  });

  it("FR1.5 warns in words at 90 percent of the list limit", () => {
    setup({
      limits: {
        ...calm,
        lists: { count: 9, limit: 10, warn: true, reached: false }
      }
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "You have used 9 of 10 lists on this board"
    );
  });

  it("FR1.5 names the limit when it is reached", () => {
    expect(
      limitMessages({
        boards: { count: 5, limit: 5, warn: true, reached: true },
        lists: { count: 10, limit: 10, warn: true, reached: true },
        cards: { count: 200, limit: 200, warn: true, reached: true }
      })
    ).toEqual([
      "Board limit reached (5 boards)",
      "List limit reached (10 lists per board)",
      "Card limit reached (200 cards in total)"
    ]);
  });

  it("FR1.1 tells the user about an update from another tab and dismisses it", async () => {
    const user = userEvent.setup();
    const { onDismissNotice } = setup({ notice: "Updated in another tab" });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Updated in another tab"
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onDismissNotice).toHaveBeenCalledTimes(1);
  });
});

describe("UndoSnackbar", () => {
  it("FR6.2 shows the message with an Undo button in a polite live region", async () => {
    const user = userEvent.setup();
    const onUndo = jest.fn();
    render(
      <UndoSnackbar
        entry={{ id: 1, message: "Card deleted" }}
        onUndo={onUndo}
      />
    );

    const status = screen.getByTestId("undo-snackbar");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Card deleted");
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("FR6.2 renders nothing when there is no undo entry", () => {
    render(<UndoSnackbar entry={null} onUndo={jest.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Undo" })
    ).not.toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  function renderConfirm() {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Delete 'Review' permanently?"
        message="This deletes the list and its 4 cards."
        confirmLabel="Delete 4 cards"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    return { onConfirm, onCancel };
  }

  it("FR2.5 names what is deleted and the count, with default focus on Cancel", () => {
    renderConfirm();

    expect(
      screen.getByRole("dialog", { name: "Delete 'Review' permanently?" })
    ).toHaveTextContent("This deletes the list and its 4 cards.");
    expect(
      screen.getByRole("button", { name: "Delete 4 cards" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("FR2.5 cancels with Escape and confirms only through the named button", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderConfirm();

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete 4 cards" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
