import { Link } from "react-router-dom";
import { ExternalLink, Radio, MapPin, Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground border-t-4 border-accent mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-primary-foreground/15">
          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <Link to="/feed" className="font-display text-2xl font-bold tracking-tight inline-block mb-3">
              Amaica <span className="text-accent">MEDIA</span>
            </Link>
            <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-md mb-4">
              The premier digital newsroom and entertainment authority for Western Kenya and national showbiz. We champion authentic storytelling across Kakamega, Kisumu, Bungoma, Busia, Vihiga, Siaya, Nairobi, and the Lake Region.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-accent">
              <span className="flex items-center gap-1"><MapPin size={13} /> Western Kenya Bureau</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Radio size={13} /> Live Entertainment Desk</span>
            </div>
          </div>

          {/* Sections */}
          <div>
            <h3 className="font-display text-sm tracking-wider uppercase text-accent mb-3 font-semibold">
              Sections
            </h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/category/music" className="hover:text-accent transition">Music & Benga</Link></li>
              <li><Link to="/category/events" className="hover:text-accent transition">Concerts & Events</Link></li>
              <li><Link to="/category/film" className="hover:text-accent transition">Film & TV</Link></li>
              <li><Link to="/category/celebrity" className="hover:text-accent transition">Celebrity & Culture</Link></li>
              <li><Link to="/legends/today" className="hover:text-accent transition">Kenyan Legends</Link></li>
            </ul>
          </div>

          {/* Connect & Bureaus */}
          <div>
            <h3 className="font-display text-sm tracking-wider uppercase text-accent mb-3 font-semibold">
              Regional Desks
            </h3>
            <div className="text-xs text-primary-foreground/70 space-y-2 mb-4">
              <p><strong className="text-primary-foreground/90">Kisumu:</strong> Lake Basin & Nyanza Arts Desk</p>
              <p><strong className="text-primary-foreground/90">Kakamega:</strong> Western Hub & Cultural Desk</p>
              <p><strong className="text-primary-foreground/90">Nairobi:</strong> National Showbiz & Syndication</p>
            </div>
            <div className="pt-2">
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs bg-accent text-accent-foreground font-semibold px-3 py-1.5 rounded hover:bg-accent/90 transition"
              >
                Join WhatsApp Channel <Send size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-primary-foreground/60 gap-4">
          <p>&copy; {new Date().getFullYear()} Amaica Media (amaicamedia.com). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/newsroom" className="hover:text-accent transition">Newsroom Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
