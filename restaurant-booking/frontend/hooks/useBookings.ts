"use client";
import useSWR from "swr";
import { adminApi } from "@/lib/adminApi";

export interface AdminBooking {
  id: string;
  slot_date: string;
  slot_start_time: string;
  party_size: number;
  status: string;
  confirmation_code: string;
  guest_id: string;
  table_id: string;
  special_requests: string | null;
}

async function fetcher(url: string) {
  const resp = await adminApi.get<AdminBooking[]>(url);
  return resp.data;
}

export function useBookings(date?: string) {
  const url = date ? `/bookings?date=${date}` : "/bookings";
  const { data, error, mutate } = useSWR<AdminBooking[]>(url, fetcher, { refreshInterval: 30000 });
  return { bookings: data ?? [], loading: !data && !error, error, mutate };
}
