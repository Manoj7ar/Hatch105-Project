import Image from "next/image";

/** Chat assistant avatar — official Gemini spark (1:1). */
export function GeminiAvatar() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-white shadow-sm"
      title="Powered by Google Gemini"
    >
      <Image
        src="/gemini-logo.svg"
        alt="Gemini"
        width={22}
        height={22}
        className="h-[22px] w-[22px] object-contain"
      />
    </div>
  );
}
