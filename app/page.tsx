export default function Home() {
  return (
    <main className="imported-app-shell">
      <iframe
        className="imported-app-frame"
        src="/bankboken-multi/index.html"
        title="Split Happens"
        allow="clipboard-write"
      />
    </main>
  );
}
