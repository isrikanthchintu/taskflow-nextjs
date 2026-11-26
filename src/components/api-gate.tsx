"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { useApiSession } from "@/lib/api/client";
import { loginUrl } from "@/lib/session";

export function ApiGate({ children }: { children: React.ReactNode }) {
  const session = useApiSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!session) router.replace(loginUrl(pathname || "/"));
  }, [session, router, pathname]);

  if (!session) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress aria-label="Checking your session" />
      </Box>
    );
  }
  return <>{children}</>;
}
