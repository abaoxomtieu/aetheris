import { useState, useEffect } from "react";
import { useCareerRoles } from "@/hooks/use-career-roles";
import { useIdps, useAddGoal, useGoals, useUserById } from "@/hooks/use-career-data";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { 
  Building2, 
  Briefcase, 
  Loader2, 
  GraduationCap, 
  Check, 
  ChevronRight, 
  Trophy,
  BookOpen,
  Mail
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CareerRole, Idp } from "@shared/schema";

export function CareerRoles() {
  const { careerRoles, isLoading } = useCareerRoles();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<CareerRole | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Filter roles where the current user is a target user
  const userTargetRoles = careerRoles.filter(role => 
    role.targetUsers && Array.isArray(role.targetUsers) && 
    role.targetUsers.includes(user?.id || 0)
  );
  
  // Other roles that don't have the current user as a target
  const otherRoles = careerRoles.filter(role => 
    !userTargetRoles.some(userRole => userRole.id === role.id)
  );

  // Email link for changing paths
  const emailSubject = "Change IDP";
  const emailRecipient = "sam@gmail.com";
  const emailLink = `mailto:${emailRecipient}?subject=${encodeURIComponent(emailSubject)}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hi {user?.fullName || "Your"}</h2>
        </div>
      </div>

      {/* User's Targeted Roles Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold tracking-tight">Your Indivudal Development Path</h3>
        {userTargetRoles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 className="size-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No specific path assigned</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your career path will be assigned by your organization soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userTargetRoles.map((role) => (
              <Card 
                key={role.id} 
                className="overflow-hidden group transition-all duration-300 hover:shadow-md border-2 border-indigo-200 hover:border-indigo-300 bg-indigo-50/50"
              >
                <CardHeader className="bg-gradient-to-r from-indigo-100 to-white pb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="bg-indigo-200 p-1.5 rounded-full">
                      <GraduationCap className="h-4 w-4 text-indigo-700" />
                    </div>
                    <CardTitle className="text-lg leading-tight">{role.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {role.responsibilities && role.responsibilities.length > 0
                      ? `Path with ${role.responsibilities.length} key responsibilities`
                      : "Progression role"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-3">
                    {role.responsibilities && role.responsibilities.length > 0 ? (
                      <div className="space-y-2">
                        {role.responsibilities.slice(0, 3).map((resp, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0">
                              <Check className="h-4 w-4 text-indigo-600" />
                            </div>
                            <p className="text-sm text-gray-600">{resp}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No responsibilities listed</p>
                    )}
                  </div>

                  {(role.responsibilities?.length || 0) > 3 && (
                    <div className="mt-3 text-sm text-indigo-600 font-medium">
                      + {(role.responsibilities?.length || 0) - 3} more responsibilities
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 pb-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full gap-1 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition-colors"
                        onClick={() => setSelectedRole(role)}
                      >
                        View Details
                        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                      {selectedRole && <RoleDetailView role={selectedRole} />}
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Other Roles Section */}
      <div className="space-y-6 pt-4">
        <h3 className="text-xl font-semibold tracking-tight">Other Paths</h3>
        {otherRoles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 className="size-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No other roles available</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Additional roles will be added by your organization soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherRoles.map((role) => (
              <Card 
                key={role.id} 
                className="overflow-hidden group transition-all duration-300 hover:shadow-md border-2 hover:border-indigo-100"
              >
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-white pb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="bg-indigo-100 p-1.5 rounded-full">
                      <GraduationCap className="h-4 w-4 text-indigo-700" />
                    </div>
                    <CardTitle className="text-lg leading-tight">{role.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {role.responsibilities && role.responsibilities.length > 0
                      ? `Path with ${role.responsibilities.length} key responsibilities`
                      : "Progression role"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-3">
                    {role.responsibilities && role.responsibilities.length > 0 ? (
                      <div className="space-y-2">
                        {role.responsibilities.slice(0, 3).map((resp, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0">
                              <Check className="h-4 w-4 text-indigo-600" />
                            </div>
                            <p className="text-sm text-gray-600">{resp}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No responsibilities listed</p>
                    )}
                  </div>

                  {(role.responsibilities?.length || 0) > 3 && (
                    <div className="mt-3 text-sm text-indigo-600 font-medium">
                      + {(role.responsibilities?.length || 0) - 3} more responsibilities
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 pb-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full gap-1 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition-colors"
                        onClick={() => setSelectedRole(role)}
                      >
                        View Details
                        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                      {selectedRole && <RoleDetailView role={selectedRole} />}
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Contact Information for Path Change */}
      <div className="mt-8 text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          To change your path reach out to 
          <a 
            href={emailLink} 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
          >
            <Mail className="h-3 w-3" />
            sam@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

function SuccessProfileCard({ userId }: { userId: number }) {
  const { data: profileUser, isLoading, error } = useUserById(userId);
  
  if (isLoading) {
    return (
      <div className="flex p-3 border rounded-lg bg-white space-x-3 items-center animate-pulse">
        <div className="w-12 h-12 rounded-full bg-slate-200"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
          <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !profileUser) {
    return (
      <div className="flex p-3 border rounded-lg bg-white space-x-3 items-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-red-500 text-xl">?</span>
        </div>
        <div>
          <p className="text-sm text-slate-700">User profile not available</p>
          <p className="text-xs text-slate-500">ID: {userId}</p>
        </div>
      </div>
    );
  }
  
  // Get user profile data
  const fullName = profileUser.fullName; 
  const avatar = profileUser.avatar;
  const title = profileUser.title; 
  const department = profileUser.department;
  
  return (
    <div className="flex p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow space-x-4 items-center">
      <div className="flex-shrink-0">
        {avatar ? (
          <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200">
            <img 
              src={avatar.startsWith('/attached_assets/') ? avatar.substring(1) : avatar}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log("Image failed to load:", avatar);
                // If image fails to load, show fallback initial
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `
                  <div class="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xl">
                    ${fullName ? fullName.charAt(0) : '?'}
                  </div>
                `;
              }}
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xl">
            {fullName ? fullName.charAt(0) : '?'}
          </div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-slate-800 text-base mb-1">{fullName || 'Unknown Name'}</h4>
        <div className="flex flex-col sm:flex-row sm:items-center text-xs text-slate-500 gap-y-1 gap-x-2">
          <span className="inline-flex items-center">
            <Briefcase className="w-3 h-3 mr-1 text-slate-400" />
            {title || 'Unknown Title'}
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="inline-flex items-center">
            <Building2 className="w-3 h-3 mr-1 text-slate-400" />
            {department || 'Unknown Department'}
          </span>
        </div>
      </div>
    </div>
  );
}

function RoleDetailView({ role }: { role: CareerRole }) {
  const { data: idps, isLoading: isIdpsLoading } = useIdps();
  const { data: userGoals, isLoading: isGoalsLoading } = useGoals();
  const { user } = useAuth();
  const addGoalMutation = useAddGoal();
  const [selectedIdps, setSelectedIdps] = useState<number[]>([]);

  // Check which IDPs are already added as goals
  const existingGoalTitles = userGoals?.map((goal: { title: string }) => goal.title.toLowerCase()) || [];
  
  // Initialize selectedIdps with IDP IDs that are already goals based on title match
  useEffect(() => {
    if (idps && userGoals) {
      const alreadyAddedIdps = idps.filter(idp => 
        existingGoalTitles.includes(idp.name.toLowerCase())
      ).map(idp => idp.id);
      
      setSelectedIdps(alreadyAddedIdps);
    }
  }, [idps, userGoals]); 

  // Function to add selected IDP as a self-category goal for the user
  const handleAddAsGoal = async (idp: Idp) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to add goals",
        variant: "destructive",
      });
      return;
    }
    
    // Check if a goal with this title already exists
    if (existingGoalTitles.includes(idp.name.toLowerCase())) {
      toast({
        title: "Goal already exists",
        description: `You already have a goal titled "${idp.name}"`,
        variant: "default",
      });
      return;
    }

    try {
      await addGoalMutation.mutateAsync({
        title: idp.name,
        description: idp.description || "",
        userId: user.id,
        category: idp.category,
        status: "draft",
        progress: 0,
        origin: "Self", // Must be "Self" not "self"
        startDate: new Date(),
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
        attachments: null,
        comments: null
      });

      toast({
        title: "Goal added",
        description: `"${idp.name}" has been added to your goals`,
      });

      // Add the IDP ID to the list of selected IDPs to disable the button
      setSelectedIdps(prev => [...prev, idp.id]);
    } catch (error) {
      toast({
        title: "Failed to add goal",
        description: "There was an error adding this IDP as a goal",
        variant: "destructive",
      });
    }
  };

  // Helper function to extract keywords from a string
  const extractKeywords = (text: string): string[] => {
    if (!text) return [];
    const words = text.toLowerCase().split(/\s+/);
    // Filter out common words
    return words.filter(word => 
      word.length > 3 && 
      !['with', 'and', 'for', 'the', 'this', 'that', 'from', 'their'].includes(word)
    );
  };

  // Check if two sets of keywords have at least one match
  const hasKeywordMatch = (keywords1: string[], keywords2: string[]): boolean => {
    return keywords1.some(k1 => keywords2.some(k2 => 
      k1.includes(k2) || k2.includes(k1) || 
      // Levenshtein-like simple similarity for words longer than 5 chars
      (k1.length > 5 && k2.length > 5 && (k1.includes(k2.substring(0, 4)) || k2.includes(k1.substring(0, 4))))
    ));
  };

  // Special keywords based on role categories
  const getSpecialKeywords = (roleTitle: string): string[] => {
    const title = roleTitle.toLowerCase();
    
    if (title.includes('learning') || title.includes('education')) {
      return ['education', 'teaching', 'training', 'leadership', 'development'];
    }
    
    if (title.includes('head') || title.includes('lead') || title.includes('manager')) {
      return ['leadership', 'management', 'strategic', 'planning', 'team'];
    }
    
    if (title.includes('specialist') || title.includes('designer')) {
      return ['specialist', 'technical', 'skills', 'industry'];
    }
    
    return [];
  };

  // Extract keywords from role title
  const roleKeywords = [
    ...extractKeywords(role.title),
    ...getSpecialKeywords(role.title)
  ];

  // Filter IDP list with improved matching
  const relevantIdps = idps?.filter(idp => {
    // Extract keywords from IDP name and description
    const idpNameKeywords = extractKeywords(idp.name);
    const idpDescKeywords = extractKeywords(idp.description || '');
    const idpKeywords = [...idpNameKeywords, ...idpDescKeywords];
    
    // Check for direct inclusion
    const directMatch = 
      role.title.toLowerCase().includes(idp.name.toLowerCase()) || 
      idp.name.toLowerCase().includes(role.title.toLowerCase()) ||
      (idp.description && idp.description.toLowerCase().includes(role.title.toLowerCase()));
    
    // Check for keyword matches
    const keywordMatch = hasKeywordMatch(roleKeywords, idpKeywords);
    
    return directMatch || keywordMatch;
  }).slice(0, 3) || [];

  return (
    <>
      <DialogHeader className="pb-2 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 p-2 rounded-full">
            <GraduationCap className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">{role.title}</DialogTitle>
            <DialogDescription className="mt-1">
              Growth opportunity with defined expectations
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6 py-5">
        {role.successProfiles && role.successProfiles.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="flex items-center gap-2 text-base font-medium text-slate-800 mb-3">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              Success Profiles
            </h3>
            <div className="grid gap-4 mt-3">
              {role.successProfiles.map((profileId, i) => (
                <SuccessProfileCard key={i} userId={profileId} />
              ))}
            </div>
          </div>
        )}
        <Separator className="bg-slate-200" />

        <div>
          <h3 className="flex items-center gap-2 text-base font-medium text-slate-800 mb-3">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            Recommended Development Goals
          </h3>

          {isIdpsLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Loading development goals...</p>
            </div>
          ) : relevantIdps.length > 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[50%]">Development Goal</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relevantIdps.map((idp) => {
                    const isAdded = selectedIdps.includes(idp.id);

                    const getCategoryColor = (category: string) => {
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

                    return (
                      <TableRow key={idp.id}>
                        <TableCell className="font-medium">{idp.name}</TableCell>
                        <TableCell>
                          <Badge className={`${getCategoryColor(idp.category)}`}>
                            {idp.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={isAdded ? "outline" : "default"}
                            disabled={isAdded || addGoalMutation.isPending}
                            onClick={() => handleAddAsGoal(idp)}
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Added
                              </>
                            ) : addGoalMutation.isPending ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add to Goals"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-sm text-slate-600">No relevant development goals found for this role.</p>
            </div>
          )}
        </div>
        <div>
          <Accordion type="single" collapsible>
            <AccordionItem value="responsibilities">
              <AccordionTrigger className="flex items-center gap-2 text-base font-medium text-slate-800 py-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600" />
                  <span>Core Responsibilities</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {role.responsibilities && role.responsibilities.length > 0 ? (
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                    {role.responsibilities.map((resp, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 bg-indigo-100 rounded-full p-0.5 flex-shrink-0">
                          <Check className="h-3.5 w-3.5 text-indigo-700" />
                        </div>
                        <p className="text-sm text-slate-700">{resp}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific responsibilities listed</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Separator className="bg-slate-200" />

        <div>
          <Accordion type="single" collapsible>
            <AccordionItem value="achievements">
              <AccordionTrigger className="flex items-center gap-2 text-base font-medium text-slate-800 py-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-indigo-600" />
                  <span>Key Achievements Expected</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {role.keyAchievements && role.keyAchievements.length > 0 ? (
                  <div className="space-y-3 bg-gradient-to-r from-slate-50 to-white p-4 rounded-lg border border-slate-200">
                    {role.keyAchievements.map((achievement, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 bg-amber-100 rounded-full p-0.5 flex-shrink-0">
                          <Check className="h-3.5 w-3.5 text-amber-700" />
                        </div>
                        <p className="text-sm text-slate-700">{achievement}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No key achievements specified</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </>
  );
}