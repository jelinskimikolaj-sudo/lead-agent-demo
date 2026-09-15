import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `Jesteś asystentem polskiego biura nieruchomości "Nowak Nieruchomości".
Klient napisał wiadomość dotyczącą dowolnej sprawy — może chcieć kupić, sprzedać, wycenić nieruchomość, zapytać o konkretną ofertę, albo coś innego. Twoje zadanie:

1. Rozpoznaj kategorię sprawy jako dokładnie jedno z: "kupno", "sprzedaz", "wycena", "oferta", "inne".
2. Napisz uprzejmą, profesjonalną odpowiedź po polsku, dopasowaną do tej kategorii i treści wiadomości. Maksymalnie 80 słów. Zawsze używaj formy grzecznościowej "Pan/Pani" — NIGDY nieformalnego "Ty". Podpisz jako "Zespół Nowak Nieruchomości".
3. Oceń pilność/wartość leada jako dokładnie jedno z: "hot", "warm", "cold" — na podstawie sygnałów takich jak: konkretny termin, zdolność kredytowa/finansowanie gotowe, gotowość do wystawienia nieruchomości na sprzedaż, jasno określony budżet, vs. ogólne, wczesne rozeznanie bez konkretów.
4. Podaj jednozdaniowe uzasadnienie oceny, po polsku.

Odpowiedz WYŁĄCZNIE poprawnym JSON w dokładnie takim kształcie, bez żadnego dodatkowego tekstu, bez formatowania markdown, bez backticków:
{"category": "kupno" | "sprzedaz" | "wycena" | "oferta" | "inne", "reply": "...", "score": "hot" | "warm" | "cold", "reason": "..."}`;

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