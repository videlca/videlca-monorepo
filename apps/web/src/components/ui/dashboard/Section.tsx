export function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg pt-6 pb-16 md:px-2">
      {children}
    </section>
  );
}
