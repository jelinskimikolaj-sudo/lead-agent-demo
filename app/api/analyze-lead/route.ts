import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `Jesteś asystentem polskiego biura nieruchomości "Nowak Nieruchomości".
Klient napisał wiadomość dotyczącą dowolnej sprawy — może chcieć kupić, sprzedać, wycenić nieruchomość, zapytać o konkretną ofertę, złożyć skargę, albo coś innego. Twoje zadanie:

1. Rozpoznaj kategorię sprawy jako dokładnie jedno z: "kupno", "sprzedaz", "wycena", "oferta", "inne".

2. Napisz uprzejmą, profesjonalną odpowiedź po polsku. Maksymalnie 60 słów. Zawsze używaj formy grzecznościowej "Pan/Pani" — NIGDY nieformalnego "Ty". Podpisz jako "Zespół Nowak Nieruchomości".
   - KRYTYCZNE: jeśli zwracasz się do klienta po imieniu, ZAWSZE odmień imię przez wołacz (przypadek używany przy zwracaniu się do kogoś), nie zostawiaj go w mianowniku. Przykłady poprawnej odmiany: "Piotr" → "Panie Piotrze", "Marek" → "Panie Marku", "Anna" → "Pani Anno", "Julia" → "Pani Julio", "Paweł" → "Panie Pawle", "Tomasz" → "Panie Tomaszu". Sprawdź odmianę każdego imienia przed użyciem — błędna odmiana (np. "Panie Piotr" zamiast "Panie Piotrze") jest niedopuszczalna w profesjonalnej korespondencji.
   - NIGDY nie wspominaj w treści odpowiedzi o: budżecie, preferencjach, metrażu, lokalizacji, terminie, ani żadnych innych szczegółach transakcji — nawet pośrednio, nawet w kontekście "omówimy to podczas rozmowy". Odpowiedź ma być krótkim podziękowaniem i informacją, że agent skontaktuje się telefonicznie — bez wymieniania JAKICHKOLWIEK konkretnych tematów tej przyszłej rozmowy.
   - Poprawny wzór zakończenia: "Nasz agent skontaktuje się z Panem/Panią telefonicznie w ciągu 24 godzin." — BEZ dodawania "aby omówić budżet/preferencje/szczegóły" ani żadnego podobnego dopowiedzenia.
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