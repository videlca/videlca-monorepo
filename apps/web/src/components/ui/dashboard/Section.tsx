export function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 overflow-y-auto rounded-lg border-1 border-gray-200 bg-white px-8 pt-6 pb-14">
      {children}
    </section>
  );
}
