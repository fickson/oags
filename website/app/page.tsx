import {
  Fingerprint,
  ScrollText,
  BadgeCheck,
  FileCode,
  Cpu,
  Search,
  ArrowRight,
  Terminal,
  ExternalLink,
  BookOpen,
  Users,
  MessageSquare,
  Scale,
  CirclePlus,
  Bug,
  Lightbulb,
} from "lucide-react";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";

const primitives = [
  {
    icon: Fingerprint,
    title: "Deterministic Identity",
    description:
      "Content-addressable agent IDs via BLAKE3 hash of model, prompt, and tools. Same configuration always produces the same identity.",
  },
  {
    icon: FileCode,
    title: "Policy Declaration",
    description:
      "Declarative constraints on network access, filesystem, tools, models, APIs, and rate limits defined in sekuire.yml.",
  },
  {
    icon: Cpu,
    title: "Runtime Enforcement",
    description:
      "Policies enforced at execution time with allow, deny, and warn decisions. Not just documentation - actual runtime checks.",
  },
  {
    icon: ScrollText,
    title: "Audit Trail",
    description:
      "Structured, tamper-evident event logging with optional Ed25519 signing. Every policy decision is recorded.",
  },
  {
    icon: Search,
    title: "Cryptographic Verification",
    description:
      "Multi-stage security scoring with compliance framework support. Verify agent behavior against declared policy.",
  },
];

const steps = [
  {
    step: "01",
    title: "Define",
    label: "sekuire.yml",
    description:
      "Declare your agent\u2019s identity, permitted tools, network access, and runtime constraints in a single configuration file.",
  },
  {
    step: "02",
    title: "Enforce",
    label: "Runtime Checks",
    description:
      "The SDK enforces declared policies at execution time. Every tool call, network request, and API access is checked against policy.",
  },
  {
    step: "03",
    title: "Verify",
    label: "Audit + Signatures",
    description:
      "Generate tamper-evident audit trails with Ed25519 signatures. Third parties can independently verify agent compliance.",
  },
];

const conformanceLevels = [
  {
    level: "L1",
    title: "Identity + Policy",
    color: "text-muted-foreground",
    borderColor: "border-border/60",
    items: [
      "Agent computes SekuireID from BLAKE3 hash",
      "Declares policy in sekuire.yml",
      "Policy schema validates correctly",
    ],
  },
  {
    level: "L2",
    title: "Runtime Enforcement",
    color: "text-primary",
    borderColor: "border-primary/40",
    items: [
      "Everything in Level 1",
      "Runtime enforcement of declared policies",
      "PolicyDecision events for every action",
      "Deny/warn on policy violations",
    ],
  },
  {
    level: "L3",
    title: "Verifiable Audit Trail",
    color: "text-status-active",
    borderColor: "border-status-active/40",
    items: [
      "Everything in Level 2",
      "Ed25519 signed audit events",
      "Third-party verification support",
      "Compliance framework scoring",
    ],
  },
];

const implementations = [
  {
    name: "TypeScript SDK",
    status: "available",
    pkg: "@sekuire/sdk",
    install: "npm install @sekuire/sdk",
    repo: "https://github.com/sekuire/sdk",
    description: "Multi-provider LLM support, local policy enforcement, structured audit logging.",
  },
  {
    name: "Python SDK",
    status: "coming-soon",
    pkg: "sekuire-sdk",
    repo: "https://github.com/sekuire/python-sdk",
    description: "Reference Python implementation is in progress and will be released soon.",
  },
  {
    name: "Rust SDK",
    status: "coming-soon",
    pkg: "sekuire-sdk",
    repo: "https://github.com/sekuire/rust-sdk",
    description: "Reference Rust implementation is in progress and will be released soon.",
  },
  {
    name: "CLI",
    status: "available",
    pkg: "sekuire-cli",
    install: "curl -fsSL https://install.sekuire.ai | sh",
    repo: "https://github.com/sekuire/cli",
    description: "Init projects, generate Ed25519 keys, compute identity hashes, publish and verify agents.",
  },
];

