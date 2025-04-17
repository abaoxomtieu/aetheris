import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Laptop, 
  Users, 
  BookOpen, 
  ExternalLink,
  LayoutGrid
} from "lucide-react";
import { useIdpsByCategory, useIdps } from "@/hooks/use-career-data";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { IdpCategory, IdpRole } from "@shared/schema";

// Define a type that extends IdpCategory to include "All"
type CategoryOption = IdpCategory | "All";

export function IdpDisplay() {
  const [activeCategory, setActiveCategory] = useState<CategoryOption>("All");
  const { user } = useAuth();
  
  // Fetch data based on active category
  const { data: categoryIdps, isLoading: isCategoryLoading, isError: isCategoryError } = 
    useIdpsByCategory(activeCategory as IdpCategory);
  
  // Fetch all IDPs for the "All" tab
  const { data: allIdps, isLoading: isAllLoading, isError: isAllError } = useIdps();
  
  // Determine which data to use based on active category
  const idps = activeCategory === "All" ? allIdps : categoryIdps;
  const isLoading = activeCategory === "All" ? isAllLoading : isCategoryLoading;
  const isError = activeCategory === "All" ? isAllError : isCategoryError;
  
  // Filter IDPs based on user role
  const filteredIdps = idps?.filter(idp => {
    if (!idp.roles || idp.roles.length === 0) {
      return true; // Show IDPs with no roles specified to everyone
    }
    
    // Get user role (default to "Employee" if not set)
    // Note: The database role names use lowercase "manager", but our IdpRole enum uses uppercase "Manager"
    const userRole: IdpRole = (user?.role || "").toLowerCase() === "manager" || (user?.role || "").toLowerCase() === "admin" 
      ? "Manager" 
      : "Employee";
    
    console.log(`Filtering IDP ${idp.id}:${idp.name} with roles ${JSON.stringify(idp.roles)}, user role: ${userRole}, user.role from DB: ${user?.role}`);
      
    // Check if the IDP's roles include the user's role
    return idp.roles.includes(userRole);
  });
  
  const getCategoryIcon = (category: IdpCategory) => {
    switch (category) {
      case "Experience":
        return <Laptop className="w-4 h-4 mr-2" />;
      case "Exposure":
        return <Users className="w-4 h-4 mr-2" />;
      case "Education":
        return <BookOpen className="w-4 h-4 mr-2" />;
      default:
        return null;
    }
  };
  
  const getCategoryColor = (category: IdpCategory) => {
    switch (category) {
      case "Experience":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Exposure":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Education":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Common card rendering for each tab
  const renderIdpCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {isLoading && (
        Array(3).fill(0).map((_, i) => (
          <Card key={i} className="border border-neutral-200">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))
      )}
      
      {isError && (
        <Card className="border border-red-200 col-span-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-600">Error Loading IDPs</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the Individual Development Plans. Please try again later.</p>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !isError && filteredIdps?.length === 0 && (
        <Card className="border border-neutral-200 col-span-full">
          <CardHeader className="pb-2">
            <CardTitle>No IDPs Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There are no Individual Development Plans available for your role in this category.</p>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !isError && filteredIdps?.map(idp => (
        <Card key={idp.id} className="border border-neutral-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold">{idp.name}</CardTitle>
              <Badge className={`${getCategoryColor(idp.category)} font-medium`}>
                {getCategoryIcon(idp.category)}
                {idp.category}
              </Badge>
            </div>
            <CardDescription className="text-sm text-neutral-500">
              {idp.createdAt && new Date(idp.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-700">{idp.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
     
      <Tabs defaultValue="All" value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryOption)}>
        <TabsList className="mb-4 bg-white border border-neutral-200 p-1">
          <TabsTrigger 
            value="All" 
            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            All
          </TabsTrigger>
          <TabsTrigger 
            value="Experience" 
            className="data-[state=active]:bg-blue-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
          >
            <Laptop className="w-4 h-4 mr-2" />
            Experience
          </TabsTrigger>
          <TabsTrigger 
            value="Exposure" 
            className="data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
          >
            <Users className="w-4 h-4 mr-2" />
            Exposure
          </TabsTrigger>
          <TabsTrigger 
            value="Education" 
            className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Education
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="All" className="mt-0">
          {renderIdpCards()}
        </TabsContent>
        
        <TabsContent value="Experience" className="mt-0">
          {renderIdpCards()}
        </TabsContent>
        
        <TabsContent value="Exposure" className="mt-0">
          {renderIdpCards()}
        </TabsContent>
        
        <TabsContent value="Education" className="mt-0">
          {renderIdpCards()}
        </TabsContent>
      </Tabs>
    </div>
  );
}