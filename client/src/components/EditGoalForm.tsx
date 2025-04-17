import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { goalEditSchema, type GoalEditData, type Goal } from "@shared/schema";
import { useState } from "react";
import { useUpdateGoal } from "@/hooks/use-career-data";
import { useToast } from "@/hooks/use-toast";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface EditGoalFormProps {
  goal: Goal;
  onComplete?: () => void;
}

export function EditGoalForm({ goal, onComplete = () => {} }: EditGoalFormProps) {
  const updateGoalMutation = useUpdateGoal();
  const { toast } = useToast();
  const [progressValue, setProgressValue] = useState<number>(goal.progress);
  
  const form = useForm<GoalEditData>({
    resolver: zodResolver(goalEditSchema),
    defaultValues: {
      progress: goal.progress,
      comment: "",
    },
  });
  
  const onSubmit = async (data: GoalEditData) => {
    try {
      // Create a new comment object
      const newComment = data.comment 
        ? {
            text: data.comment,
            timestamp: new Date()
          } 
        : null;
      
      // Prepare update data
      const updateData: Partial<Goal> = {
        progress: data.progress,
        updatedAt: new Date()
      };
      
      // Add the new comment to existing comments if provided
      if (newComment) {
        const currentComments = goal.comments || [];
        updateData.comments = [...currentComments, newComment];
      }
      
      // Update the goal
      await updateGoalMutation.mutateAsync({
        id: goal.id,
        data: updateData
      });
      
      toast({
        title: "Goal updated",
        description: "Progress updated successfully" + (data.comment ? " with a new comment" : ""),
      });
      
      form.reset();
      onComplete();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Error updating goal",
        description: "There was a problem updating your goal progress. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Progress: {progressValue}%</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    defaultValue={[field.value]}
                    onValueChange={(values) => {
                      field.onChange(values[0]);
                      setProgressValue(values[0]);
                    }}
                    className="py-4"
                  />
                </FormControl>
                <FormDescription>
                  Adjust the slider to update your progress percentage
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add a Comment</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add a comment about this progress update (optional)" 
                    className="resize-none" 
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Optional: Add context about this progress update
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onComplete}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={updateGoalMutation.isPending}
          >
            {updateGoalMutation.isPending ? 'Updating...' : 'Update Progress'}
          </Button>
        </div>
      </form>
    </Form>
  );
}