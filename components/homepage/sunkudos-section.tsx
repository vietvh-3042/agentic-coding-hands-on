"use client";

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
});

export default function SunkudosSection() {
  const { t } = useTranslation();

  return (
    // mm:3390:10349 — Figma "Bìa" frame spacing: 120px gap above, 96px below.
    <section className={`${montserrat.className} mx-auto w-full max-w-306`}>
      {/* mm:I3390:10349;313:8415 */}
      <div className="relative aspect-[1120/500] w-full overflow-hidden rounded-2xl bg-[#00101A]">
        {/* mm:I3390:10349;313:8416 */}
        <Image
          src="/homepage-saa/Kudos_Background.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1224px) 1120px, 100vw"
          className="object-cover"
        />

        {/* mm:I3390:10349;313:8419 */}
        <div
          className="absolute flex flex-col items-start justify-center gap-8"
          style={{ left: "5.71%", top: "9.2%", width: "40.8%" }}
        >
          {/* mm:I3390:10349;313:8420 */}
          <div className="flex flex-col items-start gap-4">
            {/* mm:I3390:10349;313:8421 */}
            <p className="text-2xl leading-8 font-bold text-white">{t("common:kudos.kicker")}</p>
            {/* mm:I3390:10349;313:8422 */}
            <p className="text-[57px] leading-16 font-bold tracking-[-0.25px] text-[#FFEA9E]">
              {t("common:kudos.title")}
            </p>
            {/* mm:I3390:10349;313:8423 */}
            <p className="text-justify text-base leading-6 font-bold tracking-[0.5px] whitespace-pre-line text-white">
              {t("common:kudos.body")}
            </p>
          </div>

          {/* mm:I3390:10349;313:8424 */}
          <div className="flex flex-col items-start gap-6">
            {/* mm:I3390:10349;313:8426 */}
            <Link href="/sun-kudos" className="flex items-center gap-2 rounded bg-[#FFEA9E] p-4 text-[#00101A]">
              {/* mm:I3390:10349;313:8426;186:1568 */}
              <span className="text-base leading-6 font-bold tracking-[0.15px]">{t("common:detail")}</span>
              <CustomSvgIcon src="/icons/icon_up.svg" className="size-6" />
            </Link>
          </div>
        </div>

        {/* mm:I3390:10349;313:8417 (empty decorative frame, no visible content in design) */}

        {/* mm:I3390:10349;329:2948 */}
        <div className="absolute aspect-[364/72]" style={{ left: "60%", top: "43%", width: "32.5%" }}>
          <Image src="/icons/logo_kudos.svg" alt="Sun* Kudos" fill sizes="364px" className="object-contain" />
        </div>
      </div>
    </section>
  );
}
