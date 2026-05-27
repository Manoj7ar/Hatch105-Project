import Image from "next/image";
import Link from "next/link";

type HatchLogoProps = {
  height?: number;
  className?: string;
  href?: string;
};

export function HatchLogo({ height = 28, className, href = "/" }: HatchLogoProps) {
  const width = Math.round((140 / 36) * height);

  const img = (
    <Image
      src="/hatch105-logo.svg"
      alt="Hatch105"
      width={width}
      height={height}
      priority
      className={className}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {img}
      </Link>
    );
  }

  return img;
}
