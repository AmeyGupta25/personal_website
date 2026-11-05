import { profile } from "@/data/work";

/** Lines fade in one after another, like rows arriving. */
export const LINE_GAP = 140;

/** The opening answer to SELECT * FROM amey.profile, in psql's expanded-display style. */
const ProfileRecord = ({ onSkip }: { onSkip: () => void }) => {
  const keyWidth = Math.max(...profile.map(([k]) => k.length));
  return (
    <section
      aria-label="About Amey"
      className="pt-2 font-mono text-[13px] md:text-[15px]"
    >
      <p
        className="wh-row overflow-hidden whitespace-nowrap text-wh-mute"
        aria-hidden
      >
        -[ RECORD 1 ]-{"-".repeat(Math.max(0, keyWidth - 13))}+{"-".repeat(40)}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2.5 md:gap-x-4 md:gap-y-3">
        {profile.map(([k, v], i) => (
          <div key={k} className="contents">
            <dt
              className="wh-row whitespace-pre pt-[0.2em] text-wh-mute"
              style={{ animationDelay: `${(i + 1) * LINE_GAP}ms` }}
            >
              {k.padEnd(keyWidth)} <span aria-hidden>|</span>
            </dt>
            <dd
              className={`wh-row max-w-[60ch] font-sans ${
                k === "name"
                  ? "text-[clamp(26px,3.2vw,40px)] font-extrabold uppercase leading-none tracking-[-0.03em]"
                  : "text-[clamp(16px,1.6vw,20px)] leading-snug"
              }`}
              style={{ animationDelay: `${(i + 1) * LINE_GAP}ms` }}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <p
        className="wh-row mt-4 flex items-center gap-4 text-wh-mute"
        style={{ animationDelay: `${(profile.length + 1) * LINE_GAP}ms` }}
      >
        (1 row)
        <button
          type="button"
          onClick={onSkip}
          className="font-sans text-[13px] font-semibold text-wh-ink underline underline-offset-4"
        >
          Skip intro
        </button>
      </p>
    </section>
  );
};

export default ProfileRecord;
