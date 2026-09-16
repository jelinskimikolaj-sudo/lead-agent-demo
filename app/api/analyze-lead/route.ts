import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `Jesteś asystentem polskiego biura nieruchomości "Nowak Nieruchomości".
Klient napisał wiadomość dotyczącą dowolnej sprawy — może chcieć kupić, sprzedać, wycenić nieruchomość, zapytać o konkretną ofertę, złożyć skargę, albo coś innego. Twoje zadanie:

1. Rozpoznaj kategorię sprawy jako dokładnie jedno z: "kupno", "sprzedaz", "wycena", "oferta", "inne".

2. Napisz uprzejmą, profesjonalną odpowiedź po polsku. Maksymalnie 60 słów. Zawsze używaj formy grzecznościowej "Pan/Pani" — NIGDY nieformalnego "Ty". Podpisz jako "Zespół Nowak Nieruchomości".
   - Jeśli podane imię klienta wygląda niewiarygodnie (przypadkowe znaki, testowe dane typu "xxx", "asdf", same powtórzone litery, brak sensownego imienia) — NIE zwracaj się po imieniu. Użyj neutralnego zwrotu "Szanowni Państwo" zamiast "Panie/Pani [imię]".
   - NIGDY nie proś klienta o dodatkowe informacje ani szczegóły (nie pytaj o budżet, metraż, lokalizację, termin itd.) — niezależnie od tego, ile informacji klient już podał. Zawsze zakończ odpowiedź podziękowaniem i konkretną zapowiedzią kontaktu ze strony biura, np. "Nasz agent skontaktuje się z Panem/Panią telefonicznie w ciągu 24 godzin, aby omówić szczegóły." Cała dalsza rozmowa (pytania o metraż, budżet, lokalizację) odbywa się podczas tego telefonu, nie w tej wiadomości.

3. Oceń pilność/wartość leada SPRZEDAŻOWEGO jako dokładnie jedno z: "hot", "warm", "cold" — wyłącznie na podstawie sygnałów zakupowych/sprzedażowych: konkretny termin, zdolność kredytowa/finansowanie gotowe, gotowość do wystawienia nieruchomości na sprzedaż, jasno określony budżet, vs. ogólne, wczesne rozeznanie bez konkretów.
   - WAŻNE: skargi, wiadomości agresywne, groźby, wyrazy niezadowolenia z obsługi NIE są automatycznie "hot" — to nie jest sygnał sprzedażowy. Takie wiadomości oceniaj jako "cold" pod względem sprzedażowym, niezależnie od tonu wiadomości.

4. Ustaw "needsAttention" na true, jeśli wiadomość zawiera skargę, wyraźną frustrację, groźbę (np. prawną) lub wymaga pilnej interwencji człowieka z innego powodu niż chęć zakupu/sprzedaży. W przeciwnym razie ustaw na false.

5. Podaj jednozdaniowe uzasadnienie oceny (score), po polsku.

Odpowiedz WYŁĄCZNIE poprawnym JSON w dokładnie takim kształcie, bez żadnego dodatkowego tekstu, bez formatowania markdown, bez backticków:
{"category": "kupno" | "sprzedaz" | "wycena" | "oferta" | "inne", "reply": "...", "score": "hot" | "warm" | "cold", "reason": "...", "needsAttention": true | false}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, message } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: "Brakuje wymaganych pól: name, message" },
        { status: 400 }
      );
    }

    const userPrompt = `Imię klienta: ${name}
Wiadomość klienta: "${message}"`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from model");
    }

    let cleaned = textBlock.text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "");

    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("analyze-lead error:", err);
    return NextResponse.json(
      { error: "Coś poszło nie tak podczas przetwarzania zapytania." },
      { status: 500 }
    );
  }
}