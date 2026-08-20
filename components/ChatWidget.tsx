"use client";

import { useEffect, useRef, useState } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { MessageSquareIcon, XIcon, SendIcon, SparkleIcon } from "@/components/icons";

type ChatMessage = { role: "user" | "assistant"; content: string };

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMITED: "Maaf, had soalan hari ini dah penuh. Sila cuba lagi esok atau terus WhatsApp terapis.",
  TRIAL_ENDED: "Ciri chat AI ini dah tamat tempoh percubaan percuma.",
  DISABLED: "Ciri chat AI belum diaktifkan buat masa ini.",
  NOT_CONFIGURED: "Ciri chat AI belum tersedia buat masa ini.",
  EMPTY_MESSAGE: "Sila taip soalan anda dahulu.",
  NOT_FOUND: "Terapis ini tidak dijumpai.",
};

export default function ChatWidget({ slug, therapistName, therapistPhone }: { slug: string; therapistName: string; therapistPhone: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages.slice(-6) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((cur) => [...cur, { role: "assistant", content: ERROR_MESSAGES[data.error] ?? "Maaf, ada masalah sekejap. Sila cuba lagi." }]);
      } else {
        setMessages((cur) => [...cur, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages((cur) => [...cur, { role: "assistant", content: "Maaf, sambungan terputus. Sila cuba lagi." }]);
    } finally {
      setSending(false);
    }
  }

  const whatsappLink = buildWhatsAppLink(therapistPhone, `Hai ${therapistName}, saya ada soalan tentang servis anda.`);

  return (
    <div className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-md px-5 sm:max-w-lg">
      <div className="flex justify-end">
        {open && (
          <div className="mb-3 flex h-[420px] w-full max-w-[320px] flex-col overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-2xl animate-modal-in">
            <div className="flex items-center gap-2.5 border-b border-[color:var(--border)] bg-[color:var(--surface-2)]/70 px-4 py-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, var(--brand, #7a51c9), color-mix(in srgb, var(--brand, #7a51c9) 75%, black))" }}
              >
                <SparkleIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[color:var(--text-primary)]">Tanya AI &middot; {therapistName}</p>
                <p className="text-[10px] font-medium text-brand-500">Percuma buat masa ini</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--text-muted)] active:scale-90">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-3.5 py-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <SparkleIcon className="h-6 w-6 text-brand-300" />
                  <p className="text-xs text-[color:var(--text-muted)]">Tanya tentang harga, waktu, atau kawasan liputan {therapistName}.</p>
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                        m.role === "user" ? "bg-brand-600 text-white" : "bg-[color:var(--surface-2)] text-[color:var(--text-secondary)]"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="flex gap-1 rounded-2xl bg-[color:var(--surface-2)] px-3.5 py-2.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--text-muted)]" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--text-muted)]" style={{ animationDelay: "120ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--text-muted)]" style={{ animationDelay: "240ms" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[color:var(--border)] p-2.5">
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="mb-2 block text-center text-[11px] font-semibold text-brand-300 active:opacity-60">
                Nak tempah terus? Hubungi WhatsApp →
              </a>
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Taip soalan anda..."
                  className="flex-1 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-3.5 py-2 text-[13px] text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-brand-400"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white active:scale-90 disabled:opacity-40"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center rounded-full text-white shadow-2xl transition-transform active:scale-90"
          style={{
            height: "52px",
            width: "52px",
            background: "linear-gradient(135deg, var(--brand, #7a51c9), color-mix(in srgb, var(--brand, #7a51c9) 75%, black))",
          }}
          aria-label="Tanya AI"
        >
          {open ? <XIcon className="h-5 w-5" /> : <MessageSquareIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
