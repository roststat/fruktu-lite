export default function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Basket body */}
      <path
        d="M6 20h28l-3 14H9L6 20Z"
        fill="#C8934A"
        stroke="#A0722A"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Basket weave lines horizontal */}
      <line x1="7" y1="25" x2="33" y2="25" stroke="#A0722A" strokeWidth="0.8" opacity="0.5" />
      <line x1="8" y1="30" x2="32" y2="30" stroke="#A0722A" strokeWidth="0.8" opacity="0.5" />
      {/* Basket handle */}
      <path
        d="M13 20 Q13 12 20 12 Q27 12 27 20"
        stroke="#A0722A"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Carrot (left) */}
      <path d="M11 19 Q12 14 14 13 Q13 16 13 19Z" fill="#FF7A00" />
      <path d="M14 13 Q15 11 13 10 Q14 12 14 13Z" fill="#4CAF50" />
      <path d="M12.5 11.5 Q11 10 12 9 Q12.5 11 12.5 11.5Z" fill="#4CAF50" />

      {/* Tomato (center) */}
      <circle cx="20" cy="16" r="4.5" fill="#E53935" />
      <path d="M18.5 12 Q20 10.5 21.5 12" stroke="#4CAF50" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M20 11.5 L20 10" stroke="#4CAF50" strokeWidth="1" strokeLinecap="round" />

      {/* Green herbs / parsley (right) */}
      <path d="M27 19 Q28 14 29 13 Q29 16 28 19Z" fill="#66BB6A" />
      <circle cx="29" cy="12.5" r="2" fill="#4CAF50" />
      <circle cx="31" cy="14" r="1.8" fill="#4CAF50" />
      <circle cx="27.5" cy="13" r="1.8" fill="#66BB6A" />
    </svg>
  );
}
