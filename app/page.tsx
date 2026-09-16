"use client";
import { useState } from "react";



export default function Home() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    reply: string;
    score: string;
    reason: string;
    category: string;
  }>(null);
  const [error, setError] = useState("");

  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResult(data);

            await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          message,
          score: data.score,
          reason: data.reason,
          reply: data.reply,
          category: data.category,
          needsAttention: data.needsAttention,
        }),
      });
    } catch {
      setError("Nie udało się przetworzyć zapytania. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <main className="max-w-xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl text-[#1F2A22] mb-4 leading-tight">
          Nowak Nieruchomości
        </h1>
        <p className="text-[#5B5748] mb-8 leading-relaxed">
          Napisz do nas w dowolnej sprawie — kupno, sprzedaż, wycena. Odpowiemy natychmiast.
        </p>

        

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full bg-white border border-[#D8D3C4] rounded-lg p-3 text-[#1F2A22] placeholder:text-[#A8A290] focus:outline-none focus:ring-2 focus:ring-[#2F4B3C]/30 focus:border-[#2F4B3C]"
            placeholder="Twoje imię i nazwisko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full bg-white border border-[#D8D3C4] rounded-lg p-3 text-[#1F2A22] placeholder:text-[#A8A290] focus:outline-none focus:ring-2 focus:ring-[#2F4B3C]/30 focus:border-[#2F4B3C]"
            placeholder="Telefon lub e-mail"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
          <textarea
            className="w-full bg-white border border-[#D8D3C4] rounded-lg p-3 text-[#1F2A22] placeholder:text-[#A8A290] focus:outline-none focus:ring-2 focus:ring-[#2F4B3C]/30 focus:border-[#2F4B3C]"
            placeholder="W czym możemy pomóc?"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#2F4B3C] text-white px-5 py-3 rounded-lg font-medium hover:bg-[#25392F] transition-colors disabled:opacity-50"
          >
            {loading ? "Przetwarzanie..." : "Wyślij wiadomość"}
          </button>
        </form>

        {error && <p className="text-red-700 mt-4 text-sm">{error}</p>}

        {result && (
          <div className="mt-8 bg-white border border-[#E4E0D4] rounded-xl p-6">
            <p className="text-[15px] leading-relaxed text-[#1F2A22] whitespace-pre-wrap">
              {result.reply}
            </p>
          </div>
        )}

        <p className="text-sm text-[#8A8574] mt-12">
          <a href="/dashboard" className="hover:text-[#2F4B3C] transition-colors">
            Zobacz panel biura
          </a>
        </p>
      </main>
    </div>
  );
}