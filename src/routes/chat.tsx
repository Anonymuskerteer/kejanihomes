import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, MapPin, MessageCircle, Send, Loader2, Home, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatKES } from "@/lib/properties";

export const Route = createFileRoute("/chat")({
  validateSearch: z.object({ property: z.string().optional(), c: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Messages — Kejani Homes" },
      { name: "description", content: "Chat directly with landlords and tenants on Kejani Homes." },
      { property: "og:title", content: "Messages — Kejani Homes" },
      { property: "og:description", content: "Chat directly with landlords and tenants on Kejani Homes." },
    ],
  }),
  component: ChatPage,
});

interface Conversation {
  id: string;
  property_id: string | null;
  tenant_id: string;
  landlord_id: string;
  last_message_at: string;
}
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  property_id: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}
interface MiniProperty {
  id: string;
  title: string;
  town: string;
  county: string;
  price_kes: number;
  images: string[];
  owner_id: string;
}

function ChatPage() {
  const { user, loading } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(search.c ?? null);
  const [attachProperty, setAttachProperty] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const startedFor = useRef<string | null>(null);

  const { data: convs = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Conversation[]> => {
      const { data } = await supabase.from("conversations").select("*").order("last_message_at", { ascending: false });
      return (data as Conversation[]) ?? [];
    },
  });

  const otherIds = useMemo(
    () => [...new Set(convs.map((c) => (c.tenant_id === user?.id ? c.landlord_id : c.tenant_id)))],
    [convs, user?.id],
  );
  const propIds = useMemo(() => [...new Set(convs.map((c) => c.property_id).filter(Boolean) as string[])], [convs]);

  const { data: people = {} } = useQuery({
    queryKey: ["chat-people", otherIds.join(",")],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p])) as Record<string, { id: string; full_name: string | null; avatar_url: string | null }>;
    },
  });
  const { data: props = {} } = useQuery({
    queryKey: ["chat-props", propIds.join(","), search.property],
    queryFn: async () => {
      const ids = [...new Set([...propIds, ...(search.property ? [search.property] : [])])];
      if (!ids.length) return {};
      const { data } = await supabase.from("properties").select("id, title, town, county, price_kes, images, owner_id").in("id", ids);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p])) as Record<string, MiniProperty>;
    },
  });

  // Open / create the conversation for ?property=
  useEffect(() => {
    if (!user || !search.property || startedFor.current === search.property) return;
    const prop = props[search.property];
    if (!prop) return;
    startedFor.current = search.property;
    if (prop.owner_id === user.id) {
      toast.info("This is your own listing.");
      return;
    }
    (async () => {
      let conv = convs.find((c) => c.property_id === prop.id && c.tenant_id === user.id);
      if (!conv) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ property_id: prop.id, tenant_id: user.id, landlord_id: prop.owner_id })
          .select()
          .single();
        if (error) {
          const { data: existing } = await supabase.from("conversations").select("*").eq("property_id", prop.id).eq("tenant_id", user.id).maybeSingle();
          if (!existing) return toast.error(error.message);
          conv = existing as Conversation;
        } else conv = data as Conversation;
        qc.invalidateQueries({ queryKey: ["conversations", user.id] });
      }
      setActiveId(conv.id);
      setAttachProperty(prop.id);
      setDraft(`Hi, I'm interested in "${prop.title}" in ${prop.town}. Is it still available?`);
    })();
  }, [user, search.property, props, convs, qc]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="grid flex-1 place-items-center p-8 text-center">
          <div>
            <MessageCircle className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Sign in to chat with landlords.</p>
            <Button asChild className="mt-4"><Link to="/auth">Sign in</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const active = convs.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex h-screen flex-col">
      <SiteHeader />
      <div className="container-page grid min-h-0 flex-1 gap-4 py-4 md:grid-cols-[320px_1fr]">
        <aside className={`min-h-0 overflow-y-auto rounded-2xl border border-border bg-card ${active ? "hidden md:block" : ""}`}>
          <div className="border-b border-border p-4 font-display text-lg font-bold">Messages</div>
          {convs.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet. Tap the chat button on any listing to message the landlord.
            </p>
          )}
          {convs.map((c) => {
            const other = people[c.tenant_id === user.id ? c.landlord_id : c.tenant_id];
            const p = c.property_id ? props[c.property_id] : undefined;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveId(c.id);
                  setAttachProperty(null);
                  setDraft("");
                  navigate({ to: "/chat", search: { c: c.id }, replace: true });
                }}
                className={`flex w-full items-center gap-3 border-b border-border p-3 text-left transition hover:bg-secondary ${c.id === activeId ? "bg-primary-soft" : ""}`}
              >
                <Avatar url={other?.avatar_url} name={other?.full_name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{other?.full_name || "Kejani user"}</div>
                  <div className="truncate text-xs text-muted-foreground">{p ? p.title : "Listing"}</div>
                </div>
              </button>
            );
          })}
        </aside>

        <section className={`min-h-0 flex-col rounded-2xl border border-border bg-card ${active ? "flex" : "hidden md:flex"}`}>
          {active ? (
            <Thread
              key={active.id}
              conv={active}
              meId={user.id}
              other={people[active.tenant_id === user.id ? active.landlord_id : active.tenant_id]}
              props={props}
              attachProperty={attachProperty}
              clearAttach={() => setAttachProperty(null)}
              draft={draft}
              setDraft={setDraft}
              onBack={() => {
                setActiveId(null);
                navigate({ to: "/chat", search: {}, replace: true });
              }}
            />
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Select a conversation</div>
          )}
        </section>
      </div>
    </div>
  );
}

