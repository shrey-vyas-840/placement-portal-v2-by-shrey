import { useEffect, useMemo, useState } from "react";
import type { LoadingPage } from "@/constants/loadingMessages";
import { loadingTitles } from "@/constants/loadingMessages";
import { useLoadingMessages } from "@/hooks/useLoadingMessages";

interface Props {
  page: LoadingPage;
}

const PAGE_SUBTITLES: Record<LoadingPage, string> = {
  dashboard: "Preparing your personalized placement dashboard experience.",
  profile: "Loading your profile, academics, resume and skills.",
  opportunities: "Finding the best opportunities based on your profile.",
  applications: "Preparing your application history and statuses.",
  noc: "Preparing your NOC workspace.",
  admin: "Loading reports and analytics.",
  auth: "Signing You In",
};

export default function AppLoadingScreen({ page }: Props) {
  const message = useLoadingMessages(page);

  const title = loadingTitles[page];

  const subtitle = PAGE_SUBTITLES[page];

  const [progress, setProgress] = useState(8);

  useEffect(() => {
    setProgress(8);

    const timer = window.setInterval(() => {
      setProgress((current) => {
       if (current >= 100) return 100;

return Math.min(current + 4.5, 100);
      });
    }, 220);

    return () => clearInterval(timer);
  }, [page]);

  const activeDot = useMemo(() => {
    return Math.min(4, Math.floor(progress / 20));
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* ==========================================================
          Background Blur Layer
      =========================================================== */}

      <div className="absolute inset-0 bg-slate-900/8 backdrop-blur-[18px] dark:bg-slate-950/25" />

      {/* ==========================================================
          Ambient Light
      =========================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-28 h-[26rem] w-[26rem] rounded-full bg-blue-500/20 blur-[140px] animate-pulse" />

        <div
          className="absolute right-[-8rem] top-[8%] h-[30rem] w-[30rem] rounded-full bg-cyan-400/18 blur-[170px] animate-pulse"
          style={{
            animationDelay: "1.3s",
          }}
        />

        <div
          className="absolute bottom-[-8rem] left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[150px] animate-pulse"
          style={{
            animationDelay: ".8s",
          }}
        />
      </div>

      {/* ==========================================================
          Center Layout
      =========================================================== */}

      <div className="relative flex h-full items-center justify-center p-6">
        <div
          className="
          relative
          w-full
          max-w-[560px]
          overflow-hidden
          rounded-[36px]
          border
          border-white/20
          bg-white/[0.10]
          px-8
          py-9
          shadow-[0_35px_90px_rgba(15,23,42,.18)]
          backdrop-blur-[34px]
          dark:border-white/10
          dark:bg-slate-900/20
        "
        >
          {/* Glass Highlight */}

          <div
            className="
            pointer-events-none
            absolute
            inset-0
            rounded-[36px]
            border
            border-white/15
            bg-gradient-to-br
            from-white/12
            via-transparent
            to-white/5
          "
          />

          {/* Soft Glow */}

          <div
            className="
            absolute
            left-1/2
            top-0
            h-40
            w-40
            -translate-x-1/2
            rounded-full
            bg-blue-500/20
            blur-[90px]
          "
          />

          <div className="relative flex flex-col items-center">
            {/* ==========================================================
                Brand
            =========================================================== */}

            <div className="absolute -top-8 h-44 w-44 rounded-full bg-gradient-to-b from-blue-500/15 to-transparent blur-[100px]" />

            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.55em] text-slate-500 dark:text-slate-400">
                INDUS
              </p>

              <h1
                className="
                mt-2
                bg-gradient-to-r
                from-blue-600
                via-sky-500
                to-indigo-700
                bg-clip-text
                text-transparent
              text-4xl
font-black
tracking-[0.16em]
leading-none
sm:text-5xl
              "
              >
                PLACEMENT
              </h1>

              <h2
                className="
                mt-1
                bg-gradient-to-r
                from-blue-600
                via-sky-500
                to-indigo-700
                bg-clip-text
                text-transparent
          text-4xl
font-black
tracking-[0.16em]
leading-none
sm:text-5xl
              "
              >
                NEXUS
              </h2>
            </div>

            {/* ==========================================================
                Page Title
            =========================================================== */}

            <div className="mt-8 text-center">
              <h3
                className="
                text-3xl
                font-bold
                tracking-tight
                text-slate-900
                dark:text-white
              "
              >
                {title}
              </h3>

              <p
                className="
                mt-3
                max-w-md
                text-base
                leading-7
                text-slate-500
                dark:text-slate-400
              "
              >
                {subtitle}
              </p>
            </div>

            {/* ==========================================================
                Animated Message
            =========================================================== */}

            <div
              key={message}
              className="mt-10 w-full text-center"
              style={{
                animation: "iplxMessage .45s ease both",
              }}
            >
              <h4
                className="
                text-[28px]
                font-semibold
                tracking-tight
                text-slate-900
                dark:text-white
              "
              >
                {message}
              </h4>
            </div>

            {/* ==========================================================
                Percentage
            =========================================================== */}

            <div
              className="
              mt-8
              flex
              justify-center
            "
            >
              <span
                className="
                text-2xl
                font-bold
                bg-gradient-to-r
                from-blue-600
                to-cyan-500
                bg-clip-text
                text-transparent
              "
              >
                {Math.round(progress)}%
              </span>
            </div>

            {/* ==========================================================
                Progress Bar
            =========================================================== */}

            <div className="mt-6 w-full">
              <div
                className="
                h-[10px]
                overflow-hidden
                rounded-full
                bg-white/15
                dark:bg-white/10
              "
              >
                <div
                  className="
                  relative
                  h-full
                  rounded-full
                  bg-gradient-to-r
                  from-blue-600
                  via-sky-500
                  to-cyan-400
                  transition-all
                  duration-300
                "
                  style={{
                    width: `${progress}%`,
                    boxShadow: "0 0 20px rgba(59,130,246,.45)",
                  }}
                >
                  <div
                    className="
                    absolute
                    inset-y-0
                    left-0
                    w-24
                    bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)]
                  "
                    style={{
                      animation: "iplxShimmer 1.7s linear infinite",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ==========================================================
                Progress Dots
            =========================================================== */}

            <div
              className="
              mt-8
              flex
              justify-center
              gap-4
            "
            >
              {[0, 1, 2, 3, 4].map((dot) => {
                const active = dot === activeDot;

                return (
                  <div
                    key={dot}
                    className={`
                      h-3
                      w-3
                      rounded-full
                      transition-all
                      duration-300
                      ${
                        active
                          ? "scale-125 bg-blue-500 shadow-[0_0_18px_rgba(59,130,246,.75)]"
                          : "bg-slate-300/70 dark:bg-slate-500"
                      }
                    `}
                  />
                );
              })}
            </div>

            {/* ==========================================================
                Footer
            =========================================================== */}

            <div
              className="
              mt-8
              text-center
            "
            >
              <p
                className="
                text-[11px]
                uppercase
                tracking-[0.38em]
                text-slate-500
                dark:text-slate-400
              "
              >
                Powered by
              </p>

              <p
                className="
                mt-2
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
              >
                Indus Placement Nexus
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`

        @keyframes iplxMessage {

          0%{
            opacity:0;
            transform:translateY(12px) scale(.985);
            filter:blur(6px);
          }

          100%{
            opacity:1;
            transform:translateY(0) scale(1);
            filter:blur(0);
          }

        }

        @keyframes iplxShimmer{

          0%{
            transform:translateX(-140%);
          }

          100%{
            transform:translateX(420%);
          }

        }

      `}</style>
    </div>
  );
}
