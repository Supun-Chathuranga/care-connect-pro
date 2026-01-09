import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Stethoscope, Heart, Sparkles, Bone, Baby, Brain, 
  Eye, Smile, Ear, Activity 
} from "lucide-react";
import { SPECIALTIES } from "@/lib/constants";

const iconMap: Record<string, any> = {
  Stethoscope,
  Heart,
  Sparkles,
  Bone,
  Baby,
  Brain,
  Eye,
  Smile,
  Ear,
  Activity,
};

export function SpecialtiesSection() {
  const navigate = useNavigate();

  const specialtyList = Object.entries(SPECIALTIES).slice(0, 8);

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Browse by Specialty
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find doctors by their area of expertise. We have specialists for every health concern.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {specialtyList.map(([key, value], index) => {
            const Icon = iconMap[value.icon] || Stethoscope;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/doctors?specialty=${key}`)}
                className="group cursor-pointer"
              >
                <div className="bg-card rounded-2xl p-6 shadow-soft card-hover border border-border/50 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {value.label}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button
            onClick={() => navigate("/specialties")}
            className="text-primary font-semibold hover:underline"
          >
            View All Specialties →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
