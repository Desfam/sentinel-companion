import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GitCompareArrows, Cpu, KeyRound, Wrench, Network, Check, Eye } from "lucide-react";
import { SocLayout } from "@/components/soc/SocLayout";
import {
  baselineProfiles,
  baselineNormal,
  baselineDeviations,
  type BaselineItem,
  type DevState,
} from "@/components/soc/extra-data";

export const Route = createFileRoute("/baseline")({
  component: BaselineView,
  head: () => ({
    meta: [
      { title: "Baseline · Sentinel/Ops" },
      { name: "description", content: "Define normal vs abnormal behavior across the fleet." },
    ],
  }),
});

function BaselineView() {
  const [profile, setProfile] = useState(baselineProfiles[0].id);
  const [selected, setSelected] = useState<BaselineItem>(baselineDeviations[0]);

  return (
    <SocLayout title="BASELINE" sub={`// profile · ${profile}`}>
      <div className="h-full grid grid-cols-[200px_1fr_360px] min-h-0">
        {/* Left profiles */}
        <aside className="border-r border-border bg-[var(--panel)] flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Profiles
          </div>
          {baselineProfiles.map((p) => {
            const sel = p.id === profile;
            return (
              <button
                key={p.id}
                onClick={() => setProfile(p.id)}
                className={
                  "w-full text-left px-3 py-2 border-b border-border/60 hover:bg-[var(--row-hover)] " +
                  (sel ? "bg-[var(--row-hover)] border-l-2 border-l-primary -ml-px pl-[11px]" : "")
                }
              >
                <div className="text-[12.5px] font-medium">{p.name}</div>
                <div className="text-[10.5px] font-mono text-muted-foreground">
                  {p.hosts} hosts · learned 14d
                </div>
              </button>
            );
          })}
          <div className="mt-auto px-3 py-2 border-t border-border text-[10.5px] font-mono text-muted-foreground space-y-0.5">
            <div className="flex justify-between"><span>normal</span><span className="text-success">{baselineNormal.length}</span></div>
            <div className="flex justify-between"><span>unusual</span><span className="text-warning">{baselineDeviations.filter(d => d.state === "unusual").length}</span></div>
            <div className="flex justify-between"><span>abnormal</span><span className="text-critical">{baselineDeviations.filter(d => d.state === "abnormal").length}</span></div>
          </div>
        </aside>

        {/* Center: tables */}
        <div className="flex flex-col min-h-0 border-r border-border overflow-y-auto">
          <Header
            title="NORMAL"
            sub={`${baselineNormal.length} accepted`}
            tone="success"
            icon={GitCompareArrows}
          />
          <ItemTable items={baselineNormal} onSelect={setSelected} selected={selected} />

          <Header
            title="DEVIATIONS"
            sub={`${baselineDeviations.length} flagged · last 24h`}
            tone="critical"
            icon={GitCompareArrows}
          />
          <ItemTable items={baselineDeviations} onSelect={setSelected} selected={selected} />
        </div>

        {/* Right: detail */}
        <aside className="bg-[var(--panel)] flex flex-col min-h-0">
          <div className="h-9 px-3 flex items-center border-b border-border">
            <span className="text-[12px] font-semibold tracking-wide">DETAIL</span>
            <span className="ml-2 text-[10.5px] font-mono text-muted-foreground truncate">
              {selected.name}
            </span>
            <span className="ml-auto"><StateBadge state={selected.state} /></span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Sec title="Identity">
              <KV k="kind" v={selected.kind} />
              <KV k="name" v={selected.name} />
              <KV k="freq" v={selected.freq} />
              <KV k="last seen" v={selected.lastSeen} />
            </Sec>

            <Sec title="Deviation Score">
              <div className="flex items-baseline gap-2">
                <span
                  className={
                    "text-[28px] font-mono font-semibold " +
                    (selected.state === "abnormal"
                      ? "text-critical"
                      : selected.state === "unusual"
                        ? "text-warning"
                        : "text-success")
                  }
                >
                  {selected.score}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-1 h-1 w-full bg-muted rounded-sm overflow-hidden">
                <div
                  className={
                    "h-full " +
                    (selected.state === "abnormal"
                      ? "bg-critical"
                      : selected.state === "unusual"
                        ? "bg-warning"
                        : "bg-success")
                  }
                  style={{ width: `${selected.score}%` }}
                />
              </div>
            </Sec>

            <Sec title="Seen On">
              {["BANK_12_01", "RZ_MANU2", "DC01"].map((h) => (
                <div
                  key={h}
                  className="flex items-center justify-between text-[11.5px] font-mono py-1 border-b border-border/60 last:border-0"
                >
                  <span>{h}</span>
                  <span className="text-muted-foreground">{Math.round(Math.random() * 12)}×</span>
                </div>
              ))}
            </Sec>

            <Sec title="Actions">
              <div className="flex flex-wrap gap-1.5">
                <ActBtn icon={Check} label="Accept as baseline" tone="success" />
                <ActBtn icon={Eye} label="Investigate" />
              </div>
            </Sec>
          </div>
        </aside>
      </div>
    </SocLayout>
  );
}

