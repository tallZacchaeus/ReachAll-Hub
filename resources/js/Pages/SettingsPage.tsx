import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Lock, Palette, Globe, Shield, Save, Database, Users } from "lucide-react";
import { toast } from "sonner";

interface SettingsPageProps {
  userRole?: string;
}

export default function SettingsPage({ userRole = "staff" }: SettingsPageProps) {
  const isAdmin = userRole === "superadmin" || userRole === "hr" || userRole === "management";

  const [profileData, setProfileData] = useState({
    fullName: "John Smith",
    email: "john.smith@company.com",
    staffId: "EMP001",
    department: "Engineering",
    role: isAdmin ? "Admin" : "Senior Developer",
    phone: "+1 (555) 123-4567",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    evaluationReminders: !isAdmin, // Staff only
    leaveApprovals: isAdmin, // Admin only
    chatMessages: true,
    announcements: true,
    weeklyReports: isAdmin, // Admin only
    taskAssignments: true,
    newSubmissions: isAdmin, // Admin only
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "UTC-5",
    theme: "light",
    dateFormat: "MM/DD/YYYY",
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: "team",
    showEmail: false,
    showPhone: false,
    allowPeerReviews: !isAdmin, // Staff only
  });

  const [systemSettings, setSystemSettings] = useState({
    autoApproveLeave: false,
    requireTaskApproval: true,
    enableAnonymousReviews: true,
    maxFileUploadSize: "10",
  });

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully!");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved!");
  };

  const handleSavePreferences = () => {
    toast.success("Preferences updated successfully!");
  };

  const handleSavePrivacy = () => {
    toast.success("Privacy settings updated!");
  };

  const handleSaveSystemSettings = () => {
    toast.success("System settings updated!");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Manage system and account settings" : "Manage your account and preferences"}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card border-2 border-border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-brand data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-brand data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-brand data-[state=active]:text-white">
            <Palette className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          {!isAdmin && (
            <TabsTrigger value="privacy" className="data-[state=active]:bg-brand data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="system" className="data-[state=active]:bg-brand data-[state=active]:text-white">
              <Database className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="data-[state=active]:bg-brand data-[state=active]:text-white">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Personal Information</CardTitle>
              <CardDescription className="text-muted-foreground">
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-brand text-white text-2xl">
                    {profileData.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="border-2">
                  Change Photo
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Staff ID</Label>
                  <Input
                    value={profileData.staffId}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={profileData.department} onValueChange={(value) => setProfileData({ ...profileData, department: value })}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={profileData.role}
                    onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="bg-card"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="bg-brand hover:bg-brand/90 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Notification Preferences</CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                  <div>
                    <p className="text-sm text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive email updates</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                  />
                </div>

                {!isAdmin && (
                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">Evaluation Reminders</p>
                      <p className="text-xs text-muted-foreground">Get reminded about pending evaluations</p>
                    </div>
                    <Switch
                      checked={notifications.evaluationReminders}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, evaluationReminders: checked })}
                    />
                  </div>
                )}

                {isAdmin && (
                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">Leave Approvals</p>
                      <p className="text-xs text-muted-foreground">Notify about pending leave requests</p>
                    </div>
                    <Switch
                      checked={notifications.leaveApprovals}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, leaveApprovals: checked })}
                    />
                  </div>
                )}

                {isAdmin && (
                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">New Submissions</p>
                      <p className="text-xs text-muted-foreground">Alert on new evaluation submissions</p>
                    </div>
                    <Switch
                      checked={notifications.newSubmissions}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newSubmissions: checked })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                  <div>
                    <p className="text-sm text-foreground">Task Assignments</p>
                    <p className="text-xs text-muted-foreground">Notify about task updates</p>
                  </div>
                  <Switch
                    checked={notifications.taskAssignments}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, taskAssignments: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                  <div>
                    <p className="text-sm text-foreground">Chat Messages</p>
                    <p className="text-xs text-muted-foreground">Get notified of new messages</p>
                  </div>
                  <Switch
                    checked={notifications.chatMessages}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, chatMessages: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                  <div>
                    <p className="text-sm text-foreground">Announcements</p>
                    <p className="text-xs text-muted-foreground">Receive company announcements</p>
                  </div>
                  <Switch
                    checked={notifications.announcements}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, announcements: checked })}
                  />
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">Weekly Reports</p>
                      <p className="text-xs text-muted-foreground">Receive weekly analytics summaries</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                    />
                  </div>
                )}
              </div>

              <Button onClick={handleSaveNotifications} className="bg-brand hover:bg-brand/90 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">General Preferences</CardTitle>
              <CardDescription className="text-muted-foreground">
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={preferences.language} onValueChange={(value) => setPreferences({ ...preferences, language: value })}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={preferences.timezone} onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-5">UTC-5 (EST)</SelectItem>
                      <SelectItem value="UTC-6">UTC-6 (CST)</SelectItem>
                      <SelectItem value="UTC-7">UTC-7 (MST)</SelectItem>
                      <SelectItem value="UTC-8">UTC-8 (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={preferences.theme} onValueChange={(value) => setPreferences({ ...preferences, theme: value })}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSavePreferences} className="bg-brand hover:bg-brand/90 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab - Staff Only */}
        {!isAdmin && (
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-card shadow-sm border-2 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Privacy Settings</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Control your privacy and visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select value={privacy.profileVisibility} onValueChange={(value) => setPrivacy({ ...privacy, profileVisibility: value })}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="team">Team Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">Show Email Address</p>
                      <p className="text-xs text-muted-foreground">Display email on profile</p>
                    </div>
                    <Switch
                      checked={privacy.showEmail}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, showEmail: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">Show Phone Number</p>
                      <p className="text-xs text-muted-foreground">Display phone on profile</p>
                    </div>
                    <Switch
                      checked={privacy.showPhone}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, showPhone: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">Allow Peer Reviews</p>
                      <p className="text-xs text-muted-foreground">Enable colleagues to review you</p>
                    </div>
                    <Switch
                      checked={privacy.allowPeerReviews}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, allowPeerReviews: checked })}
                    />
                  </div>
                </div>

                <Button onClick={handleSavePrivacy} className="bg-brand hover:bg-brand/90 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* System Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-card shadow-sm border-2 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">System Settings</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Configure platform-wide settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">Auto-Approve Leave Requests</p>
                      <p className="text-xs text-muted-foreground">Automatically approve leave under 2 days</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoApproveLeave}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoApproveLeave: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">Require Task Approval</p>
                      <p className="text-xs text-muted-foreground">Tasks must be approved before completion</p>
                    </div>
                    <Switch
                      checked={systemSettings.requireTaskApproval}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, requireTaskApproval: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="text-sm text-foreground">Anonymous Reviews</p>
                      <p className="text-xs text-muted-foreground">Allow anonymous peer reviews</p>
                    </div>
                    <Switch
                      checked={systemSettings.enableAnonymousReviews}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, enableAnonymousReviews: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max File Upload Size (MB)</Label>
                    <Select 
                      value={systemSettings.maxFileUploadSize} 
                      onValueChange={(value) => setSystemSettings({ ...systemSettings, maxFileUploadSize: value })}
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 MB</SelectItem>
                        <SelectItem value="10">10 MB</SelectItem>
                        <SelectItem value="25">25 MB</SelectItem>
                        <SelectItem value="50">50 MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveSystemSettings} className="bg-brand hover:bg-brand/90 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save System Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Security</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="Enter current password" className="bg-card" />
                </div>

                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="Enter new password" className="bg-card" />
                </div>

                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm new password" className="bg-card" />
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-brand-subtle dark:bg-muted border-2 border-brand rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-brand" />
                  <p className="text-sm text-foreground">Two-Factor Authentication</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline" className="border-2 border-brand text-brand">
                  Enable 2FA
                </Button>
              </div>

              <Button className="bg-brand hover:bg-brand/90 text-white">
                <Save className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

SettingsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
