import type { ReactNode } from "react";
import { MyGamesShell } from "@/components/MyGamesShell";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children }: { stage: string; children: ReactNode }) {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/");
  }
  return <MyGamesShell onSignOut={signOut}>{children}</MyGamesShell>;
}
