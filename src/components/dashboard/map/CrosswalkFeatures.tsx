import Image from "next/image";
import { Crosswalk } from "@/features/acc_calculate/types";

type FeatureItem = {
    key: string;
    name: string;
    enabled: boolean;
    src: string;
    desc: string;
};

function getCrosswalkFeatures(crosswalk: Crosswalk): FeatureItem[] {
    return [
        {
            key: "signal",
            name: "신호등",
            enabled: !!crosswalk.hasSignal,
            src: "/signal.svg",
            desc: "보행자 신호등이 설치되어 있어 보행 신호에 따라 안전하게 횡단할 수 있어요.",
        },
        {
            key: "button",
            name: "보행자 버튼",
            enabled: !!crosswalk.hasPedButton,
            src: "/button.svg",
            desc: "보행자가 버튼을 눌러 신호를 요청할 수 있어요.",
        },
        {
            key: "sound",
            name: "음향신호기",
            enabled: !!crosswalk.hasPedSound,
            src: "/sound.svg",
            desc: "시각장애인 등을 위해 소리로 보행 신호를 안내해요.",
        },
        {
            key: "highland",
            name: "고원식",
            enabled: !!crosswalk.isHighland,
            src: "/highland.svg",
            desc: "횡단보도 구간이 높아 차량 감속을 유도해요.",
        },
        {
            key: "bump",
            name: "보도턱 낮춤",
            enabled: !!crosswalk.hasBump,
            src: "/curb.svg",
            desc: "휠체어/유모차가 턱 없이 이동하기 쉬워요.",
        },
        {
            key: "braille",
            name: "점자블록",
            enabled: !!crosswalk.hasBrailleBlock,
            src: "/braille.svg",
            desc: "시각장애인 보행 안내를 위한 점자 유도 블록이에요.",
        },
        {
            key: "spotlight",
            name: "집중조명",
            enabled: !!crosswalk.hasSpotlight,
            src: "/spotlight.svg",
            desc: "야간에 횡단보도 시인성을 높여요.",
        },
    ];
}

export function CrosswalkFeatureIcons({ crosswalk }: { crosswalk: Crosswalk }) {
    const features = getCrosswalkFeatures(crosswalk);

    return (
        <div
      className="grid gap-2 sm:gap-3"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(56px, 1fr))",
      }}
    >
      {features.map((f) => {
        const title = `${f.name} - ${f.enabled ? "있음" : "없음"}\n${f.desc}`;
        const aria = `${f.name} - ${f.enabled ? "있음" : "없음"}. ${f.desc}`;

        return (
          <div
            key={f.key}
            title={title}
            aria-label={aria}
            className={[
              "flex flex-col items-center justify-center rounded-lg border",
              "transition-colors",
              "py-2 sm:py-3",
              f.enabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200",
            ].join(" ")}
          >
            <div
              className={[
                "flex items-center justify-center rounded-md border",
                f.enabled ? "bg-green-100 border-green-200" : "bg-white border-gray-200",
              ].join(" ")}
              style={{
                width: "clamp(34px, 4vw, 46px)",
                height: "clamp(34px, 4vw, 46px)",
                padding: "clamp(6px, 0.8vw, 10px)",
              }}
            >
              <Image
                src={f.src}
                alt={f.name}
                width={64}
                height={64}
                className={f.enabled ? "opacity-90" : "opacity-40 grayscale"}
                style={{
                  width: "clamp(18px, 2.2vw, 26px)",
                  height: "clamp(18px, 2.2vw, 26px)",
                }}
              />
            </div>

            <div className="mt-1 text-[11px] sm:text-xs font-medium text-gray-700">
              {f.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}