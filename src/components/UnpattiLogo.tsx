import { useState } from 'react';

const UNPATTI_LOGO_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Logo_Universitas_Pattimura_Terbaru.png/330px-Logo_Universitas_Pattimura_Terbaru.png?utm_source=id.wikipedia.org&utm_campaign=parser&utm_content=thumbnail';

interface UnpattiLogoProps {
  className?: string;
}

export function UnpattiLogo({ className = 'w-12 h-12' }: UnpattiLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <div
        className={`${className} rounded-lg bg-[#0A2342] border border-[#D4AF37]/60 flex items-center justify-center shrink-0 shadow-sm`}
        aria-label="Lambang Universitas Pattimura"
      >
        <svg
          viewBox="0 0 64 64"
          className="w-4/5 h-4/5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M32 6L52 14V30C52 43.2 43.3 53.5 32 58C20.7 53.5 12 43.2 12 30V14L32 6Z"
            fill="#0A2342"
            stroke="#D4AF37"
            strokeWidth="2.5"
          />
          <path
            d="M22 25H42M32 16V46M25 34L32 27L39 34"
            stroke="#D4AF37"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="18" r="2.5" fill="#E8CF78" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={UNPATTI_LOGO_URL}
      alt="Logo Universitas Pattimura"
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`${className} object-contain shrink-0`}
    />
  );
}
