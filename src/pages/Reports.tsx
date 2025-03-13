
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportForm } from "@/components/reports/ReportForm";
import { BarChart3, CalendarDays, Download, FileText, Printer } from "lucide-react";
import { getReports, getTaskById } from "@/lib/dataService";
import { formatDate } from "@/lib/utils";

export default function Reports() {
  const [reportType, setReportType] = useState<string>("daily");
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reports, setReports] = useState([]);
  
  useEffect(() => {
    // Load reports from data service
    setReports(getReports());
  }, [refreshKey]);
  
  const filteredReports = reports.filter(report => report.type === reportType);
  
  const handleReportSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDownload = (reportId: string) => {
    const report = filteredReports.find(r => r.id === reportId);
    if (!report) return;
    
    const reportData = {
      ...report,
      tasks: report.taskIds.map(id => {
        const task = getTaskById(id);
        return task ? {
          title: task.title,
          status: task.status,
          assignedDate: task.assignedDate,
          targetDate: task.targetDate
        } : { title: "Unknown task" };
      })
    };
    
    // Create a downloadable JSON file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${report.title.replace(/[^\w]/g, '-')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View and generate task reports
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="daily" onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Reports</SelectItem>
              <SelectItem value="weekly">Weekly Reports</SelectItem>
              <SelectItem value="monthly">Monthly Reports</SelectItem>
            </SelectContent>
          </Select>
          <Button className="whitespace-nowrap" onClick={() => setIsReportFormOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Generate New Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <FileText className="h-4 w-4 mr-2" />
            Report List
          </TabsTrigger>
          <TabsTrigger value="chart">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <div className="space-y-4">
            {filteredReports.length > 0 ? (
              filteredReports.map(report => (
                <Card key={`${report.id}-${refreshKey}`} className="animate-slide-up">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{report.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <CalendarDays className="h-3.5 w-3.5 mr-1" />
                          Generated on {formatDate(report.generatedAt)}
                        </CardDescription>
                      </div>
                      <div className="flex">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 mr-2"
                          onClick={() => window.print()}
                        >
                          <Printer className="h-4 w-4" />
                          <span className="sr-only">Print</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleDownload(report.id)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>Contains {report.taskIds.length} tasks</p>
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        {report.taskIds.slice(0, 3).map(taskId => {
                          const task = getTaskById(taskId);
                          return (
                            <li key={taskId}>{task?.title || "Unknown task"}</li>
                          );
                        })}
                        {report.taskIds.length > 3 && (
                          <li>...and {report.taskIds.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => handleDownload(report.id)}>
                      View Full Report
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No reports found</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  Generate a new {reportType} report to get started
                </p>
                <Button onClick={() => setIsReportFormOpen(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate New Report
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Task Analytics</CardTitle>
              <CardDescription>
                Visual representation of task performance and status
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Charts Coming Soon</h3>
                <p className="text-muted-foreground">
                  Task analytics visualization will be available in the next update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Report Form Dialog */}
      <ReportForm
        open={isReportFormOpen}
        onOpenChange={setIsReportFormOpen}
        onSuccess={handleReportSuccess}
      />
    </div>
  );
}
