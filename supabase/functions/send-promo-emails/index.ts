
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://wzymfxmvlbvqoxgnuckr.supabase.co";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // For security, only process POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "This endpoint only accepts POST requests" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Get pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("user_emails")
      .select("*")
      .eq("status", "pending")
      .lt("retries", 3) // Only get emails with less than 3 retry attempts
      .order("sent_at", { ascending: true })
      .limit(10); // Process in batches

    if (fetchError) {
      throw new Error(`Error fetching pending emails: ${fetchError.message}`);
    }

    // No emails to process
    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending emails to process" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process each email
    const results = [];
    for (const email of pendingEmails) {
      // In a real implementation, you would connect to an email service here
      // For now, we'll just simulate sending
      console.log(`Sending email to ${email.email_address}: ${email.subject}`);
      
      // Simulate sending the email
      const success = Math.random() > 0.2; // 80% success rate for simulation
      
      if (success) {
        // Update the status to 'sent'
        const { error: updateError } = await supabase
          .from("user_emails")
          .update({ status: "sent" })
          .eq("id", email.id);
          
        if (updateError) {
          console.error(`Error updating email status: ${updateError.message}`);
          results.push({ id: email.id, status: "error", message: updateError.message });
          continue;
        }
        
        results.push({ id: email.id, status: "sent" });
      } else {
        // Increment the retry counter
        const { error: retryError } = await supabase
          .from("user_emails")
          .update({ retries: email.retries + 1 })
          .eq("id", email.id);
          
        if (retryError) {
          console.error(`Error updating retry count: ${retryError.message}`);
        }
        
        results.push({ id: email.id, status: "failed", willRetry: email.retries < 2 });
      }
    }

    // Return the results
    return new Response(
      JSON.stringify({
        message: `Processed ${pendingEmails.length} emails`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in send-promo-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
