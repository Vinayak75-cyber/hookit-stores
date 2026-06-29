"use client";

import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
    >
      Sign out
    </button>
  );
}