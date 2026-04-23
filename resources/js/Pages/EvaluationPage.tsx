import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, Star, Clock, Heart, Zap, Users, ChevronLeft, ChevronRight, Plus, Info, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface AwardCategory {
  id: string;
  title: string;
  description: string;
  criteria: string[];
  icon: any;
  color: string;
}

interface Staff {
  id: string;
  name: string;
  avatar: string;
  department: string;
  role: string;
}

export default function EvaluationPage({ userRole }: { userRole?: string }) {
  const isAdmin = userRole === "superadmin" || userRole === "hr";
  const isStaff = userRole === "staff";
  
  const [currentIndex, setCurrentIndex] = useState(0);
  // For staff: allow 2 nominations, for admin: unlimited
  const [votes, setVotes] = useState<{ [key: string]: string[] }>({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    title: "",
    description: "",
    criteria: "",
  });

  // All staff members available for nomination - updated with proper departments
  const allStaff: Staff[] = [
    // Video & Production
    { id: "EMP001", name: "Sarah Johnson", avatar: "SJ", department: "Video & Production", role: "Video Producer" },
    { id: "EMP002", name: "Michael Torres", avatar: "MT", department: "Video & Production", role: "Video Editor" },
    { id: "EMP003", name: "Jessica Lee", avatar: "JL", department: "Video & Production", role: "Camera Operator" },
    { id: "EMP004", name: "David Martinez", avatar: "DM", department: "Video & Production", role: "Motion Graphics Designer" },
    
    // Project Management
    { id: "EMP006", name: "John Rodriguez", avatar: "JR", department: "Project Management", role: "Senior Project Manager" },
    { id: "EMP007", name: "Amanda White", avatar: "AW", department: "Project Management", role: "Project Manager" },
    { id: "EMP008", name: "Robert Kim", avatar: "RK", department: "Project Management", role: "Project Coordinator" },
    
    // Product Team
    { id: "EMP010", name: "Mike Chen", avatar: "MC", department: "Product Team", role: "Product Manager" },
    { id: "EMP011", name: "Rachel Green", avatar: "RG", department: "Product Team", role: "UX Designer" },
    { id: "EMP012", name: "Daniel Brown", avatar: "DB", department: "Product Team", role: "UI Designer" },
    { id: "EMP013", name: "Nina Patel", avatar: "NP", department: "Product Team", role: "Product Analyst" },
    
    // Content & Brand Comms
    { id: "EMP016", name: "Emily Davis", avatar: "ED", department: "Content & Brand Comms", role: "Content Manager" },
    { id: "EMP017", name: "James Anderson", avatar: "JA", department: "Content & Brand Comms", role: "Content Writer" },
    { id: "EMP018", name: "Olivia Martinez", avatar: "OM", department: "Content & Brand Comms", role: "Social Media Manager" },
    
    // Incubator Team
    { id: "EMP025", name: "Kevin Zhang", avatar: "KZ", department: "Incubator Team", role: "Tech Trainer (Team Lead)" },
    { id: "EMP026", name: "Maria Santos", avatar: "MS", department: "Incubator Team", role: "Program Coordinator" },
    { id: "EMP027", name: "Ryan Cooper", avatar: "RC", department: "Incubator Team", role: "Curriculum Developer" },
    
    // Skillup Team  
    { id: "EMP029", name: "Daniel Park", avatar: "DP", department: "Skillup Team", role: "Skills Development Lead" },
    { id: "EMP030", name: "Grace Liu", avatar: "GL", department: "Skillup Team", role: "Training Specialist" },
    
    // DAF Team
    { id: "EMP033", name: "Patricia Anderson", avatar: "PA", department: "DAF Team", role: "DAF Manager" },
    { id: "EMP034", name: "Robert Wilson", avatar: "RW", department: "DAF Team", role: "Admin Officer" },
    { id: "EMP035", name: "Lisa Martinez", avatar: "LM", department: "DAF Team", role: "Programs Coordinator" },
    
    // Graphics Design
    { id: "EMP038", name: "Alex Wong", avatar: "AW", department: "Graphics Design", role: "Senior Designer (Team Lead)" },
    { id: "EMP039", name: "Natalie Green", avatar: "NG", department: "Graphics Design", role: "Graphic Designer" },
    
    // Accounting
    { id: "EMP042", name: "Thomas Clark", avatar: "TC", department: "Accounting", role: "Senior Accountant" },
    { id: "EMP043", name: "Jennifer Adams", avatar: "JA", department: "Accounting", role: "Accountant" },
    
    // Business Development
    { id: "EMP045", name: "Maria Garcia", avatar: "MG", department: "Business Development", role: "Business Developer" },
    { id: "EMP046", name: "Steven Mitchell", avatar: "SM", department: "Business Development", role: "Partnership Manager" },
  ];

  const [categories, setCategories] = useState<AwardCategory[]>([
    {
      id: "staff-of-year",
      title: "Staff of the Year",
      description: "Outstanding overall performance and contribution",
      criteria: [
        "Consistent high performance across all metrics",
        "Demonstrates leadership and initiative",
        "Positive impact on team and company culture",
        "Goes above and beyond job requirements",
      ],
      icon: Award,
      color: "#1F6E4A",
    },
    {
      id: "culture-champion",
      title: "Culture Champion",
      description: "Best embodies company values and culture",
      criteria: [
        "Actively promotes company values",
        "Creates inclusive and positive work environment",
        "Mentors and supports colleagues",
        "Participates in team building activities",
      ],
      icon: Heart,
      color: "#FFD400",
    },
    {
      id: "innovation-leader",
      title: "Innovation Leader",
      description: "Most creative and innovative solutions",
      criteria: [
        "Introduces new ideas and solutions",
        "Embraces change and experimentation",
        "Solves problems creatively",
        "Improves processes and efficiency",
      ],
      icon: Zap,
      color: "#1F6E4A",
    },
    {
      id: "team-player",
      title: "Best Team Player",
      description: "Exceptional collaboration and teamwork",
      criteria: [
        "Supports and helps team members",
        "Shares knowledge and resources",
        "Promotes team cohesion",
        "Reliable and dependable",
      ],
      icon: Users,
      color: "#FFD400",
    },
    {
      id: "punctuality-award",
      title: "Punctuality Award",
      description: "Most reliable and on-time staff member",
      criteria: [
        "Consistently arrives on time",
        "Meets all deadlines",
        "Reliable attendance record",
        "Sets good example for others",
      ],
      icon: Clock,
      color: "#1F6E4A",
    },
  ]);

  const currentCategory = categories[currentIndex];
  const votedCount = Object.keys(votes).length;
  const totalCategories = categories.length;
  const progressPercentage = (votedCount / totalCategories) * 100;

  const getSelectedStaff = (categoryId: string) => {
    const staffIds = votes[categoryId] || [];
    return staffIds.map((id) => allStaff.find((s) => s.id === id)).filter(Boolean) as Staff[];
  };

  const handleAddNominee = (staffId: string) => {
    const currentVotes = votes[currentCategory.id] || [];
    const maxNominees: number = isStaff ? 2 : 10; // Staff can nominate 2, admin unlimited (capped at 10 for sanity)
    
    if (currentVotes.includes(staffId)) {
      toast.error("This person is already nominated");
      return;
    }
    
    if (currentVotes.length >= maxNominees) {
      toast.error(`You can only nominate ${maxNominees} ${maxNominees === 1 ? 'person' : 'people'} per award`);
      return;
    }
    
    const staff = allStaff.find((s) => s.id === staffId);
    setVotes((prev) => ({ 
      ...prev, 
      [currentCategory.id]: [...currentVotes, staffId] 
    }));
    toast.success(`${staff?.name} added to nominations!`);
  };

  const handleRemoveNominee = (staffId: string) => {
    const currentVotes = votes[currentCategory.id] || [];
    setVotes((prev) => ({ 
      ...prev, 
      [currentCategory.id]: currentVotes.filter((id) => id !== staffId) 
    }));
    toast.success("Nominee removed");
  };

  const handleNext = () => {
    if (currentIndex < categories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.title || !newCategory.description || !newCategory.criteria) {
      toast.error("Please fill in all fields");
      return;
    }

    const criteriaArray = newCategory.criteria.split("\n").filter((c) => c.trim());
    
    const category: AwardCategory = {
      id: `custom-${Date.now()}`,
      title: newCategory.title,
      description: newCategory.description,
      criteria: criteriaArray,
      icon: Award,
      color: "#1F6E4A",
    };

    setCategories([...categories, category]);
    setNewCategory({ title: "", description: "", criteria: "" });
    setShowAddCategory(false);
    toast.success("Award category added successfully!");
  };

  const Icon = currentCategory.icon;
  const selectedStaff = getSelectedStaff(currentCategory.id);

  // Group staff by department
  const departments = Array.from(new Set(allStaff.map((s) => s.department)));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Staff Evaluation</h1>
          <p className="text-muted-foreground">
            {isStaff ? "Nominate up to 2 people per award" : "Vote for this month's award winners"}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
            <DialogTrigger asChild>
              <Button className="bg-brand hover:bg-brand/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Award Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Award Category</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create a custom award category for evaluation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Award Title</Label>
                  <Input
                    placeholder="e.g., Best Team Player"
                    value={newCategory.title}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, title: e.target.value })
                    }
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description of the award"
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, description: e.target.value })
                    }
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Criteria (one per line)</Label>
                  <Textarea
                    placeholder="Enter award criteria, one per line..."
                    value={newCategory.criteria}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, criteria: e.target.value })
                    }
                    className="bg-card min-h-[120px]"
                  />
                </div>
                <Button
                  onClick={handleAddCategory}
                  className="w-full bg-brand hover:bg-brand/90 text-white"
                >
                  Add Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Progress Card */}
      <Card className="bg-card shadow-sm border-l-4 border-l-[#1F6E4A]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-foreground">Voting Progress</p>
              <p className="text-sm text-muted-foreground mt-1">
                {votedCount} of {totalCategories} awards voted
              </p>
            </div>
            <Badge
              className={`${
                votedCount === totalCategories
                  ? "bg-brand text-white"
                  : "bg-brand-yellow text-gray-900"
              }`}
            >
              {votedCount === totalCategories ? "Complete" : "In Progress"}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Award Category Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCategory.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-card shadow-lg">
            <CardHeader className="border-b border-border">
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${currentCategory.color}15` }}
                >
                  <Icon className="w-8 h-8" style={{ color: currentCategory.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-foreground">
                      {currentCategory.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-muted-foreground"
                    >
                      {currentIndex + 1} of {totalCategories}
                    </Badge>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {currentCategory.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Criteria Section */}
              <Card className="bg-brand-subtle dark:bg-muted border border-brand">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-brand" />
                    <h4 className="text-foreground">Award Criteria</h4>
                  </div>
                  <ul className="space-y-2">
                    {currentCategory.criteria.map((criterion, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="text-brand mt-0.5">•</span>
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Nominee Selection Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-foreground">
                    {isStaff ? "Your Nominees (Max 2)" : "Select Nominees"}
                  </h4>
                  {isStaff && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {selectedStaff.length} / 2
                    </Badge>
                  )}
                </div>
                
                {/* Selected Staff Display */}
                {selectedStaff.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {selectedStaff.map((staff) => (
                      <Card key={staff.id} className="border-2 border-brand bg-brand-subtle dark:bg-muted shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-brand text-white">
                                  {staff.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-foreground">{staff.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {staff.id} • {staff.department}
                                </p>
                                <p className="text-xs text-muted-foreground">{staff.role}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveNominee(staff.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Staff Dropdown Selector */}
                <Select onValueChange={handleAddNominee}>
                  <SelectTrigger className="w-full bg-card h-auto min-h-[3rem]">
                    <SelectValue placeholder="Select a staff member to nominate..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {departments.map((dept) => (
                      <SelectGroup key={dept}>
                        <SelectLabel>{dept}</SelectLabel>
                        {allStaff
                          .filter((s) => s.department === dept)
                          .map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              <div className="flex items-center gap-2 py-1">
                                <span>{staff.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({staff.id} • {staff.role})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>
                    {isStaff 
                      ? "You can nominate up to 2 staff members per award. Select from the dropdown and they'll be added to your nominees." 
                      : "Select staff members from the dropdown. Staff are grouped by department."}
                  </span>
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="text-brand border-brand hover:bg-muted"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {categories.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentIndex
                          ? "bg-brand"
                          : votes[categories[index].id] && votes[categories[index].id].length > 0
                          ? "bg-brand-yellow"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={currentIndex === categories.length - 1}
                  className="bg-brand hover:bg-brand/90 text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Submit Button */}
      {votedCount === totalCategories && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-[#f0fdf4] dark:from-muted to-card border-2 border-brand shadow-lg">
            <CardContent className="p-6 text-center">
              <Award className="w-12 h-12 text-brand-yellow mx-auto mb-3" />
              <h3 className="text-foreground mb-2">All Votes Complete!</h3>
              <p className="text-muted-foreground mb-4">
                You've voted in all {totalCategories} award categories. Your votes have been recorded.
              </p>
              <Button
                onClick={() => toast.success("All votes submitted successfully!")}
                className="bg-brand hover:bg-brand/90 text-white"
              >
                Submit All Votes
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

EvaluationPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
