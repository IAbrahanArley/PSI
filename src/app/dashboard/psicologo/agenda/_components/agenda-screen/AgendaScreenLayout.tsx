import { cn } from "@/lib/utils";

type Props = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AgendaScreenLayout({ sidebar, children, className }: Props) {
  return (
    <div className={cn("row g-4 align-items-start", className)}>
      <div className="col-12 col-lg-3 col-xl-3">{sidebar}</div>
      <div className="col-12 col-lg-9 col-xl-9 min-w-0">{children}</div>
    </div>
  );
}
