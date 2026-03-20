"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does the data collection process work?",
    answer:
      "Our platform connects data seekers with data providers worldwide. You can browse existing data pools or request specific datasets. Once a match is found, our intelligent agents facilitate the secure data transfer process, ensuring all privacy and compliance requirements are met.",
  },
  {
    question: "How much can I earn by providing data?",
    answer:
      "Earnings vary based on the type, quality, and volume of data you provide. Data providers typically earn between $50 to $5,000 per dataset, depending on market demand and data uniqueness. You set your own pricing, and our platform handles the transaction securely.",
  },
  {
    question: "Is my data secure and private?",
    answer:
      "Absolutely. We use enterprise-grade encryption, comply with GDPR and other privacy regulations, and allow you to control exactly what data is shared. All data transfers are logged and monitored, and you can anonymize or de-identify data before sharing.",
  },
  {
    question: "What types of data are in demand?",
    answer:
      "High-demand data includes medical imaging datasets, e-commerce transaction histories, surveillance footage (anonymized), sports betting data, logistics telemetry, and labeled training data for AI/ML models. However, there's demand for many specialized datasets across various industries.",
  },
  {
    question: "How do intelligent agents help with data collection?",
    answer:
      "Our AI-powered agents automate the data gathering process by identifying relevant sources, verifying data quality, handling compliance checks, and managing the transfer process. This makes data collection much faster and more efficient than manual methods.",
  },
  {
    question: "What are the fees for using the platform?",
    answer:
      "We charge a small transaction fee (typically 5-10%) on successful data exchanges. There are no upfront costs or subscription fees. Data providers keep the majority of their earnings, and data seekers only pay when they successfully acquire the data they need.",
  },
  {
    question: "Can I request specific types of data?",
    answer:
      "Yes! You can post detailed data requests describing exactly what you need. Our platform matches your request with available data providers, and you'll receive notifications when relevant datasets become available or when providers respond to your request.",
  },
  {
    question: "How long does it take to receive data after a request?",
    answer:
      "Response times vary depending on data availability and provider response. Simple requests may be fulfilled within hours, while specialized datasets might take days or weeks. Our intelligent agents work to expedite the process and keep you informed of progress.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-[#28303E] relative">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-start">
          {/* Left: Title + subtitle */}
          <motion.div
            className="md:sticky md:top-24"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Frequently asked{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                questions
              </span>
            </h2>
            <p className="text-[#a1a1aa] text-sm sm:text-base max-w-xl leading-relaxed">
              Everything you need to know about our data collection platform,
              payments, and how to get started.
            </p>
          </motion.div>

          {/* Right: FAQs list */}
          <div className="space-y-3 sm:space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    openIndex === index
                      ? "border-cyan-400/40 bg-white/[0.07] shadow-[0_0_24px_-8px_rgba(34,211,238,0.2)]"
                      : "border-white/10 bg-white/5 hover:border-cyan-400/30 hover:bg-white/[0.07]"
                  }`}
                >
                  <div
                    className="flex items-start sm:items-center justify-between p-5 sm:p-6 cursor-pointer gap-3"
                    onClick={() => toggleFAQ(index)}
                  >
                    <h3 className="text-base sm:text-lg font-semibold text-white flex-1 pr-2 leading-tight">
                      {faq.question}
                    </h3>
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0"
                      aria-expanded={openIndex === index}
                      aria-label={openIndex === index ? "Collapse" : "Expand"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFAQ(index);
                      }}
                    >
                      <svg
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
                          openIndex === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openIndex === index
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 text-sm sm:text-base text-white/70 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
