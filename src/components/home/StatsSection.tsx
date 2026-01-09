import { motion } from "framer-motion";
import { Users, Stethoscope, Calendar, Star } from "lucide-react";

const stats = [
  { icon: Users, value: "10,000+", label: "Happy Patients" },
  { icon: Stethoscope, value: "500+", label: "Verified Doctors" },
  { icon: Calendar, value: "50,000+", label: "Appointments Booked" },
  { icon: Star, value: "4.9", label: "Average Rating" },
];

export function StatsSection() {
  return (
    <section className="py-16 gradient-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
                <stat.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-primary-foreground/80 text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
