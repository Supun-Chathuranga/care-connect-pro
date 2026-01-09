import { Link } from "react-router-dom";
import { Stethoscope, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">MediCare</span>
            </div>
            <p className="text-background/70 text-sm">
              Your trusted healthcare partner in Sri Lanka. Book appointments with top doctors easily.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/doctors" className="hover:text-background transition-colors">Find Doctors</Link></li>
              <li><Link to="/specialties" className="hover:text-background transition-colors">Specialties</Link></li>
              <li><Link to="/about" className="hover:text-background transition-colors">About Us</Link></li>
              <li><Link to="/auth" className="hover:text-background transition-colors">Patient Login</Link></li>
            </ul>
          </div>

          {/* For Doctors */}
          <div>
            <h4 className="font-semibold mb-4">For Healthcare</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/auth?mode=signup&role=doctor" className="hover:text-background transition-colors">Doctor Registration</Link></li>
              <li><Link to="/doctor" className="hover:text-background transition-colors">Doctor Dashboard</Link></li>
              <li><Link to="/privacy" className="hover:text-background transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-background transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+94 11 234 5678</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@medicare.lk</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>123 Hospital Road, Colombo 07, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-sm text-background/50">
          <p>© {new Date().getFullYear()} MediCare Sri Lanka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
