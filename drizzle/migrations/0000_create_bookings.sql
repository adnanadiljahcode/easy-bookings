CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL CHECK (session_type IN ('portrait', 'family', 'product')),
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_date, time_slot)
);

GRANT SELECT, INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bookings"
  ON public.bookings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can create a booking"
  ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.bookings (session_type, booking_date, time_slot, client_name, client_email, status) VALUES
  ('portrait', CURRENT_DATE + 1, '10:00', 'Ayesha Khan', 'ayesha.khan@example.com', 'confirmed'),
  ('family', CURRENT_DATE + 1, '14:00', 'The Rahman Family', 'rahman.family@example.com', 'confirmed'),
  ('product', CURRENT_DATE + 2, '11:00', 'Bilal Ahmed', 'bilal@lumenware.co', 'pending'),
  ('portrait', CURRENT_DATE + 3, '16:00', 'Sara Malik', 'sara.malik@example.com', 'confirmed'),
  ('family', CURRENT_DATE + 4, '09:00', 'The Siddiqui Family', 'siddiqui@example.com', 'confirmed');