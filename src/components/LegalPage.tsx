interface Section {
  title: string;
  body: string[];
}

export default function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: Section[] }) {
  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">LEGAL</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">{title}</h1>
          <p className="text-muted text-sm">Last updated: {updated}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10 space-y-10">
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className="font-serif text-xl text-goldLight mb-4">{s.title}</h3>
              <div className="space-y-3 text-sm text-muted leading-[1.9]">
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
