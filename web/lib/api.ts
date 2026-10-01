import axios from "axios";

// Em produção (Vercel): usa proxy server-side /api/proxy/* → Railway (sem CORS)
// Em dev local: usa rewrite do next.config.ts /api/* → localhost:5000
const BASE = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? "/api/proxy"
  : "";

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export interface ServiceOrderDetail {
  id: string;
  title: string;
  description: string;
  status: "Draft" | "Pending" | "Paid" | "Cancelled";
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  title: string;
  status: "Draft" | "Pending" | "Paid" | "Cancelled";
  amount: number;
  createdAt: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ServiceOrderStatItem {
  status: string;
  count: number;
  total: number;
}

export interface ServiceOrderStats {
  byStatus: ServiceOrderStatItem[];
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  from?: string;
  to?: string;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export const serviceOrdersApi = {
  list: ({ page = 1, pageSize = 20, status, from, to }: ListParams = {}) =>
    api.get<PagedResult<ServiceOrder>>(`/api/serviceorders${buildQuery({ page, pageSize, status, from, to })}`).then((r) => r.data),
  get: (id: string) => api.get<ServiceOrderDetail>(`/api/serviceorders/${id}`).then((r) => r.data),
  create: (body: { title: string; description?: string | null; amount: number }) =>
    api.post<{ id: string }>("/api/serviceorders", body).then((r) => r.data),
  submitPayment: (id: string) =>
    api.post<{ pixQrCode: string; expiresAt: string }>(`/api/serviceorders/${id}/submit-payment`).then((r) => r.data),
  cancel: (id: string) =>
    api.delete(`/api/serviceorders/${id}`),
  stats: () =>
    api.get<ServiceOrderStats>("/api/serviceorders/stats").then((r) => r.data),
  exportCsv: (params: Omit<ListParams, "page" | "pageSize"> = {}) =>
    api.get<Blob>(`/api/serviceorders/export${buildQuery({ status: params.status, from: params.from, to: params.to })}`, { responseType: "blob" }).then((r) => r.data),
};

export default api;
