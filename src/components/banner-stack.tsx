"use client";

import { Alert, Button, Stack } from "@mui/material";
import type { LimitReport } from "@/lib/board-ops";

interface BannerSpec {
  key: string;
  severity: "error" | "warning" | "info";
  role: "alert" | "status";
  text: string;
  onDismiss?: () => void;
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
  onDismissNotice
}: {
  dataError: string | null;
  saveError: string | null;
  notice: string | null;
  limits?: LimitReport | null;
  onDismissSaveError: () => void;
  onDismissNotice: () => void;
}) {
  const banners: BannerSpec[] = [];
  if (dataError)
    banners.push({
      key: "data-error",
      severity: "error",
      role: "alert",
      text: dataError
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
            ) : undefined
          }
        >
          {banner.text}
        </Alert>
      ))}
    </Stack>
  );
}
