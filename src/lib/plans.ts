// Subscription tiers. Prices/limits are easy to edit here — the pricing page,
// Settings billing, and (later) Stripe checkout all read from this.

export type PlanId = "free" | "pro" | "team";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // USD / month
  tagline: string;
  cta: string;
  highlighted?: boolean;
  features: string[];
  // Env var holding the Stripe price id, used once billing is wired up.
  priceEnv?: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "For trying it out",
    cta: "Start for free",
    features: [
      "Up to 25 recordings",
      "5 min max per video",
      "Screen, camera, or both",
      "Instant share links & comments",
      "Basic AI summaries",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 12,
    tagline: "For individuals & creators",
    cta: "Upgrade to Pro",
    highlighted: true,
    priceEnv: "STRIPE_PRICE_PRO",
    features: [
      "Everything in Free",
      "Unlimited recordings",
      "Up to 45 min per video",
      "Full AI: title, summary & chapters",
      "Password, expiry & download controls",
      "Custom thumbnails",
      "Remove the Translume badge",
      "Viewer engagement insights",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: 20,
    tagline: "Per member, for teams",
    cta: "Upgrade to Team",
    priceEnv: "STRIPE_PRICE_TEAM",
    features: [
      "Everything in Pro",
      "Team workspaces & shared library",
      "Invite unlimited teammates",
      "Centralized admin",
      "Priority support",
    ],
  },
];

export const planById = (id: PlanId) => PLANS.find((p) => p.id === id);
