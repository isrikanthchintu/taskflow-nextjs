"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import { api } from "@/lib/api/endpoints";
import { errorMessage, isApiConfigured, setSession } from "@/lib/api/client";

function safeReturnUrl(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isApiConfigured()) {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", mt: 8, px: 2 }}>
        <Alert severity="info">
          This app is running in local mode. Set NEXT_PUBLIC_API_URL to sign in to the API.
        </Alert>
      </Box>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const session =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ email, name, password });
      setSession(session);
      router.replace(safeReturnUrl(params.get("returnUrl")));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 8, px: 2 }}>
      <Paper component="form" onSubmit={submit} sx={{ p: 4 }} data-testid="login-form">
        <Stack spacing={2}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            {mode === "login" ? "Log in to TaskFlow" : "Create your account"}
          </Typography>
          {error && (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          )}
          {mode === "register" && (
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            helperText={mode === "register" ? "At least 8 characters." : undefined}
          />
          <Button type="submit" variant="contained" disabled={busy}>
            {mode === "login" ? "Log in" : "Sign up"}
          </Button>
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => {
              setError(null);
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
          </Link>
        </Stack>
      </Paper>
    </Box>
  );
}
