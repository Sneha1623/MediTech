import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  Bed,
  Building2,
  Clock,
  HeartPulse,
  Stethoscope,
  CheckCircle2
} from "lucide-react";
import {
  useGetDashboardSummary,
  useGetCriticalHospitals,
  useGetRecentBookings,
  getGetDashboardSummaryQueryKey,
  getGetCriticalHospitalsQueryKey,
  getGetRecentBookingsQueryKey
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";

function MetricCard({ title, value, icon: Icon, description, isLoading }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-[100px] mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const d = t.dashboard;

  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  const { data: criticalHospitals, isLoading: isCriticalLoading } = useGetCriticalHospitals({
    query: { queryKey: getGetCriticalHospitalsQueryKey() }
  });
  const { data: recentBookings, isLoading: isRecentLoading } = useGetRecentBookings({
    query: { queryKey: getGetRecentBookingsQueryKey() }
  });

  const criticalHospitalsList = Array.isArray(criticalHospitals) ? criticalHospitals : [];
  const recentBookingsList = Array.isArray(recentBookings) ? recentBookings : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{d.title}</h1>
        <p className="text-muted-foreground">{d.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={d.totalHospitals} value={summary?.totalHospitals ?? 0} icon={Building2} isLoading={isSummaryLoading} description={`${summary?.hospitalsAtCapacity ?? 0} ${d.atFullCapacity}`} />
        <MetricCard title={d.activeAmbulances} value={summary?.activeAmbulances ?? 0} icon={Ambulance} isLoading={isSummaryLoading} />
        <MetricCard title={d.avgResponseTime} value={`${summary?.avgResponseTime ?? 0} min`} icon={Clock} isLoading={isSummaryLoading} />
        <MetricCard title={d.criticalAlerts} value={summary?.criticalAlerts ?? 0} icon={AlertTriangle} isLoading={isSummaryLoading} description={d.actionRequired} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={d.availableICUBeds} value={summary?.availableIcuBeds ?? 0} icon={HeartPulse} isLoading={isSummaryLoading} />
        <MetricCard title={d.availableGenBeds} value={summary?.availableGeneralBeds ?? 0} icon={Bed} isLoading={isSummaryLoading} />
        <MetricCard title={d.pendingBookings} value={summary?.pendingBookings ?? 0} icon={Activity} isLoading={isSummaryLoading} />
        <MetricCard title={d.doctorsOnDuty} value={summary?.totalDoctorsOnDuty ?? 0} icon={Stethoscope} isLoading={isSummaryLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader><CardTitle>{d.recentEmergencyBookings}</CardTitle></CardHeader>
          <CardContent>
            {isRecentLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentBookingsList.length > 0 ? (
              <div className="space-y-4">
                {recentBookingsList.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{booking.patientName}</p>
                      <p className="text-sm text-muted-foreground">{booking.pickupAddress}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(booking.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={booking.emergency === "critical" ? "destructive" : booking.emergency === "moderate" ? "warning" : "default"} className={booking.emergency === "moderate" ? "bg-amber-500 hover:bg-amber-600" : ""}>
                        {booking.emergency.toUpperCase()}
                      </Badge>
                      <p className="text-sm mt-2">{booking.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4">{d.noRecentBookings}</p>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link href="/bookings" className="text-sm text-primary hover:underline font-medium">{d.viewAllBookings}</Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-destructive/50">
          <CardHeader className="bg-destructive/5 rounded-t-lg">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {d.hospitalsAtCapacity}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isCriticalLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : criticalHospitalsList.length > 0 ? (
              <div className="space-y-4">
                {criticalHospitalsList.map((hospital) => (
                  <div key={hospital.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{hospital.name}</p>
                      <p className="text-sm text-muted-foreground">{hospital.city}, {hospital.state}</p>
                    </div>
                    <Link href={`/hospitals/${hospital.id}`}>
                      <Badge variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer transition-colors">
                        {d.viewResources}
                      </Badge>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
                <p>{d.noCriticalHospitals}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link href="/hospitals" className="text-sm text-primary hover:underline font-medium">{d.viewAllHospitals}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
