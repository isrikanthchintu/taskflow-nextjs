import {
  addCard,
  addList,
  createBoard,
  updateCard,
  type OpResult
} from "@/lib/board-ops";
import {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  exportBoard,
  exportFileName,
  importBoard
} from "@/lib/board-transfer";
import { createDefaultData, newCard } from "@/lib/board-schema";
import type { AppData } from "@/types/board";

function unwrap(result: OpResult): AppData {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function withCard(): AppData {
  const data = createDefaultData();
  const board = data.boards[0];
  return unwrap(
    addCard(data, board.id, board.lists[0].id, {
      title: "Exported",
      description: "<b>bold</b>"
    })
  );
}

describe("exportBoard", () => {
  it("FR8.1 writes one JSON file with a format, a version and the whole board", () => {
    const data = withCard();
    const parsed = JSON.parse(exportBoard(data, data.activeBoardId));
    expect(parsed.format).toBe(EXPORT_FORMAT);
    expect(parsed.version).toBe(EXPORT_VERSION);
    expect(parsed.board.cards[0].title).toBe("Exported");
    expect(parsed.board.lists).toHaveLength(3);
    expect(parsed.board).toHaveProperty("labels");
    expect(parsed.board).toHaveProperty("templates");
    expect(parsed.board.backgroundId).toBe("blue-gradient");
  });

  it("FR8.1 builds a safe file name from the board name", () => {
    const data = createDefaultData();
    expect(exportFileName({ ...data.boards[0], name: "Work / Q4 plan!" })).toBe(
      "work-q4-plan.taskflow.json"
    );
    expect(exportFileName({ ...data.boards[0], name: "???" })).toBe(
      "board.taskflow.json"
    );
  });
});

describe("importBoard", () => {
  it("FR8.2 always adds a new board and leaves existing boards unchanged", () => {
    const data = withCard();
    const text = exportBoard(data, data.activeBoardId);
    const other = createDefaultData();
    const result = importBoard(other, text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.boards).toHaveLength(2);
    expect(result.data.boards[0]).toBe(other.boards[0]);
    expect(result.data.boards[1].id).not.toBe(data.boards[0].id);
    expect(result.data.boards[1].cards[0].title).toBe("Exported");
    expect(result.id).toBe(result.data.boards[1].id);
  });

  it("FR8.2 adds (imported) when a board with the same name exists and keeps the original", () => {
    const data = withCard();
    const text = exportBoard(data, data.activeBoardId);
    const result = importBoard(data, text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.boards.map((board) => board.name)).toEqual([
      "My board",
      "My board (imported)"
    ]);
    expect(result.data.boards[0]).toBe(data.boards[0]);
    const again = importBoard(result.data, text);
    expect(again.ok).toBe(true);
    if (again.ok)
      expect(again.data.boards[2].name).toBe("My board (imported) (imported)");
  });

  it("FR8.3 rejects text that is not JSON and changes nothing", () => {
    const data = createDefaultData();
    const result = importBoard(data, "not json at all");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not a board export/);
  });

  it("FR8.3 rejects JSON of the wrong format and arrays", () => {
    const data = createDefaultData();
    expect(
      importBoard(
        data,
        JSON.stringify({ format: "other", version: 1, board: {} })
      ).ok
    ).toBe(false);
    expect(importBoard(data, "[]").ok).toBe(false);
    expect(
      importBoard(data, JSON.stringify({ format: EXPORT_FORMAT, board: {} })).ok
    ).toBe(false);
  });

  it("FR8.3 rejects a newer format version with a plain message", () => {
    const data = withCard();
    const file = JSON.parse(exportBoard(data, data.activeBoardId));
    file.version = EXPORT_VERSION + 1;
    const result = importBoard(createDefaultData(), JSON.stringify(file));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/newer version/);
  });

  it("FR8.3 rejects a board whose content is invalid", () => {
    const data = withCard();
    const file = JSON.parse(exportBoard(data, data.activeBoardId));
    file.board.cards[0].priority = "urgent";
    const result = importBoard(createDefaultData(), JSON.stringify(file));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not a valid board export/);
  });

  it("FR8.4 refuses an import when 5 boards exist and names the limit", () => {
    let data = createDefaultData();
    for (let index = 0; index < 4; index += 1)
      data = unwrap(createBoard(data, `B${index}`));
    const source = withCard();
    const result = importBoard(data, exportBoard(source, source.activeBoardId));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("5 boards");
  });

  it("FR8.4 refuses an import that would pass 200 cards in total", () => {
    const source = createDefaultData();
    const bulk = {
      ...source,
      boards: [
        {
          ...source.boards[0],
          cards: Array.from({ length: 150 }, (_, index) =>
            newCard(source.boards[0].lists[0].id, { title: `s${index}` })
          )
        }
      ]
    };
    const target = createDefaultData();
    const loaded = {
      ...target,
      boards: [
        {
          ...target.boards[0],
          cards: Array.from({ length: 60 }, (_, index) =>
            newCard(target.boards[0].lists[0].id, { title: `t${index}` })
          )
        }
      ]
    };
    const result = importBoard(loaded, exportBoard(bulk, bulk.activeBoardId));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("200 cards");
  });

  it("FR8.4 refuses a board with more than 10 active lists", () => {
    let source = createDefaultData();
    for (let index = 0; index < 7; index += 1)
      source = unwrap(addList(source, source.activeBoardId, `L${index}`));
    const board = {
      ...source.boards[0],
      lists: [
        ...source.boards[0].lists,
        { ...source.boards[0].lists[0], id: "extra" }
      ]
    };
    const text = JSON.stringify({
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      board
    });
    const result = importBoard(createDefaultData(), text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("10 lists per board");
  });

  it("FR8.4 keeps markup as plain text and strips control characters", () => {
    let data = withCard();
    const cardId = data.boards[0].cards[0].id;
    data = unwrap(
      updateCard(data, data.activeBoardId, cardId, {
        title: "Hello\u0007 <script>alert(1)</script>"
      })
    );
    const result = importBoard(
      createDefaultData(),
      exportBoard(data, data.activeBoardId)
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const imported = result.data.boards[1].cards[0];
    expect(imported.title).toBe("Hello <script>alert(1)</script>");
    expect(imported.description).toBe("<b>bold</b>");
  });
});
