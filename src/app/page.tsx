"use client";

import Link from "next/link";
import { 
  ShoppingBag, 
  ArrowRight, 
  Check, 
  CreditCard, 
  Globe, 
  Smartphone, 
  Zap, 
  Shield, 
  Rocket, 
  ChevronDown,
  Lock,
  Store,
  Wrench,
  Package,
  BarChart3,
  Server,
  LayoutDashboard,
  ExternalLink,
  Mail,
  Twitter,
  Instagram,
  X,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase-client";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    { icon: Store, title: "Professional Storefront", desc: "Beautiful responsive online stores ready to sell." },
    { icon: CreditCard, title: "Direct Razorpay Integration", desc: "Connect your own Razorpay account. Payments go directly to you." },
    { icon: Wrench, title: "No Coding Required", desc: "No technical knowledge needed. Set up in minutes." },
    { icon: Smartphone, title: "Mobile Friendly", desc: "Manage everything from your phone." },
    { icon: Zap, title: "Fast Setup", desc: "Go from signup to selling within minutes." },
    { icon: Shield, title: "Secure Platform", desc: "Your payments stay under your control." },
  ];

  const steps = [
    { num: "01", title: "Create Your Store", desc: "Pick a store name and your online store is instantly created." },
    { num: "02", title: "Connect Razorpay", desc: "Enter your Razorpay API Keys once. Every payment goes directly into your own Razorpay account." },
    { num: "03", title: "Start Selling", desc: "Add products, share your store link and start receiving orders." },
  ];

  const trustPoints = [
    { icon: Store, title: "Your Online Store", desc: "A professional storefront for your business." },
    { icon: Package, title: "Product Management", desc: "Add, edit and organize your products easily." },
    { icon: LayoutDashboard, title: "Order Management", desc: "Track and manage all your orders in one place." },
    { icon: Server, title: "Website Hosting", desc: "Free hosting with SSL included." },
    { icon: BarChart3, title: "Store Dashboard", desc: "Analytics and insights for your business." },
  ];

  const faqs = [
    { q: "Does Hookit hold my money?", a: "No. Payments go directly to your connected Razorpay account. We never store, hold, or delay your payments." },
    { q: "Can I use my own Razorpay account?", a: "Yes. Every store connects its own Razorpay account. You have full control over your payments." },
    { q: "Do I need coding knowledge?", a: "No. Hookit is designed for everyone. No technical knowledge required." },
    { q: "Can I use my own domain?", a: "Yes, with the Growth plan. Connect your custom domain for a branded experience." },
    { q: "Can I cancel anytime?", a: "Yes. There are no long-term contracts. Cancel whenever you want." },
  ];

  const testimonials = [
    { name: "Ananya Sharma", store: "Luna Jewelry", text: "I launched my jewelry store in literally 3 minutes. The Razorpay integration is seamless!" },
    { name: "Rahul Verma", store: "Hikari Crafts", text: "Finally a platform that doesn't hold my money. Payments go straight to my account." },
    { name: "Priya Patel", store: "Minimal Ware", text: "The dashboard is so clean. I manage everything from my phone while traveling." },
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <ShoppingBag className="w-7 h-7 text-black" />
              <span className="text-2xl font-bold tracking-tight">hookit</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">How It Works</a>
              <a href="#features" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Pricing</a>
              <a href="#faq" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-5 h-9 text-sm font-medium">
                    View Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors hidden sm:block">
                    Log in
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-5 h-9 text-sm font-medium">
                      Create Your Store
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div className="space-y-8" {...fadeInUp}>
              <h1 className="text-5xl sm:text-6xl font-bold leading-[1.05] tracking-tight">
                Launch your<br />online store<br />in minutes.
              </h1>
              <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
                Create your own online store, connect your Razorpay account, and start accepting payments directly into your own bank account.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/signup">
                  <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-8 h-12 text-base font-medium">
                    Create Your Store
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                {!user && (
                  <Link href="/login" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors group border border-gray-200 rounded-full px-6 h-12">
                    Login
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-black" /> Free to start
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-black" /> No credit card
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-black" /> Direct payments
                </div>
              </div>
            </motion.div>

            {/* Store Preview */}
            <motion.div className="relative" {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="absolute -inset-4 bg-gray-100 rounded-3xl rotate-2" />
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 text-center">
                      lunajewelry.hookit.online
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-black rounded-full" />
                      <span className="text-sm font-semibold">Luna Jewelry</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>Shop</span><span>About</span><span>Cart (0)</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 mb-5 relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-1">Timeless pieces</h3>
                      <p className="text-xs text-gray-500 mb-3">Minimal jewelry. Maximum impact.</p>
                      <span className="inline-block bg-black text-white text-xs px-4 py-1.5 rounded-full">Shop Collection</span>
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full opacity-50" />
                  </div>
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-400">Featured Collection</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg aspect-square flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white/60" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Marquee */}
      <div className="py-6 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex gap-12">
              {["lunajewelry.hookit.online", "hikari.hookit.online", "craftsbyanu.hookit.online", "minimalware.hookit.online", "thebakehouse.hookit.online", "artisanfinds.hookit.online"].map((store) => (
                <span key={`${setIdx}-${store}`} className="text-sm text-gray-400 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" /> {store}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">How It Works</span>
            <h2 className="text-4xl font-bold mt-4">Three simple steps</h2>
            <p className="text-gray-500 mt-4 text-lg">Launch in under 5 minutes.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={step.num} className="relative" {...fadeInUp} transition={{ delay: i * 0.1 }}>
                <div className="bg-white rounded-2xl p-8 border border-gray-100 h-full hover:shadow-lg transition-shadow">
                  <span className="text-4xl font-bold text-gray-200">{step.num}</span>
                  <h3 className="text-xl font-semibold mt-4 mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp}>
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Your Money, Your Control</span>
              <h2 className="text-4xl font-bold mt-4 mb-6">You always receive<br />your money directly.</h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Hookit never stores, holds or delays your payments. Customers pay directly through your connected Razorpay account.
              </p>
              <div className="space-y-4">
                {[
                  "Payments go straight to your Razorpay account",
                  "We never touch or hold customer funds",
                  "Full transparency on every transaction"
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div className="grid grid-cols-2 gap-4" {...fadeInUp} transition={{ delay: 0.2 }}>
              {trustPoints.map((point) => (
                <div key={point.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
                  <point.icon className="w-5 h-5 mb-3 text-black" />
                  <h4 className="text-sm font-semibold mb-1">{point.title}</h4>
                  <p className="text-xs text-gray-500">{point.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Why Choose Hookit</span>
            <h2 className="text-4xl font-bold mt-4">Everything you need<br />to sell online</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={feature.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group" {...fadeInUp} transition={{ delay: i * 0.1 }}>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-black group-hover:text-white transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Testimonials</span>
            <h2 className="text-4xl font-bold mt-4">Loved by creators</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100" {...fadeInUp} transition={{ delay: i * 0.1 }}>
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.store}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Pricing</span>
            <h2 className="text-4xl font-bold mt-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 mt-4 text-lg">Start free. Upgrade when you grow.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <motion.div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow" {...fadeInUp}>
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Starter</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold">₹0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Perfect for beginners</p>
              </div>
              <div className="mb-6 py-3 px-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">3% commission per sale</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["Professional Online Store", "Unlimited Products", "Dashboard & Analytics", "Connect Your Razorpay", "Direct Payments To Bank", "Mobile Responsive", "Free Hosting & SSL"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-black shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button className="w-full bg-black text-white hover:bg-gray-900 rounded-full h-11 text-sm font-medium">
                  Start Free
                </Button>
              </Link>
            </motion.div>

            {/* Growth */}
            <motion.div className="bg-black rounded-2xl p-8 border border-black relative hover:shadow-xl transition-shadow" {...fadeInUp} transition={{ delay: 0.1 }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-white text-black text-xs font-semibold px-3 py-1 rounded-full border border-gray-200">Most Popular</span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">Growth</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold text-white">₹999</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Best for growing businesses</p>
              </div>
              <div className="mb-6 py-3 px-4 bg-gray-900 rounded-lg">
                <p className="text-sm font-medium text-white">0% Platform Commission</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["Everything in Starter", "0% Platform Commission", "Priority Support"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-white shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button className="w-full bg-white text-black hover:bg-gray-100 rounded-full h-11 text-sm font-medium">
                  Upgrade To Growth
                </Button>
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div className="bg-white rounded-2xl p-8 border border-gray-200 relative opacity-70" {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="absolute top-4 right-4">
                <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">Coming Soon</span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Pro</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold">₹4,999</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">One-time setup fee</p>
              </div>
              <div className="mb-6 py-3 px-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">₹99/month maintenance</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["Everything in Growth", "Premium Features", "Custom Domain Support", "Shipping Integration", "Multiple Store Themes", "Advanced Integrations", "Future Business Tools"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <Lock className="w-4 h-4 text-gray-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button disabled className="w-full bg-gray-100 text-gray-400 rounded-full h-11 text-sm font-medium cursor-not-allowed">
                Launching Soon
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">FAQ</span>
            <h2 className="text-4xl font-bold mt-4">Common questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors" {...fadeInUp} transition={{ delay: i * 0.05 }}>
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-all duration-200 group"
                >
                  <span className="text-sm font-medium group-hover:text-black">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-black">
        <motion.div className="max-w-3xl mx-auto text-center" {...fadeInUp}>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to start<br />selling online?</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Create your store today, connect Razorpay, upload your products and start accepting payments in minutes.
          </p>
          <Link href="/signup">
            <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-10 h-14 text-base font-medium">
              Create Your Store
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-gray-500 mt-4">No credit card required</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-16 px-6 pb-24 md:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-7 h-7 text-black" />
                <span className="font-bold text-2xl">hookit</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                The easiest way for small businesses to launch a professional online store.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-gray-500 hover:text-black transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-gray-500 hover:text-black transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Templates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-400">Made with love for creators and D2C businesses.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-black transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="text-gray-400 hover:text-black transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="text-gray-400 hover:text-black transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      {!user && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:hidden z-50">
          <Link href="/signup" className="block">
            <Button className="w-full bg-black text-white rounded-full h-12 text-sm font-medium">
              Create Your Store
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}