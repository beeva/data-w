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
          "Requester project delivery: Create and run projects with budgets, proposals, workshop tracking, and submission review in one lifecycle.",
          "Collector task execution: Use Find Projects, manage Saved Jobs, submit proposals, and deliver approved submissions against project specs.",
          "Validation and QA workflows: Combine AI-assisted checks with human validation to reduce rejection loops and protect dataset quality.",
          "DataPool sourcing and reuse: Within DataW, discover datasets, preview listings, and purchase with wallet balance when reuse is faster than recollection.",
          "Payment and settlement operations: Use wallet-driven settlement and DTW crypto rails to support global contributor payouts.",
        ],
      },
      {
        heading: "Who Benefits Most",
        points: [
          "Requester teams that need one system for project setup, proposal intake, workshop visibility, and submission decisions.",
          "Collector communities that need a clear pipeline from discovery and proposal to validation and payout.",
          "AI and research teams that need production-ready datasets with measurable pass-rate and cycle-time controls.",
          "Operations and finance teams that need auditable payment flow, wallet tracking, and cost-per-approved-record analytics.",
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
          "DataW is a full-cycle data platform connecting requesters and collectors across project creation, proposal workflow, submissions, validation, and payout.",
          "DataPool is a feature inside DataW that helps teams browse, evaluate, and operationalize existing datasets alongside new collection workflows.",
          "The platform supports configurable project setup so teams can define instructions, target contributors, accepted formats, and quality standards.",
          "DataW combines operational tools with analytics visibility so teams can monitor throughput, acceptance rate, and payout status in near real time.",
        ],
      },
      {
        heading: "What Makes It a Platform",
        points: [
          "End-to-end orchestration: project posting, proposal matching, workshop progress, and submission decisions are connected in one operational flow.",
          "Role-based workspace: requester, collector, and admin actions are separated while remaining connected through shared project state.",
          "Integrated payment path: approved work transitions into wallet and crypto payout workflows without external reconciliation overhead.",
        ],
      },
      {
        heading: "Role Descriptions in DataW",
        points: [
          "Agent role: Acts as the operational reviewer layer, supporting AI-assisted and manual validation, submission quality checks, and workflow decision support for requesters.",
          "Requester role: Owns project delivery by creating projects, setting budget and requirements, reviewing proposals, managing workshops, and validating or rejecting submissions.",
          "Collector role: Executes tasks by finding projects, saving opportunities, submitting proposals, delivering submissions, and improving quality based on reviewer feedback.",
          "Company role: Used by organizations that post projects, define scope and budgets, manage proposals, run workshops, and approve submission outcomes at scale.",
          "Personal role: Designed for individual contributors who discover projects, submit proposals, complete assigned tasks, and receive wallet/DTW payouts.",
        ],
      },
      {
        heading: "Analytical Value for Teams",
        points: [
          "Improves dataset readiness by aligning task design with submission review and validator feedback loops.",
          "Supports measurable governance through KPI tracking such as acceptance rate, validated-vs-rejected volume, and review turnaround.",
          "Enables cross-project benchmarking so teams can optimize instructions, contributor targeting, and budget allocation.",
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
          "When you need to decide between DataPool purchase and new project collection and want both options in one platform.",
          "When your dataset pipeline is fragmented across multiple tools and manual spreadsheets.",
          "When you need to scale proposal intake and contributor submissions without losing quality control.",
          "When payout delays are reducing contributor retention or slowing project delivery.",
          "When leadership needs visibility into project status, validation outcomes, and cost-efficiency metrics.",
        ],
      },
      {
        heading: "Signals That It Is Time to Migrate",
        points: [
          "Project managers cannot track proposal, workshop, and submission status in one shared operational view.",
          "Multiple teams use different standards, resulting in inconsistent datasets and rework.",
          "You cannot clearly measure collection efficiency, acceptance rates, validation throughput, or payout turnaround.",
          "Current tooling does not support global collector onboarding and dependable wallet-based settlement.",
        ],
      },
      {
        heading: "Decision Checklist for Adoption",
        points: [
          "Determine whether each use case should start with DataPool purchases, new project campaigns, or a hybrid model.",
          "Confirm that task templates, quality policy, and review ownership are defined.",
          "Set baseline KPIs for comparison: pass rate, review cycle time, proposal-to-start time, and cost per approved record.",
          "Identify pilot stakeholders from requester ops, quality review, collector management, and finance.",
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
          "Start by reviewing DataPool for fit-for-purpose datasets and define what must still be collected through Projects.",
          "Define project scope, output schema, quality rubric, budget envelope, and submission requirements.",
          "Write task instructions with examples for valid, invalid, and edge-case submissions.",
          "Configure role responsibilities across requester owners, validators, and collector contributors.",
          "Set initial KPIs and reporting cadence before opening the project to contributors.",
        ],
      },
      {
        heading: "Phase 2 - Pilot and Validate",
        points: [
          "Pilot with a mix of DataPool-sourced data and newly collected records when the use case supports hybrid sourcing.",
          "Launch a controlled batch, monitor proposal quality, and shortlist collectors with relevant fit.",
          "Measure early metrics: acceptance rate, review turnaround, and instruction clarity for collectors.",
          "Capture rejection reasons from submission review and refine prompts to remove ambiguity.",
          "Validate payout and approval flow integrity before scaling volume.",
        ],
      },
      {
        heading: "Phase 3 - Scale and Optimize",
        points: [
          "Increase task volume gradually and monitor quality drift across cohorts and regions.",
          "Use recurring QA checkpoints and workshop-level review to protect dataset consistency.",
          "Track operational health weekly using KPI trends for submissions, validations, payouts, and budget burn.",
          "Run retrospectives to improve project templates, validation rules, and collector incentive structures.",
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
          "Quality confidence: standardized requester-to-collector workflows reduce variability and strengthen model training inputs.",
          "Execution speed: connected proposals, workshop tracking, and submission decisions shorten handoffs to approved output.",
          "Faster project initiation: DataPool enables immediate dataset sourcing while custom collection runs in parallel.",
          "Global accessibility: distributed collector participation improves multilingual and region-specific coverage.",
          "Cost clarity: visibility across throughput, acceptance, and payout metrics supports stronger budget governance.",
        ],
      },
      {
        heading: "Business Outcomes",
        points: [
          "Faster dataset readiness for experimentation, model iteration, and deployment planning.",
          "Lower operational risk through transparent validation checkpoints and audit-ready workflow records.",
          "Improved collector reliability due to predictable review cycles and transparent wallet/crypto payout experience.",
          "Higher confidence in scale decisions because project performance is tracked against measurable KPIs.",
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
