"use client";

import { useState } from "react";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert("Error starting checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleUpgrade}
      disabled={loading}
      className="bg-emerald-500 text-black px-4 py-2 rounded-xl font-semibold hover:bg-emerald-400 transition disabled:opacity-60"
    >
      {loading ? "Redirecting..." : "Upgrade to Pro"}
    </button>
  );
}