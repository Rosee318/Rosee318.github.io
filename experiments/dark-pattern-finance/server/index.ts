import { createHandler } from "./handler.mjs";

const env = {
  SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  MOA_STUDY_ID: Deno.env.get("MOA_STUDY_ID"),
  MOA_FORCE_TEST: Deno.env.get("MOA_FORCE_TEST"),
  MOA_ALLOWED_ORIGINS: Deno.env.get("MOA_ALLOWED_ORIGINS"),
  MOA_ALLOW_LOCALHOST_QA: Deno.env.get("MOA_ALLOW_LOCALHOST_QA"),
};

Deno.serve(createHandler({ env }));