function Avatar({ url, name }: { url?: string | null; name?: string | null }) {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : (name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

function Thread({
  conv,
  meId,
  other,
  props,
  attachProperty,
  clearAttach,
  draft,
  setDraft,
  onBack,
}: {
  conv: Conversation;
  meId: string;
  other?: { full_name: string | null; avatar_url: string | null };
  props: Record<string, MiniProperty>;
  attachProperty: string | null;
  clearAttach: () => void;
  draft: string;
  setDraft: (v: string) => void;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [locating, setLocating] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at")
      .then(({ data }) => alive && setMessages((data as Message[]) ?? []));
    // Live updates via realtime websocket
    const channel = supabase
      .channel(`chat-${conv.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conv.id}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [conv.id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (extra?: { latitude: number; longitude: number }) => {
    const body = extra ? draft.trim() || "📍 Shared my location" : draft.trim();
    if (!body && !attachProperty) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conv.id,
        sender_id: meId,
        body,
        property_id: attachProperty,
        latitude: extra?.latitude ?? null,
        longitude: extra?.longitude ?? null,
      })
      .select()
      .single();
    setSending(false);
    if (error) return toast.error(error.message);
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message]));
    setDraft("");
    clearAttach();
  };

  const shareLocation = () => {
    if (!("geolocation" in navigator)) return toast.error("Location isn't available on this device");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        send({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location. Allow location access and try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const listing = conv.property_id ? props[conv.property_id] : undefined;
  const attached = attachProperty ? props[attachProperty] : undefined;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border p-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary md:hidden" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar url={other?.avatar_url} name={other?.full_name} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{other?.full_name || "Kejani user"}</div>
          {listing && (
            <Link to="/property/$id" params={{ id: listing.id }} className="truncate text-xs text-primary hover:underline">
              {listing.title}
            </Link>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-secondary/30 p-4">
        {messages.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Say hello 👋</p>}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          const p = m.property_id ? props[m.property_id] : undefined;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] space-y-2 rounded-2xl px-3 py-2 text-sm shadow-soft ${mine ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                {p && <ListingChip p={p} inverted={mine} />}
                {m.latitude != null && m.longitude != null && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 font-medium underline-offset-2 hover:underline ${mine ? "bg-primary-foreground/15" : "bg-primary-soft text-primary"}`}
                  >
                    <MapPin className="h-4 w-4" /> Open shared location
                  </a>
                )}
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                <div className={`text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      {attached && (
        <div className="flex items-center gap-2 border-t border-border bg-primary-soft/60 px-3 py-2">
          <Home className="h-4 w-4 text-primary" />
          <span className="min-w-0 flex-1 truncate text-xs">
            Attaching listing: <strong>{attached.title}</strong>
          </span>
          <button onClick={clearAttach} aria-label="Remove attachment" className="grid h-7 w-7 place-items-center rounded-full hover:bg-background">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Button type="button" size="icon" variant="outline" onClick={shareLocation} disabled={locating} aria-label="Share location" title="Share location">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        </Button>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message" maxLength={2000} />
        <Button type="submit" size="icon" disabled={sending || (!draft.trim() && !attachProperty)} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </>
  );
}

function ListingChip({ p, inverted }: { p: MiniProperty; inverted: boolean }) {
  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      className={`flex items-center gap-2 rounded-xl p-2 ${inverted ? "bg-primary-foreground/15" : "border border-primary/30 bg-primary-soft"}`}
    >
      <img src={p.images[0] ?? "/placeholder.svg"} alt="" className="h-12 w-14 rounded-lg object-cover" />
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold">{p.title}</div>
        <div className={`text-[11px] ${inverted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {p.town} · {formatKES(p.price_kes)}/mo
        </div>
      </div>
    </Link>
  );
}
