import { redirect } from "next/navigation";
import { defaultRoute } from "@/lib/navigation";

export default function RootPage() {
  redirect(defaultRoute);
}
