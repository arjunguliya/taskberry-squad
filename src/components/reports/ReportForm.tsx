
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateReport } from "@/lib/dataService.ts";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReportForm({ open, onOpenChange, onSuccess }: ReportFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    setIsSubmitting(true);
    
    try {
      generateReport(title, type);
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Auto-generate a title based on the selected report type
  const generateTitle = () => {
    const today = new Date();
    
    switch (type) {
      case 'daily':
        setTitle(`Daily Progress Report - ${format(today, 'MMM d, yyyy')}`);
        break;
      case 'weekly':
        setTitle(`Weekly Summary - Week ${getWeekNumber(today)}, ${today.getFullYear()}`);
        break;
      case 'monthly':
        setTitle(`Monthly Overview - ${format(today, 'MMMM yyyy')}`);
        break;
    }
  };
  
  // Helper to get week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? "w-[95%] max-w-[95%] rounded-t-lg p-4" : "sm:max-w-[425px]"}>
        <DialogHeader>
          <DialogTitle>Generate New Report</DialogTitle>
          <DialogDescription>
            Create a new report based on tasks.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Report Type</Label>
            <Select 
              value={type} 
              onValueChange={(value: 'daily' | 'weekly' | 'monthly') => {
                setType(value);
                // Auto-generate title when type changes
                setTimeout(generateTitle, 0);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Report</SelectItem>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="title">Report Title*</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={generateTitle}
              >
                Auto-generate
              </Button>
            </div>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
            />
          </div>
          
          <DialogFooter className={isMobile ? "flex-col gap-2" : ""}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className={isMobile ? "w-full" : ""}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={isMobile ? "w-full" : ""}
            >
              {isSubmitting ? "Generating..." : "Generate Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
