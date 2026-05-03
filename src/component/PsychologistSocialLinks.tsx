"use client";

import Link from "next/link";
import type { PublicPsychologistSocialLink } from "@/actions/psychologists/types";
import { SOCIAL_NETWORK_META } from "@/lib/psychologist-social-links";

type Props = {
  links?: PublicPsychologistSocialLink[];
  className?: string;
  iconClassName?: string;
};

export default function PsychologistSocialLinks({
  links = [],
  className = "dz-social",
  iconClassName = "text-primary",
}: Props) {
  if (!links.length) return null;

  return (
    <ul className={className}>
      {links.map((link) => {
        const meta = SOCIAL_NETWORK_META[link.network];
        return (
          <li key={link.network}>
            <Link href={link.url} target="_blank" rel="noopener noreferrer" aria-label={meta.label}>
              <i className={`${meta.iconClassName} ${iconClassName}`.trim()} aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
