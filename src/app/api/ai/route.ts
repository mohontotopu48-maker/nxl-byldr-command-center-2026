import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/** Hugging Face Inference / router (OpenAI-compatible), same as Python OpenAI(base_url=..., api_key=HF_TOKEN). */
function isHuggingFaceRouterConfigured(): boolean {
  return Boolean(process.env.HF_TOKEN?.trim());
}

function huggingFaceRouterBaseUrl(): string {
  const raw =
    process.env.HF_ROUTER_BASE_URL ||
    "https://router.huggingface.co/v1";
  return raw.replace(/\/$/, "");
}

async function chatViaHuggingFaceRouter(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const apiKey = process.env.HF_TOKEN?.trim();
  if (!apiKey) {
    throw new Error("Missing HF_TOKEN");
  }
  const model =
    process.env.HF_CHAT_MODEL ||
    "moonshotai/Kimi-K2-Instruct-0905";

  const res = await fetch(
    `${huggingFaceRouterBaseUrl()}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Hugging Face router ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (
    data.choices?.[0]?.message?.content ||
    "Sorry, I could not generate a response."
  );
}

function isOpenRouterConfigured(): boolean {
  const key =
    process.env.Z_AI_API_KEY || process.env.OPENROUTER_API_KEY || "";
  const base =
    process.env.Z_AI_BASE_URL ||
    process.env.OPENROUTER_BASE_URL ||
    "";
  return (
    key.startsWith("sk-or-v1-") ||
    base.includes("openrouter.ai")
  );
}

function openRouterBaseUrl(): string {
  const raw =
    process.env.Z_AI_BASE_URL ||
    process.env.OPENROUTER_BASE_URL ||
    "https://openrouter.ai/api/v1";
  return raw.replace(/\/$/, "");
}

async function chatViaOpenRouter(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const apiKey =
    process.env.Z_AI_API_KEY || process.env.OPENROUTER_API_KEY || "";
  if (!apiKey) {
    throw new Error("Missing Z_AI_API_KEY or OPENROUTER_API_KEY");
  }
  const model =
    process.env.Z_AI_MODEL ||
    process.env.OPENROUTER_MODEL ||
    "openai/gpt-4o-mini";
  const referer =
    process.env.OPENROUTER_HTTP_REFERER ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${openRouterBaseUrl()}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": referer,
        "X-Title": "NXL BYLDR Command Center",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (
    data.choices?.[0]?.message?.content ||
    "Sorry, I could not generate a response."
  );
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const systemPrompt = context
      ? `You are an AI assistant for VSUAL NXL BYLDR Command Center. ${context}`
      : `You are an AI assistant for VSUAL NXL BYLDR Command Center — the growth, marketing & AI automation hub for project management, team collaboration, and lead activity tracking. You help users manage projects, teams, customers, and analytics. Be concise, helpful, and professional. Keep responses under 200 words unless asked for detailed analysis.`;

    let response: string;
    if (isHuggingFaceRouterConfigured()) {
      response = await chatViaHuggingFaceRouter(systemPrompt, message);
    } else if (isOpenRouterConfigured()) {
      response = await chatViaOpenRouter(systemPrompt, message);
    } else {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        thinking: { type: "disabled" },
      });
      response =
        completion.choices[0]?.message?.content ||
        "Sorry, I could not generate a response.";
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return NextResponse.json(
      { error: "AI assistant unavailable" },
      { status: 500 },
    );
  }
}
