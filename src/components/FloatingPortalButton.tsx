import { ExternalLink } from 'lucide-react';

interface FloatingPortalButtonProps {
  portalUrl: string;
}

export function FloatingPortalButton({ portalUrl }: FloatingPortalButtonProps) {
  const safeUrl = portalUrl?.trim() || 'https://portallpmpp.simpatti.site/';

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="no-print fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A2342] hover:bg-[#13355F] text-white text-xs sm:text-sm font-semibold border border-[#D4AF37]/60 shadow-xl transition-transform duration-150 hover:-translate-y-0.5 whitespace-nowrap"
    >
      <span>Kembali ke Portal Utama</span>
      <ExternalLink className="w-3.5 h-3.5 text-[#E8CF78]" />
    </a>
  );
}
