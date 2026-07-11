"use client";

import { useEffect, useState } from "react";

export default function ClientOnlyChart({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64" />;
  }

  return <>{children}</>;
}
