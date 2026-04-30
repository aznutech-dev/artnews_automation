import Link from "next/link";
import { redirect } from "next/navigation";
import { clearTokens, decodeJwt, getToken } from "@/lib/api";

async function logoutAction() {
  "use server";
  await clearTokens();
  redirect("/login");
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getToken();
  if (!token) redirect("/login");
  const claims = decodeJwt(token);
  if (!claims) redirect("/login");

  const me = {
    full_name: "Admin",
    email: String(claims.sub ?? ""),
    role: String(claims.role ?? "editor") as "admin" | "editor",
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r bg-white">
        <div className="flex h-16 items-center border-b px-5 font-semibold">USA Update News</div>
        <nav className="flex flex-col gap-1 p-3 text-sm">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/articles">Articles</NavLink>
          <NavLink href="/categories">Categories</NavLink>
          {me.role === "admin" && <NavLink href="/api-keys">API Keys</NavLink>}
        </nav>
        <div className="absolute bottom-0 w-60 border-t p-4 text-sm">
          <div className="font-medium">{me.full_name}</div>
          <div className="text-xs text-slate-500">
            {me.email} · {me.role}
          </div>
          <form action={logoutAction}>
            <button className="mt-2 text-xs text-slate-600 hover:underline">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 hover:bg-slate-100"
    >
      {children}
    </Link>
  );
}
