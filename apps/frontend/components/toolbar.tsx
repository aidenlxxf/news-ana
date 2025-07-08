"use client";

import { Button } from "./ui/button";
import { Activity, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { useTransition } from "react";

import dynamic from "next/dynamic";
import { useUnsubscribeWebPush } from "@/hooks/web-push";
const NotificationButton = dynamic(
  () => import("@/components/subscribe-button"),
  {
    ssr: false,
    loading: () => {
      return (
        <Button disabled>
          <Activity className="size-4" /> Connecting...
        </Button>
      );
    },
  },
);

export default function Toolbar() {
  const [isPending, startTransition] = useTransition();
  const unsubscribe = useUnsubscribeWebPush();

  const handleLogout = () => {
    startTransition(async () => {
      await unsubscribe();
      await logoutAction();
    });
  };

  return (
    <div className="flex justify-end gap-2">
      <NotificationButton />
      <Button
        variant="outline"
        onClick={handleLogout}
        disabled={isPending}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <LogOut className="size-4 mr-2" />
        {isPending ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
}
