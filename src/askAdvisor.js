// src/askAdvisor.js
// Advisor Edge Function-a sorğu göndərir. API açarı SERVERDƏDİR — burada yoxdur.
import { supabase } from "./supaBaseClient";

const FUNCTION_URL =
  "https://lvhyuptrctwkpsevwutt.supabase.co/functions/v1/advisor";

/**
 * @param {Array<{role:'user'|'assistant', content:string}>} messages  söhbət tarixçəsi
 * @param {object|null} context  maliyyə konteksti (gəlir, borc, dti, limit)
 * @returns {Promise<string>} AI cavabı
 */
export async function askAdvisor(messages, context = null) {
  // login olmuş istifadəçinin tokeni (JWT qoruması üçün)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, context }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Köməkçi cavab vermədi.");
  return data.reply;
}
