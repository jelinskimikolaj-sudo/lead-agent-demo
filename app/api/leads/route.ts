import { NextRequest, NextResponse } from "next/server";

type Lead = {
  id: string;
  name: string;
  contact: string;
  message: string;
  score: string;
  reason: string;
  reply: string;
  category: string;
  time: string;
  done: boolean;
};

declare global {
  var leadsStore: Lead[] | undefined;
}

if (!global.leadsStore) {
  global.leadsStore = [];
}

export async function GET() {
  return NextResponse.json(global.leadsStore);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newLead: Lead = {
    id: crypto.randomUUID(),
    name: body.name,
    contact: body.contact,
    message: body.message,
    score: body.score,
    reason: body.reason,
    reply: body.reply,
    category: body.category,
    time: new Date().toLocaleString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }),
    done: false,
  };
  global.leadsStore!.unshift(newLead);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const lead = global.leadsStore!.find((l) => l.id === body.id);
  if (lead) {
    lead.done = body.done;
  }
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  global.leadsStore = [];
  return NextResponse.json({ success: true });
}