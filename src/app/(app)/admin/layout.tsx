import { requireAdmin } from "@/server/auth";

// Layouts do not re-render on every navigation, so each admin page and action checks again.
// No loading.tsx under /admin: with one above a page, its notFound() would be streamed with status 200.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return children;
}
