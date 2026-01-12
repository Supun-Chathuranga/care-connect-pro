import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UsePhoneOtpReturn {
  sendOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ 
    success: boolean; 
    userExists: boolean; 
    userId: string | null;
  }>;
  loading: boolean;
  otpSent: boolean;
  setOtpSent: (sent: boolean) => void;
}

export function usePhoneOtp(): UsePhoneOtpReturn {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = async (phone: string): Promise<{ success: boolean; devOtp?: string }> => {
    if (!phone) {
      toast.error("Please enter a phone number");
      return { success: false };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone },
      });

      if (error) {
        console.error("Send OTP error:", error);
        toast.error("Failed to send OTP. Please try again.");
        return { success: false };
      }

      if (data?.success) {
        toast.success("OTP sent to your phone!");
        setOtpSent(true);
        return { success: true, devOtp: data.devOtp };
      } else {
        toast.error(data?.error || "Failed to send OTP");
        return { success: false };
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast.error("Failed to send OTP. Please try again.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (
    phone: string, 
    otp: string
  ): Promise<{ success: boolean; userExists: boolean; userId: string | null }> => {
    if (!phone || !otp) {
      toast.error("Please enter the OTP");
      return { success: false, userExists: false, userId: null };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone, otp },
      });

      if (error) {
        console.error("Verify OTP error:", error);
        toast.error("Failed to verify OTP. Please try again.");
        return { success: false, userExists: false, userId: null };
      }

      if (data?.success && data?.verified) {
        toast.success("Phone verified successfully!");
        return { 
          success: true, 
          userExists: data.userExists, 
          userId: data.userId 
        };
      } else {
        toast.error(data?.error || "Invalid OTP");
        return { success: false, userExists: false, userId: null };
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error("Failed to verify OTP. Please try again.");
      return { success: false, userExists: false, userId: null };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendOtp,
    verifyOtp,
    loading,
    otpSent,
    setOtpSent,
  };
}
