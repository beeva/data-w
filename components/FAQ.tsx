"use client";

import { useState } from "react";
import Image from "next/image";

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
  const [dismissed, setDismissed] = useState(false);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-[#0F131A] relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-600 to-transparent" />

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-start md:items-center">
        <div className="order-2 md:order-1">
          <Image
            src="/images/faq.png"
            alt="FAQ"
            width={1000}
            height={1000}
            className="rounded-xl sm:rounded-2xl w-full h-auto"
          />
        </div>
        <div className="order-1 md:order-2">
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div key={index}>
                <div
                  className="flex items-start sm:items-center justify-between py-3 sm:py-4 cursor-pointer gap-3"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white flex-1 pr-2 sm:pr-4 leading-tight sm:leading-normal">
                    {faq.question}
                  </h3>
                  <button
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors flex-shrink-0 mt-1 sm:mt-0"
                    aria-expanded={openIndex === index}
                    aria-label={openIndex === index ? "Collapse" : "Expand"}
                  >
                    {openIndex === index ? (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index
                      ? "max-h-96 opacity-100 pb-3 sm:pb-4"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-sm sm:text-base md:text-lg text-white/70 leading-relaxed pr-4 sm:pr-8 md:pr-12">
                    {faq.answer}
                  </p>
                </div>
                {index < faqs.length - 1 && (
                  <div className="h-px bg-white/10"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
