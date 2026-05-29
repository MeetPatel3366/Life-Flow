import { useState } from "react";
import { Link } from "react-router-dom";
import { HiHeart, HiMail, HiUser, HiChat, HiArrowLeft, HiLocationMarker, HiPhone } from "react-icons/hi";
import contactApi from "../../api/contactApi";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (form.name.trim().length < 3) newErrors.name = "Name must be at least 3 characters";
    if (form.name.trim().length > 100) newErrors.name = "Name cannot exceed 100 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email format";
    if (form.message.trim().length < 10) newErrors.message = "Message must be at least 10 characters";
    if (form.message.trim().length > 2000) newErrors.message = "Message cannot exceed 2000 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await contactApi.submitContact(form);
      toast.success("Message sent successfully!");
      setIsSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

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
            <Link to="/contact" className="text-sm font-medium text-primary-600">Contact</Link>
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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/3" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
              <HiMail className="w-4 h-4" /> Get in Touch
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-surface-900 leading-tight">
              Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">Us</span>
            </h1>
            <p className="text-lg text-surface-500 mt-4">
              Have questions, feedback, or need assistance? We'd love to hear from you. Our team will respond to your message within 24 hours.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
            <div className="lg:col-span-2 space-y-5">
              {[
                {
                  icon: HiMail,
                  title: "Email Us",
                  text: "bestsquad11111@gmail.com",
                  sub: "We reply within 24 hours",
                },
                {
                  icon: HiPhone,
                  title: "Call Us",
                  text: "+91 98765 43210",
                  sub: "Mon - Fri, 9am - 6pm",
                },
                {
                  icon: HiLocationMarker,
                  title: "Visit Us",
                  text: "Ahmedabad, Gujarat",
                  sub: "India",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border border-surface-100 shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                      <item.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 text-sm">{item.title}</h3>
                      <p className="text-surface-700 text-sm mt-0.5">{item.text}</p>
                      <p className="text-surface-400 text-xs mt-1">{item.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-surface-100 p-6 sm:p-8">
                {isSubmitted ? (
                  <div className="text-center py-10 animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                      <HiMail className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 mb-2">Message Sent!</h3>
                    <p className="text-surface-500 max-w-sm mx-auto mb-6">
                      Thank you for reaching out. We've received your message and will get back to you within 24 hours.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => { setIsSubmitted(false); setForm({ name: "", email: "", message: "" }); }} variant="outline">
                        Send Another Message
                      </Button>
                      <Link to="/">
                        <Button variant="primary">
                          <HiArrowLeft className="w-4 h-4" /> Back to Home
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-surface-900">Send us a Message</h2>
                      <p className="text-sm text-surface-500 mt-1">Fill in the form and we'll get back to you</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        id="contact-name"
                        label="Full Name"
                        icon={HiUser}
                        placeholder="John Doe"
                        value={form.name}
                        onChange={set("name")}
                        error={errors.name}
                      />
                      <Input
                        id="contact-email"
                        label="Email Address"
                        type="email"
                        icon={HiMail}
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={set("email")}
                        error={errors.email}
                      />
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-surface-700">Message</label>
                        <div className="relative">
                          <div className="absolute top-3 left-3 pointer-events-none">
                            <HiChat className="h-4 w-4 text-surface-400" />
                          </div>
                          <textarea
                            id="contact-message"
                            rows={5}
                            placeholder="Tell us how we can help you..."
                            value={form.message}
                            onChange={set("message")}
                            className={`w-full rounded-lg border border-surface-300 bg-white pl-9 pr-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200 resize-none ${
                              errors.message ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                            }`}
                          />
                        </div>
                        {errors.message && <p className="text-xs text-red-500 mt-0.5">{errors.message}</p>}
                      </div>
                      <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
                        <HiMail className="w-5 h-5" /> Send Message
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
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
