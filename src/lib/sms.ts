import { supabase } from "@/integrations/supabase/client";

type NotificationType = "confirmation" | "reminder" | "cancelled" | "completed";

export async function sendAppointmentNotification(
  appointmentId: string,
  notificationType: NotificationType
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-appointment-notification", {
      body: { appointmentId, notificationType },
    });

    if (error) {
      console.error("Send notification error:", error);
      return { success: false, error: error.message };
    }

    return { success: data?.success || false, error: data?.error };
  } catch (error: any) {
    console.error("Send notification error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendSms(
  phone: string,
  message: string,
  type: "otp" | "appointment_confirmation" | "appointment_reminder" | "appointment_cancelled"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: { phone, message, type },
    });

    if (error) {
      console.error("Send SMS error:", error);
      return { success: false, error: error.message };
    }

    return { success: data?.success || false, error: data?.error };
  } catch (error: any) {
    console.error("Send SMS error:", error);
    return { success: false, error: error.message };
  }
}
