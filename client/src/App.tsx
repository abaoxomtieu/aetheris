import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import LoginPage from "@/pages/login-page";
import UnauthorizedPage from "@/pages/unauthorized-page";
import CareerRolesPage from "@/pages/CareerRolesPage";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import AuthPage from "./pages/auth-page";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/roles">
        <ProtectedRoute>
          <CareerRolesPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/login">
        <ProtectedRoute isAuthRoute>
          <LoginPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/auth">
        <ProtectedRoute isAuthRoute>
          <AuthPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/unauthorized" component={UnauthorizedPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
