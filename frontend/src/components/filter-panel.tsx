"use client";

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Popover,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from "@mui/material";
import {
  EMPTY_FILTER,
  type CardFilter,
  type DueState,
  type GroupKey,
  type SortDirection,
  type SortKey,
  type SortSpec,
  type SwimlaneKey
} from "@/lib/board-query";
import { labelTextColor } from "@/lib/label-colors";
import type { Label, Priority } from "@/types/board";

export interface BoardView {
  filter: CardFilter;
  sort: SortSpec | null;
  group: GroupKey | null;
  swimlane: SwimlaneKey | null;
}

export const EMPTY_VIEW: BoardView = {
  filter: EMPTY_FILTER,
  sort: null,
  group: null,
  swimlane: null
};

export const SWIMLANE_LABELS: Record<SwimlaneKey, string> = {
  priority: "priority",
  label: "label"
};

export const SORT_LABELS: Record<SortKey, string> = {
  due: "due date",
  priority: "priority",
  created: "created date"
};

export const GROUP_LABELS: Record<GroupKey, string> = {
  priority: "priority",
  label: "label",
  due: "due state"
};

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
];

const DUE_OPTIONS: { value: DueState; label: string }[] = [
  { value: "overdue", label: "Overdue" },
  { value: "due-soon", label: "Due soon" }
];

export function viewActiveCount(view: BoardView): number {
  const { filter } = view;
  return (
    (filter.labelIds.length > 0 ? 1 : 0) +
    (filter.priorities.length > 0 ? 1 : 0) +
    (filter.dueStates.length > 0 ? 1 : 0) +
    (view.sort ? 1 : 0) +
    (view.group ? 1 : 0) +
    (view.swimlane ? 1 : 0)
  );
}

