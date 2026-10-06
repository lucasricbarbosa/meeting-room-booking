"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

// Mounted by the page a server action redirected to: a toast fired before redirect() would never show.
export function SuccessToast({ message }: { message: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // The id dedupes the effect running twice in development (StrictMode).
    toast.success(message, { id: message });
    // Drops the query param, so a refresh does not show the toast again.
    router.replace(pathname, { scroll: false });
  }, [message, pathname, router]);

  return null;
}
