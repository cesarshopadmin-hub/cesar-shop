import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-3xl font-bold text-white">Page not found</h2>
      <p className="max-w-md text-slate-400">
        The route you requested does not exist yet in this starter scaffold.
      </p>
      <Link
        to="/"
        className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        Return home
      </Link>
    </div>
  );
}

export default NotFoundPage;
