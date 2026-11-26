import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";
import {
  readWorkspaces,
  WORKSPACE_NAME_MAX,
  WORKSPACES_KEY
} from "@/lib/workspace-store";
import { renderWithTheme } from "@/test-utils";

type User = ReturnType<typeof userEvent.setup>;

function setup() {
  const onClose = jest.fn();
  const onCreated = jest.fn();
  renderWithTheme(
    <CreateWorkspaceDialog open onClose={onClose} onCreated={onCreated} />
  );
  return { user: userEvent.setup(), onClose, onCreated };
}

async function chooseType(user: User, name: string) {
  await user.click(screen.getByRole("combobox", { name: /Type/ }));
  await user.click(await screen.findByRole("option", { name }));
}

describe("CreateWorkspaceDialog", () => {
  beforeEach(() => window.localStorage.clear());

  it("FR-11 asks for Name and Type and marks Description optional", () => {
    setup();

    const dialog = screen.getByRole("dialog", { name: "Create Workspace" });
    expect(within(dialog).getByLabelText(/^Name/)).toBeRequired();
    expect(within(dialog).getByLabelText(/Description/)).not.toBeRequired();
  });

  it("6.2 blocks an empty or whitespace-only name with an inline error", async () => {
    const { user, onCreated } = setup();

    await user.type(screen.getByTestId("workspace-name-input"), "    ");
    await user.click(screen.getByTestId("workspace-submit"));

    expect(
      await screen.findByText("Enter a workspace name.")
    ).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
    expect(readWorkspaces()).toEqual([]);
  });

  it("6.2 blocks a name longer than 100 characters after trimming", async () => {
    const { user } = setup();

    await user.click(screen.getByTestId("workspace-name-input"));
    await user.paste("x".repeat(WORKSPACE_NAME_MAX + 1));
    await chooseType(user, "Team");
    await user.click(screen.getByTestId("workspace-submit"));

    expect(
      await screen.findByText("Use 100 characters or fewer.")
    ).toBeInTheDocument();
    expect(readWorkspaces()).toEqual([]);
  });

  it("6.2 accepts a name of exactly 100 characters", async () => {
    const { user, onCreated } = setup();

    await user.click(screen.getByTestId("workspace-name-input"));
    await user.paste(`  ${"x".repeat(WORKSPACE_NAME_MAX)}  `);
    await chooseType(user, "Team");
    await user.click(screen.getByTestId("workspace-submit"));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  });

  it("FR-11 requires a Type", async () => {
    const { user } = setup();

    await user.type(screen.getByTestId("workspace-name-input"), "Design");
    await user.click(screen.getByTestId("workspace-submit"));

    expect(
      await screen.findByText("Choose a workspace type.")
    ).toBeInTheDocument();
    expect(readWorkspaces()).toEqual([]);
  });

  it("6.2 trims the name, keeps the optional description and closes on success", async () => {
    const { user, onClose, onCreated } = setup();

    await user.type(screen.getByTestId("workspace-name-input"), "  Design  ");
    await chooseType(user, "Business");
    await user.type(
      screen.getByTestId("workspace-description-input"),
      "  Brand work "
    );
    await user.click(screen.getByTestId("workspace-submit"));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
    const [saved] = readWorkspaces();
    expect(saved).toMatchObject({
      name: "Design",
      type: "Business",
      description: "Brand work"
    });
  });

  it("6.2 reports a duplicate name inline without closing", async () => {
    window.localStorage.setItem(
      WORKSPACES_KEY,
      JSON.stringify([
        {
          id: "1",
          name: "Design",
          type: "Team",
          description: "",
          createdAt: ""
        }
      ])
    );
    const { user, onClose } = setup();

    await user.type(screen.getByTestId("workspace-name-input"), " design ");
    await chooseType(user, "Team");
    await user.click(screen.getByTestId("workspace-submit"));

    expect(
      await screen.findByText("A workspace with this name already exists.")
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(readWorkspaces()).toHaveLength(1);
  });

  it("reports a storage failure on the form instead of failing silently", async () => {
    const { user, onClose } = setup();
    await user.type(screen.getByTestId("workspace-name-input"), "Design");
    await chooseType(user, "Team");
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });

    await user.click(screen.getByTestId("workspace-submit"));

    expect(
      await screen.findByText("The workspace could not be saved. Try again.")
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("clears an inline error once the field is edited", async () => {
    const { user } = setup();

    await user.click(screen.getByTestId("workspace-submit"));
    expect(
      await screen.findByText("Enter a workspace name.")
    ).toBeInTheDocument();
    await user.type(screen.getByTestId("workspace-name-input"), "D");

    expect(
      screen.queryByText("Enter a workspace name.")
    ).not.toBeInTheDocument();
  });
});
