import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaMicrosoft, FaApple, FaGithub } from "react-icons/fa";
import loginImage from "@assets/Growth.png";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { user, loginMutation } = useAuth();
  const [_, navigate] = useLocation();

  // If the user is already logged in, redirect to the dashboard
  if (user) {
    return <Redirect to="/roles" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  const handleSSOLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    // This would be implemented with actual SSO logic
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left side - Image */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <img 
          src={loginImage} 
          alt="Team celebrating success together" 
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-blue-600/10"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 to-transparent text-white">
          <h2 className="text-3xl font-bold mb-2">Aetheris</h2>
          <p className="text-xl">Elevate your career journey with intelligent tracking and insights</p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          {/* SSO Options */}
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2" 
                onClick={() => handleSSOLogin('Google')}
              >
                <FcGoogle className="h-5 w-5" />
                <span>Google</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2"
                onClick={() => handleSSOLogin('Microsoft')}
              >
                <FaMicrosoft className="h-4 w-4 text-blue-500" />
                <span>Microsoft</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2"
                onClick={() => handleSSOLogin('Apple')}
              >
                <FaApple className="h-5 w-5" />
                <span>Apple</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2"
                onClick={() => handleSSOLogin('GitHub')}
              >
                <FaGithub className="h-5 w-5" />
                <span>GitHub</span>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button variant="link" className="px-0 text-xs font-normal h-auto" type="button">
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}