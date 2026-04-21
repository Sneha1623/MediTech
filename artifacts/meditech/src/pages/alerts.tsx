import { useState } from "react";
import { useListAlerts, useCreateAlert, getListAlertsQueryKey, useListHospitals, getListHospitalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { AlertTriangle, Info, Bell, Plus, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const alertSchema = z.object({
  title: z.string().min(3, "Title required"),
  message: z.string().min(10, "Message required"),
  severity: z.enum(["critical", "warning", "info"]),
  hospitalId: z.string().optional(),
});

type AlertForm = z.infer<typeof alertSchema>;

function SeverityBadge({ severity, labels }: { severity: string; labels: { critical: string; warning: string; info: string } }) {
  if (severity === "critical") return <Badge className="bg-red-500 hover:bg-red-600 text-white gap-1"><ShieldAlert className="h-3 w-3" />{labels.critical}</Badge>;
  if (severity === "warning") return <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1"><AlertTriangle className="h-3 w-3" />{labels.warning}</Badge>;
  return <Badge variant="secondary" className="gap-1"><Info className="h-3 w-3" />{labels.info}</Badge>;
}

function AlertIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <ShieldAlert className="h-5 w-5 text-red-500" />;
  if (severity === "warning") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <Info className="h-5 w-5 text-primary" />;
}

export default function Alerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const a = t.alerts;

  const { data: alerts, isLoading } = useListAlerts({ query: { queryKey: getListAlertsQueryKey() } });
  const { data: hospitals } = useListHospitals({}, { query: { queryKey: getListHospitalsQueryKey({}) } });

  const createAlert = useCreateAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        toast({ title: a.alertCreated, description: a.alertCreatedDesc });
        setOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Failed", description: a.alertFailed, variant: "destructive" });
      },
    },
  });

  const form = useForm<AlertForm>({
    resolver: zodResolver(alertSchema),
    defaultValues: { title: "", message: "", severity: "info", hospitalId: "" },
  });

  function onSubmit(values: AlertForm) {
    createAlert.mutate({
      data: {
        title: values.title,
        message: values.message,
        severity: values.severity,
        hospitalId: values.hospitalId ? Number(values.hospitalId) : undefined,
      },
    });
  }

  const criticalCount = Array.isArray(alerts) ? alerts.filter(al => al.severity === "critical").length : 0;
  const warningCount = Array.isArray(alerts) ? alerts.filter(al => al.severity === "warning").length : 0;
  const severityLabels = { critical: a.critical, warning: a.warning, info: a.info };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{a.title}</h1>
          <p className="text-muted-foreground">{a.subtitle}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-alert">
              <Plus className="h-4 w-4" />
              {a.newAlert}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{a.broadcastAlert}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-create-alert">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{a.alertTitle}</FormLabel>
                    <FormControl><Input placeholder={a.alertTitle} data-testid="input-alert-title" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="severity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{a.severity}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-alert-severity"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="critical">{a.critical}</SelectItem>
                        <SelectItem value="warning">{a.warning}</SelectItem>
                        <SelectItem value="info">{a.info}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="hospitalId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{a.selectHospital}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-alert-hospital"><SelectValue placeholder={a.allHospitals} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{a.allHospitals}</SelectItem>
                        {hospitals?.map(h => (
                          <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{a.message}</FormLabel>
                    <FormControl><Textarea placeholder={a.message + "..."} rows={3} data-testid="textarea-alert-message" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createAlert.isPending} data-testid="button-submit-alert">
                  {createAlert.isPending ? a.broadcasting : a.broadcast}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-red-600">{a.critical}</p>
                <p className="text-2xl font-bold text-red-700" data-testid="count-critical-alerts">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-amber-600">{a.warning}</p>
                <p className="text-2xl font-bold text-amber-700" data-testid="count-warning-alerts">{warningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold" data-testid="count-total-alerts">{Array.isArray(alerts) ? alerts.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
        </div>
      ) : !Array.isArray(alerts) || alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{a.noAlerts}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...alerts].reverse().map(alert => {
            const hospital = hospitals?.find(h => h.id === alert.hospitalId);
            return (
              <Card
                key={alert.id}
                className={`border-l-4 ${alert.severity === "critical" ? "border-l-red-500" : alert.severity === "warning" ? "border-l-amber-500" : "border-l-primary"} hover:shadow-md transition-shadow`}
                data-testid={`card-alert-${alert.id}`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <AlertIcon severity={alert.severity} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold" data-testid={`text-alert-title-${alert.id}`}>{alert.title}</span>
                          <SeverityBadge severity={alert.severity} labels={severityLabels} />
                          {hospital && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{hospital.name}</span>}
                          {!alert.hospitalId && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{a.allHospitals}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(alert.createdAt), "dd MMM, hh:mm a")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid={`text-alert-message-${alert.id}`}>{alert.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
