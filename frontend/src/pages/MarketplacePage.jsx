import useDocumentTitle from "../hooks/useDocumentTitle.js";

function MarketplacePage() {
  useDocumentTitle("GameVault | Marketplace");

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold text-white">Marketplace</h1>
      <p className="max-w-2xl text-slate-300">
        Placeholder route for product listings, filters, game cards, and
        checkout flow.
      </p>
    </section>
  );
}

export default MarketplacePage;
