import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ROLES = new Set(["requester", "collector", "agent"]);

function getSafeNextPath(nextPath: string | null): string {
  if (!nextPath) return "/dashboard/home";
  if (!nextPath.startsWith("/")) return "/dashboard/home";
  if (nextPath.startsWith("//")) return "/dashboard/home";
  return nextPath;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const selectedRole = requestUrl.searchParams.get("role");
  const fullName = requestUrl.searchParams.get("full_name");

  const redirectUrl = new URL(nextPath, requestUrl.origin);
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(redirectUrl);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_oauth_code", requestUrl.origin));
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/login?error=oauth_exchange_failed", requestUrl.origin));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL("/login?error=oauth_user_unavailable", requestUrl.origin));
  }

  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  const metadataRole = typeof metadata.role === "string" ? metadata.role : null;
  const resolvedRole =
    selectedRole && ALLOWED_ROLES.has(selectedRole)
      ? selectedRole
      : metadataRole && ALLOWED_ROLES.has(metadataRole)
        ? metadataRole
        : "collector";

  const resolvedFullName =
    (fullName && fullName.trim()) ||
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    null;

  const { error: profileUpsertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || "",
      role: resolvedRole,
      full_name: resolvedFullName,
    },
    { onConflict: "id" }
  );

  if (profileUpsertError) {
    return NextResponse.redirect(new URL("/login?error=profile_upsert_failed", requestUrl.origin));
  }

  return response;
}
