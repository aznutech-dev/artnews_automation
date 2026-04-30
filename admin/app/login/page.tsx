import { redirect } from "next/navigation";
import { setTokens, API_BASE } from "@/lib/api";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!res.ok) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string };
  await setTokens(data.access_token, data.refresh_token);
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        action={loginAction}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        {sp.error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid email or password.
          </p>
        )}
        <input type="hidden" name="next" value={sp.next ?? "/dashboard"} />
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
