import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  phone: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone }: SendOtpRequest = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // OTP expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        phone,
        otp_code: otpCode,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw new Error("Failed to generate OTP");
    }

    // Send SMS with OTP
    const smsApiKey = Deno.env.get("SMS_API_KEY");
    const smsSenderId = Deno.env.get("SMS_SENDER_ID") || "MediCare";
    const message = `Your MediCare verification code is: ${otpCode}. Valid for 5 minutes. Do not share this code.`;

    if (smsApiKey) {
      // Format phone for Sri Lanka
      const formattedPhone = formatSriLankanPhone(phone);
      
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
      console.log("OTP SMS sent:", smsResult);

      // Log the SMS
      await supabase.from("sms_logs").insert({
        phone,
        message: `OTP sent: ${otpCode.substring(0, 3)}***`,
        type: "otp",
        status: smsResponse.ok ? "sent" : "failed",
      });
    } else {
      console.log(`[DEV MODE] OTP for ${phone}: ${otpCode}`);
      // Log as pending config
      await supabase.from("sms_logs").insert({
        phone,
        message: `OTP generated (SMS pending config)`,
        type: "otp",
        status: "pending_config",
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        // Only include OTP in dev mode when no API key configured
        ...(smsApiKey ? {} : { devOtp: otpCode })
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function formatSriLankanPhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  
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

serve(handler);
