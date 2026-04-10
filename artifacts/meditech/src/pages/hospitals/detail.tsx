import { useGetHospital, useGetHospitalResources, useUpdateHospitalResources, getGetHospitalQueryKey, getGetHospitalResourcesQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Building2, Activity, HeartPulse, Bed, Ambulance, Stethoscope, Wind, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

function ResourceBar({ title, available, total, icon: Icon }: any) {
  const percentage = total > 0 ? (available / total) * 100 : 0;
  
  let colorClass = "bg-green-500";
  if (percentage < 30) colorClass = "bg-red-500";
  else if (percentage < 60) colorClass = "bg-amber-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <div className="text-sm font-medium">
          {available} / {total}
        </div>
      </div>
      <Progress value={percentage} className="h-2" indicatorClassName={colorClass} />
    </div>
  );
}

export default function HospitalDetail() {
  const { id } = useParams();
  const hospitalId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hospital, isLoading: isHospitalLoading } = useGetHospital(hospitalId, {
    query: { enabled: !!hospitalId, queryKey: getGetHospitalQueryKey(hospitalId) }
  });

  const { data: resources, isLoading: isResourcesLoading } = useGetHospitalResources(hospitalId, {
    query: { enabled: !!hospitalId, queryKey: getGetHospitalResourcesQueryKey(hospitalId) }
  });

  const updateResources = useUpdateHospitalResources();

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (resources) {
      setFormData({
        icuBedsAvailable: resources.icuBedsAvailable,
        generalBedsAvailable: resources.generalBedsAvailable,
        oxygenCylindersAvailable: resources.oxygenCylindersAvailable,
        ambulancesAvailable: resources.ambulancesAvailable,
        ventilatorsAvailable: resources.ventilatorsAvailable,
        doctorsOnDuty: resources.doctorsOnDuty
      });
    }
  }, [resources]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: Number(value) }));
  };

  const handleUpdate = () => {
    updateResources.mutate({
      id: hospitalId,
      data: formData
    }, {
      onSuccess: () => {
        toast({
          title: "Resources updated",
          description: "Hospital resources have been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: getGetHospitalResourcesQueryKey(hospitalId) });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Failed to update hospital resources.",
        });
      }
    });
  };

  if (isHospitalLoading || isResourcesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[200px] w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!hospital || !resources) {
    return <div className="p-8 text-center">Hospital not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/hospitals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{hospital.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {hospital.city}, {hospital.state}</span>
            <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {hospital.phone}</span>
            <Badge variant="outline" className="capitalize">{hospital.type}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Resource Availability
            </CardTitle>
            <CardDescription>Current capacity metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <ResourceBar title="ICU Beds" available={resources.icuBedsAvailable} total={resources.icuBeds} icon={HeartPulse} />
              <ResourceBar title="General Beds" available={resources.generalBedsAvailable} total={resources.generalBeds} icon={Bed} />
              <ResourceBar title="Oxygen Cylinders" available={resources.oxygenCylindersAvailable} total={resources.oxygenCylinders} icon={Activity} />
              <ResourceBar title="Ventilators" available={resources.ventilatorsAvailable} total={resources.ventilators} icon={Wind} />
              <ResourceBar title="Ambulances" available={resources.ambulancesAvailable} total={resources.ambulancesTotal} icon={Ambulance} />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    Doctors on Duty
                  </div>
                  <div>{resources.doctorsOnDuty}</div>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Update Resources</CardTitle>
            <CardDescription>Adjust current availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Available ICU Beds</Label>
              <Input type="number" value={formData.icuBedsAvailable ?? ""} onChange={(e) => handleInputChange("icuBedsAvailable", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Available Gen Beds</Label>
              <Input type="number" value={formData.generalBedsAvailable ?? ""} onChange={(e) => handleInputChange("generalBedsAvailable", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Available Oxygen</Label>
              <Input type="number" value={formData.oxygenCylindersAvailable ?? ""} onChange={(e) => handleInputChange("oxygenCylindersAvailable", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Doctors on Duty</Label>
              <Input type="number" value={formData.doctorsOnDuty ?? ""} onChange={(e) => handleInputChange("doctorsOnDuty", e.target.value)} />
            </div>
            <Button onClick={handleUpdate} className="w-full mt-2" disabled={updateResources.isPending}>
              {updateResources.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}