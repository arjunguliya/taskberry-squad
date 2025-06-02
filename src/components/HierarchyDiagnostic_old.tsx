import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

export default function HierarchyDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const results = {
      frontend: {},
      backend: {},
      apiCalls: {},
      errors: []
    };

    try {
      // Test 1: Check if functions exist
      console.log('🔍 Testing frontend functions...');
      try {
        const { getActiveUsers, getSupervisors, getManagers, approveUser } = await import('@/lib/dataService');
        results.frontend.functionsExist = true;
        results.frontend.functions = ['getActiveUsers', 'getSupervisors', 'getManagers', 'approveUser'];
      } catch (error) {
        results.frontend.functionsExist = false;
        results.errors.push(`Frontend functions missing: ${error}`);
      }

      // Test 2: Check API connectivity
      console.log('🔍 Testing API connectivity...');
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://taskberry-backend.onrender.com';
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const users = await response.json();
          results.backend.usersEndpoint = true;
          results.backend.userCount = users.length;
          results.backend.sampleUser = users[0] || null;
          
          // Check if users have hierarchy fields
          const userWithHierarchy = users.find((user: any) => 
            user.supervisorId || user.managerId || user.supervisor || user.manager
          );
          results.backend.hierarchyFieldsFound = !!userWithHierarchy;
          results.backend.hierarchyFields = userWithHierarchy ? 
            Object.keys(userWithHierarchy).filter(key => 
              key.includes('supervisor') || key.includes('manager')
            ) : [];
        } else {
          results.backend.usersEndpoint = false;
          results.errors.push(`Users API failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        results.backend.usersEndpoint = false;
        results.errors.push(`API connection failed: ${error}`);
      }

      // Test 3: Check approval endpoint structure
      console.log('🔍 Testing approval endpoint...');
      try {
        // We won't actually call this, just check if it's configured
        results.apiCalls.approvalEndpoint = `${API_BASE_URL}/api/users/{userId}/approve`;
        results.apiCalls.expectedMethod = 'PUT';
        results.apiCalls.expectedBody = {
          role: 'team_member',
          supervisorId: 'supervisor_id',
          managerId: 'manager_id'
        };
      } catch (error) {
        results.errors.push(`Approval endpoint check failed: ${error}`);
      }

      // Test 4: Check database schema inference
      if (results.backend.sampleUser) {
        const user = results.backend.sampleUser;
        results.backend.userSchema = {
          hasId: !!user.id,
          hasName: !!user.name,
          hasEmail: !!user.email,
          hasRole: !!user.role,
          hasStatus: !!user.status,
          hasSupervisorId: !!user.supervisorId,
          hasManagerId: !!user.managerId,
          hasSupervisor: !!user.supervisor,
          hasManager: !!user.manager,
          allFields: Object.keys(user)
        };
      }

    } catch (error) {
      results.errors.push(`Diagnostic failed: ${error}`);
    }

    setDiagnosticResults(results);
    setLoading(false);
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  const getStatusBadge = (status: boolean | undefined) => {
    if (status === true) return <Badge className="bg-green-100 text-green-800">✓ Pass</Badge>;
    if (status === false) return <Badge className="bg-red-100 text-red-800">✗ Fail</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">? Unknown</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Hierarchy System Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This tool will help diagnose why the hierarchical assignments aren't working.
          </p>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
        </CardContent>
      </Card>

      {diagnosticResults && (
        <div className="space-y-4">
          {/* Frontend Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(diagnosticResults.frontend.functionsExist)}
                Frontend Functions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Functions Available</span>
                  {getStatusBadge(diagnosticResults.frontend.functionsExist)}
                </div>
                {diagnosticResults.frontend.functions && (
                  <div className="text-sm text-muted-foreground">
                    Available: {diagnosticResults.frontend.functions.join(', ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Backend Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(diagnosticResults.backend.usersEndpoint)}
                Backend API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Users Endpoint</span>
                  {getStatusBadge(diagnosticResults.backend.usersEndpoint)}
                </div>
                
                {diagnosticResults.backend.userCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span>Users Found</span>
                    <Badge variant="outline">{diagnosticResults.backend.userCount}</Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>Hierarchy Fields in Database</span>
                  {getStatusBadge(diagnosticResults.backend.hierarchyFieldsFound)}
                </div>

                {diagnosticResults.backend.hierarchyFields?.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Found fields: {diagnosticResults.backend.hierarchyFields.join(', ')}
                  </div>
                )}

                {diagnosticResults.backend.userSchema && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">User Schema Analysis:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>ID: {diagnosticResults.backend.userSchema.hasId ? '✓' : '✗'}</div>
                      <div>Name: {diagnosticResults.backend.userSchema.hasName ? '✓' : '✗'}</div>
                      <div>Email: {diagnosticResults.backend.userSchema.hasEmail ? '✓' : '✗'}</div>
                      <div>Role: {diagnosticResults.backend.userSchema.hasRole ? '✓' : '✗'}</div>
                      <div>Status: {diagnosticResults.backend.userSchema.hasStatus ? '✓' : '✗'}</div>
                      <div>SupervisorId: {diagnosticResults.backend.userSchema.hasSupervisorId ? '✓' : '✗'}</div>
                      <div>ManagerId: {diagnosticResults.backend.userSchema.hasManagerId ? '✓' : '✗'}</div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      All fields: {diagnosticResults.backend.userSchema.allFields.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Expected API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="font-medium">Approval Endpoint:</div>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {diagnosticResults.apiCalls.approvalEndpoint}
                  </code>
                </div>
                
                <div>
                  <div className="font-medium">Expected Request:</div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{JSON.stringify(diagnosticResults.apiCalls.expectedBody, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {diagnosticResults.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Issues Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diagnosticResults.errors.map((error: string, index: number) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800">{error}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
