import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="pt-40 pb-40 text-center bg-navy min-h-screen">
      <div className="eyebrow mb-4">404</div>
      <h1 className="font-serif text-4xl mb-6">This Page Has No Signature</h1>
      <p className="text-muted mb-10">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-gold-fill">RETURN HOME</Link>
    </div>
  );
}
