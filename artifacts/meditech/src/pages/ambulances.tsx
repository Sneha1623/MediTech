import { useState } from "react";
import { useListAmbulances, useListHospitals, getListAmbulancesQueryKey, getListHospitalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Ambulance, Wrench, CheckCircle2, Navigation, Phone, Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

function StatusBadge({ status, labels }: { status: string; labels: { available: string; dispatched: string; maintenance: string } }) {
  if (status === "available") return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white" data-testid="badge-status">{labels.available}</Badge>;
  if (status === "dispatched") return <Badge className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="badge-status">{labels.dispatched}</Badge>;
  return <Badge variant="secondary" data-testid="badge-status">{labels.maintenance}</Badge>;
}

function TypeBadge({ type }: { type: string }) {
  if (type === "icu") return <Badge variant="outline" className="border-primary text-primary" data-testid="badge-type">ICU</Badge>;
  if (type === "advanced") return <Badge variant="outline" className="border-blue-500 text-blue-600" data-testid="badge-type">Advanced</Badge>;
  return <Badge variant="outline" data-testid="badge-type">Basic</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "available") return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
  if (status === "dispatched") return <Navigation className="h-8 w-8 text-amber-500" />;
  return <Wrench className="h-8 w-8 text-muted-foreground" />;
}

export default function Ambulances() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const { t } = useI18n();
  const a = t.ambulances;

  const params: Record<string, string | number> = {};
  if (statusFilter !== "all") params.status = statusFilter;
  if (hospitalFilter !== "all") params.hospitalId = Number(hospitalFilter);

  const { data: ambulances, isLoading } = useListAmbulances(
    params,
    { query: { queryKey: getListAmbulancesQueryKey(params) } }
  );
  const { data: hospitals } = useListHospitals({}, { query: { queryKey: getListHospitalsQueryKey({}) } });

  const totalAvailable = ambulances?.filter(a => a.status === "available").length ?? 0;
  const totalDispatched = ambulances?.filter(a => a.status === "dispatched").length ?? 0;
  const totalMaintenance = ambulances?.filter(a => a.status === "maintenance").length ?? 0;

  const statusLabels = { available: a.available, dispatched: a.dispatched, maintenance: a.maintenance };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{a.title}</h1>
          <p className="text-muted-foreground">{a.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder={a.allStatuses} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{a.allStatuses}</SelectItem>
              <SelectItem value="available">{a.available}</SelectItem>
              <SelectItem value="dispatched">{a.dispatched}</SelectItem>
              <SelectItem value="maintenance">{a.maintenance}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-hospital-filter">
              <SelectValue placeholder={a.allHospitals} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{a.allHospitals}</SelectItem>
              {hospitals?.map(h => (
                <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">{a.available}</p>
                <p className="text-2xl font-bold text-emerald-600" data-testid="count-available">{totalAvailable}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Navigation className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">{a.dispatched}</p>
                <p className="text-2xl font-bold text-amber-600" data-testid="count-dispatched">{totalDispatched}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{a.maintenance}</p>
                <p className="text-2xl font-bold text-muted-foreground" data-testid="count-maintenance">{totalMaintenance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ambulances?.map(ambulance => {
            const hospital = hospitals?.find(h => h.id === ambulance.hospitalId);
            return (
              <Card key={ambulance.id} className="hover:shadow-md transition-shadow" data-testid={`card-ambulance-${ambulance.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={ambulance.status} />
                      <div>
                        <CardTitle className="text-base font-bold">{ambulance.vehicleNumber}</CardTitle>
                        <p className="text-xs text-muted-foreground">{ambulance.type.toUpperCase()} {a.lifeSupport}</p>
                      </div>
                    </div>
                    <StatusBadge status={ambulance.status} labels={statusLabels} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{hospital?.name ?? a.unknownHospital}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Ambulance className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{ambulance.driverName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${ambulance.driverPhone}`} className="text-primary hover:underline">{ambulance.driverPhone}</a>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <TypeBadge type={ambulance.type} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && ambulances?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ambulance className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{a.noAmbulances}</p>
        </div>
      )}
    </div>
  );
}
