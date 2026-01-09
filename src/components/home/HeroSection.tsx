import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  const features = [
    { icon: Calendar, label: "Easy Booking" },
    { icon: Shield, label: "Verified Doctors" },
    { icon: Clock, label: "24/7 Support" },
  ];

  return (
    <section className="relative min-h-screen hero-gradient overflow-hidden pt-16">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Trusted by 10,000+ Patients in Sri Lanka
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              Your Health,{" "}
              <span className="gradient-text">Our Priority</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Find and book appointments with the best doctors in Sri Lanka. 
              Get SMS notifications for your appointments and manage your healthcare journey seamlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="xl"
                variant="hero"
                onClick={() => navigate("/doctors")}
                className="group"
              >
                <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Find a Doctor
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={() => navigate("/auth?mode=signup")}
              >
                Book Appointment
              </Button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-4 pt-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-soft"
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="glass-card rounded-3xl p-8 shadow-elevated">
                <div className="aspect-square rounded-2xl gradient-primary flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                      <Search className="w-16 h-16" />
                    </div>
                    <p className="text-xl font-semibold">Find Your Doctor</p>
                    <p className="text-sm opacity-80 mt-2">Browse 500+ verified doctors</p>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 glass-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Appointment Confirmed</p>
                    <p className="text-xs text-muted-foreground">Dr. Silva - Tomorrow 10:00 AM</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 glass-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">SMS Notification</p>
                    <p className="text-xs text-muted-foreground">Instant booking confirmations</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
