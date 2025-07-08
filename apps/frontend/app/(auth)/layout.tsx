import ServiceWorkerHandler from "@/components/sw-handler";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthenticationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  return (
    <>
      {children}
      <ServiceWorkerHandler />
    </>
  );
}
