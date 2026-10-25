
import { supabase } from "./supabase.js";

const result = document.getElementById("supabase-test-result");

async function testSupabase() {
  result.textContent = "Connecting to Supabase...";

  try {
    const { data, error } = await supabase
      .from("hostels")
      .select("id, name")
      .limit(5);

    if (error) {
      throw error;
    }

    result.textContent =
      `Connection successful! Read ${data.length} hostel record(s).`;

    console.log("Supabase test successful:", data);
  } catch (error) {
    result.textContent =
      `Connection test failed: ${error.message}`;

    console.error("Supabase test error:", error);
  }
}

testSupabase();
