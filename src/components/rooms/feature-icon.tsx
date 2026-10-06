import {
  type LucideIcon,
  Presentation,
  Projector,
  Tv,
  Video,
} from "lucide-react";

// Keyed by the seed's fixed catalog; a slug without an icon just renders its name.
const icons: Record<string, LucideIcon> = {
  projector: Projector,
  videoconf: Video,
  whiteboard: Presentation,
  tv: Tv,
};

export function FeatureIcon({ slug }: { slug: string }) {
  const Icon = icons[slug];
  return Icon ? <Icon aria-hidden="true" /> : null;
}
