type FeaturePlaceholderProps = {
  title: string;
};

export function FeaturePlaceholder({ title }: FeaturePlaceholderProps) {
  return (
    <main className="px-4 pb-24 pt-7">
      <section className="flex min-h-[calc(100dvh-8.5rem)] items-center justify-center">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </section>
    </main>
  );
}
