"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    // Reset form after submission
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      message: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <footer className="relative bg-[#28303E] text-white">
      {/* Gradient border using pseudo-element */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-600 to-transparent" />
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
          {/* First Column - Product/Service Links */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">
              Product
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  E-commerce Search
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Content Search
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Our Customers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Knowledge Base
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Google Alternative
                </Link>
              </li>
            </ul>
          </div>

          {/* Second Column - Legal/Account Links */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">
              Legal
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Imprint
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  System Status
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Third Column - Competitor Review */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">
              Competitor Review
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block text-sm"
                >
                  Google Custom Search vs. Site Search 360
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block text-sm"
                >
                  Algolia Search vs. Site Search 360
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block text-sm"
                >
                  Swiftype by Elasticsearch vs. Site Search 360
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block text-sm"
                >
                  Addsearch vs. Site Search 360
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block text-sm"
                >
                  Yext vs. Site Search 360
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block text-sm"
                >
                  Coveo vs. Site Search 360
                </Link>
              </li>
            </ul>
          </div>

          {/* Fourth Column - Get in touch form */}
          <div className="lg:col-span-3 sm:col-span-2">
            <h4 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">
              Get in touch
            </h4>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative group">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300"
                  />
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300"
                  />
                </div>
              </div>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300"
                />
              </div>
              <div className="relative group">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Message"
                  rows={4}
                  required
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 resize-none transition-all duration-300"
                />
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                At DataW, we take our Privacy Policy seriously. We will not,
                without your permission, publish, sell, or share information you
                entrust to us. We may use it to reach out to you with our latest
                news and updates but you can unsubscribe anytime.{" "}
                <Link
                  href="#"
                  className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                >
                  Privacy Policy
                </Link>
              </p>
              <button
                type="submit"
                className="w-full bg-slate-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 active:scale-[0.98] text-sm sm:text-base"
              >
                Send your message
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section - Social Media, Logo, Copyright */}
        <div className="border-t border-white/10 pt-6 sm:pt-8 mt-8 sm:mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex justify-center">
              <Image
                src="/logo.png"
                alt="DataW"
                width={140}
                height={100}
                className="w-24 sm:w-32 md:w-36 h-auto"
              />
            </div>
            <div className="text-white/50 text-xs sm:text-sm text-center md:text-left">
              © {new Date().getFullYear()} DataW. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
