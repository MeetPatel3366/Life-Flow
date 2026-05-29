import { Link } from "react-router-dom";
import { HiHeart, HiCheckCircle, HiUserGroup, HiShieldCheck } from "react-icons/hi";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-surface-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <HiHeart className="w-7 h-7 text-primary-600" />
            <span className="text-xl font-bold text-surface-900">Life Flow</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors">Home</Link>
            <Link to="/about" className="text-sm font-medium text-primary-600 transition-colors">About</Link>
            {/* <Link to="/search-blood" className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors">Search Blood</Link> */}
            <Link to="/contact" className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">Login</Link>
            <Link to="/register" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-20 pb-20">
        <div className="absolute inset-0 bg-primary-50/50" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-surface-900 tracking-tight">About <span className="text-primary-600">Life Flow</span></h1>
          <p className="mt-6 text-xl text-surface-600 leading-relaxed">
            We are on a mission to bridge the gap between blood donors, patients in need, and medical institutions. Our platform ensures that finding and donating blood is fast, secure, and reliable.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-surface-900 mb-6">Our Vision</h2>
              <p className="text-lg text-surface-600 mb-4">
                Millions of lives are lost every year because of a shortage of blood during emergencies. We visualized a world where blood is always available at the right time.
              </p>
              <p className="text-lg text-surface-600">
                Life Flow is a streamlined, technological solution that centralizes blood stock availability, transparently processes donor screenings, and ensures inter-hospital blood transfers happen without delay.
              </p>
            </div>
            <div className="bg-surface-50 p-8 rounded-2xl border border-surface-100">
              <h3 className="text-xl font-bold text-surface-900 mb-4">Why Life Flow?</h3>
              <ul className="space-y-4">
                {[
                  { icon: HiCheckCircle, title: "Real-time Inventory", desc: "Live tracking of blood stocks across all partnered hospitals." },
                  { icon: HiUserGroup, title: "Community Driven", desc: "Encouraging regular voluntary donations through a seamless scheduling system." },
                  { icon: HiShieldCheck, title: "100% Secure", desc: "Patient data and screening results are kept strictly confidential." }
                ].map((feature, i) => (
                  <li key={i} className="flex gap-4">
                    <feature.icon className="w-6 h-6 text-primary-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-surface-900">{feature.title}</h4>
                      <p className="text-sm text-surface-500">{feature.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="bg-surface-900 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HiHeart className="w-5 h-5 text-primary-400" />
            <span className="text-white font-semibold">Life Flow</span>
          </div>
          <p className="text-sm text-surface-400">&copy; {new Date().getFullYear()} Life Flow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
