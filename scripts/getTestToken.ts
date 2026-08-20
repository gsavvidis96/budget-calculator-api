import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const testUserEmail = process.env.TEST_USER_EMAIL;

if (!supabaseUrl || !supabaseSecretKey || !testUserEmail) {
  throw new Error(
    "SUPABASE_URL, SUPABASE_SECRET_KEY, and TEST_USER_EMAIL are required",
  );
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);
const { data: linkData, error: linkError } =
  await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: testUserEmail,
  });

if (linkError || !linkData.properties?.email_otp) {
  throw linkError ?? new Error("Supabase did not return an email OTP");
}

const { data: sessionData, error: sessionError } =
  await supabase.auth.verifyOtp({
    email: testUserEmail,
    token: linkData.properties.email_otp,
    type: "email",
  });

if (sessionError || !sessionData.session?.access_token) {
  throw sessionError ?? new Error("Supabase did not return an access token");
}

console.log(sessionData.session.access_token);
