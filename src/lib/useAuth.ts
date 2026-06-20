"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isCloud } from "./supabase";

export interface AuthState {
  user: User | null;
  loading: boolean;
  /** True when the app requires login (Supabase configured). */
  authRequired: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authRequired = isCloud();

  useEffect(() => {
    if (!authRequired) {
      setLoading(false);
      return;
    }
    const sb = getSupabase();
    let active = true;
    sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [authRequired]);

  return { user, loading, authRequired };
}
