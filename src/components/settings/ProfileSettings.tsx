import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Camera, Upload } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/dataService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const ProfileSettings = () => {
  const currentUser = getCurrentUser();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profilePicture', file);

      // API call to upload profile picture
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.onrender.com';
      const response = await fetch(`${API_BASE_URL}/api/auth/upload-profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile picture updated successfully');
        
        // Update the user data in localStorage
        const updatedUser = { ...currentUser, avatarUrl: data.avatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Refresh the page to show new profile picture
        window.location.reload();
      } else {
        toast.error(data.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error('Failed to update profile picture. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Profile Settings
          </div>
        </CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback className="text-lg">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Camera icon overlay */}
            <button
              onClick={triggerFileInput}
              disabled={isUploadingImage}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              title="Change profile picture"
            >
              {isUploadingImage ? (
                <Upload className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={triggerFileInput}
              disabled={isUploadingImage}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isUploadingImage ? 'Uploading...' : 'Change Picture'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleProfilePictureChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* User Information - Read Only */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={currentUser.name}
              readOnly
              className="bg-muted cursor-not-allowed"
              title="Name cannot be changed. Contact administrator if you need to update this information."
            />
            <p className="text-sm text-muted-foreground">
              Your name cannot be changed. Contact your administrator to update this information.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={currentUser.email}
              readOnly
              className="bg-muted cursor-not-allowed"
              title="Email cannot be changed. Contact administrator if you need to update this information."
            />
            <p className="text-sm text-muted-foreground">
              Your email address cannot be changed. Contact your administrator to update this information.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={formatRole(currentUser.role)}
              readOnly
              className="bg-muted cursor-not-allowed"
              title="Role is assigned by your administrator"
            />
            <p className="text-sm text-muted-foreground">
              Your role is assigned by your administrator.
            </p>
          </div>

          {/* User ID for reference */}
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={currentUser.id}
              readOnly
              className="bg-muted cursor-not-allowed font-mono text-sm"
              title="Your unique user identifier"
            />
            <p className="text-sm text-muted-foreground">
              Your unique user identifier.
            </p>
          </div>
        </div>

        {/* Information Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                Profile Information
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Your name, email, and role are managed by your system administrator. 
                You can only update your profile picture. If you need to change other 
                information, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
