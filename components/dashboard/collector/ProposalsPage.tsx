"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProposalsByCollectorWithProjects,
  type ProposalWithProject,
} from "@/lib/services/proposalService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  MapPin,
  Users,
  Search,
  FileText,
  Clock,
  Camera,
  Video,
  Mic,
  ClipboardList,
  LocateFixed,
  Activity,
  Package,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Inbox,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Photography1Svg } from "@/components/svg/photography/photography_1";
import { Photography2Svg } from "@/components/svg/photography/photography_2";
import { Photography3Svg } from "@/components/svg/photography/photography_3";
import { Photography4Svg } from "@/components/svg/photography/photography_4";
import { Photography5Svg } from "@/components/svg/photography/photography_5";
import { Video1Svg } from "@/components/svg/video/video_1";
import { Video2Svg } from "@/components/svg/video/video_2";
import { Video3Svg } from "@/components/svg/video/video_3";
import { Video4Svg } from "@/components/svg/video/video_4";
import { Video5Svg } from "@/components/svg/video/video_5";
import { Audio1Svg } from "@/components/svg/audio/audio_1";
import { Audio2Svg } from "@/components/svg/audio/audio_2";
import { Audio3Svg } from "@/components/svg/audio/audio_3";
import { Audio4Svg } from "@/components/svg/audio/audio_4";
import { Audio5Svg } from "@/components/svg/audio/audio_5";
import { Text1Svg } from "@/components/svg/text/text_1";
import { Text2Svg } from "@/components/svg/text/text_2";
import { Text3Svg } from "@/components/svg/text/text_3";
import { Text4Svg } from "@/components/svg/text/text_4";
import { Text5Svg } from "@/components/svg/text/text_5";
import { Survey1Svg } from "@/components/svg/survey/survey_1";
import { Survey2Svg } from "@/components/svg/survey/survey_2";
import { Survey3Svg } from "@/components/svg/survey/survey_3";
import { Survey4Svg } from "@/components/svg/survey/survey_4";
import { Survey5Svg } from "@/components/svg/survey/survey_5";
import { Location1Svg } from "@/components/svg/location-data/location_1";
import { Location2Svg } from "@/components/svg/location-data/location_2";
import { Location3Svg } from "@/components/svg/location-data/location_3";
import { Location4Svg } from "@/components/svg/location-data/location_4";
import { Location5Svg } from "@/components/svg/location-data/location_5";
import { Sensor1Svg } from "@/components/svg/sensor-data/sensor_1";
import { Sensor2Svg } from "@/components/svg/sensor-data/sensor_2";
import { Sensor3Svg } from "@/components/svg/sensor-data/sensor_3";
import { Sensor4Svg } from "@/components/svg/sensor-data/sensor_4";
import { Sensor5Svg } from "@/components/svg/sensor-data/sensor_5";
import { Other1Svg } from "@/components/svg/other/other_1";
import { Other2Svg } from "@/components/svg/other/other_2";

/* ── SVG pools (same as FindProjects) ── */
const PHOTOGRAPHY_SVGS = [
  Photography1Svg,
  Photography2Svg,
  Photography3Svg,
  Photography4Svg,
  Photography5Svg,
] as const;
const VIDEO_SVGS = [
  Video1Svg,
  Video2Svg,
  Video3Svg,
  Video4Svg,
  Video5Svg,
] as const;
const AUDIO_SVGS = [
  Audio1Svg,
  Audio2Svg,
  Audio3Svg,
  Audio4Svg,
  Audio5Svg,
] as const;
const TEXT_SVGS = [Text1Svg, Text2Svg, Text3Svg, Text4Svg, Text5Svg] as const;
const SURVEY_SVGS = [
  Survey1Svg,
  Survey2Svg,
  Survey3Svg,
  Survey4Svg,
  Survey5Svg,
] as const;
const LOCATION_SVGS = [
  Location1Svg,
  Location2Svg,
  Location3Svg,
  Location4Svg,
  Location5Svg,
] as const;
const SENSOR_SVGS = [
  Sensor1Svg,
  Sensor2Svg,
  Sensor3Svg,
  Sensor4Svg,
  Sensor5Svg,
] as const;
const OTHER_SVGS = [Other1Svg, Other2Svg] as const;

