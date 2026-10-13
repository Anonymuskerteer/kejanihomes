import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Headset, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { openSupportChat } from "@/lib/account.functions";

export function SupportChatButton() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const open = useServerFn(openSupportChat);
  const [busy, setBusy] = useState(false);
  if (!user || role === "admin") return null;

  const go = async () => {
    setBusy(true);
    try {
      const { id } = await open();
      navigate({ to: "/chat", search: { c: id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open support chat");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      aria-label="Chat with admin"
      title="Chat with admin"
      className="fixed bottom-20 right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated transition hover:scale-105"
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Headset className="h-5 w-5" />}
    </button>
  );
}
