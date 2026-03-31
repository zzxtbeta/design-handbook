import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export type AiProvider =
  | "mock"
  | "openai-compatible"
  | "anthropic"
  | "gemini"
  | "litellm";

export interface AppConfig {
  port: number;
  uploadDir: string;
  databaseUrl: string;
  ai: {
    provider: AiProvider;
    model: string;
    apiKey: string;
    baseUrl: string | null;
    openaiApiKey: string;
    openaiBaseUrl: string | null;
    anthropicApiKey: string;
    anthropicModel: string;
    geminiApiKey: string;
    geminiBaseUrl: string | null;
    geminiModel: string;
    litellmApiKey: string;
    litellmBaseUrl: string | null;
    litellmModel: string;
  };
}

loadEnv();

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 8787),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://handbook:handbook@127.0.0.1:54329/handbook",
  uploadDir: resolveUploadDir(),
  ai: {
    provider: (process.env.AI_PROVIDER ?? "mock") as AiProvider,
    model: process.env.AI_MODEL ?? "gpt-4.1-mini",
    apiKey: process.env.AI_API_KEY ?? "",
    baseUrl: process.env.AI_BASE_URL ?? null,
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    openaiBaseUrl: process.env.OPENAI_BASE_URL ?? null,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-3-7-sonnet-latest",
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    geminiBaseUrl: process.env.GEMINI_BASE_URL ?? null,
    geminiModel:
      process.env.GEMINI_MODEL_NAME ??
      process.env.GEMINI_MODEL ??
      "gemini-2.5-flash",
    litellmApiKey: process.env.LITELLM_API_KEY ?? "",
    litellmBaseUrl: process.env.LITELLM_BASE_URL ?? null,
    litellmModel: process.env.LITELLM_MODEL ?? "gpt-4.1-mini",
  },
};

function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env.local"),
    path.resolve(process.cwd(), "../../.env"),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    dotenv.config({
      path: candidate,
      override: false,
    });
  }
}

function resolveUploadDir() {
  const repoRoot = path.resolve(process.cwd(), "../..");
  const configured = process.env.UPLOAD_DIR;

  if (!configured) {
    return path.resolve(repoRoot, "ARTIFACTS/runtime/uploads");
  }

  if (path.isAbsolute(configured)) {
    return configured;
  }

  return path.resolve(repoRoot, configured);
}
