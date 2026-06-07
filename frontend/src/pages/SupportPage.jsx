import useDocumentTitle from "../hooks/useDocumentTitle.js";

function SupportPage() {
  useDocumentTitle("GameVault | Support");

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold text-white">Support</h1>
      <p className="max-w-2xl text-slate-300">
        Placeholder route for help center articles, contact forms, and account
        support.
      </p>
    </section>
  );
}

export default SupportPage;
