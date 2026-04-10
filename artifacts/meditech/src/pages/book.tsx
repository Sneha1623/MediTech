import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateBooking, useListHospitals, getListHospitalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Ambulance, CheckCircle2, Clock, AlertTriangle, PhoneCall } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const bookingSchema = z.object({
  patientName: z.string().min(2, "Name must be at least 2 characters"),
  patientPhone: z.string().min(10, "Enter a valid phone number"),
  pickupAddress: z.string().min(5, "Enter a valid pickup address"),
  destinationHospitalId: z.string().min(1, "Select a destination hospital"),
  emergency: z.enum(["critical", "moderate", "low"]),
  notes: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

function EmergencyBadge({ level }: { level: string }) {
  const config = {
    critical: { label: "Critical", className: "bg-red-100 text-red-700 border-red-200" },
    moderate: { label: "Moderate", className: "bg-amber-100 text-amber-700 border-amber-200" },
    low: { label: "Low", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  }[level] ?? { label: level, className: "" };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

export default function Book() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmedBooking, setConfirmedBooking] = useState<{ id: number; status: string; emergency: string; hospital: string } | null>(null);

  const { data: hospitals, isLoading: hospitalsLoading } = useListHospitals(
    {},
    { query: { queryKey: getListHospitalsQueryKey({}) } }
  );

  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: (booking) => {
        const hospital = hospitals?.find(h => h.id === booking.destinationHospitalId);
        setConfirmedBooking({
          id: booking.id,
          status: booking.status,
          emergency: booking.emergency,
          hospital: hospital?.name ?? "Selected Hospital",
        });
        queryClient.invalidateQueries({ queryKey: ["listBookings"] });
        form.reset();
      },
      onError: () => {
        toast({ title: "Booking Failed", description: "Unable to create booking. Please try again.", variant: "destructive" });
      },
    },
  });

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patientName: "",
      patientPhone: "",
      pickupAddress: "",
      destinationHospitalId: "",
      emergency: "moderate",
      notes: "",
    },
  });

  function onSubmit(values: BookingForm) {
    createBooking.mutate({
      data: {
        patientName: values.patientName,
        patientPhone: values.patientPhone,
        pickupAddress: values.pickupAddress,
        destinationHospitalId: Number(values.destinationHospitalId),
        emergency: values.emergency,
        notes: values.notes,
      },
    });
  }

  const etaMap = { critical: "8-12 minutes", moderate: "15-20 minutes", low: "25-30 minutes" };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Book Ambulance</h1>
        <p className="text-muted-foreground">Request emergency medical transport — one-click dispatch to the nearest available ambulance.</p>
      </div>

      {/* Emergency Notice */}
      <Alert className="border-red-200 bg-red-50">
        <PhoneCall className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Life-threatening emergency?</AlertTitle>
        <AlertDescription className="text-red-700">
          For immediate life-threatening emergencies, call{" "}
          <a href="tel:112" className="font-bold underline">112</a> directly. This form is for pre-arranged medical transport.
        </AlertDescription>
      </Alert>

      {/* Confirmation Card */}
      {confirmedBooking && (
        <Card className="border-emerald-200 bg-emerald-50" data-testid="card-booking-confirmed">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-emerald-900 text-lg">Booking Confirmed!</h3>
                <p className="text-emerald-700 text-sm">Your ambulance has been dispatched.</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs text-muted-foreground">Booking ID</p>
                    <p className="font-bold text-lg" data-testid="text-booking-id">#{confirmedBooking.id}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-bold capitalize">{confirmedBooking.status}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs text-muted-foreground">Emergency Level</p>
                    <EmergencyBadge level={confirmedBooking.emergency} />
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Est. Arrival</p>
                    </div>
                    <p className="font-bold text-sm" data-testid="text-eta">{etaMap[confirmedBooking.emergency as keyof typeof etaMap]}</p>
                  </div>
                </div>
                <p className="text-xs text-emerald-700 mt-2">Destination: {confirmedBooking.hospital}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setConfirmedBooking(null)} data-testid="button-new-booking">
                    Book Another
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/bookings" data-testid="link-view-bookings">View All Bookings</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ambulance className="h-5 w-5 text-primary" />
            <CardTitle>Patient Information</CardTitle>
          </div>
          <CardDescription>Fill in the details to dispatch the nearest available ambulance.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" data-testid="form-booking">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" data-testid="input-patient-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="patientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 XXXXX XXXXX" data-testid="input-patient-phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="pickupAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Full address including landmark" data-testid="input-pickup-address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationHospitalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Hospital</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={hospitalsLoading}>
                      <FormControl>
                        <SelectTrigger data-testid="select-destination-hospital">
                          <SelectValue placeholder={hospitalsLoading ? "Loading hospitals..." : "Select hospital"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hospitals?.map(h => (
                          <SelectItem key={h.id} value={String(h.id)}>{h.name} — {h.city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-emergency-level">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="critical">Critical — Immediate life threat</SelectItem>
                        <SelectItem value="moderate">Moderate — Urgent but stable</SelectItem>
                        <SelectItem value="low">Low — Non-urgent transport</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Medical condition, special equipment needed, etc." rows={3} data-testid="textarea-notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={createBooking.isPending}
                data-testid="button-submit-booking"
              >
                {createBooking.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                    Dispatching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Ambulance className="h-5 w-5" />
                    Dispatch Ambulance
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
