"use client";
import { useEffect, useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  kupno: "Kupno",
  sprzedaz: "Sprzedaż",
  wycena: "Wycena",
  oferta: "Pytanie o ofertę",
  inne: "Inne",
};

type Lead = {
  id: string;
  name: string;
  contact: string;
  message: string;
  score: string;
  reason: string;
  reply: string;
  category: string;
  needsAttention: boolean;
  time: string;
  done: boolean;
};

function scoreBadgeStyle(score: string) {
  if (score === "hot") return "bg-[#FBEAE4] text-[#B3492A]";
  if (score === "warm") return "bg-[#FBF3DC] text-[#946C1F]";
  return "bg-[#EFEDE6] text-[#6B6558]";
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function loadLeads() {
    fetch("/api/leads", { cache: "no-store" })
      .then((res) => res.json())
      .then((serverLeads: Lead[]) => setLeads(serverLeads));
  }

  useEffect(() => {
    loadLeads();
    const interval = setInterval(loadLeads, 4000);
    return () => clearInterval(interval);
  }, []);

  async function toggleDone(id: string, currentDone: boolean) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, done: !currentDone } : l))
    );
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done: !currentDone }),
    });
  }

  async function clearAll() {
    if (!confirm("Na pewno usunąć wszystkie leady?")) return;
    await fetch("/api/leads", { method: "DELETE" });
    setLeads([]);
  }

  const hotCount = leads.filter((l) => l.score === "hot" && !l.done).length;
  const activeCount = leads.filter((l) => !l.done).length;

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="font-serif text-4xl text-[#1F2A22] mb-1">Panel biura</h1>
            <p className="text-[#8A8574] text-sm">Nowak Nieruchomości</p>
          </div>
          {leads.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-[#8A8574] border border-[#D8D3C4] rounded-full px-3 py-1.5 hover:bg-white transition-colors"
            >
              Wyczyść wszystkie
            </button>
          )}
        </div>

        <div className="flex gap-8 mb-10 pb-8 border-b border-[#E4E0D4]">
          <div>
            <p className="text-2xl font-serif text-[#1F2A22]">{activeCount}</p>
            <p className="text-xs text-[#8A8574]">aktywnych zapytań</p>
          </div>
          <div>
            <p className="text-2xl font-serif text-[#B3492A]">{hotCount}</p>
            <p className="text-xs text-[#8A8574]">gorących leadów</p>
          </div>
        </div>

        {leads.length === 0 && (
          <p className="text-sm text-[#8A8574]">Brak zapytań do wyświetlenia.</p>
        )}

        <div className="space-y-3">
          {leads.map((lead, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={lead.id}
                className={`bg-white border rounded-xl overflow-hidden ${
                  lead.needsAttention ? "border-[#C9A227]" : "border-[#E4E0D4]"
                } ${lead.done ? "opacity-50" : ""}`}
              >
                <div className="w-full text-left p-5 flex justify-between items-start">
                  <div className="flex gap-3 pr-4">
                    <input
                      type="checkbox"
                      checked={lead.done}
                      onChange={() => toggleDone(lead.id, lead.done)}
                      className="mt-1 h-4 w-4 accent-[#2F4B3C] cursor-pointer"
                    />
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="text-left"
                    >
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className={`font-medium text-[#1F2A22] ${lead.done ? "line-through" : ""}`}>
                          {lead.name}
                        </p>
                        <span className="text-xs text-[#8A8574]">
                          · {CATEGORY_LABELS[lead.category] ?? lead.category}
                        </span>
                        {lead.needsAttention && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#FBF3DC] text-[#946C1F] font-medium">
                            Wymaga uwagi
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#8A8574] mb-2">{lead.contact}</p>
                      <p className="text-sm text-[#5B5748] leading-relaxed">
                        {lead.reason}
                      </p>
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${scoreBadgeStyle(
                        lead.score
                      )}`}
                    >
                      {lead.score.toUpperCase()}
                    </span>
                    <p className="text-xs text-[#A8A290] mt-2">{lead.time}</p>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-[#F0EDE3] space-y-4 ml-7">
                    <div>
                      <p className="text-xs text-[#8A8574] mb-1">Wiadomość klienta</p>
                      <p className="text-sm text-[#1F2A22] leading-relaxed">
                        {lead.message}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A8574] mb-1">Proponowana odpowiedź</p>
                      <p className="text-sm text-[#1F2A22] leading-relaxed whitespace-pre-wrap">
                        {lead.reply}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-[#8A8574] mt-10">
          <a href="/" className="hover:text-[#2F4B3C] transition-colors">
            ← Powrót do strony głównej
          </a>
        </p>
      </main>
    </div>
  );
}