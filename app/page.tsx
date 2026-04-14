import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="w-full flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link
          href="/"
          className="text-xl font-bold gradient-text tracking-tight"
        >
          Quikround
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/browse"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Live Rounds
          </Link>
          <Link
            href="/create"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Create a Round
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="animate-in">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-zinc-400 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Free to play — no signup required
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] animate-in-delay-1">
            Guess the number.
            <br />
            <span className="gradient-text">Beat your friends.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed animate-in-delay-2">
            Create a question, share a link, and see who can guess closest to
            the correct answer. Simple, fast, and ridiculously fun.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in-delay-3">
            <Link href="/create" className="btn-primary text-lg px-8 py-4">
              Start a Round
            </Link>
            <Link href="/browse" className="btn-secondary text-lg px-8 py-4">
              Browse Live Rounds
            </Link>
          </div>
        </div>
      </main>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="w-full max-w-5xl mx-auto px-6 py-24"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
          How It <span className="gradient-text">Works</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Create a Round",
              desc: "Enter a question with a numeric answer, or let AI generate one for you. Set a timer and go.",
            },
            {
              step: "02",
              title: "Share the Link",
              desc: "Send the unique link to your group. Anyone with the link can join — no accounts needed.",
            },
            {
              step: "03",
              title: "See Who Wins",
              desc: "When time's up, everyone sees the leaderboard. Closest guess wins. Furthest guess gets roasted.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="glass p-8 flex flex-col gap-4 glass-hover transition-all"
            >
              <span className="text-sm font-mono text-accent-light opacity-60">
                {item.step}
              </span>
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <span className="font-semibold gradient-text">Quikround</span>
          <span>Built for fun. No data sold. Ever.</span>
          <a
            href="mailto:contact@quikround.com"
            className="hover:text-white transition-colors"
          >
            contact@quikround.com
          </a>
        </div>
      </footer>
    </div>
  );
}