function Header({
  title,
  sub,
  tone,
  icon: Icon,
}: {
  title: string;
  sub: string;
  tone: "success" | "critical";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const c = tone === "critical" ? "text-critical" : "text-success";
  return (
    <div className="px-3 py-2 border-b border-border bg-[var(--panel)] flex items-center gap-2 sticky top-0 z-10">
      <Icon className={"h-3.5 w-3.5 " + c} />
      <span className="text-[12px] font-semibold tracking-wide">{title}</span>
      <span className="text-[10.5px] font-mono text-muted-foreground">{sub}</span>
    </div>
  );
}

function ItemTable({
  items,
  onSelect,
  selected,
}: {
  items: BaselineItem[];
  onSelect: (i: BaselineItem) => void;
  selected: BaselineItem;
}) {
  return (
    <table className="w-full text-[11.5px] font-mono">
      <thead className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
        <tr>
          <th className="px-3 py-1.5 text-left font-medium w-[28px]"></th>
          <th className="px-3 py-1.5 text-left font-medium">Name</th>
          <th className="px-3 py-1.5 text-left font-medium w-[80px]">Kind</th>
          <th className="px-3 py-1.5 text-right font-medium w-[80px]">Freq</th>
          <th className="px-3 py-1.5 text-right font-medium w-[80px]">Last</th>
          <th className="px-3 py-1.5 text-right font-medium w-[60px]">Score</th>
          <th className="px-3 py-1.5 text-left font-medium w-[90px]">State</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => {
          const sel = it.name === selected.name && it.kind === selected.kind;
          const Icon =
            it.kind === "process" ? Cpu : it.kind === "user" ? KeyRound : it.kind === "service" ? Wrench : Network;
          return (
            <tr
              key={it.kind + it.name}
              onClick={() => onSelect(it)}
              className={
                "border-b border-border/60 cursor-pointer hover:bg-[var(--row-hover)] " +
                (sel ? "bg-[var(--row-hover)]" : "")
              }
            >
              <td className="px-3 py-1.5">
                <span
                  className={
                    "inline-block h-1.5 w-1.5 rounded-full " +
                    (it.state === "abnormal"
                      ? "bg-critical"
                      : it.state === "unusual"
                        ? "bg-warning"
                        : "bg-success")
                  }
                />
              </td>
              <td className="px-3 py-1.5 truncate">
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  {it.name}
                </span>
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">{it.kind}</td>
              <td className="px-3 py-1.5 text-right text-muted-foreground">{it.freq}</td>
              <td className="px-3 py-1.5 text-right text-muted-foreground">{it.lastSeen}</td>
              <td
                className={
                  "px-3 py-1.5 text-right font-semibold " +
                  (it.state === "abnormal"
                    ? "text-critical"
                    : it.state === "unusual"
                      ? "text-warning"
                      : "text-success")
                }
              >
                {it.score}
              </td>
              <td className="px-3 py-1.5">
                <StateBadge state={it.state} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function StateBadge({ state }: { state: DevState }) {
  const map = {
    normal: "bg-success/15 text-success border-success/40",
    unusual: "bg-warning/15 text-warning border-warning/40",
    abnormal: "bg-critical/15 text-critical border-critical/40",
  } as const;
  return (
    <span
      className={
        "inline-flex items-center h-[18px] px-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wider border " +
        map[state]
      }
    >
      {state}
    </span>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 border-b border-border">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2 text-[11.5px] font-mono py-0.5">
      <span className="text-muted-foreground w-16">{k}</span>
      <span className="truncate">{v}</span>
    </div>
  );
}
function ActBtn({
  icon: Icon,
  label,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "default" | "success";
}) {
  const t =
    tone === "success"
      ? "border-success/40 hover:bg-success/10 text-success"
      : "border-border hover:bg-accent text-foreground";
  return (
    <button className={"h-6 px-2 rounded-sm border text-[11px] font-mono inline-flex items-center gap-1 " + t}>
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
