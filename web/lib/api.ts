import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface ServiceOrder {
  id: string;
  title: string;
  status: "Draft" | "Pending" | "Paid" | "Cancelled";
  amount: number;
  createdAt: string;
}

export const serviceOrdersApi = {
  list: () => api.get<ServiceOrder[]>("/api/serviceorders").then((r) => r.data),
  get: (id: string) => api.get<ServiceOrder>(`/api/serviceorders/${id}`).then((r) => r.data),
  create: (body: { title: string; description: string; amount: number }) =>
    api.post<{ id: string }>("/api/serviceorders", body).then((r) => r.data),
  submitPayment: (id: string) =>
    api.post<{ pixQrCode: string; expiresAt: string }>(`/api/serviceorders/${id}/submit-payment`).then((r) => r.data),
};

export default api;
