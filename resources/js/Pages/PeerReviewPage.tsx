import { UserCheck, Send, Lock, Eye, Users as UsersIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";

interface ReviewCategory {
  id: string;
  name: string;
  value: number;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export default function PeerReviewPage({ userRole }: { userRole: string }) {
  const [reviews, setReviews] = useState<ReviewCategory[]>([
    { id: "collaboration", name: "Collaboration", value: 3 },
    { id: "reliability", name: "Reliability", value: 3 },
    { id: "punctuality", name: "Punctuality", value: 3 },
    { id: "communication", name: "Communication", value: 3 },
  ]);

  const [selectedTeamMember, setSelectedTeamMember] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [managerNotes, setManagerNotes] = useState("");

  const isManager = userRole === "management" || userRole === "superadmin" || userRole === "hr";
  const canOnlyViewResults = isManager; // Admin/HR/Management can only view results

  // Team members based on department (simulated)
  const teamMembers: TeamMember[] = [
    { id: "EMP001", name: "John Smith", avatar: "JS", role: "Senior Developer" },
    { id: "EMP003", name: "Mike Chen", avatar: "MC", role: "Software Engineer" },
    { id: "EMP008", name: "Emma Wilson", avatar: "EW", role: "DevOps Engineer" },
    { id: "EMP009", name: "Lisa Park", avatar: "LP", role: "Tech Lead" },
    { id: "EMP014", name: "James Wilson", avatar: "JW", role: "Frontend Developer" },
    { id: "EMP018", name: "Daniel Park", avatar: "DP", role: "Backend Developer" },
    { id: "EMP020", name: "Kevin Zhang", avatar: "KZ", role: "Data Engineer" },
    { id: "EMP022", name: "Oliver Harris", avatar: "OH", role: "Mobile Developer" },
    { id: "EMP026", name: "Noah White", avatar: "NW", role: "Security Engineer" },
    { id: "EMP029", name: "Charlotte Jackson", avatar: "CJ", role: "QA Engineer" },
    { id: "EMP032", name: "Benjamin Lee", avatar: "BL", role: "Cloud Architect" },
    { id: "EMP035", name: "Evelyn Moore", avatar: "EM", role: "UI/UX Designer" },
    { id: "EMP038", name: "Logan Thomas", avatar: "LT", role: "Database Admin" },
  ];

  const handleSliderChange = (id: string, value: number[]) => {
    setReviews(reviews.map((r) => (r.id === id ? { ...r, value: value[0] } : r)));
  };

  const handleSubmitReview = () => {
    if (!selectedTeamMember) {
      toast.error("Please select a team member to review");
      return;
    }
    if (reviews.some((r) => r.value === 0)) {
      toast.error("Please rate all categories");
      return;
    }

    const selectedMember = teamMembers.find((m) => m.id === selectedTeamMember);
    toast.success(`Anonymous review submitted for ${selectedMember?.name}!`);
    
    // Reset form
    setReviews(reviews.map((r) => ({ ...r, value: 3 })));
    setSelectedTeamMember("");
    setAdditionalNotes("");
    setManagerNotes("");
  };

  const getRatingLabel = (value: number) => {
    const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
    return labels[value];
  };

  const getRatingColor = (value: number) => {
    if (value >= 4) return "var(--brand)";
    if (value >= 3) return "var(--brand-yellow)";
    return "var(--destructive)";
  };

  // Mock data for viewing submitted reviews (HR/Management only)
  const submittedReviews = [
    {
      id: "1",
      targetStaff: "EMP001",
      targetName: "John Smith",
      avatar: "JS",
      submittedDate: "Nov 4, 2025",
      ratings: {
        collaboration: 5,
        reliability: 4,
        punctuality: 5,
        communication: 5,
      },
      notes: "Excellent team player. Always willing to help and share knowledge.",
    },
    {
      id: "2",
      targetStaff: "EMP003",
      targetName: "Mike Chen",
      avatar: "MC",
      submittedDate: "Nov 3, 2025",
      ratings: {
        collaboration: 4,
        reliability: 5,
        punctuality: 4,
        communication: 4,
      },
      notes: "Very reliable and punctual. Great technical skills.",
    },
    {
      id: "3",
      targetStaff: "EMP009",
      targetName: "Lisa Park",
      avatar: "LP",
      submittedDate: "Nov 2, 2025",
      ratings: {
        collaboration: 5,
        reliability: 5,
        punctuality: 5,
        communication: 4,
      },
      notes: "Outstanding leadership and mentorship. Drives the team forward.",
    },
  ];

  const getSelectedMember = () => {
    return teamMembers.find((m) => m.id === selectedTeamMember);
  };

  const selectedMember = getSelectedMember();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground mb-2">Peer Reviews</h1>
        <p className="text-muted-foreground">
          {canOnlyViewResults
            ? "View anonymous team feedback and peer evaluations"
            : "Submit anonymous peer evaluations to help improve team performance"}
        </p>
      </div>

      {/* Submit New Review - Only for Staff */}
      {!canOnlyViewResults && (
        <Card className="bg-card shadow-sm border-2 border-brand">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand" />
            <CardTitle className="text-foreground">Submit Peer Evaluation</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Your review is completely anonymous and visible only to HR and Management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Member Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-brand" />
              Select Team Member to Review
            </Label>
            <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Choose a team member..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <span>{member.name}</span>
                      <span className="text-xs text-muted-foreground">• {member.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMember && (
              <Card className="mt-2 bg-brand-subtle dark:bg-muted border border-brand">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-brand text-white">
                        {selectedMember.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-foreground">{selectedMember.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedMember.id} • {selectedMember.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Rating Categories */}
          <div className="space-y-6">
            {reviews.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">{category.name}</Label>
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: getRatingColor(category.value) }}
                  >
                    {category.value} - {getRatingLabel(category.value)}
                  </Badge>
                </div>
                <Slider
                  value={[category.value]}
                  onValueChange={(value) => handleSliderChange(category.id, value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Very Good</span>
                  <span>Excellent</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Comments (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Share any additional feedback or observations..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="bg-card min-h-[100px]"
            />
          </div>

          {/* Manager Private Notes */}
          {isManager && (
            <div className="space-y-2 p-4 bg-[#fff9e6] rounded-lg border border-brand-yellow">
              <Label htmlFor="manager-notes" className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-yellow" />
                Private Manager Notes (Visible only to Super Admins)
              </Label>
              <Textarea
                id="manager-notes"
                placeholder="Enter confidential notes for super admin review..."
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                className="bg-card min-h-[80px]"
              />
            </div>
          )}

          <Button
            onClick={handleSubmitReview}
            className="w-full bg-brand hover:bg-brand/90 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Anonymous Review
          </Button>
        </CardContent>
      </Card>
      )}

      {/* View Submitted Reviews (HR/Management Only) */}
      {canOnlyViewResults && (
        <Card className="bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand" />
              <CardTitle className="text-foreground">Recent Peer Reviews</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Anonymous feedback submitted by team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submittedReviews.map((review) => (
              <Card key={review.id} className="bg-muted">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-brand text-white">
                        {review.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-foreground">{review.targetName}</p>
                      <p className="text-sm text-muted-foreground">
                        {review.targetStaff} • {review.submittedDate}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {Object.entries(review.ratings).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 bg-card rounded"
                      >
                        <span className="text-sm text-muted-foreground capitalize">{key}</span>
                        <Badge
                          className="text-white"
                          style={{ backgroundColor: getRatingColor(value) }}
                        >
                          {value}/5
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-card rounded">
                    <p className="text-sm text-muted-foreground">{review.notes}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

PeerReviewPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
