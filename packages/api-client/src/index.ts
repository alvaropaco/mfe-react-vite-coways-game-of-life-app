import axios, { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  UploadBoardRequest,
  BoardId,
  BoardStateResponse,
  FinalStateResponse,
} from "@gol/types";

const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL) ||
  "";

const api = axios.create({ baseURL: BASE_URL, timeout: 10000, validateStatus: s => s >= 200 && s < 300 });

// Attach optional auth header from env or localStorage
api.interceptors.request.use((config) => {
  const token =
    (typeof import.meta !== "undefined" && (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_TOKEN) ||
    (typeof window !== "undefined" ? localStorage.getItem("authToken") : null);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  return config;
});

function toError(e: unknown): Error {
  if (axios.isAxiosError(e)) {
    const ax = e as AxiosError<unknown>;
    const status = ax.response?.status;
    const data: unknown = ax.response?.data;
    const serverMsg = (data as { message?: string; error?: string } | undefined)?.message || (data as { message?: string; error?: string } | undefined)?.error;
    const msg = serverMsg || ax.message || "Request failed";
    return new Error(status ? `${status}: ${msg}` : msg);
  }
  return e instanceof Error ? e : new Error("Unknown error");
}

export async function uploadBoard(req: UploadBoardRequest): Promise<BoardId> {
  try {
    const res = await api.post(`/api/Boards`, req);
    return res.data as string;
  } catch (e) {
    throw toError(e);
  }
}

export async function updateGrid(id: BoardId, grid: boolean[][]): Promise<BoardStateResponse> {
  const res = await api.put(`/api/boards/${id}`, { grid });
  return res.data as BoardStateResponse;
}
export function useUpdateGridMutation(id: BoardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (grid: boolean[][]) => updateGrid(id, grid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", id] });
      qc.invalidateQueries({ queryKey: ["board", id, "next"] });
    }
  });
}

export async function getBoard(id: BoardId): Promise<BoardStateResponse> {
  try {
    const res = await api.get(`/api/Boards/${id}`);
    return res.data as BoardStateResponse;
  } catch (e) {
    throw toError(e);
  }
}

export async function getNext(id: BoardId): Promise<BoardStateResponse> {
  try {
    const res = await api.get(`/api/Boards/${id}/next`);
    return res.data as BoardStateResponse;
  } catch (e) {
    throw toError(e);
  }
}

export async function getSteps(id: BoardId, n: number): Promise<BoardStateResponse> {
  try {
    const res = await api.get(`/api/Boards/${id}/steps/${n}`);
    return res.data as BoardStateResponse;
  } catch (e) {
    throw toError(e);
  }
}

export async function advance(id: BoardId, steps = 1): Promise<BoardStateResponse> {
  try {
    const res = await api.post(`/api/Boards/${id}/advance?steps=${steps}`);
    return res.data as BoardStateResponse;
  } catch (e) {
    throw toError(e);
  }
}

export async function getFinal(id: BoardId, maxAttempts = 10000): Promise<FinalStateResponse> {
  try {
    const res = await api.get(`/api/Boards/${id}/final?maxAttempts=${maxAttempts}`);
    return res.data as FinalStateResponse;
  } catch (e) {
    throw toError(e);
  }
}

export function useBoard(id?: BoardId) {
  return useQuery({ queryKey: ["board", id], queryFn: () => getBoard(id!), enabled: !!id });
}
export function useAdvanceMutation(id: BoardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (steps: number) => advance(id, steps),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", id] });
      qc.invalidateQueries({ queryKey: ["board", id, "next"] });
    }
  });
}
export function useUploadMutation() {
  return useMutation({ mutationFn: (req: UploadBoardRequest) => uploadBoard(req) });
}
export function usePreviewNext(id?: BoardId) {
  return useQuery({ queryKey: ["board", id, "next"], queryFn: () => getNext(id!), enabled: !!id });
}
