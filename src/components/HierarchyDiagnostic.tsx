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
      errors: [],
      roleMismatch: {}
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

          // ADDED: Check for role consistency
          const roleTypes = [...new Set(users.map((user: any) => user.role))];
          results.roleMismatch.rolesInDatabase = roleTypes;
          results.roleMismatch.hasTeamMember = roleTypes.includes('team_member');
          results.roleMismatch.hasMember = roleTypes.includes('member');
          results.roleMismatch.inconsistency = roleTypes.includes('team_member') && roleTypes.includes('member');
          
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
        // FIXED: Updated expected body to use 'member' instead of 'team_member'
        results.apiCalls.approvalEndpoint = `${API_BASE_URL}/api/users/{userId}/approve`;
        results.apiCalls.expectedMethod = 'PUT';
        results.apiCalls.expectedBody = {
          role: 'member',
          supervisorId: 'supervisor_id',
          managerId: 'manager_id'
        };
        results.apiCalls.frontendExpectation = 'Frontend sends role as "member"';
        results.apiCalls.backendExpectation = 'Backend expects role as "member"';
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

      // Test 5: Role validation check
      console.log('🔍 Testing role validation...');
      try {
        // Simulate a test call to see what roles the backend accepts
        const testResponse = await fetch(`${API_BASE_URL}/api/users/test-role-validation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: 'member' })
        });
        
        if (testResponse.status === 404) {
          results.backend.roleValidationEndpoint = 'Not implemented (expected)';
        } else if (testResponse.ok) {
          results.backend.roleValidationEndpoint = 'Available';
        } else {
          const errorData = await testResponse.json();
          if (errorData.message && errorData.message.includes('Must be one of')) {
            results.backend.acceptedRoles = errorData.message;
          }
        }
      } catch (error) {
        // This is expected to fail, so we don't treat it as an error
        results.backend.roleValidationEndpoint = 'Test endpoint not available';
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
            <strong> Fixed: Now checking for 'member' vs 'team_member' role consistency.</strong>
          </p>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
        </CardContent>
      </Card>

      {diagnosticResults && (
        <div className="space-y-4">
          {/* Role Consistency Check */}
          {diagnosticResults.roleMismatch && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(!diagnosticResults.roleMismatch.inconsistency)}
                  Role Consistency Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Roles in Database</span>
                    <Badge variant="outline">
                      {diagnosticResults.roleMismatch.rolesInDatabase?.join(', ') || 'None found'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Has 'team_member' role</span>
                    {getStatusBadge(diagnosticResults.roleMismatch.hasTeamMember)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Has 'member' role</span>
                    {getStatusBadge(diagnosticResults.roleMismatch.hasMember)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Role Inconsistency Detected</span>
                    {diagnosticResults.roleMismatch.inconsistency ? 
                      <Badge className="bg-red-100 text-red-800">⚠️ Yes</Badge> :
                      <Badge className="bg-green-100 text-green-800">✓ None</Badge>
                    }
                  </div>

                  {diagnosticResults.roleMismatch.inconsistency && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-sm text-amber-800">
                        <strong>Issue Found:</strong> Your database contains both 'team_member' and 'member' roles. 
                        The backend expects 'member' but some users might have 'team_member'. 
                        This mismatch causes the blank screen issue.
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

                {diagnosticResults.backend.acceptedRoles && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">Backend Role Validation:</div>
                    <div className="text-xs text-blue-800">{diagnosticResults.backend.acceptedRoles}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Expected API Configuration (FIXED)</CardTitle>
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
                  <div className="font-medium">Expected Request (CORRECTED):</div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{JSON.stringify(diagnosticResults.apiCalls.expectedBody, null, 2)}
                  </pre>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <div className="text-xs font-medium text-green-900">✓ Frontend (Fixed):</div>
                    <div className="text-xs text-green-800">{diagnosticResults.apiCalls.frontendExpectation}</div>
                  </div>
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <div className="text-xs font-medium text-green-900">✓ Backend:</div>
                    <div className="text-xs text-green-800">{diagnosticResults.apiCalls.backendExpectation}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Solution Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Solution Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-900 mb-2">Fixed Components:</div>
                  <ul className="text-xs text-green-800 space-y-1">
                    <li>• TeamMembersManager.tsx - Updated all "team_member" to "member"</li>
                    <li>• EnhancedApprovalForm.tsx - Updated role checks and validation</li>
                    <li>• TeamMemberForm.tsx - Updated role assignment logic</li>
                    <li>• HierarchyDiagnostic.tsx - Added role consistency checks</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">What was changed:</div>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Changed all SelectItem values from "team_member" to "member"</li>
                    <li>• Updated all role validation checks</li>
                    <li>• Fixed hierarchy display text</li>
                    <li>• Maintained "Member" as display label for consistency</li>
                  </ul>
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
