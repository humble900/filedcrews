import React, { useState } from "react";
import MobileOnboardingModal from "@/components/MobileOnboardingModal";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";

export default function MobileWelcomePage() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsOpen(false);
    navigate("/");
  };

  return (
    <>
      <SEO
        title="Mobile App Guide & Sole Trader Quickstart — FiledCrews"
        description="Learn how FiledCrews connects mobile field crews with the web admin dashboard, explore industry vertical workflows, and start your free workspace."
        path="/mobile-welcome"
      />
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <MobileOnboardingModal isOpen={isOpen} onClose={handleClose} />
      </div>
    </>
  );
}
