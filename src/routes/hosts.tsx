import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Server, Search, ShieldOff, Terminal, Eye } from "lucide-react";
import { SocLayout } from "@/components/soc/SocLayout";
import { Tag } from "@/components/soc/Badges";
import { hosts, type Host, type HostStatus } from "@/components/soc/extra-data";

export const Route = createFileRoute("/hosts")({
  component: HostsView,
  head: () => ({
    meta: [
      { title: "Hosts · Sentinel/Ops" },
      { name: "description", content: "Fleet overview, risk score and host status." },
    ],
  }),
});

const STATUSES: (HostStatus | "ALL")[] = ["ALL", "ONLINE", "OFFLINE", "ISOLATED", "STALE"];

function HostsView() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<HostStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<Host>(hosts[0]);

  const filtered = useMemo(
    () =>
      hosts.filter(
        (h) =>
          (status === "ALL" || h.status === status) &&
          (q === "" || (h.name + h.ip + h.tags.join(",")).toLowerCase().includes(q.toLowerCase())),
      ),
    [q, status],
  );

  return (
    <SocLayout title="HOSTS" sub={`// fleet · ${hosts.length} agents`}>
      <div className="h-full grid grid-cols-[1fr_360px] min-h-0">
        <div className="flex flex-col min-h-0 border-r border-border">
          {/* Toolbar */}
          <div className="border-b border-border bg-[var(--panel)] px-3 py-2 flex flex-wrap items-center gap-2">
            <Server className="h-3.5 w-3.5 text-info" />
            <span className="text-[12px] font-semibold tracking-wide">FLEET</span>

            <div className="ml-2 flex items-center gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={
                    "h-6 px-2 rounded-sm text-[11px] font-mono border " +
                    (status === s
                      ? "bg-accent border-border text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent")
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 h-6 w-[280px] px-2 rounded-sm bg-input border border-border">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="host, ip, tag…"
                className="bg-transparent flex-1 outline-none text-[11.5px] font-mono placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[11.5px] font-mono">
              <thead className="sticky top-0 bg-[var(--panel)] border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>Hostname</Th>
                  <Th align="right">Risk</Th>
                  <Th>Status</Th>
                  <Th>Last Seen</Th>
                  <Th align="right">Alerts</Th>
                  <Th>OS</Th>
                  <Th>IP</Th>
                  <Th>Tags</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const isSel = h.name === selected.name;
                  return (
                    <tr
                      key={h.name}
                      onClick={() => setSelected(h)}
                      className={
                        "cursor-pointer border-b border-border/60 hover:bg-[var(--row-hover)] " +
                        (isSel ? "bg-[var(--row-hover)]" : "")
                      }
                    >
                      <Td>
                        <span
                          className={
                            "border-l-2 pl-2 -ml-2 inline-block " +
                            (h.risk >= 80
                              ? "border-l-critical"
                              : h.risk >= 60
                                ? "border-l-high"
                                : h.risk >= 40
                                  ? "border-l-warning"
                                  : "border-l-success/50")
                          }
                        >
                          {h.name}
                        </span>
                      </Td>
                      <Td align="right">
                        <RiskCell risk={h.risk} />
                      </Td>
                      <Td>
                        <StatusDot status={h.status} />
                      </Td>
                      <Td className="text-muted-foreground">{h.lastSeen}</Td>
                      <Td align="right">{h.alerts}</Td>
                      <Td className="text-muted-foreground">{h.os}</Td>
                      <Td className="text-muted-foreground">{h.ip}</Td>
                      <Td>
                        <span className="flex flex-wrap gap-1">
                          {h.tags.map((t) => (
                            <Tag key={t}>#{t}</Tag>
                          ))}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Context */}
        <aside className="bg-[var(--panel)] flex flex-col min-h-0">
          <div className="h-9 px-3 flex items-center border-b border-border">
            <span className="text-[12px] font-semibold tracking-wide">HOST</span>
            <span className="ml-2 text-[10.5px] font-mono text-muted-foreground">{selected.name}</span>
            <span className="ml-auto"><StatusDot status={selected.status} /></span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sec title="Identity">
              <KV k="ip" v={selected.ip} />
              <KV k="os" v={selected.os} />
              <KV k="seen" v={selected.lastSeen + " ago"} />
              <KV k="alerts" v={String(selected.alerts)} />
            </Sec>
            <Sec title="Risk Score">
              <div className="flex items-baseline gap-2">
                <span className={"text-[28px] font-mono font-semibold " + riskColor(selected.risk)}>
                  {selected.risk}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-1 h-1 w-full bg-muted rounded-sm overflow-hidden">
                <div
                  className={"h-full " + riskBg(selected.risk)}
                  style={{ width: `${selected.risk}%` }}
                />
              </div>
              <div className="mt-2 grid grid-cols-12 gap-[2px]">
                {Array.from({ length: 24 }).map((_, i) => {
                  const v = Math.max(8, Math.round(selected.risk * (0.5 + Math.sin(i * 0.6) * 0.4)));
                  return (
                    <div
                      key={i}
                      title={`h-${24 - i}`}
                      className={"h-6 rounded-[1px] " + riskBg(v)}
                      style={{ opacity: 0.2 + (v / 100) * 0.8 }}
                    />
                  );
                })}
              </div>
              <div className="mt-1 text-[10px] font-mono text-muted-foreground">last 24h</div>
            </Sec>
            <Sec title="Top Events">
              {[
                { eid: "4688", n: 124, t: "process create" },
                { eid: "7045", n: 3, t: "service install" },
                { eid: "10", n: 8, t: "process access" },
                { eid: "3", n: 41, t: "network connect" },
              ].map((e) => (
                <div
                  key={e.eid}
                  className="grid grid-cols-[50px_1fr_40px] gap-2 text-[11.5px] font-mono py-1 border-b border-border/60 last:border-0"
                >
                  <span className="text-info">[{e.eid}]</span>
                  <span className="text-muted-foreground truncate">{e.t}</span>
                  <span className="text-right">{e.n}</span>
                </div>
              ))}
            </Sec>
            <Sec title="Active Incidents">
              <div className="space-y-1">
                <Linkish text="INC-10481 · suspicious service" tone="critical" />
                <Linkish text="INC-10477 · scheduled task" tone="warning" />
              </div>
            </Sec>
            <Sec title="Quick Actions">
              <div className="flex flex-wrap gap-1.5">
                <ActBtn icon={Eye} label="Investigate" />
                <ActBtn icon={ShieldOff} label="Isolate Host" tone="critical" />
                <ActBtn icon={Terminal} label="Run Script" />
              </div>
            </Sec>
          </div>
        </aside>
      </div>
    </SocLayout>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={"px-3 py-2 font-medium " + (align === "right" ? "text-right" : "text-left")}>
      {children}
    </th>
  );
}
function Td({
  children,
  align,
  className = "",
}: {
  children: React.ReactNode;
  align?: "right";
  className?: string;
}) {
  return (
    <td className={"px-3 py-1.5 " + (align === "right" ? "text-right " : "") + className}>
      {children}
    </td>
  );
}

