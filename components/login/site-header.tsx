import Image from "next/image";
import LanguageSelector from "@/components/common/language-selector";

/** Fixed top navigation: Sun* Annual Awards 2025 brand logo + language selector. */
export default function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-20 items-center justify-between bg-[#0B0F12]/80 px-6 sm:px-10 lg:px-36">
      <Image
        src="/login/header-logo.png"
        alt="Sun* Annual Awards 2025"
        width={52}
        height={48}
        priority
        className="h-10 w-auto sm:h-12"
      />
      <LanguageSelector />
    </header>
  );
}
