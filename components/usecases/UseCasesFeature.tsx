"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";

type SectionKey =
  | "overview"
  | "what-is-dataw"
  | "when-to-use"
  | "how-to-use"
  | "why-use-dataw";

type SectionConfig = {
  title: string;
  subtitle: string;
  description: string;
  sections: { heading: string; points: string[] }[];
};

const featureSections: Record<SectionKey, SectionConfig> = {
  overview: {
    title: "Use Cases",
    subtitle: "for DataW",
    description:
      "A complete view of how DataW supports data operations from planning to payout, with practical workflows for enterprise teams, researchers, and distributed contributors.",
    sections: [
      {
        heading: "Platform Use Case Categories",
        points: [
          "Data collection campaigns: Launch targeted projects for image, text, audio, and task-based datasets with clear quality requirements.",
          "Validation and QA workflows: Review submissions with layered checks to maintain consistency, reduce rejection rates, and protect model performance.",
          "Contributor operations: Coordinate global contributors through structured task distribution, progress tracking, and transparent compensation.",
          "Crypto-enabled payouts: Deliver borderless payments with lower settlement delays, useful for regions with limited banking infrastructure.",
        ],
      },
      {
        heading: "Who Benefits Most",
        points: [
          "AI companies that need production-ready datasets at scale with predictable quality controls.",
          "Research teams that need fast pilot studies and repeatable data cycles before full deployment.",
          "Operations teams that need a single platform to align task design, collection, validation, and payment.",
          "Global contributors looking for accessible work and reliable payout options.",
        ],
      },
      {
        heading: "Professional Implementation Guidance",
        points: [
          "Start with a narrow pilot campaign, then expand once baseline quality and turnaround targets are met.",
          "Define acceptance criteria before launch: labeling logic, edge-case handling, and escalation paths.",
          "Use milestone-based reporting: submission volume, pass rate, cost per approved record, and cycle time.",
          "Review payout and compliance policies early to keep contributor trust and reduce operational friction.",
        ],
      },
    ],
  },
  "what-is-dataw": {
    title: "What is",
    subtitle: "DataW Platform",
    description:
      "DataW is a structured data operations platform designed to connect project owners and contributors through quality-controlled collection pipelines and transparent compensation.",
    sections: [
      {
        heading: "Core Platform Definition",
        points: [
          "DataW is a full-cycle data platform for task creation, distributed contribution, quality verification, and payout management.",
          "The platform supports configurable project setup so teams can define task instructions, target audiences, and expected output formats.",
          "DataW combines operational tooling with analytics visibility, helping teams monitor throughput and quality in near real time.",
        ],
      },
      {
        heading: "What Makes It a Platform",
        points: [
          "End-to-end orchestration: requirements, execution, and verification are connected in one operational workflow.",
          "Role-based environment: project owners, validators, and contributors interact through clear role permissions.",
          "Integrated payment path: approved work can move directly to payout workflows, reducing administrative handoffs.",
        ],
      },
      {
        heading: "Analytical Value for Teams",
        points: [
          "Improves dataset readiness by minimizing inconsistency between task intent and final output.",
          "Supports measurable governance through KPI tracking such as acceptance rate and rework volume.",
          "Enables comparison across campaigns so teams can optimize instructions, timelines, and budgets.",
        ],
      },
    ],
  },
  "when-to-use": {
    title: "When",
    subtitle: "to Use DataW",
    description:
      "Use DataW when your organization needs repeatable, quality-controlled data operations with measurable outcomes across distributed teams.",
    sections: [
      {
        heading: "When to Use DataW",
        points: [
          "When your dataset pipeline is fragmented across multiple tools and manual spreadsheets.",
          "When you need to scale contribution volume without losing control over quality thresholds.",
          "When payout delays are reducing contributor retention or slowing project delivery.",
          "When leadership needs clearer analytics on cost, speed, and data acceptance outcomes.",
        ],
      },
      {
        heading: "Signals That It Is Time to Migrate",
        points: [
          "Your data pipeline depends on manual coordination and review bottlenecks are increasing.",
          "Multiple teams use different standards, resulting in inconsistent datasets and rework.",
          "You cannot clearly measure collection efficiency, acceptance rates, or payout turnaround.",
          "Current tooling cannot scale to global contributors or multilingual data requirements.",
        ],
      },
      {
        heading: "Decision Checklist for Adoption",
        points: [
          "Confirm that task templates, quality policy, and review ownership are defined.",
          "Set baseline KPIs for comparison: pass rate, cycle time, and cost per approved record.",
          "Identify pilot stakeholders from operations, quality, and finance before rollout.",
          "Plan a phased transition to avoid disrupting active projects and contributor trust.",
        ],
      },
    ],
  },
  "how-to-use": {
    title: "How",
    subtitle: "to Use DataW",
    description:
      "Apply DataW through a phased operating model: design, pilot, scale, and optimization, with quality governance and analytics at every stage.",
    sections: [
      {
        heading: "Phase 1 - Design and Setup",
        points: [
          "Define project scope, output schema, quality rubric, and submission requirements.",
          "Write task instructions with examples for valid, invalid, and edge-case submissions.",
          "Configure roles and review responsibilities for owners, validators, and contributors.",
          "Set initial KPIs and reporting cadence before opening the project to contributors.",
        ],
      },
      {
        heading: "Phase 2 - Pilot and Validate",
        points: [
          "Launch a controlled batch with a smaller contributor cohort.",
          "Measure early metrics: acceptance rate, review turnaround, and contributor clarity.",
          "Collect rejection reasons and refine instructions to remove ambiguity.",
          "Validate payout and approval flow integrity before scaling volume.",
        ],
      },
      {
        heading: "Phase 3 - Scale and Optimize",
        points: [
          "Increase task volume gradually and monitor quality drift indicators.",
          "Use recurring QA checkpoints to protect dataset consistency.",
          "Track operational health weekly using KPI dashboards and trend comparisons.",
          "Run retrospectives to improve templates, review rules, and incentive structures.",
        ],
      },
    ],
  },
  "why-use-dataw": {
    title: "Why Use",
    subtitle: "DataW Platform",
    description:
      "DataW helps teams improve quality, speed, and transparency in data operations while supporting global contributor participation through modern payout infrastructure.",
    sections: [
      {
        heading: "Strategic Reasons",
        points: [
          "Quality confidence: standardized workflows reduce variability and strengthen model training inputs.",
          "Execution speed: connected tooling shortens handoffs from task publication to approved output.",
          "Global accessibility: distributed contribution model increases coverage for multilingual and regional datasets.",
          "Cost clarity: visibility across throughput and acceptance metrics supports better budget control.",
        ],
      },
      {
        heading: "Business Outcomes",
        points: [
          "Faster dataset readiness for experimentation, model iteration, and deployment planning.",
          "Lower operational risk through transparent validation checkpoints and audit-friendly records.",
          "Improved contributor reliability due to predictable review cycles and transparent payout experience.",
          "Higher confidence in scaling data programs because performance is tracked against measurable KPIs.",
        ],
      },
      {
        heading: "Why Teams Keep Expanding on DataW",
        points: [
          "It supports both pilot and enterprise-scale campaigns without changing core operating patterns.",
          "Cross-functional teams can collaborate in one platform instead of coordinating across disconnected systems.",
          "Leaders get a clearer analytical view of productivity, quality, and payment health across projects.",
        ],
      },
    ],
  },
};

export default function UseCasesFeature({ section }: { section: SectionKey }) {
  const content = featureSections[section];

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Header />
      <PageHero
        title={content.title}
        subtitle={content.subtitle}
        description={content.description}
      />

      <main className="pb-24 pt-8">
        <div className="container mx-auto px-4 sm:px-6">
          <section className="space-y-6">
            {content.sections.map((block) => (
              <article
                key={block.heading}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7"
              >
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
                  {block.heading}
                </h2>
                <ul className="space-y-3">
                  {block.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                      <p className="text-white/75 leading-relaxed">{point}</p>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
