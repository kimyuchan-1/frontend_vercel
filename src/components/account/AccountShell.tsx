export default function AccountShell(props: {
  nav: React.ReactNode;
  children: React.ReactNode;
}) {
  const { nav, children } = props;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <aside className="md:sticky md:top-6 h-fit">{nav}</aside>
        <main className="bg-white rounded-2xl shadow-sm border p-6">{children}</main>
      </div>
    </div>
  );
}
