import { useListBookings, useUpdateBookingStatus, useListHospitals, getListBookingsQueryKey, getListHospitalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Ambulance, Clock, MapPin, Phone, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700 border-gray-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    dispatched: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${config[status] ?? ""}`} data-testid="badge-booking-status">
      {status}
    </span>
  );
}

function EmergencyBadge({ level }: { level: string }) {
  const config: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    moderate: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${config[level] ?? ""}`} data-testid="badge-emergency-level">
      {level}
    </span>
  );
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["dispatched", "cancelled"],
  dispatched: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export default function Bookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const { t } = useI18n();
  const b = t.bookings;

  const { data: bookings, isLoading } = useListBookings({ query: { queryKey: getListBookingsQueryKey() } });
  const { data: hospitals } = useListHospitals({}, { query: { queryKey: getListHospitalsQueryKey({}) } });

  const updateStatus = useUpdateBookingStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        toast({ title: b.statusUpdated, description: b.statusUpdatedDesc });
      },
      onError: () => {
        toast({ title: b.updateFailed, description: b.updateFailedDesc, variant: "destructive" });
      },
    },
  });

  const filteredBookings = bookings?.filter(bk => filterStatus === "all" || bk.status === filterStatus) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{b.title}</h1>
          <p className="text-muted-foreground">{b.subtitle}</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]" data-testid="select-booking-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{b.allStatuses}</SelectItem>
            <SelectItem value="pending">{b.pending}</SelectItem>
            <SelectItem value="confirmed">{b.confirmed}</SelectItem>
            <SelectItem value="dispatched">{b.dispatched}</SelectItem>
            <SelectItem value="completed">{b.completed}</SelectItem>
            <SelectItem value="cancelled">{b.cancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ambulance className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{b.noBookings}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...filteredBookings].reverse().map(booking => {
            const hospital = hospitals?.find(h => h.id === booking.destinationHospitalId);
            const nextStatuses = STATUS_TRANSITIONS[booking.status] ?? [];
            return (
              <Card key={booking.id} className="hover:shadow-md transition-shadow" data-testid={`card-booking-${booking.id}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 rounded-full p-2 shrink-0">
                        <Ambulance className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold" data-testid={`text-patient-name-${booking.id}`}>{booking.patientName}</span>
                          <StatusBadge status={booking.status} />
                          <EmergencyBadge level={booking.emergency} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{booking.patientPhone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            <span className="truncate">{hospital?.name ?? t.ambulances.unknownHospital}</span>
                          </div>
                          <div className="flex items-center gap-1.5 col-span-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{booking.pickupAddress}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{format(new Date(booking.createdAt), "dd MMM yyyy, hh:mm a")}</span>
                          <span className="ml-2 font-mono text-primary/70">#{booking.id}</span>
                        </div>
                      </div>
                    </div>
                    {nextStatuses.length > 0 && (
                      <div className="flex gap-2 shrink-0 flex-wrap">
                        {nextStatuses.map(nextStatus => (
                          <Button
                            key={nextStatus}
                            size="sm"
                            variant={nextStatus === "cancelled" ? "destructive" : "default"}
                            onClick={() => updateStatus.mutate({ id: booking.id, data: { status: nextStatus as any } })}
                            disabled={updateStatus.isPending}
                            className="capitalize"
                            data-testid={`button-status-${nextStatus}-${booking.id}`}
                          >
                            {nextStatus === "cancelled" ? b.cancel : `${b.updateStatus}: ${nextStatus}`}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  {booking.notes && (
                    <div className="mt-3 ml-11 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                      <span className="font-medium">Notes: </span>{booking.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
