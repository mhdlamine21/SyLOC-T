export function OrangeMoneyLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Orange Money"
      role="img"
    >
      <rect width="100" height="100" rx="22" fill="#FF7900" />
      <circle cx="38" cy="50" r="20" fill="white" />
      <circle cx="62" cy="50" r="20" fill="#000000" />
      <path
        d="M50 35.4C54.4 39.5 57.2 44.5 57.2 50C57.2 55.5 54.4 60.5 50 64.6C45.6 60.5 42.8 55.5 42.8 50C42.8 44.5 45.6 39.5 50 35.4Z"
        fill="#FF7900"
      />
    </svg>
  );
}

export function WaveLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Wave"
      role="img"
    >
      <rect width="100" height="100" rx="22" fill="#1DC3E6" />
      {/* Silhouette Pingouin Wave */}
      <path
        d="M50 18C39 18 30 27 30 38C30 46 34 53 40 57.5L34 76C33.5 78 35 80 37 80H63C65 80 66.5 78 66 76L60 57.5C66 53 70 46 70 38C70 27 61 18 50 18Z"
        fill="#0B132B"
      />
      {/* Ventre blanc */}
      <ellipse cx="50" cy="52" rx="14" ry="18" fill="#FFFFFF" />
      {/* Yeux */}
      <circle cx="44" cy="34" r="2.5" fill="#FFFFFF" />
      <circle cx="56" cy="34" r="2.5" fill="#FFFFFF" />
      {/* Bec jaune */}
      <polygon points="50,37 45,43 55,43" fill="#FBBF24" />
      {/* Noeud papillon ou noeud cyan */}
      <polygon points="46,47 54,47 50,51" fill="#1DC3E6" />
    </svg>
  );
}

export function FreeMoneyLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Free Money"
      role="img"
    >
      <rect width="100" height="100" rx="22" fill="#E21421" />
      <text
        x="50"
        y="58"
        fill="#FFFFFF"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="30"
        fontStyle="italic"
        textAnchor="middle"
      >
        free
      </text>
      <text
        x="50"
        y="74"
        fill="#FFFFFF"
        fontFamily="sans-serif"
        fontWeight="700"
        fontSize="12"
        letterSpacing="2"
        textAnchor="middle"
      >
        MONEY
      </text>
    </svg>
  );
}
