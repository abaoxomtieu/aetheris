import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LockIcon, AlertTriangleIcon } from "lucide-react";

export default function UnauthorizedPage() {
  const [_, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="bg-red-50 p-3 rounded-full inline-flex items-center justify-center mb-6">
          <LockIcon className="h-12 w-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
        
        <div className="flex items-center justify-center mb-6 bg-amber-50 p-4 rounded-lg">
          <AlertTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
          <p className="text-amber-700 text-sm">You need to be logged in to access this page</p>
        </div>
        
        <p className="text-gray-600 mb-8">
          Please sign in with your account credentials to continue using Aetheris Career Management Platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate("/login")}
            size="lg"
            className="px-8"
          >
            Go to Login
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            size="lg"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}