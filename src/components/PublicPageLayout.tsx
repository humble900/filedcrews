import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface PublicPageLayoutProps {
  children: ReactNode;
}

const footerLinks = [
  { label: "About", to: "/about" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
  { label: "Support", to: "/support" },
  { label: "Account Deletion", to: "/account-deletion" },
];

export default function PublicPageLayout({ children }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/favicon.png" alt="FiledCrews" className="h-7 w-7 rounded-lg" />
            <span className="text-lg font-bold text-foreground">FiledCrews</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link>
            <Link to="/" className="text-primary font-medium hover:opacity-80 transition-opacity">Sign In</Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="FiledCrews" className="h-5 w-5 rounded-md" />
              <span className="font-semibold text-sm text-foreground">FiledCrews</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {footerLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} FiledCrews. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
