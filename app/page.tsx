import { redirect } from "next/navigation";

// The site root is the login screen. Login lives at /login (with its own layout
// and metadata), so root simply redirects there — this is the first screen the
// user sees. Post-login routing (countdown vs. homepage) is decided by the
// login button based on LAUNCH_AT; see components/login/hero-section.tsx.
export default function RootPage() {
  redirect("/login");
}
