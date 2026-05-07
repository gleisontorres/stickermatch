import { Nav } from "@/components/nav";

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
