import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Hospitals from "@/pages/hospitals";
import HospitalDetail from "@/pages/hospitals/detail";
import Ambulances from "@/pages/ambulances";
import Book from "@/pages/book";
import Bookings from "@/pages/bookings";
import Analytics from "@/pages/analytics";
import Alerts from "@/pages/alerts";
import AIHub from "@/pages/ai-hub";
import SymptomChecker from "@/pages/symptom-checker";
import ImageDetect from "@/pages/image-detect";
import HomeCare from "@/pages/home-care";
import PrescriptionScanner from "@/pages/prescription-scanner";
import Specialist from "@/pages/specialist";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/hospitals" component={Hospitals} />
      <Route path="/hospitals/:id" component={HospitalDetail} />
      <Route path="/ambulances" component={Ambulances} />
      <Route path="/book" component={Book} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/ai" component={AIHub} />
      <Route path="/ai/symptom-checker" component={SymptomChecker} />
      <Route path="/ai/image-detect" component={ImageDetect} />
      <Route path="/ai/home-care" component={HomeCare} />
      <Route path="/ai/prescription-scanner" component={PrescriptionScanner} />
      <Route path="/ai/specialist" component={Specialist} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppLayout>
            <Router />
          </AppLayout>
        </WouterRouter>
        <PwaInstallPrompt />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;