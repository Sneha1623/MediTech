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
  Stethoscope
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
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: criticalHospitals, isLoading: isCriticalLoading } = useGetCriticalHospitals({
    query: { queryKey: getGetCriticalHospitalsQueryKey() }
  });

  const { data: recentBookings, isLoading: isRecentLoading } = useGetRecentBookings({
    query: { queryKey: getGetRecentBookingsQueryKey() }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Real-time snapshot of healthcare resources and emergency operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Hospitals"
          value={summary?.totalHospitals ?? 0}
          icon={Building2}
          isLoading={isSummaryLoading}
          description={`${summary?.hospitalsAtCapacity ?? 0} at full capacity`}
        />
        <MetricCard
          title="Active Ambulances"
          value={summary?.activeAmbulances ?? 0}
          icon={Ambulance}
          isLoading={isSummaryLoading}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${summary?.avgResponseTime ?? 0} min`}
          icon={Clock}
          isLoading={isSummaryLoading}
        />
        <MetricCard
          title="Critical Alerts"
          value={summary?.criticalAlerts ?? 0}
          icon={AlertTriangle}
          isLoading={isSummaryLoading}
          description="Action required immediately"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Available ICU Beds"
          value={summary?.availableIcuBeds ?? 0}
          icon={HeartPulse}
          isLoading={isSummaryLoading}
        />
        <MetricCard
          title="Available Gen Beds"
          value={summary?.availableGeneralBeds ?? 0}
          icon={Bed}
          isLoading={isSummaryLoading}
        />
        <MetricCard
          title="Pending Bookings"
          value={summary?.pendingBookings ?? 0}
          icon={Activity}
          isLoading={isSummaryLoading}
        />
        <MetricCard
          title="Doctors on Duty"
          value={summary?.totalDoctorsOnDuty ?? 0}
          icon={Stethoscope}
          isLoading={isSummaryLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Emergency Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isRecentLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentBookings && recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{booking.patientName}</p>
                      <p className="text-sm text-muted-foreground">{booking.pickupAddress}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(booking.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        booking.emergency === "critical" ? "destructive" :
                        booking.emergency === "moderate" ? "warning" : "default"
                      } className={booking.emergency === "moderate" ? "bg-amber-500 hover:bg-amber-600" : ""}>
                        {booking.emergency.toUpperCase()}
                      </Badge>
                      <p className="text-sm mt-2">{booking.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4">No recent bookings found.</p>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link href="/bookings" className="text-sm text-primary hover:underline font-medium">
                View all bookings →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-destructive/50">
          <CardHeader className="bg-destructive/5 rounded-t-lg">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hospitals at Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isCriticalLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : criticalHospitals && criticalHospitals.length > 0 ? (
              <div className="space-y-4">
                {criticalHospitals.map((hospital) => (
                  <div key={hospital.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{hospital.name}</p>
                      <p className="text-sm text-muted-foreground">{hospital.city}, {hospital.state}</p>
                    </div>
                    <Link href={`/hospitals/${hospital.id}`}>
                      <Badge variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer transition-colors">
                        View Resources
                      </Badge>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
                <p>No hospitals currently at critical capacity.</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link href="/hospitals" className="text-sm text-primary hover:underline font-medium">
                View all hospitals →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}