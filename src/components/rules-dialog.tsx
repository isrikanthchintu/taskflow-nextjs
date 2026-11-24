"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { Trash2, TriangleAlert } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useBoard } from "@/hooks/use-board";
import { ruleBroken } from "@/lib/board-rules";
import type {
  Board,
  Priority,
  Rule,
  RuleAction,
  RuleTrigger
} from "@/types/board";

type TriggerKind = RuleTrigger["kind"];
type ActionKind = RuleAction["kind"];

const PRIORITY_CHOICES: Priority[] = ["high", "medium", "low"];

function listName(board: Board, listId: string): string {
  return (
    board.lists.find((list) => list.id === listId)?.name ?? "a removed list"
  );
}

export function describeRule(board: Board, rule: Rule): string {
  const when =
    rule.trigger.kind === "card-enters-list"
      ? `When a card enters ${listName(board, rule.trigger.listId)}`
      : "When a card's checklist is fully checked";
  let then: string;
  if (rule.action.kind === "move-to-list") {
    then = `move it to ${listName(board, rule.action.listId)}`;
  } else if (rule.action.kind === "add-label") {
    const labelId = rule.action.labelId;
    const label = board.labels.find((item) => item.id === labelId);
    then = `add the label ${label?.name ?? "that was removed"}`;
  } else {
    then = `set its priority to ${rule.action.priority}`;
  }
  return `${when}, ${then}`;
}

export function brokenReason(board: Board, rule: Rule): string | null {
  if (!ruleBroken(board, rule)) return null;
  const usable = (listId: string) =>
    board.lists.some((list) => list.id === listId && !list.archived);
  if (rule.trigger.kind === "card-enters-list" && !usable(rule.trigger.listId))
    return "Broken: the list it watches was archived or removed. It does nothing.";
  if (rule.action.kind === "move-to-list" && !usable(rule.action.listId))
    return "Broken: the list it moves cards to was archived or removed. It does nothing.";
  return "Broken: its label was deleted. It does nothing.";
}

