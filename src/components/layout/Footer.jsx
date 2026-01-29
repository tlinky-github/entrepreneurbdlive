import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Youtube, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();



  return (
    <footer className="bg-stone-900 text-stone-300" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">e</span>
              </div>
              <div>
                <span className="font-bold text-lg text-white">entrepreneurs</span>
                <span className="text-emerald-500 font-bold">.bd</span>
              </div>
            </Link>
            <p className="text-stone-400 mb-6 max-w-sm">
              Bangladesh's leading platform connecting entrepreneurs, startups, and businesses.
              Empowering the next generation of innovators.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-stone-800 hover:bg-emerald-900 rounded-lg flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-stone-800 hover:bg-emerald-900 rounded-lg flex items-center justify-center transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-stone-800 hover:bg-emerald-900 rounded-lg flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-stone-800 hover:bg-emerald-900 rounded-lg flex items-center justify-center transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/knowledge" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Knowledge Hub
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/entrepreneurs" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Entrepreneurs
                </Link>
              </li>
              <li>
                <Link to="/directory" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/resources/guides" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Practical Guides
                </Link>
              </li>
              <li>
                <Link to="/resources/faqs" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/resources/glossary" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Glossary
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/editorial" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Editorial Principles
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-stone-400 hover:text-emerald-500 transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="py-6 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="mailto:hello@entrepreneurs.bd" className="flex items-center gap-2 hover:text-emerald-500 transition-colors">
              <Mail className="w-4 h-4" />
              hello@entrepreneurs.bd
            </a>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Dhaka, Bangladesh
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 border-t border-stone-800 text-center text-sm text-stone-500">
          <p>© {currentYear} entrepreneurs.bd. All rights reserved. Made with ❤️ in Bangladesh</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
