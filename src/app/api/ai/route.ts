import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { checkRequestAuth } from "@/lib/auth-guard";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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
  messages: Array<{ role: string; content: string }>,
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
          ...messages,
        ],
        max_tokens: 500,
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
  messages: Array<{ role: string; content: string }>,
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
    "";

  const res = await fetch(
    `${openRouterBaseUrl()}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(referer ? { "HTTP-Referer": referer } : {}),
        "X-Title": "NXL BYLDR Command Center",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
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
  // Rate limit AI calls to prevent unbounded API costs
  const ip = getClientIp(request)
  const rl = rateLimit(`ai-chat:${ip}`, { limit: 20, windowMs: 60000 })
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many AI requests. Please wait a moment.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
    })
  }

  // Auth check (async — verifies JWT signature)
  const auth = await checkRequestAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const { message, context, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Input length limit
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long. Maximum 2000 characters." },
        { status: 400 },
      );
    }

    // Sanitize context — only allow structured object with known keys (NO free-text injection into system prompt)
    let safeContext = '';
    if (context) {
      if (typeof context === 'object' && context !== null && !Array.isArray(context)) {
        const ALLOWED_KEYS = ['journeyId', 'leadId', 'stage', 'view', 'customerName', 'projectName'];
        const entries = Object.entries(context as Record<string, unknown>);
        const filtered = entries.filter(([key, val]) => ALLOWED_KEYS.includes(key) && typeof val === 'string');
        if (filtered.length > 0) {
          safeContext = ' Context: ' + JSON.stringify(Object.fromEntries(filtered));
        }
      }
    }

    const systemPrompt = `You are an AI assistant for VSUAL NXL BYLDR Command Center — the growth, marketing & AI automation hub for project management, team collaboration, and lead activity tracking. You help users manage projects, teams, customers, and analytics. Be concise, helpful, and professional. Keep responses under 200 words unless asked for detailed analysis.${safeContext}`;

    // Build message history (last 8 turns max to control token usage)
    const userMessages: Array<{ role: string; content: string }> = []
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-8)
      for (const msg of recentHistory) {
        if (msg && typeof msg.role === 'string' && typeof msg.content === 'string' && msg.content.length <= 2000) {
          userMessages.push({ role: msg.role, content: msg.content })
        }
      }
    }
    userMessages.push({ role: 'user', content: message })

    let response: string;
    if (isHuggingFaceRouterConfigured()) {
      response = await chatViaHuggingFaceRouter(systemPrompt, userMessages);
    } else if (isOpenRouterConfigured()) {
      response = await chatViaOpenRouter(systemPrompt, userMessages);
    } else {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system" as const, content: systemPrompt },
          ...userMessages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
        ],
        thinking: { type: "disabled" },
        max_tokens: 500,
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
