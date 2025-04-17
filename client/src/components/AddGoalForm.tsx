import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { goalFormSchema, type GoalFormData, goalOriginEnum } from "@shared/schema";
import { useState, useRef, useEffect } from "react";
import { useAddGoal, useReportees, useIdps } from "@/hooks/use-career-data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { Idp } from "@shared/schema";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, File, X } from "lucide-react";

interface AddGoalFormProps {
  onComplete?: () => void;
}

export function AddGoalForm({ onComplete = () => {} }: AddGoalFormProps) {
  const addGoalMutation = useAddGoal();
  const { toast } = useToast();
  const { user } = useAuth();
  // Debug the user object and role value - temporarily log it
  console.log("Current user object:", user);
  console.log("Current user role:", user?.role);
  const isEmployee = user?.role?.toLowerCase() === 'employee';
  const isManager = user?.role?.toLowerCase() === 'manager' || user?.role?.toLowerCase() === 'admin';
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isManagerOrigin, setIsManagerOrigin] = useState(false);
  const [selectedReporteeId, setSelectedReporteeId] = useState<number | null>(null);
  const [selectedIdp, setSelectedIdp] = useState<Idp | null>(null);
  const { data: reportees, isLoading: reporteesLoading } = useReportees();
  const { data: idps, isLoading: idpsLoading } = useIdps();
  
  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      userId: user?.id || 1,
      title: "",
      description: "",
      category: "Professional Development",
      origin: "Self",
      startDate: new Date(),
      targetDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
      status: "draft", // Set initial status to draft for all roles
      progress: 0,
    },
  });
  
  const onSubmit = async (data: GoalFormData) => {
    try {
      // Validate that an IDP is selected
      if (!selectedIdp) {
        toast({
          title: "Missing IDP selection",
          description: "Please select an Individual Development Plan for this goal.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate that a reportee is selected when Manager origin is chosen
      if (isManagerOrigin && !selectedReporteeId) {
        toast({
          title: "Missing reportee",
          description: "Please select a reportee to assign this goal to.",
          variant: "destructive",
        });
        return;
      }
      
      // Confirm the selectedReporteeId is a number and valid
      console.log("FORM VALIDATION AND USER DATA ===================");
      console.log("isManager:", isManager);
      console.log("isManagerOrigin:", isManagerOrigin);
      console.log("selectedReporteeId (before submission):", selectedReporteeId, "type:", typeof selectedReporteeId);
      console.log("Current user:", user);
      console.log("Raw form data:", data);
      
      // Create an entirely new object to avoid reference issues
      let userId = user?.id || 1;  // Default to current user
      let managerId = undefined;
      
      // Special handling for manager-assigned goals
      if (isManagerOrigin && selectedReporteeId) {
        userId = selectedReporteeId;
        managerId = user?.id;
        console.log(`Manager ${user?.id} assigning goal to user ${userId}`);
      }
      
      // Build submission data explicitly
      const submissionData = {
        title: data.title,
        description: data.description,
        category: data.category,
        origin: data.origin,
        startDate: data.startDate,
        targetDate: data.targetDate,
        status: data.status || "draft",
        progress: data.progress || 0,
        userId: userId,
        managerId: managerId,
      };
      
      // Add more detailed logging
      console.log('SUBMISSION DATA ================================');
      console.log('Final submission data:', JSON.stringify(submissionData, null, 2));
      console.log('=================================================');
      
      // Always use FormData to ensure consistent handling on the server
      const formData = new FormData();
      
      // EXPLICITLY add each field to make sure we don't lose anything in serialization
      if (submissionData.title) formData.append("title", submissionData.title);
      if (submissionData.description) formData.append("description", submissionData.description);
      if (submissionData.category) formData.append("category", submissionData.category);
      if (submissionData.origin) formData.append("origin", submissionData.origin);
      
      // Dates need special handling
      if (submissionData.startDate instanceof Date) {
        formData.append("startDate", submissionData.startDate.toISOString());
      }
      if (submissionData.targetDate instanceof Date) {
        formData.append("targetDate", submissionData.targetDate.toISOString());
      }
      
      // Add status, progress and other fields
      if (submissionData.status) formData.append("status", submissionData.status);
      formData.append("progress", String(submissionData.progress || 0));
      
      // Most important: add the user IDs
      formData.append("userId", String(submissionData.userId));
      if (submissionData.managerId) {
        formData.append("managerId", String(submissionData.managerId));
      }
      
      // Add files if any
      files.forEach(file => {
        formData.append("attachments", file);
      });
      
      // Log the final FormData
      console.log("FORM DATA ENTRIES ============================");
      // We can't directly iterate over formData entries in all TypeScript targets,
      // so let's log the key fields individually
      console.log("userId:", formData.get("userId"));
      console.log("title:", formData.get("title"));
      console.log("origin:", formData.get("origin"));
      console.log("managerId:", formData.get("managerId"));
      console.log("=============================================");
      
      // Submit the data
      await addGoalMutation.mutateAsync(formData);
      
      toast({
        title: "Goal created",
        description: isManagerOrigin && selectedReporteeId
          ? `Goal successfully assigned to ${reportees?.find(r => r.id === selectedReporteeId)?.fullName || 'reportee'}.`
          : "Your new goal has been created successfully.",
      });
      
      // Reset form state
      form.reset();
      setFiles([]);
      setSelectedReporteeId(null);
      setSelectedIdp(null);
      setIsManagerOrigin(false);
      onComplete();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Error creating goal",
        description: "There was a problem creating your goal. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  // Watch for changes in the origin field
  const originValue = form.watch("origin");
  
  useEffect(() => {
    setIsManagerOrigin(originValue === "Manager");
    
    // Reset the selected reportee when origin changes
    if (originValue !== "Manager") {
      setSelectedReporteeId(null);
    }
  }, [originValue]);
  
  // We need to watch for changes to isManagerOrigin to update selectedReporteeId
  useEffect(() => {
    // Reset the selectedReporteeId when isManagerOrigin changes to false
    if (!isManagerOrigin) {
      setSelectedReporteeId(null);
    }
  }, [isManagerOrigin]);
  
  // Update form when an IDP is selected
  const handleIdpSelect = (idpId: string) => {
    const foundIdp = idps?.find(idp => idp.id === parseInt(idpId));
    if (foundIdp) {
      setSelectedIdp(foundIdp);
      form.setValue("title", foundIdp.name);
      form.setValue("category", foundIdp.category);
      // Make sure to handle potential null values for description
      if (typeof foundIdp.description === 'string') {
        form.setValue("description", foundIdp.description);
      } else {
        form.setValue("description", "");
      }
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <FormLabel className="block text-sm font-medium text-neutral-700 mb-2">
              Select Individual Development Plan (IDP)
            </FormLabel>
            {idpsLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                <span className="text-sm text-neutral-500">Loading IDPs...</span>
              </div>
            ) : idps && idps.length > 0 ? (
              <Select
                value={selectedIdp?.id.toString() || ''}
                onValueChange={handleIdpSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an IDP for your goal" />
                </SelectTrigger>
                <SelectContent>
                  {idps.map((idp) => (
                    <SelectItem key={idp.id} value={idp.id.toString()}>
                      {idp.name} ({idp.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-neutral-500 p-3 bg-neutral-50 border border-neutral-200 rounded">
                No IDPs found for your role. Please contact your manager or HR.
              </div>
            )}
            {selectedIdp && (
              <FormDescription className="mt-2 text-green-600">
                This IDP will provide the structure for your goal.
              </FormDescription>
            )}
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-6">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <div className="flex min-h-[80px] w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-not-allowed overflow-y-auto">
                    {field.value || "Description will be populated from selected IDP"}
                  </div>
                </FormControl>
                <FormDescription className="text-orange-600">
                  This field is populated from your selected IDP.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Delegator</FormLabel>
                {isEmployee ? (
                  <>
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-not-allowed">
                      <span className="capitalize">{field.value}</span>
                    </div>
                    <FormDescription className="text-orange-600">
                      As an employee, you cannot change the delegator role.
                    </FormDescription>
                  </>
                ) : (
                  <>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select origin type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {goalOriginEnum.map((origin) => (
                          <SelectItem key={origin} value={origin}>
                            <span className="capitalize">{origin}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Indicate if this goal was selected by you or assigned by management.
                    </FormDescription>
                  </>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                    value={field.value instanceof Date ? formatDate(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      field.onChange(e.target.value ? new Date(e.target.value) : null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="targetDate"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Target Completion Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                    value={field.value instanceof Date ? formatDate(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      field.onChange(e.target.value ? new Date(e.target.value) : null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Reportee selection dropdown (only shown for managers when "Manager" origin is selected) */}
          {isManager && isManagerOrigin && (
            <div className="sm:col-span-6">
              <FormLabel className="block text-sm font-medium text-neutral-700 mb-2">
                Assign To Reportee
              </FormLabel>
              {reporteesLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                  <span className="text-sm text-neutral-500">Loading reportees...</span>
                </div>
              ) : reportees && reportees.length > 0 ? (
                <Select
                  value={selectedReporteeId?.toString() || ''}
                  onValueChange={(value) => setSelectedReporteeId(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reportee" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportees.map((reportee) => (
                      <SelectItem key={reportee.id} value={reportee.id.toString()}>
                        {reportee.fullName} - {reportee.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-neutral-500">
                  No reportees found. You need to have direct reports to assign goals to them.
                </div>
              )}
              {selectedReporteeId && (
                <FormDescription className="mt-2 text-green-600">
                  This goal will be assigned to the selected reportee.
                </FormDescription>
              )}
              {isManagerOrigin && !selectedReporteeId && (
                <FormDescription className="mt-2 text-orange-600">
                  Please select a reportee to assign this goal to.
                </FormDescription>
              )}
            </div>
          )}
          
          <div className="sm:col-span-6">
            <FormLabel className="block text-sm font-medium text-neutral-700">Supporting Documents</FormLabel>
            <div 
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                <div className="flex text-sm text-neutral-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-neutral-500">
                  PDF, DOC, DOCX, PPT, PPTX up to 10MB
                </p>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center p-2 border border-neutral-300 rounded-md">
                    <File className="h-4 w-4 text-neutral-400 mr-2" />
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setFiles([]);
              setSelectedIdp(null);
              setSelectedReporteeId(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={addGoalMutation.isPending}
          >
            Save Goal
          </Button>
        </div>
      </form>
    </Form>
  );
}
