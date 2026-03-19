import { config } from "dotenv";
import { resolve } from "path";

// Load .env from process.cwd() (which should be server folder)
config({ path: resolve(process.cwd(), ".env") });

async function seed() {
  const { supabase, mem } = await import("./supabase.js");

  if (!supabase) {
    console.error("Supabase is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env");
    process.exit(1);
  }

  console.log(`Seeding ${mem.faqs.length} FAQs to Supabase...`);
  let successCount = 0;
  let errorCount = 0;

  for (const faq of mem.faqs) {
    const { id, ...data } = faq;
    
    // Check if FAQ already exists with same question to avoid duplicates
    const { data: existingFAQ } = await supabase.from("faqs").select("id").eq("question", data.question).maybeSingle();
    
    let error;
    if (existingFAQ) {
      const res = await supabase.from("faqs").update(data).eq("id", existingFAQ.id);
      error = res.error;
    } else {
      const res = await supabase.from("faqs").insert(data);
      error = res.error;
    }

    if (error) {
      console.error(`Error with FAQ "${data.question}":`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`Seeding complete. Success: ${successCount}, Errors: ${errorCount}`);
  process.exit(errorCount > 0 ? 1 : 0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
