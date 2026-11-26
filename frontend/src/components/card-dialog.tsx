"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useBoard } from "@/hooks/use-board";
import * as ops from "@/lib/board-ops";
import { dueState } from "@/lib/board-query";
import {
  DEFAULT_LABEL_COLOR,
  LABEL_COLORS,
  labelTextColor
} from "@/lib/label-colors";
import type { AppData, Card, Checklist, Label, Priority } from "@/types/board";

const DRAFT_ID = "draft-card";

function EditableText({
  value,
  label,
  onCommit,
  testId
}: {
  value: string;
  label: string;
  onCommit: (value: string) => ops.OpResult;
  testId?: string;
}) {
  const [text, setText] = useState(value);
  const [error, setError] = useState<string | null>(null);

  function commit() {
    if (text.trim() === value) {
      setText(value);
      setError(null);
      return;
    }
    const result = onCommit(text);
    if (!result.ok) {
      setError(result.error);
      setText(value);
      return;
    }
    setError(null);
  }

  return (
    <TextField
      size="small"
      variant="standard"
      value={text}
      error={Boolean(error)}
      helperText={error ?? undefined}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
      slotProps={{
        htmlInput: { "aria-label": label, "data-testid": testId }
      }}
      sx={{ flex: 1, minWidth: 0 }}
    />
  );
}

