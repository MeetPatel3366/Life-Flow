import { Link } from "react-router-dom";
import { HiHeart, HiSearch, HiUserGroup, HiShieldCheck, HiArrowRight } from "react-icons/hi";
import { BLOOD_GROUPS, BLOOD_GROUP_COLORS } from "../../utils/constants";

export default function HomePage() {
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
            <Link to="/about" className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors">About</Link>
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

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
              <HiHeart className="w-4 h-4" /> Every Drop Counts
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 leading-tight">
              Save Lives with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">Blood Donation</span>
            </h1>
            <p className="text-lg text-surface-500 mt-6 max-w-2xl">
              Life Flow connects blood donors, patients, and hospitals in a seamless digital platform. Find blood availability, schedule donations, and manage requests — all in one place.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-lg shadow-primary-500/25 transition-all">
                Start Donating <HiArrowRight className="w-5 h-5" />
              </Link>
              {/* <Link to="/search-blood" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-surface-700 font-semibold border border-surface-200 hover:bg-surface-50 transition-all">
                <HiSearch className="w-5 h-5" /> Search Blood
              </Link> */}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900">Blood Group Availability</h2>
            <p className="text-surface-500 mt-2">Quick view of all blood types in our system</p>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
            {BLOOD_GROUPS.map((group) => (
              <div key={group} className="flex flex-col items-center p-4 rounded-2xl bg-surface-50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className={`w-14 h-14 rounded-full ${BLOOD_GROUP_COLORS[group]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {group}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-surface-900">How It Works</h2>
            <p className="text-surface-500 mt-2">Simple steps to save a life</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: HiUserGroup, title: "Register", desc: "Create your account as a donor, patient, or hospital and complete your profile." },
              { icon: HiSearch, title: "Find & Connect", desc: "Search for blood availability, request blood, or schedule a donation at a nearby hospital." },
              { icon: HiShieldCheck, title: "Save Lives", desc: "Go through screening, donate blood, and help patients in need. Every drop matters." },
            ].map((step, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-8 shadow-sm border border-surface-100 hover:shadow-xl transition-all duration-300 group">
                <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                  {i + 1}
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mb-5 group-hover:bg-primary-100 transition-colors">
                  <step.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">{step.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
          <p className="text-lg text-white/80 mb-8">Join thousands of donors and hospitals working together to save lives every day.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary-700 font-semibold hover:bg-primary-50 shadow-xl transition-all">
            Join Life Flow Today <HiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-surface-900 py-10">
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
