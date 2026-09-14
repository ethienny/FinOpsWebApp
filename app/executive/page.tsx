// Legacy route of the executive view. Redirects to the root, which renders it.

import { redirect } from "next/navigation";

export default function ExecutiveAlias() {
  redirect("/");
}
