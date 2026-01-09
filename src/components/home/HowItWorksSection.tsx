import { motion } from "framer-motion";
import { Search, CalendarCheck, Bell, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search Doctor",
    description: "Browse our verified list of doctors by specialty, location, or availability.",
  },
  {
    icon: CalendarCheck,
    title: "Book Appointment",
    description: "Select a convenient time slot from the doctor's available schedule.",
  },
  {
    icon: Bell,
    title: "Get SMS Notification",
    description: "Receive instant SMS confirmation and reminders for your appointment.",
  },
  {
    icon: CheckCircle,
    title: "Visit Doctor",
    description: "Visit the doctor at your scheduled time and receive quality healthcare.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Book your doctor's appointment in four simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20" />
              )}

              <div className="relative z-10 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl gradient-primary flex items-center justify-center shadow-lg">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 md:right-auto md:left-1/2 md:-translate-x-1/2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
