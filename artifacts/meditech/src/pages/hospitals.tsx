import { useListHospitals, getListHospitalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, MapPin, Building2, Phone } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Hospitals() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: hospitals, isLoading } = useListHospitals(
    {},
    { query: { queryKey: getListHospitalsQueryKey({}) } }
  );

  const filteredHospitals = hospitals?.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Hospitals Directory</h1>
          <p className="text-muted-foreground">Manage and monitor hospital network status.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search hospitals..."
            className="pl-8 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredHospitals?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No hospitals found matching "{searchTerm}"
          </div>
        ) : (
          filteredHospitals?.map((hospital) => (
            <Card key={hospital.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2 capitalize">
                    {hospital.type}
                  </Badge>
                  <Badge variant={hospital.status === "active" ? "default" : "secondary"} className={hospital.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}>
                    {hospital.status}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-1">{hospital.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {hospital.city}, {hospital.state}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span className="truncate">{hospital.address}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{hospital.phone}</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/hospitals/${hospital.id}`}>View Details & Resources</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}