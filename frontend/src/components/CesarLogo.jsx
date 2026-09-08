import logo from '../assets/logo.png';

export default function CesarLogo({ className = "w-8 h-8", logoUrl = "" }) {
  return (
    <div className={`${className} rounded-xl border border-white/10 bg-cesar-darker/50 overflow-hidden shrink-0 flex items-center justify-center`}>
      <img
        src={logoUrl || logo}
        alt="Cesar Logo"
        className="w-full h-full object-contain "
        onError={(e) => { e.currentTarget.src = logo; }}
      />
    </div>
  );
}

