import { useGetEmergencyHotspots, useGetAnalyticsTrends, useGetResponseTimeStats, getGetEmergencyHotspotsQueryKey, getGetAnalyticsTrendsQueryKey, getGetResponseTimeStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown, Clock, AlertTriangle, MapPin, Activity, Award } from "lucide-react";
import { useI18n } from "@/lib/i18n";

function RiskBadge({ level, labels }: { level: string; labels: { highRisk: string; mediumRisk: string; lowRisk: string } }) {
  if (level === "high") return <Badge className="bg-red-500 hover:bg-red-600 text-white">{labels.highRisk}</Badge>;
  if (level === "medium") return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">{labels.mediumRisk}</Badge>;
  return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">{labels.lowRisk}</Badge>;
}

function RiskBar({ level }: { level: string }) {
  const pct = level === "high" ? 85 : level === "medium" ? 55 : 25;
  const color = level === "high" ? "bg-red-500" : level === "medium" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Analytics() {
  const { t } = useI18n();
  const a = t.analytics;

  const { data: hotspots, isLoading: hotspotsLoading } = useGetEmergencyHotspots({ query: { queryKey: getGetEmergencyHotspotsQueryKey() } });
  const { data: trends, isLoading: trendsLoading } = useGetAnalyticsTrends({ query: { queryKey: getGetAnalyticsTrendsQueryKey() } });
  const { data: responseStats, isLoading: statsLoading } = useGetResponseTimeStats({ query: { queryKey: getGetResponseTimeStatsQueryKey() } });

  const riskLabels = { highRisk: a.highRisk, mediumRisk: a.mediumRisk, lowRisk: a.lowRisk };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{a.title}</h1>
        <p className="text-muted-foreground">{a.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        ) : (
          <>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">{a.avgResponse}</p>
                </div>
                <p className="text-2xl font-bold" data-testid="stat-avg-response">{responseStats?.avgResponseTimeMinutes} min</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">{a.bestResponse}</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600" data-testid="stat-best-response">{responseStats?.bestResponseTimeMinutes} min</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-muted-foreground">{a.peakHour}</p>
                </div>
                <p className="text-2xl font-bold text-amber-600" data-testid="stat-success-rate">{responseStats?.successRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">{a.totalEmergencies}</p>
                </div>
                <p className="text-2xl font-bold text-primary" data-testid="stat-improvement">-{responseStats?.monthlyImprovement}%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{a.emergencyTrend}</CardTitle>
            <CardDescription>{a.emergencyTrendDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="emergencyCalls" name="Emergency Calls" stroke="hsl(186,70%,32%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ambulancesDispatched" name="Dispatched" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{a.responseTimeTrend}</CardTitle>
            <CardDescription>{a.responseTimeTrendDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v} min`} />
                  <Bar dataKey="avgResponseTime" name="Avg Response (min)" fill="hsl(186,70%,32%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{a.hotspots}</CardTitle>
          <CardDescription>{a.hotspotsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {hotspotsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotspots?.map(hotspot => (
                <div key={hotspot.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow" data-testid={`card-hotspot-${hotspot.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold leading-tight">{hotspot.area}</p>
                        <p className="text-xs text-muted-foreground">{hotspot.city}</p>
                      </div>
                    </div>
                    <RiskBadge level={hotspot.riskLevel} labels={riskLabels} />
                  </div>
                  <RiskBar level={hotspot.riskLevel} />
                  <p className="text-sm text-muted-foreground leading-relaxed">{hotspot.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-md p-2 text-center">
                      <p className="text-xs text-muted-foreground">Incidents/Month</p>
                      <p className="font-bold text-sm" data-testid={`stat-incidents-${hotspot.id}`}>{hotspot.incidentCount}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2 text-center">
                      <p className="text-xs text-muted-foreground">Predicted Demand</p>
                      <p className="font-bold text-sm" data-testid={`stat-demand-${hotspot.id}`}>{hotspot.predictedDemand} units</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
