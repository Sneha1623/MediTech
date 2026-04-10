import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Activity, HeartPulse, Building2, Ambulance, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-sm font-medium">
                <Activity className="mr-2 h-4 w-4" />
                Emergency Command Center
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Smart Healthcare Management System
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-[600px] leading-relaxed">
                A unified platform for Indian hospitals to track critical resources, deploy ambulance fleets, and predict emergency hotspots in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" variant="secondary" className="font-bold h-12 px-8" asChild>
                  <Link href="/dashboard">Access Dashboard</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10 h-12 px-8" asChild>
                  <Link href="/book">Book Ambulance</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-card rounded-xl shadow-2xl overflow-hidden border border-border flex items-center justify-center text-muted-foreground relative">
                {/* Simulated Dashboard UI */}
                <div className="absolute inset-0 p-4 bg-muted/20">
                  <div className="h-full w-full rounded border bg-card shadow-sm flex flex-col p-4 space-y-4">
                     <div className="flex justify-between items-center pb-2 border-b">
                        <div className="h-4 w-32 bg-muted rounded"></div>
                        <div className="h-4 w-16 bg-muted rounded"></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-primary/10 rounded border border-primary/20"></div>
                        <div className="h-24 bg-destructive/10 rounded border border-destructive/20"></div>
                     </div>
                     <div className="flex-1 bg-muted/50 rounded flex items-center justify-center">
                       <Activity className="h-12 w-12 text-primary/40" />
                     </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card text-card-foreground p-4 rounded-lg shadow-xl border flex items-center gap-4">
                <div className="bg-green-100 text-green-700 p-2 rounded-full">
                  <Ambulance className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">12.5 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Core Capabilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Designed for high-pressure environments where every second counts.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-md bg-muted/30">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Resource Tracking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time visibility into ICU beds, general wards, oxygen cylinders, and ventilator availability across all networked hospitals.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-muted/30">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6">
                  <Ambulance className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Fleet Routing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  GPS-enabled tracking and intelligent dispatch of basic, advanced, and ICU ambulances to minimize response times.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-muted/30">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Predictive Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI-driven forecasting of emergency hotspots allowing preemptive repositioning of resources during high-risk periods.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Implementation Plan */}
      <section className="py-20 px-4 bg-muted/20 border-y">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Implementation Roadmap</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A systematic approach to scaling healthcare infrastructure across India.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-border z-0"></div>
            
            <div className="relative z-10 text-center space-y-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-background">
                P1
              </div>
              <h3 className="text-xl font-bold">Pilot Phase</h3>
              <div className="bg-card p-4 rounded-lg shadow-sm border text-sm space-y-2">
                <p className="font-medium">Duration: 3 Months</p>
                <p className="text-muted-foreground">5 Major Government Hospitals</p>
                <p className="text-muted-foreground">Core tracking features only</p>
              </div>
            </div>

            <div className="relative z-10 text-center space-y-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-background">
                P2
              </div>
              <h3 className="text-xl font-bold text-muted-foreground">Regional Expansion</h3>
              <div className="bg-card/50 p-4 rounded-lg shadow-sm border border-dashed text-sm space-y-2 text-muted-foreground">
                <p className="font-medium">Duration: 6 Months</p>
                <p>50+ Hospitals (Gov & Trust)</p>
                <p>Predictive analytics integration</p>
              </div>
            </div>

            <div className="relative z-10 text-center space-y-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-background">
                P3
              </div>
              <h3 className="text-xl font-bold text-muted-foreground">Statewide Deployment</h3>
              <div className="bg-card/50 p-4 rounded-lg shadow-sm border border-dashed text-sm space-y-2 text-muted-foreground">
                <p className="font-medium">Duration: 18 Months</p>
                <p>500+ Hospitals Statewide</p>
                <p>Full API integration with state systems</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDG Alignment */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <HeartPulse className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold">Aligned with SDG 3</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            MediTech directly supports the United Nations Sustainable Development Goal 3: <strong>Good Health and Well-being</strong>. By drastically reducing emergency response times and optimizing resource allocation, we are building a resilient infrastructure that saves lives.
          </p>
        </div>
      </section>
    </div>
  );
}
