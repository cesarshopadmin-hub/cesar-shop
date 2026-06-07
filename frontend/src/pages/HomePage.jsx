import Button from "../components/ui/Button.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";

function HomePage() {
  useDocumentTitle("GameVault | Home");

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="space-y-6">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-cyan-300">
          Gaming Marketplace
        </span>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Discover, buy, and trade games with a clean dark-first experience.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            This frontend scaffold is ready for marketplace listings, carts,
            profiles, and future API integration.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button>Explore Marketplace</Button>
          <button className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/5">
            Learn More
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 p-4">
            <p className="text-sm text-slate-400">Featured Drop</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              Next-gen titles, indie gems, and collectibles.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              Responsive layout
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              Tailwind ready
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              Router enabled
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              Toast support
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;
