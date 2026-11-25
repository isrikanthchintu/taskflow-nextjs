import {
  DATA_VERSION,
  buildId,
  createDefaultData,
  createPlaceholderData,
  createStarterData,
  defaultBoard,
  emptyBoard,
  newCard,
  newChecklist,
  newId,
  newLabel,
  newList,
  validateAppData,
  validateBoard
} from "@/lib/board-schema";
import type { AppData } from "@/types/board";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("board-schema factories", () => {
  it("FR1.1 createDefaultData builds one board with three lists and the Completed list flagged done", () => {
    const data = createDefaultData();
    expect(data.version).toBe(DATA_VERSION);
    expect(data.boards).toHaveLength(1);
    expect(data.activeBoardId).toBe(data.boards[0].id);
    expect(data.boards[0].lists.map((list) => list.name)).toEqual([
      "To do",
      "In progress",
      "Completed"
    ]);
    expect(data.boards[0].lists.map((list) => list.done)).toEqual([
      false,
      false,
      true
    ]);
    expect(data.boards[0].cards).toEqual([]);
  });

  it("FR5.1 default settings follow the system mode with the blue accent", () => {
    expect(createDefaultData().settings).toEqual({
      mode: "system",
      accentId: "blue",
      density: "comfortable",
      corners: "md"
    });
  });

  it("FR1.1 createStarterData places the starter cards in the matching lists", () => {
    const data = createStarterData();
    const board = data.boards[0];
    expect(board.cards).toHaveLength(4);
    const names = new Map(board.lists.map((list) => [list.id, list.name]));
    expect(board.cards.map((card) => names.get(card.listId))).toEqual([
      "In progress",
      "To do",
      "Completed",
      "To do"
    ]);
  });

  it("FR3.1 FR3.2 label and checklist factories return the expected shapes", () => {
    const label = newLabel("Bug", "#c62828");
    expect(label).toEqual({
      id: expect.any(String),
      name: "Bug",
      color: "#c62828"
    });
    const checklist = newChecklist("Steps", ["one", "two"]);
    expect(checklist.items.map((item) => [item.text, item.checked])).toEqual([
      ["one", false],
      ["two", false]
    ]);
  });

  it("FR3.4 newCard fills the existing task fields with defaults", () => {
    const card = newCard("list-1", { title: "Plan" });
    expect(card).toMatchObject({
      listId: "list-1",
      title: "Plan",
      description: "",
      priority: "medium",
      dueDate: "",
      labelIds: [],
      checklists: [],
      archived: false
    });
  });

  it("FR2.1 emptyBoard and newList give unique ids", () => {
    expect(emptyBoard("A").id).not.toBe(emptyBoard("A").id);
    expect(newList("x").id).not.toBe(newList("x").id);
    expect(defaultBoard("Named").name).toBe("Named");
  });
});

describe("ids and placeholder data", () => {
  const v4Shape =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it("NFR5 buildId returns a v4-shaped unique id from getRandomValues when randomUUID is unavailable", () => {
    const source = { getRandomValues: crypto.getRandomValues.bind(crypto) };
    const first = buildId(source);
    const second = buildId(source);
    expect(first).toMatch(v4Shape);
    expect(second).toMatch(v4Shape);
    expect(second).not.toBe(first);
  });

  it("NFR5 buildId still works with no crypto at all, as on a page that is not a secure context", () => {
    const first = buildId(undefined);
    const second = buildId({});
    expect(first).toMatch(v4Shape);
    expect(second).toMatch(v4Shape);
    expect(second).not.toBe(first);
  });

  it("NFR5 buildId uses randomUUID when it exists, and newId returns a usable id", () => {
    expect(
      buildId({ randomUUID: () => "11111111-1111-4111-8111-111111111111" })
    ).toBe("11111111-1111-4111-8111-111111111111");
    expect(newId()).toMatch(v4Shape);
  });

  it("FR1.1 createPlaceholderData gives the same ids and values on every call so server and browser render the same page", () => {
    const first = createPlaceholderData();
    const second = createPlaceholderData();
    expect(second).toEqual(first);
    expect(first.boards[0].lists.map((list) => list.name)).toEqual([
      "To do",
      "In progress",
      "Completed"
    ]);
    expect(validateAppData(first).ok).toBe(true);
  });
});

describe("validateAppData", () => {
  it("FR1.3 accepts valid data", () => {
    const data = createStarterData();
    const result = validateAppData(clone(data));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.boards[0].cards).toHaveLength(4);
  });

  it("FR1.3 rejects values that are not objects with a reason", () => {
    for (const value of [null, "text", 5, [], undefined]) {
      const result = validateAppData(value);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).not.toBe("");
    }
  });

  it("FR1.3 rejects data from a newer version", () => {
    const data: AppData = { ...createDefaultData(), version: DATA_VERSION + 1 };
    const result = validateAppData(clone(data));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/newer/);
  });

  it("FR1.3 rejects a card that points at a missing list", () => {
    const data = createDefaultData();
    data.boards[0].cards = [newCard("missing", { title: "Lost" })];
    expect(validateAppData(clone(data)).ok).toBe(false);
  });

  it("FR1.3 rejects a card with a bad priority and a list with a bad limit", () => {
    const badCard = clone(createStarterData()) as unknown as {
      boards: { cards: { priority: string }[] }[];
    };
    badCard.boards[0].cards[0].priority = "urgent";
    expect(validateAppData(badCard).ok).toBe(false);

    const badList = clone(createDefaultData()) as unknown as {
      boards: { lists: { limit: unknown }[] }[];
    };
    badList.boards[0].lists[0].limit = 0;
    expect(validateAppData(badList).ok).toBe(false);
  });

  it("FR1.3 rejects data whose open board is missing or archived", () => {
    const missing = { ...createDefaultData(), activeBoardId: "nope" };
    expect(validateAppData(clone(missing)).ok).toBe(false);
    const archived = createDefaultData();
    archived.boards[0].archived = true;
    expect(validateAppData(clone(archived)).ok).toBe(false);
  });

  it("FR5.4 rejects invalid settings", () => {
    const data = clone(createDefaultData()) as unknown as {
      settings: { density: string };
    };
    data.settings.density = "tiny";
    expect(validateAppData(data).ok).toBe(false);
  });

  it("FR11.1 accepts rules and rejects a malformed rule", () => {
    const data = createDefaultData();
    const [first, second] = data.boards[0].lists;
    data.boards[0].rules = [
      {
        id: "r1",
        name: "Move",
        enabled: true,
        trigger: { kind: "card-enters-list", listId: first.id },
        action: { kind: "move-to-list", listId: second.id }
      }
    ];
    expect(validateAppData(clone(data)).ok).toBe(true);
    const broken = clone(data) as unknown as {
      boards: { rules: { action: { kind: string } }[] }[];
    };
    broken.boards[0].rules[0].action.kind = "explode";
    expect(validateAppData(broken).ok).toBe(false);
  });

  it("migrates legacy corner settings to the XS-SM-MD-XL scale", () => {
    const data = clone(createDefaultData()) as unknown as {
      settings: { corners: string };
    };
    data.settings.corners = "rounded";
    const result = validateAppData(data);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.settings.corners).toBe("md");
  });
});

describe("validateBoard", () => {
  it("FR8.3 rejects a board without a name", () => {
    const board = clone(defaultBoard());
    board.name = "  ";
    expect(validateBoard(board).ok).toBe(false);
  });

  it("FR8.3 accepts a valid board", () => {
    expect(validateBoard(clone(defaultBoard())).ok).toBe(true);
  });
});
