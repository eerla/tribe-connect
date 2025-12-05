import {
  Laptop,
  Dumbbell,
  Palette,
  Music,
  UtensilsCrossed,
  Gamepad2,
  Mountain,
  Camera,
  BookOpen,
  Briefcase,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Laptop,
  Dumbbell,
  Palette,
  Music,
  UtensilsCrossed,
  Gamepad2,
  Mountain,
  Camera,
  BookOpen,
  Briefcase,
};

interface CategoryIconProps {
  icon: string;
  className?: string;
}

export function CategoryIcon({ icon, className }: CategoryIconProps) {
  const Icon = iconMap[icon] || Laptop;
  return <Icon className={className} />;
}
