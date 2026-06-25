"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Zap, Code, CreditCard, Globe, Smartphone, Search, Rocket, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">hookit</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Log in
              </Link>
              <Link href="/signup">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-5 h-9 text-sm font-medium">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                Create a<br />
                professional<br />
                website in<br />
                minutes.
              </h1>
              <p className="text-lg text-gray-500 max-w-md leading-relaxed">
                For online stores, portfolios, restaurants, freelancers, personal brands and more.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/signup">
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 h-12 text-base font-medium">
                    Start Free
                  </Button>
                </Link>
                <Link href="#templates" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors group">
                  View Themes
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Check className="w-4 h-4" />
                  Free to start
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Zap className="w-4 h-4" />
                  Powered by Razorpay
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Code className="w-4 h-4" />
                  No coding required
                </div>
              </div>
            </div>

            {/* Right - Store Preview */}
            <div className="relative">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-2xl">
                {/* Mini Store Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full" />
                    <span className="text-sm font-semibold">Luna Jewelry</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Home</span>
                    <span>Shop</span>
                    <span>About</span>
                    <span>Contact</span>
                    <span>Cart (0)</span>
                  </div>
                </div>
                {/* Hero Banner */}
                <div className="bg-gray-100 rounded-xl p-8 mb-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Timeless pieces,<br />made for you.</h3>
                    <p className="text-sm text-gray-500 mb-4">Minimal jewelry. Maximum impact.</p>
                    <button className="bg-black text-white text-xs px-4 py-2 rounded-full">Shop Collection</button>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 bg-gray-300 rounded-full opacity-50" />
                </div>
                {/* Products Grid */}
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-400">Featured Collection</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-lg aspect-square" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Templates</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">Designed for every type of business</h2>
            <p className="text-gray-500 mt-3">Pick a template. Make it yours.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: "Online Store", active: true },
              { name: "Portfolio", active: false },
              { name: "Restaurant", active: false },
              { name: "Personal Brand", active: false },
              { name: "Freelancer", active: false },
            ].map((template) => (
              <div key={template.name} className="group cursor-pointer">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden aspect-[3/4] mb-3 relative">
                  <div className="absolute inset-0 bg-gray-100" />
                  {!template.active && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-3 py-1 border border-white/30 rounded-full">Coming Soon</span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-center">{template.name}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="#" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Browse all templates
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">Three simple steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Choose a template",
                desc: "Pick a design that fits your business.",
                icon: "layout",
              },
              {
                step: "2",
                title: "Add your content",
                desc: "Customize text, images, products and more.",
                icon: "edit",
              },
              {
                step: "3",
                title: "Go live",
                desc: "Publish your website and start growing.",
                icon: "rocket",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  {item.icon === "layout" && <div className="grid grid-cols-2 gap-0.5 w-5 h-5"><div className="bg-black rounded-sm" /><div className="bg-black rounded-sm" /><div className="bg-black rounded-sm" /><div className="bg-black rounded-sm" /></div>}
                  {item.icon === "edit" && <div className="w-5 h-5 border-2 border-black rounded-sm" />}
                  {item.icon === "rocket" && <Rocket className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.step}. {item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Built For You</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">Everything you need to grow online</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: CreditCard, title: "Razorpay Payments", desc: "Accept payments securely." },
              { icon: Smartphone, title: "Mobile Responsive", desc: "Looks perfect on every device." },
              { icon: Globe, title: "Custom Domain", desc: "Connect your own domain." },
              { icon: Search, title: "SEO Friendly", desc: "Built with best SEO practices." },
              { icon: Rocket, title: "Blazing Fast", desc: "Fast loading websites that perform." },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-gray-100">
                <feature.icon className="w-5 h-5 mb-4" />
                <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to launch your website?</h2>
          <p className="text-gray-500 mb-8">Join thousands of businesses going online with Hookit.</p>
          <Link href="/signup">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 h-12 text-base font-medium">
              Start Free
            </Button>
          </Link>
          <p className="text-xs text-gray-400 mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
                <ShoppingBag className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold">hookit</span>
            </div>
            <p className="text-sm text-gray-400">Made with love for creators and small businesses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}