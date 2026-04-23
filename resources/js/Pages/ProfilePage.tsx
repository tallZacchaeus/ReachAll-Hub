import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Mail, Phone, MapPin, Calendar, Trophy, Sparkles, AlertCircle, CheckCircle2, User as UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion } from "motion/react";
import { BadgesDisplay, DEFAULT_BADGES, BadgeData } from "@/components/BadgesDisplay";
import { useForm, usePage } from "@inertiajs/react";

interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
}

interface ProfilePageProps {
  user: User;
  pendingRequest: any;
}

export default function ProfilePage({ user, pendingRequest }: ProfilePageProps) {
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { flash } = usePage().props as any;

  const { data, setData, post, processing, errors, reset } = useForm({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    location: user.location || "",
    department: user.department || "",
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    post((window as any).route("profile.request-update"), {
      onSuccess: () => {
        setShowEditModal(false);
        reset();
      },
    });
  };

  const earnedBadgeIds = ["punctual-pro", "active-voice", "culture-star", "team-player", "top-performer"];

  const allBadges: BadgeData[] = DEFAULT_BADGES.map(badge => ({
    ...badge,
    earned: earnedBadgeIds.includes(badge.id),
    earnedDate: earnedBadgeIds.includes(badge.id) ? "Oct 2025" : undefined
  }));

  const achievements = [
    { title: "Culture Champion", month: "July 2025", icon: "🏆" },
    { title: "Best Team Player", month: "April 2025", icon: "🤝" },
    { title: "Innovation Leader", month: "January 2025", icon: "💡" },
    { title: "Rising Star", month: "October 2024", icon: "⭐" },
  ];

  const stats = [
    { label: "Awards Won", value: "4", color: "#1F6E4A" },
    { label: "Nominations", value: "12", color: "#FFD400" },
    { label: "Attendance", value: "98%", color: "#1F6E4A" },
    { label: "Punctuality", value: "96%", color: "#FFD400" },
  ];

  const recentActivity = [
    { action: "Nominated for Staff of the Year", date: "Nov 3, 2025" },
    { action: "Completed Q3 Performance Review", date: "Oct 15, 2025" },
    { action: "Won Culture Champion Award", date: "Jul 28, 2025" },
    { action: "Attended Leadership Workshop", date: "Jun 12, 2025" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">View and manage your profile information</p>
        </div>

        {flash.success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{flash.success}</span>
          </motion.div>
        )}
      </div>

      {pendingRequest && (
        <Card className="bg-amber-50 border-amber-200 border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">Pending Profile Update</p>
              <p className="text-sm text-amber-700">
                You have a profile update request pending approval by HR or Super Admin.
                Submitted on {new Date(pendingRequest.created_at).toLocaleDateString()}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarFallback className="bg-brand text-white text-2xl uppercase">
                    {user.name.charAt(0)}{user.name.split(" ")[1]?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-foreground mb-1">{user.name}</h2>
                <p className="text-muted-foreground mb-2">{user.role}</p>
                <Badge className="bg-brand text-white uppercase">{user.employee_id}</Badge>
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{user.location}</span>
                  </div>
                )}
                {user.department && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm">{user.department}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-brand hover:bg-brand/90 text-white">
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Edit Profile Details</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Changes to your profile (except password) require approval from HR or Super Admin.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employee_id">Staff ID</Label>
                          <Input id="employee_id" value={user.employee_id} disabled className="bg-gray-100 uppercase" />
                          <p className="text-[10px] text-gray-500">Staff ID cannot be changed</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" value={data.name} onChange={e => setData("name", e.target.value)} />
                          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={data.email} onChange={e => setData("email", e.target.value)} />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" value={data.phone} onChange={e => setData("phone", e.target.value)} />
                          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" value={data.location} onChange={e => setData("location", e.target.value)} />
                          {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" value={data.department} onChange={e => setData("department", e.target.value)} />
                        {errors.department && <p className="text-xs text-red-500">{errors.department}</p>}
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand/90 text-white">
                          {processing ? "Submitting..." : "Submit for Approval"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={showBadgesModal} onOpenChange={setShowBadgesModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-brand-yellow hover:bg-[#e6c000] text-foreground">
                      <Sparkles className="w-4 h-4 mr-2" />
                      View Badges
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-foreground">
                        <Trophy className="w-6 h-6 text-brand-yellow" />
                        My Badges & Milestones
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        {allBadges.filter(b => b.earned).length} of {allBadges.length} badges earned • Track your achievements and progress
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6">
                      <BadgesDisplay badges={allBadges} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Badges Preview */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm text-foreground">Recent Badges</h4>
                  <Badge variant="outline" className="border-brand-yellow text-brand-yellow">
                    {allBadges.filter(b => b.earned).length}
                  </Badge>
                </div>
                <BadgesDisplay badges={allBadges} compact />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card shadow-sm border-2 hover:shadow-md transition-all" style={{ borderColor: stat.color }}>
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                      <Trophy className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <p className="text-2xl text-foreground mb-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Achievements */}
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-yellow" />
                Recent Achievements
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Awards and recognitions you've received
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 border-2 border-border rounded-lg hover:shadow-md hover:border-brand-yellow transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-yellow to-[#f59e0b] rounded-lg flex items-center justify-center text-2xl shadow-md">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-foreground mb-1">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.month}</p>
                    </div>
                    <Trophy className="w-5 h-5 text-brand-yellow" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Activity</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your recent actions and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.action}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 pb-4 border-b border-border last:border-b-0 last:pb-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-brand mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground mb-1">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

ProfilePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
