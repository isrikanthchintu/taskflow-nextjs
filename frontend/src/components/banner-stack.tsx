"use client";

import { useState } from "react";
import { Alert, Button, Stack } from "@mui/material";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { downloadTextFile } from "@/components/import-export-dialog";
import type { LimitReport } from "@/lib/board-ops";

interface BannerSpec {
  key: string;
  severity: "error" | "warning" | "info";
  role: "alert" | "status";
  text: string;
  onDismiss?: () => void;
  actions?: React.ReactNode;
}

const LIMIT_TEXT = {
  boards: {
    warn: (count: number, limit: number) =>
      `You have used ${count} of ${limit} boards`,
    reached: (limit: number) => `Board limit reached (${limit} boards)`
  },
  lists: {
    warn: (count: number, limit: number) =>
      `You have used ${count} of ${limit} lists on this board`,
    reached: (limit: number) => `List limit reached (${limit} lists per board)`
  },
  cards: {
    warn: (count: number, limit: number) =>
      `You have used ${count} of ${limit} cards in total`,
    reached: (limit: number) => `Card limit reached (${limit} cards in total)`
  }
} as const;

export function limitMessages(limits: LimitReport | null): string[] {
  if (!limits) return [];
  return (["boards", "lists", "cards"] as const).flatMap((key) => {
    const status = limits[key];
    if (status.reached) return [LIMIT_TEXT[key].reached(status.limit)];
    if (status.warn) return [LIMIT_TEXT[key].warn(status.count, status.limit)];
    return [];
  });
}

export function BannerStack({
  dataError,
  saveError,
  notice,
  limits = null,
  onDismissSaveError,
  onDismissNotice,
  onBackupData,
  onResetData
}: {
  dataError: string | null;
  saveError: string | null;
  notice: string | null;
  limits?: LimitReport | null;
  onDismissSaveError: () => void;
  onDismissNotice: () => void;
  onBackupData?: () => { fileName: string; text: string } | null;
  onResetData?: () => { ok: boolean; error?: string };
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState("");
  const canRecover = Boolean(onBackupData && onResetData);

  function backup() {
    const file = onBackupData?.();
    if (!file) {
      setRecoveryStatus("There is no saved data to download.");
      return;
    }
    downloadTextFile(file.fileName, file.text);
    setRecoveryStatus(`Downloaded ${file.fileName}`);
  }

  function reset() {
    const result = onResetData?.();
    setConfirmReset(false);
    if (result && !result.ok)
      setRecoveryStatus(result.error ?? "Reset failed.");
  }

  const banners: BannerSpec[] = [];
  if (dataError)
    banners.push({
      key: "data-error",
      severity: "error",
      role: "alert",
      text: dataError,
      actions: canRecover ? (
        <>
          <Button
            color="inherit"
            size="small"
            onClick={backup}
            data-testid="banner-data-error-backup"
          >
            Download backup
          </Button>
          <Button
            color="inherit"
            size="small"
            onClick={() => setConfirmReset(true)}
            data-testid="banner-data-error-reset"
          >
            Reset saved data
          </Button>
        </>
      ) : undefined
    });
  if (saveError)
    banners.push({
      key: "save-error",
      severity: "error",
      role: "alert",
      text: saveError,
      onDismiss: onDismissSaveError
    });
  limitMessages(limits).forEach((text) =>
    banners.push({
      key: `limit-${text}`,
      severity: "warning",
      role: "status",
      text
    })
  );
  if (notice)
    banners.push({
      key: "notice",
      severity: "info",
      role: "status",
      text: notice,
      onDismiss: onDismissNotice
    });

  if (banners.length === 0) return null;

  return (
    <Stack spacing={0.5} data-testid="banner-stack" sx={{ px: 2, pb: 0.5 }}>
      {banners.map((banner) => (
        <Alert
          key={banner.key}
          severity={banner.severity}
          role={banner.role}
          data-testid={`banner-${banner.key}`}
          action={
            banner.onDismiss ? (
              <Button
                color="inherit"
                size="small"
                onClick={banner.onDismiss}
                data-testid={`banner-${banner.key}-dismiss`}
              >
                Dismiss
              </Button>
            ) : (
              banner.actions
            )
          }
        >
          {banner.text}
          {banner.key === "data-error" && recoveryStatus ? (
            <div role="status">{recoveryStatus}</div>
          ) : null}
        </Alert>
      ))}
      <ConfirmDialog
        open={confirmReset}
        title="Reset saved data?"
        message="This permanently deletes everything stored in this browser for TaskFlow and starts with a fresh board. Download a backup first if you want to keep it."
        confirmLabel="Reset saved data"
        onConfirm={reset}
        onCancel={() => setConfirmReset(false)}
      />
    </Stack>
  );
}