const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; accent: string; bg: string }
> = {
  Photography: {
    icon: <Camera className="w-4 h-4" />,
    accent: "#10b981",
    bg: "bg-emerald-500/10",
  },
  Video: {
    icon: <Video className="w-4 h-4" />,
    accent: "#0ea5e9",
    bg: "bg-sky-500/10",
  },
  Audio: {
    icon: <Mic className="w-4 h-4" />,
    accent: "#a855f7",
    bg: "bg-purple-500/10",
  },
  Text: {
    icon: <FileText className="w-4 h-4" />,
    accent: "#f59e0b",
    bg: "bg-amber-500/10",
  },
  Survey: {
    icon: <ClipboardList className="w-4 h-4" />,
    accent: "#22c55e",
    bg: "bg-green-500/10",
  },
  "Location Data": {
    icon: <LocateFixed className="w-4 h-4" />,
    accent: "#14b8a6",
    bg: "bg-teal-500/10",
  },
  "Sensor Data": {
    icon: <Activity className="w-4 h-4" />,
    accent: "#f97316",
    bg: "bg-orange-500/10",
  },
  Other: {
    icon: <Package className="w-4 h-4" />,
    accent: "#06b6d4",
    bg: "bg-cyan-500/10",
  },
};
const DEFAULT_CATEGORY_META = CATEGORY_META["Other"];

