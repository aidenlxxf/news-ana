import { redirect } from "next/navigation";

export function handleNextRedirect(form: FormData) {
  if (!form.has("next")) return false;
  const fieldValue = form.get("next");
  if (typeof fieldValue !== "string" || !fieldValue.startsWith("/"))
    return false;
  redirect(fieldValue);
}
