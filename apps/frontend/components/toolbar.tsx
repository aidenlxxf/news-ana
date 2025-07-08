"use client";

import { Button } from "./ui/button";
import { Activity } from "lucide-react";

import dynamic from "next/dynamic";
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
  return (
    <div className="flex justify-end">
      <NotificationButton />
    </div>
  );
}