function getProjectIconIndex(projectId: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

function formatDate(date: string | null): string {
  if (!date) return "No deadline";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Proposal card ── */
interface ProposalCardProps {
  proposal: ProposalWithProject;
  onClick: () => void;
}

function ProposalCard({ proposal, onClick }: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  const project = proposal.project;
  const category = project?.category ?? "Other";
  const catMeta = CATEGORY_META[category] || DEFAULT_CATEGORY_META;

  const categoryIcon = (() => {
    const projectId = project?.id ?? "";
    const svgPool =
      category === "Photography"
        ? PHOTOGRAPHY_SVGS
        : category === "Video"
          ? VIDEO_SVGS
          : category === "Audio"
            ? AUDIO_SVGS
            : category === "Text"
              ? TEXT_SVGS
              : category === "Survey"
                ? SURVEY_SVGS
                : category === "Location Data"
                  ? LOCATION_SVGS
                  : category === "Sensor Data"
                    ? SENSOR_SVGS
                    : OTHER_SVGS;

    const idx = getProjectIconIndex(projectId, svgPool.length);
    const SvgComp = svgPool[idx];
    return (
      <span className="w-8 h-8 flex items-center justify-center">
        <SvgComp color={catMeta.accent} />
      </span>
    );
  })();

  useEffect(() => {
    const el = descRef.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight);
  }, [project?.description]);

  const proposalStatusBadge = (() => {
    if (proposal.status === "accepted")
      return (
        <Badge className="text-[10px] px-2 py-0.5 bg-green-500/15 text-green-600 border-green-500/25 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Accepted
        </Badge>
      );
    if (proposal.status === "rejected")
      return (
        <Badge className="text-[10px] px-2 py-0.5 bg-red-500/15 text-red-500 border-red-500/25 flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Rejected
        </Badge>
      );
    if (proposal.status === "withdrawn")
      return (
        <Badge className="text-[10px] px-2 py-0.5 bg-zinc-500/15 text-zinc-400 border-zinc-500/25 flex items-center gap-1">
          <MinusCircle className="w-3 h-3" /> Withdrawn
        </Badge>
      );
    return (
      <Badge className="text-[10px] px-2 py-0.5 bg-yellow-500/15 text-yellow-600 border-yellow-500/25 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Pending
      </Badge>
    );
  })();

  const dataTypes = project?.requirements?.data_types ?? [];
  const locationAddress = project?.location?.address;
  const locationLabel = (() => {
    if (!locationAddress) return null;
    const parts = locationAddress
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    const country = parts.length >= 2 ? parts[parts.length - 1] : null;
    return country ? `${city}, ${country}` : city;
  })();

  return (
    <div
      className="group relative flex items-stretch gap-4 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all cursor-pointer p-4"
      onClick={onClick}
    >
      {/* Category icon */}
      <div
        className={`shrink-0 w-12 h-12 rounded-xl ${catMeta.bg} flex items-center justify-center mt-0.5`}
        style={{ color: catMeta.accent }}
      >
        {categoryIcon}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-base font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
            {project?.title ?? "Unknown Project"}
          </h3>
        </div>

        {/* Price & Deadline */}
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Price:</span>
            <span className="font-semibold text-muted-foreground">
              ${(project?.budget ?? 0).toFixed(2)}
            </span>
          </span>
          <span className="text-muted-foreground/30 text-xs">·</span>
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Deadline:</span>
            <span className="font-medium text-muted-foreground">
              {formatDate(project?.deadline ?? null)}
            </span>
          </span>
          <span className="text-muted-foreground/30 text-xs">·</span>
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Submitted:</span>
            <span className="font-medium text-muted-foreground">
              {formatDate(proposal.submitted_at)}
            </span>
          </span>
        </div>

        {/* Description */}
        {project?.description && (
          <div className="mb-3">
            <p
              ref={descRef}
              className={`text-sm text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
            >
              {project.description}
            </p>
            {(clamped || expanded) && (
              <button
                type="button"
                className="text-sm text-cyan-600 dark:text-cyan-400 underline underline-offset-2 mt-0.5 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
              >
                {expanded ? "less" : "more"}
              </button>
            )}
          </div>
        )}

        {/* Data type badges */}
        {dataTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {dataTypes.slice(0, 3).map((type, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-xs px-2.5 py-1 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full"
              >
                {type}
              </Badge>
            ))}
            {dataTypes.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs px-2.5 py-1 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full"
              >
                +{dataTypes.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Meta chips */}
        <div className="flex items-center gap-4 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${catMeta.bg}`}
            style={{ color: catMeta.accent }}
          >
            {catMeta.icon && (
              <span className="scale-75 origin-center">{catMeta.icon}</span>
            )}
            {category}
          </span>

          {project?.max_collectors != null && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {project.max_collectors} collector
              {project.max_collectors !== 1 ? "s" : ""}
            </span>
          )}

          {locationLabel && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {locationLabel}
            </span>
          )}

          {proposal.proposed_budget != null && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5" />
              Bid: ${proposal.proposed_budget.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Right: status badge + hover action */}
      <div
        className="shrink-0 flex flex-col items-end justify-between gap-2 pl-1"
        onClick={(e) => e.stopPropagation()}
      >
        {proposalStatusBadge}
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap">
          View Proposal
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({
  title,
  count,
  dot,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  dot: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 mb-4 group"
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </span>
      <span className="text-xs text-muted-foreground font-medium bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
        {count}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <ChevronDown
        className={`w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
      />
    </button>
  );
}

/* ── Skeleton ── */
function CardSkeleton() {
  return (
    <div className="flex items-stretch gap-4 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 p-4">
      <Skeleton className="shrink-0 w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
        <Inbox className="w-5 h-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground/60">{label}</p>
    </div>
  );
}

/* ── Page ── */
export default function ProposalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOpen, setActiveOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [rejectedOpen, setRejectedOpen] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const { data, error } = await getProposalsByCollectorWithProjects(
        user.id,
      );
      if (!mounted) return;
      if (error) setError(error.message);
      else setProposals(data ?? []);
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const active = proposals.filter((p) => p.status === "accepted");
  const pending = proposals.filter((p) => p.status === "pending");
  const rejected = proposals.filter((p) => p.status === "rejected");

  const handleCardClick = (proposal: ProposalWithProject) => {
    const projectId = proposal.project?.id ?? proposal.request_id;
    router.push(`/dashboard/projects/${projectId}/proposal`);
  };

  return (
    <div className="min-h-screen pt-2">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Proposals</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track the status of your submitted proposals.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-8">
          <div>
            <Skeleton className="h-4 w-28 mb-3" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No proposals yet
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            Browse open projects and submit your first proposal to get started.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() => router.push("/dashboard/projects/find")}
          >
            Find Projects
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Active */}
          <section>
            <SectionHeader
              title="Active"
              count={active.length}
              dot="bg-green-500"
              open={activeOpen}
              onToggle={() => setActiveOpen((v) => !v)}
            />
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{ gridTemplateRows: activeOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                {active.length === 0 ? (
                  <EmptyState label="No accepted proposals yet." />
                ) : (
                  <div className="space-y-3 pb-1">
                    {active.map((p) => (
                      <ProposalCard
                        key={p.id}
                        proposal={p}
                        onClick={() => handleCardClick(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Pending */}
          <section>
            <SectionHeader
              title="Pending"
              count={pending.length}
              dot="bg-yellow-500"
              open={pendingOpen}
              onToggle={() => setPendingOpen((v) => !v)}
            />
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{ gridTemplateRows: pendingOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                {pending.length === 0 ? (
                  <EmptyState label="No proposals awaiting review." />
                ) : (
                  <div className="space-y-3 pb-1">
                    {pending.map((p) => (
                      <ProposalCard
                        key={p.id}
                        proposal={p}
                        onClick={() => handleCardClick(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Rejected */}
          <section>
            <SectionHeader
              title="Rejected"
              count={rejected.length}
              dot="bg-red-500"
              open={rejectedOpen}
              onToggle={() => setRejectedOpen((v) => !v)}
            />
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{ gridTemplateRows: rejectedOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                {rejected.length === 0 ? (
                  <EmptyState label="No rejected proposals." />
                ) : (
                  <div className="space-y-3 pb-1">
                    {rejected.map((p) => (
                      <ProposalCard
                        key={p.id}
                        proposal={p}
                        onClick={() => handleCardClick(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
