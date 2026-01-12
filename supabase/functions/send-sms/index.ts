import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSmsRequest {
  phone: string;
  message: string;
  type: "otp" | "appointment_confirmation" | "appointment_reminder" | "appointment_cancelled";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, type }: SendSmsRequest = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "Phone and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format phone number for Sri Lanka (remove spaces, ensure +94 prefix)
    const formattedPhone = formatSriLankanPhone(phone);
    
    // Get SMS API credentials from environment
    const smsApiKey = Deno.env.get("SMS_API_KEY");
    const smsSenderId = Deno.env.get("SMS_SENDER_ID") || "MediCare";

    if (!smsApiKey) {
      console.error("SMS_API_KEY not configured");
      // Log the attempt even if we can't send
      await logSmsAttempt(phone, message, type, "pending_config");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "SMS queued (API key pending configuration)",
          simulated: true 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Using Text.lk API format (popular Sri Lanka SMS provider)
    // API docs: https://www.text.lk/api-documentation
    const smsResponse = await fetch("https://app.text.lk/api/v3/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${smsApiKey}`,
      },
      body: JSON.stringify({
        recipient: formattedPhone,
        sender_id: smsSenderId,
        message: message,
      }),
    });

    const smsResult = await smsResponse.json();
    console.log("SMS API response:", smsResult);

    // Log the SMS attempt
    await logSmsAttempt(phone, message, type, smsResponse.ok ? "sent" : "failed");

    if (!smsResponse.ok) {
      throw new Error(smsResult.message || "Failed to send SMS");
    }

    return new Response(
      JSON.stringify({ success: true, message: "SMS sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function formatSriLankanPhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");
  
  // Handle different formats
  if (cleaned.startsWith("+94")) {
    return cleaned;
  } else if (cleaned.startsWith("94")) {
    return "+" + cleaned;
  } else if (cleaned.startsWith("0")) {
    return "+94" + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return "+94" + cleaned;
  }
  
  return cleaned;
}

async function logSmsAttempt(phone: string, message: string, type: string, status: string) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("sms_logs").insert({
      phone,
      message,
      type,
      status,
    });
  } catch (error) {
    console.error("Failed to log SMS attempt:", error);
  }
}

serve(handler);
