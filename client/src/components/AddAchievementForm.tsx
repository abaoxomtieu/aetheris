import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { achievementFormSchema, type AchievementFormData } from "@shared/schema";
import { useState, useRef } from "react";
import { useAddAchievement, useGoals } from "@/hooks/use-career-data";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, File, X } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

interface AddAchievementFormProps {
  onComplete?: () => void;
}

export function AddAchievementForm({ onComplete = () => {} }: AddAchievementFormProps) {
  const addAchievementMutation = useAddAchievement();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: goals, isLoading: isGoalsLoading } = useGoals();
  
  const form = useForm<AchievementFormData>({
    resolver: zodResolver(achievementFormSchema),
    defaultValues: {
      userId: 1, // For demo purposes, hardcoded to 1
      title: "",
      description: "",
      date: new Date(),
      goalId: undefined,
      attachments: [],
    },
  });
  
  const onSubmit = async (data: AchievementFormData) => {
    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append("userId", data.userId.toString());
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("date", data.date ? data.date.toISOString() : new Date().toISOString());
      
      if (data.goalId) {
        formData.append("goalId", data.goalId.toString());
      }
      
      // Add files
      files.forEach(file => {
        formData.append("attachments", file);
      });
      
      await addAchievementMutation.mutateAsync(formData);
      
      toast({
        title: "Achievement added",
        description: "Your achievement has been recorded successfully.",
      });
      
      // Reset the form
      form.reset();
      setFiles([]);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Error adding achievement",
        description: "There was a problem adding your achievement. Please try again.",
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
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="sm:col-span-6">
                <FormLabel>Achievement Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="E.g., Completed certification, Led successful project" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-6">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your achievement, its impact, and how it helped you grow professionally" 
                    className="resize-none" 
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Provide details about what you accomplished and why it matters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="goalId"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Related Goal (Optional)</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === 'none' ? null : parseInt(value))} 
                  value={field.value?.toString() || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a goal (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {!isGoalsLoading && goals && goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id.toString()}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Link this achievement to one of your goals.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Achievement Date</FormLabel>
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
                  <label htmlFor="achievement-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload a file</span>
                    <input
                      id="achievement-file-upload"
                      name="achievement-file-upload"
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
                  PDF, DOC, DOCX, JPG, PNG up to 10MB
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
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setFiles([]);
              onComplete();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={addAchievementMutation.isPending}
          >
            {addAchievementMutation.isPending ? 'Saving...' : 'Save Achievement'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}