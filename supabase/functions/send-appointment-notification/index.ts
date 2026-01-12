import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentNotificationRequest {
  appointmentId: string;
  notificationType: "confirmation" | "reminder" | "cancelled" | "completed";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, notificationType }: AppointmentNotificationRequest = await req.json();

    if (!appointmentId || !notificationType) {
      return new Response(
        JSON.stringify({ error: "Appointment ID and notification type are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch appointment with patient and doctor details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        reason,
        patient_id,
        doctor_id
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error("Appointment not found");
    }

    // Get patient profile
    const { data: patientProfile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", appointment.patient_id)
      .single();

    // Get doctor profile and details
    const { data: doctor } = await supabase
      .from("doctors")
      .select("user_id, specialty")
      .eq("id", appointment.doctor_id)
      .single();

    let doctorProfile = null;
    if (doctor) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", doctor.user_id)
        .single();
      doctorProfile = profile;
    }

    if (!patientProfile?.phone) {
      throw new Error("Patient phone number not found");
    }

    // Format date for display
    const appointmentDate = new Date(appointment.appointment_date);
    const formattedDate = appointmentDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Generate message based on notification type
    const message = generateMessage(
      notificationType,
      patientProfile.full_name,
      doctorProfile?.full_name || "Doctor",
      formattedDate,
      appointment.appointment_time
    );

    // Send SMS
    const smsApiKey = Deno.env.get("SMS_API_KEY");
    const smsSenderId = Deno.env.get("SMS_SENDER_ID") || "MediCare";
    const formattedPhone = formatSriLankanPhone(patientProfile.phone);

    let smsStatus = "pending_config";

    if (smsApiKey) {
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

      smsStatus = smsResponse.ok ? "sent" : "failed";
      console.log(`Appointment notification SMS ${smsStatus}:`, await smsResponse.json());
    } else {
      console.log(`[DEV MODE] Would send to ${formattedPhone}: ${message}`);
    }

    // Log the SMS
    await supabase.from("sms_logs").insert({
      phone: patientProfile.phone,
      message: message,
      type: `appointment_${notificationType}`,
      status: smsStatus,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${notificationType} notification sent`,
        status: smsStatus,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function generateMessage(
  type: "confirmation" | "reminder" | "cancelled" | "completed",
  patientName: string,
  doctorName: string,
  date: string,
  time: string
): string {
  const messages = {
    confirmation: `Dear ${patientName}, your appointment with Dr. ${doctorName} on ${date} at ${time} has been confirmed. - MediCare`,
    reminder: `Reminder: ${patientName}, you have an appointment with Dr. ${doctorName} tomorrow (${date}) at ${time}. Please arrive 10 mins early. - MediCare`,
    cancelled: `Dear ${patientName}, your appointment with Dr. ${doctorName} on ${date} at ${time} has been cancelled. Please rebook if needed. - MediCare`,
    completed: `Thank you ${patientName} for visiting Dr. ${doctorName}. We hope you had a good experience. See you again! - MediCare`,
  };

  return messages[type];
}

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
