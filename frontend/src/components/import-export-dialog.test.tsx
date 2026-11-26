import { useRef } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ImportExportDialog,
  type ImportExportHandle
} from "@/components/import-export-dialog";
import { createDefaultData, defaultBoard } from "@/lib/board-schema";
import { exportBoard, EXPORT_FORMAT } from "@/lib/board-transfer";
import { renderWithTheme, seedData, storedData } from "@/test-utils";

function Harness() {
  const ref = useRef<ImportExportHandle>(null);
  return (
    <>
      <button onClick={() => ref.current?.exportBoard()}>Export now</button>
      <button onClick={() => ref.current?.startImport()}>Import now</button>
      <ImportExportDialog ref={ref} />
    </>
  );
}

function jsonFile(text: string, name = "board.taskflow.json"): File {
  return new File([text], name, { type: "application/json" });
}

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsText(blob);
  });
}

function chooseFile(file: File) {
  fireEvent.change(screen.getByTestId("import-file-input"), {
    target: { files: [file] }
  });
}

describe("ImportExportDialog", () => {
  const downloads: { name: string; href: string }[] = [];
  let blobs: Blob[] = [];

  beforeEach(() => {
    window.localStorage.clear();
    downloads.length = 0;
    blobs = [];
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn((blob: Blob) => {
        blobs.push(blob);
        return "blob:board";
      })
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn()
    });
    jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push({ name: this.download, href: this.href });
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("FR8.1 downloads the open board as a file named from the board", async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    data.boards[0].name = "Work Board";
    seedData(data);
    renderWithTheme(<Harness />);

    await user.click(screen.getByRole("button", { name: "Export now" }));

    expect(downloads).toEqual([
      { name: "work-board.taskflow.json", href: "blob:board" }
    ]);
    const text = await readBlob(blobs[0]);
    expect(JSON.parse(text)).toMatchObject({
      format: EXPORT_FORMAT,
      board: { name: "Work Board" }
    });
    expect(screen.getByTestId("transfer-status")).toHaveTextContent(
      "Exported work-board.taskflow.json"
    );
  });

  it("FR8.2 confirms by naming the new board and saying existing boards are not changed, then adds it", async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    data.boards[0].name = "Work";
    seedData(data);
    const source = createDefaultData();
    source.boards.push({ ...defaultBoard("Travel") });
    renderWithTheme(<Harness />);

    chooseFile(
      jsonFile(exportBoard(source, source.boards[1].id), "travel.json")
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Import 'travel.json'?");
    expect(dialog).toHaveTextContent("Adds a new board named 'Travel'");
    expect(dialog).toHaveTextContent("Your existing boards are not changed");
    expect(storedData().boards).toHaveLength(1);

    await user.click(screen.getByTestId("import-confirm"));

    await waitFor(() => expect(storedData().boards).toHaveLength(2));
    expect(storedData().boards[0]).toEqual(data.boards[0]);
    expect(storedData().boards[1].name).toBe("Travel");
  });

  it("FR8.2 adds ' (imported)' when a board with the same name exists and never overwrites", async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    data.boards[0].name = "Work";
    seedData(data);
    renderWithTheme(<Harness />);

    chooseFile(jsonFile(exportBoard(data, data.boards[0].id)));

    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Adds a new board named 'Work (imported)'"
    );
    await user.click(screen.getByTestId("import-confirm"));

    await waitFor(() => expect(storedData().boards).toHaveLength(2));
    expect(storedData().boards.map((board) => board.name)).toEqual([
      "Work",
      "Work (imported)"
    ]);
    expect(storedData().boards[0].id).toBe(data.boards[0].id);
  });

  it("FR8.2 Cancel leaves the stored boards untouched", async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    seedData(data);
    renderWithTheme(<Harness />);

    chooseFile(jsonFile(exportBoard(data, data.boards[0].id)));
    await screen.findByRole("dialog");
    await user.click(screen.getByTestId("import-cancel"));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(storedData().boards).toHaveLength(1);
  });

  it("FR8.3 shows a plain-words error for a file that is not JSON and changes nothing", async () => {
    const data = createDefaultData();
    seedData(data);
    renderWithTheme(<Harness />);

    chooseFile(jsonFile("not json at all"));

    expect(await screen.findByTestId("import-error")).toHaveTextContent(
      "could not be read as JSON"
    );
    expect(screen.queryByTestId("import-confirm")).not.toBeInTheDocument();
    expect(storedData().boards).toHaveLength(1);
  });

  it("FR8.3 rejects a file from a newer version with a message naming the problem", async () => {
    const data = createDefaultData();
    seedData(data);
    const newer = JSON.parse(exportBoard(data, data.boards[0].id));
    newer.version = 99;
    renderWithTheme(<Harness />);

    chooseFile(jsonFile(JSON.stringify(newer)));

    expect(await screen.findByTestId("import-error")).toHaveTextContent(
      "newer version"
    );
    expect(storedData().boards).toHaveLength(1);
  });

  it("FR8.4 refuses an import past the limit of 5 boards with the limit message", async () => {
    const data = createDefaultData();
    ["B", "C", "D", "E"].forEach((name) =>
      data.boards.push(defaultBoard(name))
    );
    seedData(data);
    renderWithTheme(<Harness />);

    chooseFile(jsonFile(exportBoard(data, data.boards[0].id)));

    expect(await screen.findByTestId("import-error")).toHaveTextContent(
      "Limit reached: 5 boards."
    );
    expect(storedData().boards).toHaveLength(5);
  });

  it("FR8.4 shows imported names as plain text, never as markup", async () => {
    const data = createDefaultData();
    seedData(data);
    const source = createDefaultData();
    source.boards[0].name = "<b>Bold</b><img src=x onerror=alert(1)>";
    renderWithTheme(<Harness />);

    chooseFile(jsonFile(exportBoard(source, source.boards[0].id)));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("<b>Bold</b>");
    expect(dialog.querySelector("b")).toBeNull();
    expect(dialog.querySelector("img")).toBeNull();
  });

  it("FR8.2 opens the file picker from startImport", async () => {
    const user = userEvent.setup();
    seedData(createDefaultData());
    renderWithTheme(<Harness />);
    const input = screen.getByTestId("import-file-input");
    const clicked = jest.fn();
    input.addEventListener("click", clicked);

    await user.click(screen.getByRole("button", { name: "Import now" }));

    expect(clicked).toHaveBeenCalledTimes(1);
  });
});
