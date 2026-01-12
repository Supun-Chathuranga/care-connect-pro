import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { usePhoneOtp } from "@/hooks/usePhoneOtp";
import { toast } from "sonner";
import { Stethoscope, Mail, Lock, User, Phone, ArrowLeft, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type UserRole = "patient" | "doctor";
type AuthMethod = "email" | "phone";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [loading, setLoading] = useState(false);
  
  // Email auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Common state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  
  // OTP state
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  const { signIn, signUp, user } = useAuth();
  const { sendOtp, verifyOtp, loading: otpLoading, otpSent, setOtpSent } = usePhoneOtp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Reset OTP state when switching methods
  useEffect(() => {
    setOtpSent(false);
    setOtp("");
    setDevOtp(null);
  }, [authMethod, isLogin, setOtpSent]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || "Failed to sign in");
        } else {
          toast.success("Welcome back!");
          navigate("/");
        }
      } else {
        if (!fullName || !phone) {
          toast.error("Please fill in all fields");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, phone, role);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in.");
          } else {
            toast.error(error.message || "Failed to create account");
          }
        } else {
          toast.success("Account created successfully!");
          navigate("/");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    const result = await sendOtp(phone);
    if (result.devOtp) {
      setDevOtp(result.devOtp);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    // Verify OTP
    const result = await verifyOtp(phone, otp);
    
    if (result.success) {
      if (result.userExists && result.userId) {
        // User exists - sign them in with a magic link or show success
        toast.success("Phone verified! Please complete sign in with your email.");
        setAuthMethod("email");
      } else if (!isLogin) {
        // New user registration - need email/password
        toast.success("Phone verified! Please complete registration.");
        setAuthMethod("email");
      } else {
        toast.error("No account found with this phone number. Please sign up first.");
        setIsLogin(false);
      }
    }
  };

  const isLoading = loading || otpLoading;

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl text-foreground">MediCare</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isLogin
              ? "Sign in to manage your appointments"
              : "Join MediCare to book appointments"}
          </p>

          {/* Auth Method Tabs */}
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as AuthMethod)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Phone OTP
              </TabsTrigger>
            </TabsList>

            {/* Email Auth */}
            <TabsContent value="email">
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+94 7X XXX XXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">I am a</Label>
                      <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patient">Patient</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            {/* Phone OTP Auth */}
            <TabsContent value="phone">
              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phoneOtp">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phoneOtp"
                      type="tel"
                      placeholder="+94 7X XXX XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      disabled={otpSent}
                      required
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-3">
                    <Label>Enter 6-digit OTP</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    
                    {devOtp && (
                      <p className="text-xs text-center text-muted-foreground bg-muted p-2 rounded">
                        Dev Mode OTP: <span className="font-mono font-bold">{devOtp}</span>
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setDevOtp(null);
                      }}
                    >
                      Change phone number
                    </Button>
                  </div>
                )}

                {!isLogin && otpSent && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullNameOtp">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="fullNameOtp"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roleOtp">I am a</Label>
                      <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patient">Patient</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading 
                    ? "Please wait..." 
                    : otpSent 
                      ? "Verify OTP" 
                      : "Send OTP"}
                </Button>

                {otpSent && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </Button>
                )}
              </form>
            </TabsContent>
          </Tabs>

          {/* Toggle */}
          <p className="text-center text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