const sekuireYml = `agent:
  name: "my-agent"
  version: "1.0.0"
  model: "claude-sonnet-4-20250514"

identity:
  signing_key_path: "./keys/agent.ed25519"

policy:
  network:
    allowed_domains:
      - "api.openai.com"
      - "api.anthropic.com"
    deny_all_other: true

  tools:
    allowed:
      - "web_search"
      - "file_read"
    require_confirmation:
      - "file_write"
      - "shell_execute"

  rate_limits:
    max_requests_per_minute: 60
    max_tokens_per_hour: 100000

  audit:
    level: "full"
    sign_events: true`;

const oagsJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  name: "Open Agent Governance Specification (OAGS)",
  headline: "OAGS - Open Agent Governance Specification",
  description:
    "An open specification for identity, policy, enforcement, audit, and verification of autonomous AI agents.",
  url: "https://oags.sekuire.ai",
  publisher: {
    "@type": "Organization",
    name: "Sekuire",
    url: "https://sekuire.ai",
  },
  mainEntityOfPage: "https://oags.sekuire.ai",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(oagsJsonLd) }}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.68_0.13_208/0.08),transparent_60%)]" />
        <div className="section-container relative flex flex-col items-center pt-28 pb-20 text-center">
          <div className="badge mb-6">v0.1.1 Draft</div>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Open Agent Governance{" "}
            <span className="text-primary">Specification</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            An open specification for identity, policy, enforcement, audit, and
            verification of autonomous AI agents.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="https://github.com/sekuire/oags/tree/main/specs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <BookOpen className="h-4 w-4" />
              Read the Spec
            </a>
            <a
              href="https://github.com/sekuire/oags"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/50"
            >
              View on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Primitives */}
      <section id="primitives">
        <div className="section-container">
          <div className="mb-12 text-center">
            <div className="badge mb-4 inline-block">Core Primitives</div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Five pillars of agent governance
            </h2>
            <p className="mt-4 text-muted-foreground">
              OAGS defines five composable primitives that work together to make
              AI agent behavior auditable, predictable, and verifiable.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {primitives.map((p) => (
              <div key={p.title} className="glass-card p-6">
                <p.icon className="mb-4 h-6 w-6 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">{p.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works">
        <div className="section-container">
          <div className="mb-12 text-center">
            <div className="badge mb-4 inline-block">How It Works</div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Three steps to governed agents
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="glass-card flex flex-col p-6">
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.step}
                  </span>
                  <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                  <span className="mt-1 font-mono text-xs text-primary">
                    {s.label}
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden items-center justify-center md:absolute md:-right-3 md:top-1/2 md:flex md:-translate-y-1/2">
                    <ArrowRight className="h-5 w-5 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conformance Levels */}
      <section id="conformance">
        <div className="section-container">
          <div className="mb-12 text-center">
            <div className="badge mb-4 inline-block">Conformance</div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Three levels of compliance
            </h2>
            <p className="mt-4 text-muted-foreground">
              Implementations can conform at different levels, allowing
              incremental adoption.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {conformanceLevels.map((cl) => (
              <div
                key={cl.level}
                className={`glass-card border-l-2 ${cl.borderColor} p-6`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-2xl font-bold ${cl.color}`}
                  >
                    {cl.level}
                  </span>
                  <h3 className="text-lg font-semibold">{cl.title}</h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {cl.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <BadgeCheck
                        className={`mt-0.5 h-4 w-4 shrink-0 ${cl.color}`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section id="example">
        <div className="section-container">
          <div className="mb-12 text-center">
            <div className="badge mb-4 inline-block">Example</div>
            <h2 className="text-3xl font-bold md:text-4xl">sekuire.yml</h2>
            <p className="mt-4 text-muted-foreground">
              A single file defines your agent&apos;s identity, policies, and audit
              configuration.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-xl border border-border/40">
              <div className="flex items-center gap-2 border-b border-border/40 bg-[oklch(0.10_0.015_250)] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[oklch(0.60_0.20_25)]" />
                  <div className="h-3 w-3 rounded-full bg-[oklch(0.80_0.16_84)]" />
                  <div className="h-3 w-3 rounded-full bg-[oklch(0.72_0.15_170)]" />
                </div>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  sekuire.yml
                </span>
              </div>
              <pre className="overflow-x-auto bg-[oklch(0.10_0.015_250)] p-4 font-mono text-[13px] leading-relaxed text-foreground/80">
                <code>{sekuireYml}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Implementations */}
      <section id="implementations">
        <div className="section-container">
          <div className="mb-12 text-center">
            <div className="badge mb-4 inline-block">Implementations</div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Get started with any language
            </h2>
            <p className="mt-4 text-muted-foreground">
              Official SDKs and tools that implement the OAGS specification.
              TypeScript and CLI are available now. Python and Rust are coming soon.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {implementations.map((impl) => (
              <div key={impl.name} className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{impl.name}</h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                        impl.status === "coming-soon"
                          ? "border-border/70 text-muted-foreground"
                          : "border-primary/40 text-primary"
                      }`}
                    >
                      {impl.status === "coming-soon" ? "Coming Soon" : "Available"}
                    </span>
                  </div>
                  <a
                    href={impl.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {impl.description}
                </p>
                {impl.install ? (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-[oklch(0.10_0.015_250)] px-3 py-2">
                    <Terminal className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <code className="flex-1 font-mono text-xs text-foreground/80">
                      {impl.install}
                    </code>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-border/50 bg-[oklch(0.10_0.015_250)] px-3 py-2 text-muted-foreground text-xs">
                    Installation command will be published at launch.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="community">
        <div className="section-container">
          <div className="mb-12 text-center">
            <div className="badge mb-4 inline-block">Community</div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Built in the open
            </h2>
            <p className="mt-4 text-muted-foreground">
              OAGS is an open specification. Contributions, feedback, and
              implementations are welcome.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="https://github.com/sekuire/oags/issues/new?template=bug_report.md&title=%5BBug%5D+Brief+description"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card flex items-start gap-4 p-6 transition-colors hover:border-primary/40"
            >
              <Bug className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">Report a Bug</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Found an issue in the spec or an SDK? Open a bug report on
                  GitHub.
                </p>
              </div>
            </a>
            <a
              href="https://github.com/sekuire/oags/issues/new?template=feature_request.md&title=%5BRFC%5D+Brief+description"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card flex items-start gap-4 p-6 transition-colors hover:border-primary/40"
            >
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">Propose a Change</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Have an idea for the specification? Open an RFC to start a
                  discussion.
                </p>
              </div>
            </a>
            <a
              href="https://github.com/sekuire/oags/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card flex items-start gap-4 p-6 transition-colors hover:border-primary/40"
            >
              <CirclePlus className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">Open an Issue</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  General questions, feedback, or anything else - create a new
                  issue.
                </p>
              </div>
            </a>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <a
              href="https://github.com/sekuire/oags/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card flex items-start gap-4 p-6 transition-colors hover:border-primary/40"
            >
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Contributing Guide</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Learn how to propose changes, submit RFCs, and contribute to
                  the specification.
                </p>
              </div>
            </a>
            <a
              href="https://github.com/sekuire/oags/blob/main/CODE_OF_CONDUCT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card flex items-start gap-4 p-6 transition-colors hover:border-primary/40"
            >
              <Scale className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Code of Conduct</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  We are committed to providing a welcoming and inclusive
                  environment for everyone.
                </p>
              </div>
            </a>
            <a
              href="https://github.com/sekuire/oags/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card flex items-start gap-4 p-6 transition-colors hover:border-primary/40"
            >
              <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Browse Issues</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  See existing discussions, bugs, and feature requests on
                  GitHub.
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
