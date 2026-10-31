
import { supabase } from "./supabase.js";

async function testSupabaseConnection() {
  const { error } = await supabase
    .from("hostels")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase test failed:", error.message);
    return;
  }

  console.log("Supabase connection successful!");
}

testSupabaseConnection();
