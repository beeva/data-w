"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import man1 from "@/public/avatars/man1.jpg";
import man2 from "@/public/avatars/man2.jpg";
import female from "@/public/avatars/female.jpg";

interface Testimonial {
  name: string;
  image: StaticImageData;
  content?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    image: man1,
    content:
      "As a data requester, I needed large volumes of medical imaging data for my AI research. Through this platform, I connected with collectors worldwide and gathered over 50,000 labeled scans in just 3 weeks.",
  },
  {
    name: "Marcus Rodriguez",
    image: man2,
    content:
      "I've earned over $12,000 by collecting and providing data through this platform. The global reach means I can work with requesters from anywhere, and the payment process is transparent and reliable.",
  },
  {
    name: "Dr. Emily Watson",
    image: female,
    content:
      "Finding quality data collectors was challenging until I discovered this platform. The agents help verify data quality automatically, saving me weeks of manual validation work.",
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / (5000 / 50);
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 50);

    return () => {
      clearInterval(progressInterval);
    };
  }, [activeIndex]);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 6000);

    return () => {
      clearInterval(testimonialInterval);
    };
  }, []);

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-[#28303E] relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-600 to-transparent" />

      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-6">
          {/* Left Column */}
          <div className="space-y-8 sm:space-y-10 md:space-y-12">
            <div className="flex gap-2 sm:gap-3">
              <span className="text-white text-4xl sm:text-5xl md:text-6xl font-bold mb-2 flex-shrink-0">
                1.
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 flex-1">
                <div className="flex flex-col gap-2 sm:col-span-3">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-0 sm:mt-4">
                    We drive higher revenue results
                  </h3>
                  <p className="text-sm sm:text-base text-white/70 mb-4 sm:mb-6 leading-relaxed">
                    Whether you're a data requester looking to fill your data
                    gaps, a collector seeking to earn income, or an agent
                    validating data quality, our platform connects you with
                    people worldwide. Our intelligent agents automate the data
                    gathering process, ensuring seamless transactions and
                    quality validation.
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 border border-cyan-400/50 rounded-lg text-cyan-400 text-xs sm:text-sm">
                      Global Connections
                    </span>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 border border-cyan-400/50 rounded-lg text-cyan-400 text-xs sm:text-sm">
                      Intelligent Agents
                    </span>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 border border-cyan-400/50 rounded-lg text-cyan-400 text-xs sm:text-sm">
                      Quality Validation
                    </span>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 border border-cyan-400/50 rounded-lg text-cyan-400 text-xs sm:text-sm">
                      Secure Transactions
                    </span>
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-cyan-400/50 p-1 sm:col-span-2 aspect-square order-first sm:order-last">
                  <Image
                    src="/images/image1.jpg"
                    alt="Testimonial"
                    width={500}
                    height={500}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: What industries benefit from data gathering? */}
            <div className="flex gap-2 sm:gap-3">
              <span className="text-white text-4xl sm:text-5xl md:text-6xl font-bold mb-2 flex-shrink-0">
                2.
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 flex-1">
                <div className="flex flex-col gap-2 sm:col-span-3">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-0 sm:mt-4">
                    What industries benefit from data gathering?
                  </h3>
                  <p className="text-sm sm:text-base text-white/70 mb-4 sm:mb-6 leading-relaxed">
                    Our platform serves diverse industries that need quality
                    data for research, AI training, and business intelligence.
                    From healthcare to e-commerce, we connect requesters with
                    collectors worldwide to build comprehensive datasets
                    efficiently.
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 border border-cyan-400/50 rounded-lg text-cyan-400 text-xs sm:text-sm">
                      Healthcare
                    </span>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 border border-cyan-400/50 rounded-lg text-cyan-400 text-xs sm:text-sm">
                      E-commerce
                    </span>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 border border-cyan-400/50 rounded-lg text-cyan-400 text-xs sm:text-sm">
                      Finance
                    </span>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 border border-cyan-400/50 rounded-lg text-cyan-400 text-xs sm:text-sm">
                      Marketing
                    </span>
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-cyan-400/50 p-1 sm:col-span-2 aspect-square order-first sm:order-last">
                  <Image
                    src="/images/image2.jpg"
                    alt="Testimonial"
                    width={500}
                    height={500}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8 sm:space-y-10 md:space-y-12">
            <div className="flex flex-col sm:flex-row flex-wrap items-start gap-4 sm:gap-6 lg:gap-8 min-h-[200px] sm:min-h-[192px]">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`relative flex items-start gap-3 sm:gap-4 transition-all duration-300 w-full sm:w-auto ${
                    activeIndex === index
                      ? "flex-1 sm:min-w-[280px] md:min-w-[300px] lg:min-w-[400px]"
                      : "flex-shrink-0 flex-col items-center sm:w-auto"
                  }`}
                >
                  {/* Profile Picture with Timer Ring */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
                        activeIndex === index
                          ? "w-20 h-20 sm:w-24 sm:h-24 p-2"
                          : "w-14 h-14 sm:w-16 sm:h-16 opacity-70"
                      }`}
                    >
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={activeIndex === index ? 80 : 64}
                        height={activeIndex === index ? 80 : 64}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    {/* Animated Progress Ring */}
                    {activeIndex === index && (
                      <svg
                        className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 -rotate-90"
                        viewBox="0 0 84 84"
                      >
                        <circle
                          cx="42"
                          cy="42"
                          r="40"
                          stroke="rgba(34, 211, 238, 0.2)"
                          strokeWidth="2"
                          fill="none"
                        />
                        <circle
                          cx="42"
                          cy="42"
                          r="40"
                          stroke="#22d3ee"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 40 * (1 - progress / 100)
                          }`}
                          className="transition-all duration-50 ease-linear"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Content and Name Container */}
                  <div
                    className={`flex-1 ${
                      activeIndex === index
                        ? ""
                        : "flex flex-col items-center mt-2"
                    }`}
                  >
                    {/* Content - only show for active testimonial */}
                    {activeIndex === index && testimonial.content && (
                      <div className="mb-3 animate-in fade-in duration-300">
                        <p className="text-white/80 leading-relaxed text-sm sm:text-base">
                          {testimonial.content}
                        </p>
                      </div>
                    )}

                    {/* Name */}
                    <div
                      className={`font-semibold transition-colors duration-300 ${
                        activeIndex === index
                          ? "text-white text-sm sm:text-base"
                          : "text-white/60 text-center text-xs sm:text-sm"
                      }`}
                    >
                      <div>{testimonial.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* What our clients are saying about us / DataW Platform */}
            <div className="bg-black/40 relative rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px]">
              <Image
                src="/images/building.png"
                alt="DataW Platform"
                width={500}
                height={500}
                className="object-cover rounded-lg absolute bottom-0 right-0 w-full sm:w-auto h-full sm:h-auto"
              />
              <div className="p-4 sm:p-6 z-10 relative">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
                  What our clients are saying about us
                </h3>
                <div className="bg-gradient-to-r from-white/10 to-transparent py-8 sm:py-12 px-2 sm:px-4 rounded-xl w-full sm:w-2/3">
                  <h4 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-3 sm:mb-4">
                    DataW Platform
                  </h4>
                  <p className="text-sm sm:text-base text-white/70 mb-4 sm:mb-6 leading-relaxed pl-2 sm:pl-4">
                    Our innovative data gathering platform enables seamless
                    connections between requesters, collectors, and agents
                    worldwide. With intelligent automation and quality
                    validation, experience the future of efficient data
                    collection and monetization.
                  </p>
                  <div className="mb-4 sm:mb-6 ml-2 sm:ml-4">
                    <button className="px-4 sm:px-6 py-2 bg-white/10 border border-white/50 rounded-lg text-white hover:bg-white/10 transition-colors text-sm sm:text-base">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
