import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User, Lock, AtSign, AlertTriangle } from "lucide-react";

interface FullUserData {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePhoto: string | null;
  role: string;
  usernameChanged: boolean;
}

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [fullUserData, setFullUserData] = useState<FullUserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  const [newUsername, setNewUsername] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    async function fetchFullUserData() {
      try {
        const res = await fetch("/api/users/me/full", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setFullUserData(data);
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setProfilePhoto(data.profilePhoto || "");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoadingUser(false);
      }
    }
    
    if (isAuthenticated) {
      fetchFullUserData();
    }
  }, [isAuthenticated]);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, profilePhoto }),
      });
      
      if (res.ok) {
        toast({ title: "Profile updated", description: "Your profile has been saved." });
        await refreshUser();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/users/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      if (res.ok) {
        toast({ title: "Password changed", description: "Your password has been updated." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleUsernameChange = async () => {
    if (newUsername.trim().length < 3) {
      toast({ title: "Error", description: "Username must be at least 3 characters", variant: "destructive" });
      return;
    }
    
    setUsernameSaving(true);
    try {
      const res = await fetch("/api/users/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newUsername: newUsername.trim() }),
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Username changed", description: "Your username has been updated." });
        setFullUserData(prev => prev ? { ...prev, username: data.username, usernameChanged: true } : null);
        setNewUsername("");
        await refreshUser();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to change username", variant: "destructive" });
    } finally {
      setUsernameSaving(false);
    }
  };

  if (isLoading || loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="animate-pulse text-rose-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-serif font-semibold text-gray-800 mb-6" data-testid="settings-title">
          Account Settings
        </h1>

        <div className="space-y-6">
          <Card className="border-rose-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-rose-400" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-rose-200">
                  <AvatarImage src={profilePhoto || undefined} alt="Profile" />
                  <AvatarFallback className="bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600 text-xl font-medium">
                    {fullUserData?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="profilePhoto">Profile Photo URL</Label>
                  <Input
                    id="profilePhoto"
                    data-testid="input-profile-photo"
                    placeholder="https://example.com/photo.jpg"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    className="border-rose-200 focus:border-rose-400"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    data-testid="input-first-name"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border-rose-200 focus:border-rose-400"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    data-testid="input-last-name"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border-rose-200 focus:border-rose-400"
                  />
                </div>
              </div>
              
              <Button
                data-testid="button-save-profile"
                onClick={handleProfileSave}
                disabled={profileSaving}
                className="w-full bg-gradient-to-r from-rose-300 to-rose-400 hover:from-rose-400 hover:to-rose-500 text-white"
              >
                {profileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-rose-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-rose-400" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  data-testid="input-current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="border-rose-200 focus:border-rose-400"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  data-testid="input-new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-rose-200 focus:border-rose-400"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  data-testid="input-confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-rose-200 focus:border-rose-400"
                />
              </div>
              
              <Button
                data-testid="button-change-password"
                onClick={handlePasswordChange}
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-rose-300 to-rose-400 hover:from-rose-400 hover:to-rose-500 text-white"
              >
                {passwordSaving ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-rose-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AtSign className="h-5 w-5 text-rose-400" />
                Change Username
              </CardTitle>
              <CardDescription>
                Current username: <span className="font-medium text-gray-800">{fullUserData?.username}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fullUserData?.usernameChanged ? (
                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">You have already changed your username once. This action cannot be done again.</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm">Warning: You can only change your username once. This action cannot be undone.</span>
                  </div>
                  
                  <div>
                    <Label htmlFor="newUsername">New Username</Label>
                    <Input
                      id="newUsername"
                      data-testid="input-new-username"
                      placeholder="Enter new username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="border-rose-200 focus:border-rose-400"
                    />
                  </div>
                  
                  <Button
                    data-testid="button-change-username"
                    onClick={handleUsernameChange}
                    disabled={usernameSaving || !newUsername.trim()}
                    className="w-full bg-gradient-to-r from-rose-300 to-rose-400 hover:from-rose-400 hover:to-rose-500 text-white"
                  >
                    {usernameSaving ? "Changing..." : "Change Username"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