export function RulesDialog({
  open,
  onClose,
  onExited
}: {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
}) {
  const { board, addRule, setRuleEnabled, deleteRule } = useBoard();
  const lists = board.lists.filter((list) => !list.archived);
  const [name, setName] = useState("");
  const [triggerKind, setTriggerKind] =
    useState<TriggerKind>("card-enters-list");
  const [triggerList, setTriggerList] = useState("");
  const [actionKind, setActionKind] = useState<ActionKind>("move-to-list");
  const [actionList, setActionList] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionPriority, setActionPriority] = useState<Priority>("high");
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Rule | null>(null);

  const triggerListId = triggerList || lists[0]?.id || "";
  const actionListId = actionList || lists[0]?.id || "";
  const actionLabelId = actionLabel || board.labels[0]?.id || "";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trigger: RuleTrigger =
      triggerKind === "card-enters-list"
        ? { kind: "card-enters-list", listId: triggerListId }
        : { kind: "checklist-complete" };
    let action: RuleAction;
    if (actionKind === "move-to-list")
      action = { kind: "move-to-list", listId: actionListId };
    else if (actionKind === "add-label")
      action = { kind: "add-label", labelId: actionLabelId };
    else action = { kind: "set-priority", priority: actionPriority };

    if (trigger.kind === "card-enters-list" && !trigger.listId) {
      setError("Add a list before making a rule that watches a list.");
      return;
    }
    if (action.kind === "move-to-list" && !action.listId) {
      setError("Add a list before making a rule that moves cards.");
      return;
    }
    if (action.kind === "add-label" && !action.labelId) {
      setError("Add a label to this board before making a rule that adds one.");
      return;
    }
    const result = addRule({ name, trigger, action });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setError(null);
  }

  function confirmDelete() {
    if (pendingDelete) deleteRule(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="rules-dialog-title"
        slotProps={{ transition: { onExited } }}
      >
        <DialogTitle id="rules-dialog-title">
          Rules for {board.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {
              "Rules run only when you move a card or finish a checklist. A rule's own action never starts another rule."
            }
          </Typography>
          {board.rules.length === 0 ? (
            <Typography data-testid="rules-empty" sx={{ mb: 2 }}>
              No rules yet
            </Typography>
          ) : (
            <Stack
              component="ul"
              spacing={1}
              sx={{ listStyle: "none", m: 0, p: 0, mb: 2 }}
            >
              {board.rules.map((rule) => {
                const broken = brokenReason(board, rule);
                return (
                  <Box
                    component="li"
                    key={rule.id}
                    data-testid={`rule-${rule.id}`}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 1
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <Typography sx={{ flex: 1, fontWeight: 700 }}>
                        {rule.name}
                      </Typography>
                      <Switch
                        checked={rule.enabled}
                        slotProps={{
                          input: {
                            "aria-label": `${rule.enabled ? "Turn off" : "Turn on"} rule ${rule.name}`,
                            "data-testid": `rule-${rule.id}-toggle`
                          } as React.InputHTMLAttributes<HTMLInputElement>
                        }}
                        onChange={(event) =>
                          setRuleEnabled(rule.id, event.target.checked)
                        }
                      />
                      <IconButton
                        aria-label={`Delete rule ${rule.name}`}
                        data-testid={`rule-${rule.id}-delete`}
                        onClick={() => setPendingDelete(rule)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Stack>
                    <Typography variant="body2">
                      {describeRule(board, rule)}
                      {rule.enabled ? "" : " (turned off)"}
                    </Typography>
                    {broken && (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        data-testid={`rule-${rule.id}-broken`}
                        sx={{
                          alignItems: "center",
                          mt: 0.5,
                          color: "error.main",
                          fontWeight: 700,
                          fontSize: 13
                        }}
                      >
                        <TriangleAlert size={14} aria-hidden="true" />
                        <span>{broken}</span>
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}

          <Box component="form" onSubmit={submit} aria-label="New rule">
            <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>
              New rule
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="Rule name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                slotProps={{ htmlInput: { "data-testid": "rule-name" } }}
              />
              <TextField
                select
                size="small"
                label="When"
                value={triggerKind}
                onChange={(event) =>
                  setTriggerKind(event.target.value as TriggerKind)
                }
                slotProps={{
                  select: { native: true },
                  htmlInput: { "data-testid": "rule-trigger-kind" }
                }}
              >
                <option value="card-enters-list">a card enters a list</option>
                <option value="checklist-complete">
                  {"a card's checklist is fully checked"}
                </option>
              </TextField>
              {triggerKind === "card-enters-list" && (
                <TextField
                  select
                  size="small"
                  label="Watched list"
                  value={triggerListId}
                  onChange={(event) => setTriggerList(event.target.value)}
                  slotProps={{
                    select: { native: true },
                    htmlInput: { "data-testid": "rule-trigger-list" }
                  }}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </TextField>
              )}
              <TextField
                select
                size="small"
                label="Do"
                value={actionKind}
                onChange={(event) =>
                  setActionKind(event.target.value as ActionKind)
                }
                slotProps={{
                  select: { native: true },
                  htmlInput: { "data-testid": "rule-action-kind" }
                }}
              >
                <option value="move-to-list">move the card to a list</option>
                <option value="add-label">add a label</option>
                <option value="set-priority">set the priority</option>
              </TextField>
              {actionKind === "move-to-list" && (
                <TextField
                  select
                  size="small"
                  label="Move to list"
                  value={actionListId}
                  onChange={(event) => setActionList(event.target.value)}
                  slotProps={{
                    select: { native: true },
                    htmlInput: { "data-testid": "rule-action-list" }
                  }}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </TextField>
              )}
              {actionKind === "add-label" && (
                <TextField
                  select
                  size="small"
                  label="Label to add"
                  value={actionLabelId}
                  onChange={(event) => setActionLabel(event.target.value)}
                  slotProps={{
                    select: { native: true },
                    htmlInput: { "data-testid": "rule-action-label" }
                  }}
                >
                  {board.labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </TextField>
              )}
              {actionKind === "set-priority" && (
                <TextField
                  select
                  size="small"
                  label="Priority to set"
                  value={actionPriority}
                  onChange={(event) =>
                    setActionPriority(event.target.value as Priority)
                  }
                  slotProps={{
                    select: { native: true },
                    htmlInput: { "data-testid": "rule-action-priority" }
                  }}
                >
                  {PRIORITY_CHOICES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </TextField>
              )}
              {error && (
                <Alert severity="error" role="alert" data-testid="rule-error">
                  {error}
                </Alert>
              )}
              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  data-testid="rule-create"
                >
                  Create rule
                </Button>
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            color="inherit"
            data-testid="rules-close"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete rule '${pendingDelete?.name ?? ""}'?`}
        message="The rule is removed and stops running. Cards it already changed stay as they are."
        confirmLabel="Delete rule"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
