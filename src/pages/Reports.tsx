
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportForm } from "@/components/reports/ReportForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChart3, CalendarDays, Download, FileText, Printer } from "lucide-react";
import { getReports, getTaskById } from "@/lib/dataService";
import { formatDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Task, TaskStatus } from "@/lib/types";

export default function Reports() {
  const [reportType, setReportType] = useState<string>("daily");
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewReportOpen, setIsViewReportOpen] = useState(false);
  const isMobile = useIsMobile();
  
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

  const openFullReport = (reportId: string) => {
    const report = filteredReports.find(r => r.id === reportId);
    if (!report) return;
    
    setSelectedReport(report);
    setIsViewReportOpen(true);
  };

  // Get task details for the selected report
  const getReportTasks = () => {
    if (!selectedReport) return [];
    
    return selectedReport.taskIds.map(id => {
      const task = getTaskById(id);
      return task || { id, title: "Unknown task", status: "unknown" };
    });
  };

  // Prepare data for charts
  const prepareChartData = () => {
    // Count tasks by status for all reports of the selected type
    const statusCounts = { completed: 0, inProgress: 0, notStarted: 0 };
    
    filteredReports.forEach(report => {
      report.taskIds.forEach(taskId => {
        const task = getTaskById(taskId);
        if (task) {
          if (task.status === TaskStatus.COMPLETED) {
            statusCounts.completed++;
          } else if (task.status === TaskStatus.IN_PROGRESS) {
            statusCounts.inProgress++;
          } else if (task.status === TaskStatus.NOT_STARTED) {
            statusCounts.notStarted++;
          }
        }
      });
    });
    
    return [
      { name: 'Completed', value: statusCounts.completed },
      { name: 'In Progress', value: statusCounts.inProgress },
      { name: 'Not Started', value: statusCounts.notStarted }
    ];
  };

  const chartData = prepareChartData();
  const COLORS = ['#4caf50', '#2196f3', '#ff9800'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View and generate task reports
          </p>
        </div>
        <div className={`flex ${isMobile ? 'flex-col w-full' : 'flex-row'} gap-2`}>
          <Select defaultValue="daily" onValueChange={setReportType}>
            <SelectTrigger className={isMobile ? "w-full" : "w-[180px]"}>
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Reports</SelectItem>
              <SelectItem value="weekly">Weekly Reports</SelectItem>
              <SelectItem value="monthly">Monthly Reports</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className={`whitespace-nowrap ${isMobile ? 'w-full' : ''}`} 
            onClick={() => setIsReportFormOpen(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate New Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className={`${isMobile ? 'w-full' : ''}`}>
          <TabsTrigger value="list" className={isMobile ? 'flex-1' : ''}>
            <FileText className="h-4 w-4 mr-2" />
            Report List
          </TabsTrigger>
          <TabsTrigger value="chart" className={isMobile ? 'flex-1' : ''}>
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
                    <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-start justify-between'}`}>
                      <div>
                        <CardTitle>{report.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <CalendarDays className="h-3.5 w-3.5 mr-1" />
                          Generated on {formatDate(report.generatedAt)}
                        </CardDescription>
                      </div>
                      <div className={`flex ${isMobile ? 'justify-end' : ''}`}>
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
                            <li key={taskId} className="truncate">{task?.title || "Unknown task"}</li>
                          );
                        })}
                        {report.taskIds.length > 3 && (
                          <li>...and {report.taskIds.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => openFullReport(report.id)}
                    >
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
            <CardContent className="h-[400px]">
              {filteredReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <div className="flex flex-col items-center">
                    <h3 className="font-medium mb-2">Task Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col items-center">
                    <h3 className="font-medium mb-2">Task Status Counts</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Tasks" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No Data Available</h3>
                    <p className="text-muted-foreground">
                      Generate reports to see analytics visualization
                    </p>
                  </div>
                </div>
              )}
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

      {/* View Full Report Dialog */}
      <Dialog open={isViewReportOpen} onOpenChange={setIsViewReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              Generated on {selectedReport ? formatDate(selectedReport.generatedAt) : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Tasks in this report</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Target Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getReportTasks().map((task: Task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded-full text-xs inline-flex items-center ${
                        task.status === TaskStatus.COMPLETED 
                          ? 'bg-green-100 text-green-800' 
                          : task.status === TaskStatus.IN_PROGRESS 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </div>
                    </TableCell>
                    <TableCell>{task.assignedDate ? formatDate(task.assignedDate) : 'N/A'}</TableCell>
                    <TableCell>{task.targetDate ? formatDate(task.targetDate) : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsViewReportOpen(false)}>
              Close
            </Button>
            <Button onClick={() => handleDownload(selectedReport?.id)}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
