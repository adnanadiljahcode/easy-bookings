import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SESSION_TYPES = [
  {
    id: "portrait",
    name: "Portrait",
    description: "Individual or couple portraits in natural studio light.",
    duration: "1 hour",
    price: "$150",
  },
  {
    id: "family",
    name: "Family",
    description: "Relaxed sessions for the whole family, up to 6 people.",
    duration: "90 minutes",
    price: "$220",
  },
  {
    id: "product",
    name: "Product",
    description: "Crisp, styled product photography for your brand.",
    duration: "2 hours",
    price: "$300",
  },
] as const;

export type SessionType = (typeof SESSION_TYPES)[number]["id"];

export const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

export type Booking = {
  id: string;
  session_type: SessionType;
  booking_date: string;
  time_slot: string;
  client_name: string;
  client_email: string;
  status: "confirmed" | "pending" | "cancelled";
  created_at: string;
};

export function bookingsQueryOptions(date?: string) {
  return queryOptions({
    queryKey: ["bookings", date ?? "all"],
    queryFn: async (): Promise<Booking[]> => {
      let query = supabase
        .from("bookings")
        .select("*")
        .order("booking_date", { ascending: true })
        .order("time_slot", { ascending: true });
      if (date) query = query.eq("booking_date", date);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Booking[];
    },
  });
}

export async function createBooking(input: {
  session_type: SessionType;
  booking_date: string;
  time_slot: string;
  client_name: string;
  client_email: string;
}) {
  const { error } = await supabase.from("bookings").insert({
    ...input,
    status: "confirmed",
  });
  if (error) {
    if (error.code === "23505") {
      throw new Error("That time slot was just taken — please pick another one.");
    }
    throw error;
  }
}
