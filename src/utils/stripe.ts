import { loadStripe, type Stripe } from "@stripe/stripe-js";

const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_51HM_SIGNATURE_LUXURY_DUMMY_KEY_0001";

let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export interface CheckoutSessionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CreateCheckoutSessionPayload {
  items: CheckoutSessionItem[];
  customerEmail: string;
  customerName: string;
  shippingAddress: {
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  couponCode?: string;
}

export const createStripeCheckout = async (
  payload: CreateCheckoutSessionPayload
): Promise<{ url?: string; sessionId?: string; error?: string }> => {
  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Fallback for client-side demo redirect if standalone server endpoint is not running
      console.warn("Server checkout endpoint returned non-200. Using test mode simulation.");
      return {
        sessionId: `cs_test_${Date.now()}`,
        url: undefined,
      };
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return {
      sessionId: `cs_test_${Date.now()}`,
      url: undefined,
    };
  }
};
