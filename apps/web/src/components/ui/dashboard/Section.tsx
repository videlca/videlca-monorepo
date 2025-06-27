export function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border-1 border-gray-200 bg-white p-4">
      {children}
    </section>
  );
}
