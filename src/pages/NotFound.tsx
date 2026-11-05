import { useLocation } from "react-router-dom";

const NotFound = () => {
  const { pathname } = useLocation();
  return (
    <main className="flex min-h-screen flex-col justify-center gap-5 px-4 md:px-12">
      <pre className="whitespace-pre-wrap break-words font-mono text-[15px] font-semibold md:text-[18px]">
        <span className="text-wh-kw">SELECT</span> * <span className="text-wh-kw">FROM</span> pages <span className="text-wh-kw">WHERE</span> path = <span className="text-wh-str">'{pathname}'</span>;
      </pre>
      <h1 className="text-[clamp(36px,6vw,72px)] font-extrabold leading-none tracking-[-0.03em]">0 rows.</h1>
      <a href="/" className="w-fit rounded-lg border-2 border-wh-ink bg-wh-ink px-4 py-2.5 font-bold text-wh-paper">
        Back to the table
      </a>
    </main>
  );
};

export default NotFound;
