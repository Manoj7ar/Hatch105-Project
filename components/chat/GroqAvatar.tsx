import Image from "next/image";

export function GroqAvatar() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white shadow-sm"
      title="Powered by Groq"
    >
      <Image
        src="/groq-logo.ico"
        alt="Groq"
        width={20}
        height={20}
        className="h-5 w-5 object-contain"
      />
    </div>
  );
}