function ChecklistBlock({
  checklist,
  api
}: {
  checklist: Checklist;
  api: ChecklistApi;
}) {
  const [itemText, setItemText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const done = checklist.items.filter((item) => item.checked).length;

  function addItem() {
    const result = api.addItem(checklist.id, itemText);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setItemText("");
  }

  return (
    <Box
      component="section"
      aria-label={`Checklist ${checklist.title}`}
      data-testid={`checklist-${checklist.id}`}
      sx={{ mb: 2 }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <EditableText
          value={checklist.title}
          label="Checklist title"
          onCommit={(title) => api.renameChecklist(checklist.id, title)}
        />
        <Typography
          role="status"
          aria-live="polite"
          data-testid={`checklist-${checklist.id}-progress`}
          variant="body2"
          color="text.secondary"
          sx={{ whiteSpace: "nowrap" }}
        >
          {done} of {checklist.items.length} done
        </Typography>
        <IconButton
          size="small"
          aria-label={`Delete checklist ${checklist.title}`}
          onClick={() => api.deleteChecklist(checklist.id)}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Stack>
      {checklist.items.map((item, index) => (
        <Stack
          key={item.id}
          direction="row"
          spacing={0.5}
          sx={{ alignItems: "center" }}
        >
          <Checkbox
            size="small"
            checked={item.checked}
            onChange={(event) =>
              api.updateItem(checklist.id, item.id, {
                checked: event.target.checked
              })
            }
            slotProps={{
              input: {
                "aria-label": `Done: ${item.text}`,
                "data-testid": `checklist-item-${item.id}-check`
              } as React.InputHTMLAttributes<HTMLInputElement>
            }}
          />
          <EditableText
            value={item.text}
            label={`Item text: ${item.text}`}
            onCommit={(text) => api.updateItem(checklist.id, item.id, { text })}
          />
          <IconButton
            size="small"
            disabled={index === 0}
            aria-label={`Move item up: ${item.text}`}
            onClick={() => api.moveItem(checklist.id, item.id, index - 1)}
          >
            <ArrowUpwardIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            disabled={index === checklist.items.length - 1}
            aria-label={`Move item down: ${item.text}`}
            onClick={() => api.moveItem(checklist.id, item.id, index + 1)}
          >
            <ArrowDownwardIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Delete item: ${item.text}`}
            onClick={() => api.deleteItem(checklist.id, item.id)}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}
      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 1, alignItems: "flex-start" }}
      >
        <TextField
          size="small"
          fullWidth
          label={`New item in ${checklist.title}`}
          value={itemText}
          error={Boolean(error)}
          helperText={error ?? undefined}
          onChange={(event) => setItemText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            }
          }}
        />
        <Button
          variant="outlined"
          onClick={addItem}
          sx={{ whiteSpace: "nowrap", height: 40 }}
        >
          Add item
        </Button>
      </Stack>
    </Box>
  );
}

interface ChecklistApi {
  addChecklist: (title: string) => ops.OpResult;
  renameChecklist: (checklistId: string, title: string) => ops.OpResult;
  deleteChecklist: (checklistId: string) => ops.OpResult;
  addItem: (checklistId: string, text: string) => ops.OpResult;
  updateItem: (
    checklistId: string,
    itemId: string,
    updates: { text?: string; checked?: boolean }
  ) => ops.OpResult;
  moveItem: (
    checklistId: string,
    itemId: string,
    index: number
  ) => ops.OpResult;
  deleteItem: (checklistId: string, itemId: string) => ops.OpResult;
}

function LabelManager({ labels }: { labels: Label[] }) {
  const { addLabel, renameLabel, recolorLabel, deleteLabel } = useBoard();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_LABEL_COLOR);
  const [error, setError] = useState<string | null>(null);

  function add() {
    const result = addLabel(name, color);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setName("");
  }

  return (
    <Box
      data-testid="label-manager"
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.default",
        p: 1,
        mt: 1
      }}
    >
      {labels.length > 0 && (
        <Box sx={{ display: "grid", gap: 0.5, mb: 1 }}>
          {labels.map((label) => (
            <Box
              key={label.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(120px, 1fr) 112px 32px",
                alignItems: "center",
                gap: 0.75,
                minHeight: 40,
                px: 0.5
              }}
            >
              <EditableText
                value={label.name}
                label={`Label name: ${label.name}`}
                onCommit={(next) => renameLabel(label.id, next)}
              />
              <TextField
                select
                size="small"
                value={label.color}
                onChange={(event) => recolorLabel(label.id, event.target.value)}
                slotProps={{
                  select: { native: true },
                  htmlInput: { "aria-label": `Color for ${label.name}` }
                }}
              >
                {colorOptions(label.color)}
              </TextField>
              <IconButton
                size="small"
                aria-label={`Delete label ${label.name}`}
                onClick={() => deleteLabel(label.id)}
                sx={{ color: "error.main" }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(120px, 1fr) 112px auto",
          alignItems: "start",
          gap: 0.75,
          pt: labels.length > 0 ? 1 : 0,
          borderTop: labels.length > 0 ? "1px solid" : "none",
          borderColor: "divider"
        }}
      >
        <TextField
          size="small"
          placeholder="New label name"
          value={name}
          error={Boolean(error)}
          helperText={error ?? undefined}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <TextField
          select
          size="small"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          slotProps={{
            select: { native: true },
            htmlInput: { "aria-label": "New label color" }
          }}
        >
          {colorOptions(color)}
        </TextField>
        <Button
          variant="outlined"
          onClick={add}
          sx={{ height: 40, whiteSpace: "nowrap", px: 1.5 }}
        >
          Add label
        </Button>
      </Box>
    </Box>
  );
}

function colorOptions(current: string) {
  const known = LABEL_COLORS.some((entry) => entry.value === current);
  return (
    <>
      {!known && <option value={current}>Custom</option>}
      {LABEL_COLORS.map((entry) => (
        <option key={entry.value} value={entry.value}>
          {entry.name}
        </option>
      ))}
    </>
  );
}

function CardDialogBody({
  card,
  listId,
  onClose,
  hasHeader,
  hasFooter
}: {
  card: Card | null;
  listId: string;
  onClose: () => void;
  hasHeader: boolean;
  hasFooter: boolean;
}) {
  const board = useBoard();
  const {
    data,
    addCard,
    updateCard,
    duplicateCard,
    archiveCard,
    deleteCard,
    saveAsTemplate,
    createCardFromTemplate
  } = board;
  const current = board.board;
  const live = card ? current.cards.find((item) => item.id === card.id) : null;
  const source = live ?? card;

  const [title, setTitle] = useState(source?.title ?? "");
  const [description, setDescription] = useState(source?.description ?? "");
  const [priority, setPriority] = useState<Priority>(
    source?.priority ?? "medium"
  );
  const [dueDate, setDueDate] = useState(source?.dueDate ?? "");
  const [labelIds, setLabelIds] = useState<string[]>(source?.labelIds ?? []);
  const [draftChecklists, setDraftChecklists] = useState<Checklist[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [managingLabels, setManagingLabels] = useState(false);
  const [newChecklist, setNewChecklist] = useState("");
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);

  const targetListId = card ? card.listId : listId;
  const list = current.lists.find((item) => item.id === targetListId);
  const checklists = live ? live.checklists : draftChecklists;
  const state = dueState({ dueDate } as Card, list);

  function draftApply(
    op: (data: AppData, boardId: string, cardId: string) => ops.OpResult
  ): ops.OpResult {
    const draft: Card = {
      id: DRAFT_ID,
      listId: targetListId,
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      labelIds: [],
      checklists: draftChecklists,
      archived: false,
      createdAt: ""
    };
    const scratch: AppData = {
      ...data,
      boards: [{ ...current, cards: [draft] }],
      activeBoardId: current.id
    };
    const result = op(scratch, current.id, DRAFT_ID);
    if (result.ok)
      setDraftChecklists(result.data.boards[0].cards[0].checklists);
    return result;
  }

  const api: ChecklistApi = live
    ? {
        addChecklist: (value) => board.addChecklist(live.id, value),
        renameChecklist: (id, value) =>
          board.renameChecklist(live.id, id, value),
        deleteChecklist: (id) => board.deleteChecklist(live.id, id),
        addItem: (id, text) => board.addChecklistItem(live.id, id, text),
        updateItem: (id, itemId, updates) =>
          board.updateChecklistItem(live.id, id, itemId, updates),
        moveItem: (id, itemId, index) =>
          board.reorderChecklistItem(live.id, id, itemId, index),
        deleteItem: (id, itemId) =>
          board.deleteChecklistItem(live.id, id, itemId)
      }
    : {
        addChecklist: (value) =>
          draftApply((d, b, c) => ops.addChecklist(d, b, c, value)),
        renameChecklist: (id, value) =>
          draftApply((d, b, c) => ops.renameChecklist(d, b, c, id, value)),
        deleteChecklist: (id) =>
          draftApply((d, b, c) => ops.deleteChecklist(d, b, c, id)),
        addItem: (id, text) =>
          draftApply((d, b, c) => ops.addChecklistItem(d, b, c, id, text)),
        updateItem: (id, itemId, updates) =>
          draftApply((d, b, c) =>
            ops.updateChecklistItem(d, b, c, id, itemId, updates)
          ),
        moveItem: (id, itemId, index) =>
          draftApply((d, b, c) =>
            ops.reorderChecklistItem(d, b, c, id, itemId, index)
          ),
        deleteItem: (id, itemId) =>
          draftApply((d, b, c) => ops.deleteChecklistItem(d, b, c, id, itemId))
      };

  function toggleLabel(id: string) {
    setLabelIds((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setTitleError("Add a title to save this card");
      return;
    }
    setTitleError(null);
    const known = new Set(current.labels.map((label) => label.id));
    const fields = {
      title: cleanTitle,
      description: description.trim(),
      priority,
      dueDate,
      labelIds: labelIds.filter((id) => known.has(id))
    };
    const result = card
      ? updateCard(card.id, fields)
      : addCard(listId, { ...fields, checklists: draftChecklists });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    onClose();
  }

  function addChecklistFromField() {
    const result = api.addChecklist(newChecklist);
    if (!result.ok) {
      setChecklistError(result.error);
      return;
    }
    setChecklistError(null);
    setNewChecklist("");
  }

  function runAndClose(action: () => ops.OpResult) {
    const result = action();
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    onClose();
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        minHeight: 0
      }}
    >
      {hasHeader && (
        <Box sx={{ position: "relative", px: 2, pt: 1.5, pb: 1, borderBottom: "1px solid", borderColor: "divider" }}>
          <DialogTitle
            component="h2"
            id="card-dialog-title"
            sx={{ p: 0, fontSize: 19, fontWeight: 700, letterSpacing: -0.5 }}
          >
            {card ? "Edit task" : "Create a new task"}
          </DialogTitle>
          <Typography variant="body2" color="text.secondary">
            in list: {list?.name ?? "Unknown list"}
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Close dialog"
            sx={{
              position: "absolute",
              top: 8,
              right: 16,
              width: 36,
              height: 36,
              border: "1px solid",
              borderColor: "error.main",
              color: "error.main",
              borderRadius: 1.5,
              "&:hover": {
                bgcolor: "rgba(211,47,47,.08)",
                borderColor: "error.dark"
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      <DialogContent sx={{ display: "grid", gap: 1.5, px: 2, py: 1.5, alignContent: "start" }}>
        {formError && (
          <Alert severity="error" role="alert">
            {formError}
          </Alert>
        )}
        <TextField
          label="Task name"
          required
          autoFocus
          slotProps={{ htmlInput: { maxLength: 100 } }}
          value={title}
          error={Boolean(titleError)}
          helperText={titleError ?? undefined}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Prepare project proposal"
          fullWidth
          size="small"
        />

        {!card && current.templates.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <TextField
              select
              size="small"
              fullWidth
              label="Start from a template"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              slotProps={{
                select: { native: true },
                inputLabel: { shrink: true }
              }}
            >
              <option value="">Choose a template</option>
              {current.templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </TextField>
            <Button
              variant="outlined"
              disabled={!templateId}
              onClick={() =>
                runAndClose(() => createCardFromTemplate(templateId, listId))
              }
              sx={{ whiteSpace: "nowrap", height: 40 }}
            >
              Use template
            </Button>
          </Stack>
        )}

        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" sx={{ fontSize: 13, fontWeight: 700 }}>
            Labels
          </Typography>
          {current.labels.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No labels yet. Add one below.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {current.labels.map((label) => (
                <Box
                  key={label.id}
                  component="label"
                  sx={{ display: "inline-flex", alignItems: "center" }}
                >
                  <Checkbox
                    size="small"
                    checked={labelIds.includes(label.id)}
                    onChange={() => toggleLabel(label.id)}
                    slotProps={{
                      input: {
                        "data-testid": `card-label-${label.id}`
                      } as React.InputHTMLAttributes<HTMLInputElement>
                    }}
                  />
                  <Box
                    component="span"
                    sx={{
                      bgcolor: label.color,
                      color: labelTextColor(label.color),
                      px: 0.75,
                      borderRadius: 1,
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  >
                    {label.name}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
          <Button
            size="small"
            variant="text"
            aria-expanded={managingLabels}
            onClick={() => setManagingLabels((value) => !value)}
            sx={{ mt: 0.5, ml: -1, height: 32 }}
          >
            {managingLabels ? "Hide manager" : "Manage labels"}
          </Button>
          {managingLabels && <LabelManager labels={current.labels} />}
        </Box>

        <TextField
          label="Description"
          multiline
          rows={3}
          slotProps={{ htmlInput: { maxLength: 500 } }}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add a few details (optional)"
          fullWidth
          size="small"
        />

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <TextField
            select
            label="Priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            fullWidth
            size="small"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
          <TextField
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {state !== "none" && (
            <Box
              data-testid="card-dialog-due-state"
              role="status"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
                color: (theme) =>
                  state === "overdue"
                    ? theme.palette.error.main
                    : theme.palette.text.primary
              }}
            >
              {state === "overdue" ? (
                <ErrorOutlinedIcon sx={{ fontSize: 16 }} />
              ) : (
                <ScheduleIcon sx={{ fontSize: 16 }} />
              )}
              <span>{state === "overdue" ? "Overdue" : "Due soon"}</span>
            </Box>
          )}
        </Stack>

        <Divider />

        <Box>
          <Typography
            component="h3"
            sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}
          >
            Checklists
          </Typography>
          {checklists.map((checklist) => (
            <ChecklistBlock
              key={checklist.id}
              checklist={checklist}
              api={api}
            />
          ))}
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <TextField
              size="small"
              fullWidth
              label="New checklist title"
              value={newChecklist}
              error={Boolean(checklistError)}
              helperText={checklistError ?? undefined}
              onChange={(event) => setNewChecklist(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addChecklistFromField();
                }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addChecklistFromField}
              sx={{
                whiteSpace: "nowrap",
                height: 40,
                "&:focus-visible": {
                  outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 1
                }
              }}
            >
              Checklist
            </Button>
          </Stack>
        </Box>

        {card && (
          <>
            <Divider />
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => runAndClose(() => duplicateCard(card.id))}
              >
                Duplicate
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const result = saveAsTemplate(card.id);
                  if (!result.ok) setFormError(result.error);
                  else setTemplateSaved(true);
                }}
              >
                Save as template
              </Button>
              <Button
                variant="outlined"
                onClick={() => runAndClose(() => archiveCard(card.id))}
              >
                Archive
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => runAndClose(() => deleteCard(card.id))}
              >
                Delete card
              </Button>
            </Stack>
            {templateSaved && (
              <Typography role="status" variant="body2">
                Saved as a template
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      {hasFooter && (
        <DialogActions
          sx={{
            px: 2,
            py: 0.75,
            gap: 0.5,
            borderTop: "1px solid",
            borderColor: "divider"
          }}
        >
          <Button
            variant="outlined"
            color="error"
            onClick={onClose}
            sx={{ minWidth: 88 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ minWidth: 128 }}
          >
            {card ? "Save changes" : "Create task"}
          </Button>
        </DialogActions>
      )}
    </Box>
  );
}

export function CardDialog({
  open,
  card,
  listId,
  onClose,
  onExited,
  hasHeader = true,
  hasFooter = true
}: {
  open: boolean;
  card: Card | null;
  listId: string;
  onClose: () => void;
  onExited?: () => void;
  hasHeader?: boolean;
  hasFooter?: boolean;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      aria-labelledby="card-dialog-title"
      slotProps={{
        paper: { sx: { borderRadius: fullScreen ? 0 : 3.5, p: 0 } },
        transition: { onExited }
      }}
    >
      <CardDialogBody
        card={card}
        listId={listId}
        onClose={onClose}
        hasHeader={hasHeader}
        hasFooter={hasFooter}
      />
    </Dialog>
  );
}
