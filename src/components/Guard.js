"use client";

import { useEffect, useState } from "react";

import { getMe } from "../lib/auth";
import { useRouter } from "next/navigation";

export default function Guard({ allowRoles = [], children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const data = await getMe();
        if (!alive) return;

        const user = data?.user || data?.me || null;
        setMe(user);

        if (!user?.role) {
          router.replace("/login");
          return;
        }

        if (allowRoles.length && !allowRoles.includes(user.role)) {
          // redirect by role
          const map = {
            owner: "/owner",
            admin: "/admin",
            manager: "/manager",
            store_keeper: "/store-keeper",
            seller: "/seller",
            cashier: "/cashier",
          };
          router.replace(map[user.role] || "/login");
          return;
        }

        setReady(true);
      } catch {
        router.replace("/login");
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [router, allowRoles]);

  if (!ready)
    return <div className="p-6 text-sm text-gray-600">Loading...</div>;

  return children(me);
}
