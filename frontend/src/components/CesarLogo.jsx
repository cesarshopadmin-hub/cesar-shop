import logo from '../assets/logo.png';

export default function CesarLogo({ className = "w-8 h-8" }) {
  return (
    <img
      src={logo}
      alt="Cesar Logo"
      className={className}
    />
  );
}

