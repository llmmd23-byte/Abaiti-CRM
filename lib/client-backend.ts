"use client";

import {useCallback, useEffect, useState} from "react";

export function useBackend<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(path, {cache: "no-store"});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "REQUEST_FAILED");
      setData(body.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "REQUEST_FAILED");
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => { void reload(); }, [reload]);
  return {data, error, loading, reload};
}

async function request<T>(path: string, method: "POST" | "PUT", body: Record<string, unknown>) {
  const response = await fetch(path, {method, headers: {"Content-Type": "application/json; charset=utf-8"}, body: JSON.stringify(body)});
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "REQUEST_FAILED");
  return payload.data as T;
}

export const createBackend = <T,>(resource: string, body: Record<string, unknown>) =>
  request<T>(`/api/v1/data/${resource}`, "POST", body);

export const updateBackend = <T,>(resource: string, id: number | string, body: Record<string, unknown>) =>
  request<T>(`/api/v1/data/${resource}/${id}`, "PUT", body);

export const updateProfileBackend = <T,>(body: Record<string, unknown>) => request<T>("/api/v1/profile", "PUT", body);

export const saveSocialAccountsBackend = <T,>(body: Record<string, unknown>) =>
  request<T>("/api/v1/profile/social-accounts", "PUT", body);

