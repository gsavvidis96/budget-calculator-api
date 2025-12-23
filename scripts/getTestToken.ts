import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

const { data } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email: process.env.TEST_USER_EMAIL!,
});

const { data: sessionData } = await supabase.auth.verifyOtp({
  email: process.env.TEST_USER_EMAIL!,
  token: data!.properties!.email_otp,
  type: "email",
});

console.log("JWT TOKEN");
console.log(sessionData.session?.access_token);
