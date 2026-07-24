// src/logOfferClick.js
// Bank klikini Supabase-ə yazır (data toplama). Sükutla işləyir — xəta olsa app pozulmur.
import { supabase } from "./supaBaseClient";

export async function logOfferClick({ bankKey, bankName, rate, dti, limit }) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return; // yalnız login olmuş istifadəçi
    await supabase.from("offer_clicks").insert({
      user_id: user.id,
      bank_key: bankKey ?? null,
      bank_name: bankName ?? null,
      rate: typeof rate === "number" ? rate : null,
      dti: typeof dti === "number" ? dti : null,
      estimated_limit: typeof limit === "number" ? limit : null,
    });
  } catch (_) {
    // sükutla ötür — data yazıla bilməsə də app işləməyə davam edir
  }
}