function riskColor(r: number) {
  return r >= 80 ? "text-critical" : r >= 60 ? "text-high" : r >= 40 ? "text-warning" : "text-success";
}
function riskBg(r: number) {
  return r >= 80 ? "bg-critical" : r >= 60 ? "bg-high" : r >= 40 ? "bg-warning" : "bg-success";
}

function RiskCell({ risk }: { risk: number }) {
  return (
    <span className={"font-semibold " + riskColor(risk)}>{risk}</span>
  );
}

function StatusDot({ status }: { status: HostStatus }) {
  const map: Record<HostStatus, { c: string; t: string }> = {
    ONLINE: { c: "bg-success", t: "online" },
    OFFLINE: { c: "bg-muted-foreground", t: "offline" },
    ISOLATED: { c: "bg-critical", t: "isolated" },
    STALE: { c: "bg-warning", t: "stale" },
  };
  const m = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono">
      <span className={"h-1.5 w-1.5 rounded-full " + m.c} />
      {m.t}
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
    <div className="flex gap-2 text-[11.5px] font-mono">
      <span className="text-muted-foreground w-14">{k}</span>
      <span className="truncate">{v}</span>
    </div>
  );
}
function Linkish({ text, tone }: { text: string; tone: "critical" | "warning" }) {
  const c = tone === "critical" ? "border-l-critical text-critical" : "border-l-warning text-warning";
  return (
    <div className={"text-[11.5px] font-mono pl-2 border-l-2 " + c}>{text}</div>
  );
}
function ActBtn({
  icon: Icon,
  label,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "default" | "critical";
}) {
  const t =
    tone === "critical"
      ? "border-critical/50 hover:bg-critical/15 text-critical"
      : "border-border hover:bg-accent text-foreground";
  return (
    <button className={"h-6 px-2 rounded-sm border text-[11px] font-mono inline-flex items-center gap-1 " + t}>
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
