-- Additive columns consumed by the checkout gift-wrap option.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_gift_wrap BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS gift_message TEXT;
