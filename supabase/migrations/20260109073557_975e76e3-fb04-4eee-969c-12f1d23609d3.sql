-- Fix overly permissive RLS policies

-- Drop and recreate sms_logs insert policy with proper check
DROP POLICY IF EXISTS "System can insert sms logs" ON public.sms_logs;
CREATE POLICY "Authenticated users can insert sms logs" ON public.sms_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'));

-- Drop and recreate otp_verifications policies with proper restrictions
DROP POLICY IF EXISTS "Anyone can insert otp" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can view own otp by phone" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can update otp" ON public.otp_verifications;

-- OTP should be accessible without auth for phone verification during signup
CREATE POLICY "Public can insert otp for verification" ON public.otp_verifications 
  FOR INSERT 
  WITH CHECK (expires_at > NOW());

CREATE POLICY "Public can select otp for verification" ON public.otp_verifications 
  FOR SELECT 
  USING (expires_at > NOW() AND verified = false);

CREATE POLICY "Public can update otp verification status" ON public.otp_verifications 
  FOR UPDATE 
  USING (expires_at > NOW() AND verified = false);