function toggle<T>(items: T[], value: T): T[] {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

export function FilterPanel({
  anchorEl,
  onClose,
  labels,
  view,
  onChange,
  matchCount
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  labels: Label[];
  view: BoardView;
  onChange: (view: BoardView) => void;
  matchCount: number;
}) {
  const { filter, sort, group, swimlane } = view;
  const sortValue = sort ? sort.key : "saved";
  const groupValue = group ?? "off";

  function setFilter(changes: Partial<CardFilter>) {
    onChange({ ...view, filter: { ...filter, ...changes } });
  }

  function setSortKey(value: string) {
    if (value === "saved") {
      onChange({ ...view, sort: null });
      return;
    }
    onChange({
      ...view,
      sort: { key: value as SortKey, direction: sort?.direction ?? "asc" }
    });
  }

  function setDirection(direction: SortDirection) {
    if (sort) onChange({ ...view, sort: { ...sort, direction } });
  }

  function setGroup(value: string) {
    onChange({ ...view, group: value === "off" ? null : (value as GroupKey) });
  }

  function setSwimlane(value: string) {
    onChange({
      ...view,
      swimlane: value === "off" ? null : (value as SwimlaneKey)
    });
  }

  function clearAll() {
    onChange({
      filter: { ...EMPTY_FILTER, text: filter.text },
      sort: null,
      group: null,
      swimlane: null
    });
  }

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-label": "Filters",
          sx: { width: 340, maxWidth: "calc(100vw - 16px)", p: 2 }
        }
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}
      >
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>
          Filters
        </Typography>
        <Button
          size="small"
          variant="text"
          data-testid="filter-clear-all"
          onClick={clearAll}
        >
          Clear all
        </Button>
      </Stack>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, mb: 1.5 }}>
        <Typography component="legend" sx={{ fontSize: 13, fontWeight: 700 }}>
          Label
        </Typography>
        {labels.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No labels yet. Add one in a card.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 1 }}>
            {labels.map((label) => (
              <FormControlLabel
                key={label.id}
                control={
                  <Checkbox
                    size="small"
                    checked={filter.labelIds.includes(label.id)}
                    onChange={() =>
                      setFilter({ labelIds: toggle(filter.labelIds, label.id) })
                    }
                    slotProps={{
                      input: {
                        "data-testid": `filter-label-${label.id}`
                      } as React.InputHTMLAttributes<HTMLInputElement>
                    }}
                  />
                }
                label={
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
                }
              />
            ))}
          </Box>
        )}
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, mb: 1.5 }}>
        <Typography component="legend" sx={{ fontSize: 13, fontWeight: 700 }}>
          Priority
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 1 }}>
          {PRIORITY_OPTIONS.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  size="small"
                  checked={filter.priorities.includes(option.value)}
                  onChange={() =>
                    setFilter({
                      priorities: toggle(filter.priorities, option.value)
                    })
                  }
                  slotProps={{
                    input: {
                      "data-testid": `filter-priority-${option.value}`
                    } as React.InputHTMLAttributes<HTMLInputElement>
                  }}
                />
              }
              label={option.label}
            />
          ))}
        </Box>
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, mb: 1.5 }}>
        <Typography component="legend" sx={{ fontSize: 13, fontWeight: 700 }}>
          Due
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 1 }}>
          {DUE_OPTIONS.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  size="small"
                  checked={filter.dueStates.includes(option.value)}
                  onChange={() =>
                    setFilter({
                      dueStates: toggle(filter.dueStates, option.value)
                    })
                  }
                  slotProps={{
                    input: {
                      "data-testid": `filter-due-${option.value}`
                    } as React.InputHTMLAttributes<HTMLInputElement>
                  }}
                />
              }
              label={option.label}
            />
          ))}
        </Box>
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, mb: 1 }}>
        <Typography component="legend" sx={{ fontSize: 13, fontWeight: 700 }}>
          Sort cards by
        </Typography>
        <RadioGroup
          row
          aria-label="Sort cards by"
          value={sortValue}
          onChange={(event) => setSortKey(event.target.value)}
        >
          <FormControlLabel
            value="saved"
            control={<Radio size="small" />}
            label="Saved order"
          />
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <FormControlLabel
              key={key}
              value={key}
              control={<Radio size="small" />}
              label={
                SORT_LABELS[key][0].toUpperCase() + SORT_LABELS[key].slice(1)
              }
            />
          ))}
        </RadioGroup>
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, mb: 1.5 }}>
        <Typography component="legend" sx={{ fontSize: 13, fontWeight: 700 }}>
          Sort direction
        </Typography>
        <RadioGroup
          row
          aria-label="Sort direction"
          value={sort?.direction ?? "asc"}
          onChange={(event) =>
            setDirection(event.target.value as SortDirection)
          }
        >
          <FormControlLabel
            value="asc"
            disabled={!sort}
            control={<Radio size="small" />}
            label="Up"
          />
          <FormControlLabel
            value="desc"
            disabled={!sort}
            control={<Radio size="small" />}
            label="Down"
          />
        </RadioGroup>
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, mb: 1.5 }}>
        <Typography component="legend" sx={{ fontSize: 13, fontWeight: 700 }}>
          Group cards by
        </Typography>
        <RadioGroup
          row
          aria-label="Group cards by"
          value={groupValue}
          onChange={(event) => setGroup(event.target.value)}
        >
          <FormControlLabel
            value="off"
            control={<Radio size="small" />}
            label="Off"
          />
          {(Object.keys(GROUP_LABELS) as GroupKey[]).map((key) => (
            <FormControlLabel
              key={key}
              value={key}
              control={<Radio size="small" />}
              label={
                GROUP_LABELS[key][0].toUpperCase() + GROUP_LABELS[key].slice(1)
              }
            />
          ))}
        </RadioGroup>
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, mb: 1.5 }}>
        <Typography component="legend" sx={{ fontSize: 13, fontWeight: 700 }}>
          Swimlanes (bands across all lists)
        </Typography>
        <RadioGroup
          row
          aria-label="Swimlanes"
          value={swimlane ?? "off"}
          onChange={(event) => setSwimlane(event.target.value)}
        >
          <FormControlLabel
            value="off"
            control={
              <Radio
                size="small"
                slotProps={{
                  input: {
                    "data-testid": "filter-swimlane-off"
                  } as React.InputHTMLAttributes<HTMLInputElement>
                }}
              />
            }
            label="Off"
          />
          {(Object.keys(SWIMLANE_LABELS) as SwimlaneKey[]).map((key) => (
            <FormControlLabel
              key={key}
              value={key}
              control={
                <Radio
                  size="small"
                  slotProps={{
                    input: {
                      "data-testid": `filter-swimlane-${key}`
                    } as React.InputHTMLAttributes<HTMLInputElement>
                  }}
                />
              }
              label={`By ${SWIMLANE_LABELS[key]}`}
            />
          ))}
        </RadioGroup>
      </Box>

      <Typography
        role="status"
        aria-live="polite"
        data-testid="filter-match-count"
        variant="body2"
        sx={{ mb: 1 }}
      >
        {matchCount} {matchCount === 1 ? "card matches" : "cards match"}
      </Typography>
      <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </Stack>
    </Popover>
  );
}
