import {
  FolderKanban,
  Plus,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";

interface ProjectsPageProps {
  userRole: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  department: string[];
  assignedTo: string[];
  status: "planning" | "in-progress" | "on-hold" | "completed";
  progress: number;
  startDate: string;
  endDate: string;
  priority: "low" | "medium" | "high";
  budget?: number;
}

export default function ProjectsPage({ userRole }: ProjectsPageProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  
  // Mock projects data
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "New Website Redesign",
      description: "Complete overhaul of company website with modern UI/UX",
      department: ["Tech", "Design"],
      assignedTo: ["John Smith", "Sarah Jones", "Mike Wilson"],
      status: "in-progress",
      progress: 65,
      startDate: "2024-01-15",
      endDate: "2024-12-31",
      priority: "high",
      budget: 50000,
    },
    {
      id: "2",
      name: "Marketing Campaign Q4",
      description: "Social media and digital marketing campaign for Q4",
      department: ["Marketing"],
      assignedTo: ["Emily Brown"],
      status: "in-progress",
      progress: 80,
      startDate: "2024-10-01",
      endDate: "2024-12-31",
      priority: "high",
      budget: 25000,
    },
    {
      id: "3",
      name: "Mobile App Development",
      description: "Native mobile application for iOS and Android",
      department: ["Tech"],
      assignedTo: ["Mike Wilson", "John Smith"],
      status: "planning",
      progress: 15,
      startDate: "2024-11-01",
      endDate: "2025-06-30",
      priority: "medium",
      budget: 100000,
    },
    {
      id: "4",
      name: "Internal Tools Upgrade",
      description: "Upgrade internal management and tracking tools",
      department: ["Tech", "Operations"],
      assignedTo: ["David Lee", "Mike Wilson"],
      status: "on-hold",
      progress: 45,
      startDate: "2024-08-01",
      endDate: "2024-11-30",
      priority: "low",
    },
    {
      id: "5",
      name: "Customer Portal Launch",
      description: "New self-service customer portal",
      department: ["Tech", "Design", "Operations"],
      assignedTo: ["John Smith", "Sarah Jones", "David Lee"],
      status: "completed",
      progress: 100,
      startDate: "2024-03-01",
      endDate: "2024-09-30",
      priority: "high",
      budget: 75000,
    },
  ]);

  const departments = ["Tech", "Design", "Marketing", "Operations", "HR", "Finance"];
  const staffMembers = [
    "John Smith",
    "Sarah Jones",
    "Mike Wilson",
    "Emily Brown",
    "David Lee",
    "Jessica Taylor",
    "Robert Chen",
  ];

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in-progress":
        return <Clock className="w-4 h-4" />;
      case "on-hold":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on-hold":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: Project["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (selectedTab === "all") return true;
    return project.status === selectedTab;
  });

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProject: Project = {
      id: String(projects.length + 1),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      department: [formData.get("department") as string],
      assignedTo: [formData.get("assignedTo") as string],
      status: "planning",
      progress: 0,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      priority: formData.get("priority") as Project["priority"],
      budget: Number(formData.get("budget")) || undefined,
    };

    setProjects([...projects, newProject]);
    setIsCreateDialogOpen(false);
    toast.success("Project created successfully!");
  };

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "in-progress").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const avgProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Projects & Departments</h1>
          <p className="text-muted-foreground">
            Manage projects, assign to departments and track progress
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand text-white hover:bg-brand/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project and assign it to departments or individuals
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the project"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select name="department" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select name="assignedTo" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((member) => (
                        <SelectItem key={member} value={member}>
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (Optional)</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    placeholder="Enter budget"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-brand text-white hover:bg-brand/90"
                >
                  Create Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Projects</p>
                <p className="text-2xl text-foreground">{totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-brand" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                <p className="text-2xl text-foreground">{activeProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl text-foreground">{completedProjects}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Progress</p>
                <p className="text-2xl text-foreground">{avgProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="bg-muted">
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="on-hold">On Hold</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-l-4 border-l-[#1F6E4A]">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Project Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-foreground">{project.name}</h3>
                            <Badge className={getStatusColor(project.status)}>
                              {getStatusIcon(project.status)}
                              <span className="ml-1 capitalize">{project.status.replace('-', ' ')}</span>
                            </Badge>
                            <Badge className={getPriorityColor(project.priority)}>
                              <span className="capitalize">{project.priority} Priority</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      {/* Project Details */}
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            Departments
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {project.department.map((dept) => (
                              <Badge
                                key={dept}
                                variant="outline"
                                className="text-xs"
                              >
                                {dept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Assigned To
                          </p>
                          <p className="text-foreground">
                            {project.assignedTo.length} member{project.assignedTo.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Timeline
                          </p>
                          <p className="text-foreground">
                            {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {project.budget && (
                          <div>
                            <p className="text-muted-foreground mb-1">Budget</p>
                            <p className="text-foreground">
                              ${project.budget.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-muted-foreground">Progress</p>
                          <p className="text-sm text-foreground">{project.progress}%</p>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-brand border-brand hover:bg-brand hover:text-white"
                        >
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No projects found in this category</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

ProjectsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
