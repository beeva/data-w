import type { ComponentType } from "react";
import { Photography1Svg } from "@/components/svg/photography/photography_1";
import { Video1Svg } from "@/components/svg/video/video_1";
import { Audio2Svg } from "@/components/svg/audio/audio_2";
import { Text1Svg } from "@/components/svg/text/text_1";
import { Survey1Svg } from "@/components/svg/survey/survey_1";
import { Location2Svg } from "@/components/svg/location-data/location_2";
import { Sensor3Svg } from "@/components/svg/sensor-data/sensor_3";
import { Other1Svg } from "@/components/svg/other/other_1";

export const JOB_CATEGORIES = [
  "Photography",
  "Video",
  "Audio",
  "Text",
  "Survey",
  "Location Data",
  "Sensor Data",
  "Other",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const CATEGORY_ICON_COLOR = "#22d3ee"; // cyan-400
export const JOB_CATEGORY_DISPLAY: Record<
  JobCategory,
  { icon: ComponentType<{ color: string }>; label: string }
> = {
  Photography: { icon: Photography1Svg, label: "Photography" },
  Video: { icon: Video1Svg, label: "Video" },
  Audio: { icon: Audio2Svg, label: "Audio" },
  Text: { icon: Text1Svg, label: "Text" },
  Survey: { icon: Survey1Svg, label: "Survey" },
  "Location Data": { icon: Location2Svg, label: "Location Data" },
  "Sensor Data": { icon: Sensor3Svg, label: "Sensor Data" },
  Other: { icon: Other1Svg, label: "Other" },
};
