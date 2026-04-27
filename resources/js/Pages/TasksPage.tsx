import { router, useForm, usePage } from "@inertiajs/react";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  ListChecks,
  Clock,
  AlertCircle,
  TrendingUp,
  Trophy,
  Target,
  ChevronRight,
  X,
  Paperclip,
  MessageSquare,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import { useChartColors } from "@/lib/useChartColors";

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  assignedBy: string;
  assignedByName: string;
  assignedToName: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  status: "todo" | "in-progress" | "completed" | "blocked";
  progress: number;
  comments: Comment[];
  description?: string;
  createdAt: string;
  assignedTimestamp: string;
  subtasks?: Subtask[];
  tags?: string[];
  department?: string;
  project?: string;
  attachments?: Attachment[];
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
}

interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
}

interface StaffOption {
  employeeId: string;
  name: string;
  department?: string | null;
}

interface TasksPageProps {
  userRole: string;
  tasks: Task[];
  staffOptions: StaffOption[];
  departments: string[];
  projects: string[];
  currentUserEmployeeId?: string | null;
  currentUserName?: string;
}

type CreateTaskFormData = {
  title: string;
  assignedTo: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  description: string;
  department: string;
  project: string;
};

const buildMonthlyData = (tasks: Task[]) => {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthTasks = tasks.filter((task) => task.createdAt.startsWith(key));

    return {
      key,
      month: date.toLocaleDateString("en-US", { month: "short" }),
      completed: monthTasks.filter((task) => task.status === "completed").length,
      inProgress: monthTasks.filter((task) => task.status === "in-progress").length,
      total: monthTasks.length,
    };
  });
};

const DraggableTaskCard = ({
  task,
  onViewDetails,
  onEdit,
  onDelete,
}: {
  task: Task;
  onViewDetails: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TASK",
    item: { task },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const isOverdue = new Date(task.dueDate) < new Date();
  const priorityColors = {
    high: "bg-destructive/10 dark:bg-red-950/30 text-destructive border-destructive/30",
    medium: "bg-[#fef9c3] dark:bg-yellow-950/30 text-[#d97706] border-[#fde68a]",
    low: "bg-[#f0f9ff] dark:bg-blue-950/30 text-[#0284c7] border-[#bae6fd]",
  };

  return (
    <motion.div
      ref={(node) => {
        drag(node);
      }}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <Card
        className="mb-3 border border-border hover:shadow-lg transition-all cursor-pointer group rounded-2xl"
        onClick={() => onViewDetails(task)}
      >
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="text-foreground flex-1 pr-2 line-clamp-2">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:bg-[#f3f4f6]"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(task);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-brand/90 text-white text-xs">
                {task.assignedToName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs text-foreground">{task.assignedToName}</span>
              <span className="text-[10px] text-muted-foreground">{task.assignedTo}</span>
            </div>
          </div>

          {task.department && (
            <Badge
              variant="outline"
              className="bg-brand-subtle dark:bg-muted text-[#15803d] border-[#86efac] text-[10px]"
            >
              {task.department}
            </Badge>
          )}

          <div className="flex items-center gap-2">
            <Calendar
              className={`w-3.5 h-3.5 ${
                isOverdue ? "text-destructive" : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-xs ${
                isOverdue ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            {isOverdue && (
              <Badge className="bg-destructive/10 dark:bg-red-950/30 text-destructive border-destructive/30 text-[10px] ml-auto">
                Overdue
              </Badge>
            )}
          </div>

          <Badge className={`text-[10px] ${priorityColors[task.priority]}`}>
            {task.priority === "high"
              ? "Urgent"
              : task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}{" "}
                Subtasks
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-[#1E3D34]">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DropZone = ({
  status,
  tasks,
  title,
  color,
  onDrop,
  onViewDetails,
  onEdit,
  onDelete,
}: {
  status: Task["status"];
  tasks: Task[];
  title: string;
  color: string;
  onDrop: (task: Task, newStatus: Task["status"]) => void;
  onViewDetails: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "TASK",
    drop: (item: { task: Task }) => {
      if (item.task.status !== status) {
        onDrop(item.task, status);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={(node) => {
        drop(node);
      }}
      className={`space-y-4 min-h-[600px] ${
        isOver ? "bg-brand-subtle dark:bg-muted rounded-2xl p-2 transition-colors" : ""
      }`}
    >
      <div className="flex items-center justify-between sticky top-0 bg-muted pb-2 z-10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`}></div>
          <h3 className="text-foreground">{title}</h3>
          <Badge variant="secondary" className="bg-card border border-border">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground bg-card rounded-2xl border-2 border-dashed border-border">
            <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No tasks in this column</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TasksPage({
  userRole,
  tasks: taskItems,
  staffOptions,
  departments,
  projects,
  currentUserEmployeeId,
  currentUserName,
}: TasksPageProps) {
  const { colors } = useChartColors();
  const { flash } = usePage<{
    flash?: {
      success?: string;
      error?: string;
    };
  }>().props;

  const isManager =
    userRole === "management" || userRole === "superadmin" || userRole === "hr";
  const monthlyData = buildMonthlyData(taskItems);
  const latestMonthKey =
    monthlyData.length > 0
      ? monthlyData[monthlyData.length - 1].key
      : new Date().toISOString().slice(0, 7);
  const availableStaffOptions = staffOptions.filter((staff) => Boolean(staff.employeeId));
  const initialTaskForm: CreateTaskFormData = {
    title: "",
    assignedTo: isManager ? "" : currentUserEmployeeId ?? "",
    priority: "medium",
    dueDate: "",
    description: "",
    department: "",
    project: "",
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [chartView, setChartView] = useState<"staff" | "department" | "all">("all");
  const [newComment, setNewComment] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => latestMonthKey);
  const {
    data: newTask,
    setData: setNewTaskData,
    post,
    processing: creatingTask,
    errors: createErrors,
    clearErrors: clearCreateErrors,
  } = useForm<CreateTaskFormData>(initialTaskForm);

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }

    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash?.error, flash?.success]);

  useEffect(() => {
    if (!isManager && currentUserEmployeeId && !newTask.assignedTo) {
      setNewTaskData("assignedTo", currentUserEmployeeId);
    }
  }, [currentUserEmployeeId, isManager, newTask.assignedTo, setNewTaskData]);

  useEffect(() => {
    if (selectedTask) {
      const nextSelectedTask = taskItems.find((task) => task.id === selectedTask.id);
      setSelectedTask(nextSelectedTask ?? null);
    }

    if (editingTask) {
      const nextEditingTask = taskItems.find((task) => task.id === editingTask.id);
      if (nextEditingTask) {
        setEditingTask(nextEditingTask);
      } else {
        setEditingTask(null);
        setShowEditDialog(false);
      }
    }
  }, [editingTask, selectedTask, taskItems]);

  useEffect(() => {
    if (!monthlyData.some((month) => month.key === selectedMonth)) {
      setSelectedMonth(latestMonthKey);
    }
  }, [latestMonthKey, monthlyData, selectedMonth]);

  const totalTasks = taskItems.length || 1;
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const activeTasks = taskItems.filter(
    (task) => task.status !== "completed" && task.status !== "blocked"
  ).length;
  const pendingTasks = taskItems.filter((task) => task.status === "todo").length;
  const completedThisMonth = taskItems.filter(
    (task) => task.status === "completed" && task.createdAt.startsWith(currentMonthKey)
  ).length;
  const overdueTasks = taskItems.filter((task) => {
    if (!task.dueDate || task.status === "completed") {
      return false;
    }

    return new Date(task.dueDate) < new Date();
  }).length;

  const filteredTasks = taskItems.filter((task) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchMatch =
      normalizedQuery.length === 0 ||
      task.title.toLowerCase().includes(normalizedQuery) ||
      task.assignedToName.toLowerCase().includes(normalizedQuery) ||
      (task.project ?? "").toLowerCase().includes(normalizedQuery);
    const departmentMatch =
      selectedDepartment === "all" || task.department === selectedDepartment;
    const staffMatch = selectedStaff === "all" || task.assignedTo === selectedStaff;
    const projectMatch = selectedProject === "all" || task.project === selectedProject;
    const statusMatch =
      selectedStatusFilter === "all" || task.status === selectedStatusFilter;

    return searchMatch && departmentMatch && staffMatch && projectMatch && statusMatch;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter((task) => task.status === "todo"),
    "in-progress": filteredTasks.filter((task) => task.status === "in-progress"),
    blocked: filteredTasks.filter((task) => task.status === "blocked"),
    completed: filteredTasks.filter((task) => task.status === "completed"),
  };

  const monthOptions = monthlyData.map((entry) => ({
    value: entry.key,
    label: new Date(`${entry.key}-01`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  }));

  const resetCreateForm = () => {
    setNewTaskData(initialTaskForm);
    clearCreateErrors();
  };

  const closeCreateDialog = (open: boolean) => {
    setShowCreateDialog(open);

    if (!open) {
      resetCreateForm();
    }
  };

  const handleCreateTask = () => {
    post("/tasks", {
      preserveScroll: true,
      onSuccess: () => {
        resetCreateForm();
        setShowCreateDialog(false);
      },
    });
  };

  const handleUpdateTask = () => {
    if (!editingTask) {
      return;
    }

    router.put(
      `/tasks/${editingTask.id}`,
      {
        title: editingTask.title,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
        progress: editingTask.progress,
        description: editingTask.description ?? "",
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setShowEditDialog(false);
          setEditingTask(null);
        },
      }
    );
  };

  const handleDrop = (task: Task, newStatus: Task["status"]) => {
    router.patch(
      `/tasks/${task.id}/status`,
      { status: newStatus },
      {
        preserveScroll: true,
      }
    );
  };

  const handleDeleteTask = (taskId: string) => {
    if (!window.confirm("Delete this task? This action cannot be undone.")) {
      return;
    }

    router.delete(`/tasks/${taskId}`, {
      preserveScroll: true,
      onSuccess: () => {
        if (selectedTask?.id === taskId) {
          setSelectedTask(null);
        }

        if (editingTask?.id === taskId) {
          setEditingTask(null);
          setShowEditDialog(false);
        }
      },
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask({ ...task });
    setShowEditDialog(true);
  };

  const handleAddComment = () => {
    if (!selectedTask || !newComment.trim()) {
      return;
    }

    router.post(
      `/tasks/${selectedTask.id}/comments`,
      {
        text: newComment.trim(),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setNewComment("");
        },
      }
    );
  };

  const handleDownloadReport = () => {
    const monthTasks = taskItems.filter((task) => task.createdAt.startsWith(selectedMonth));

    const escapeValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      [
        "Task ID",
        "Title",
        "Assigned To",
        "Assigned By",
        "Department",
        "Project",
        "Priority",
        "Status",
        "Progress",
        "Due Date",
        "Created At",
      ],
      ...monthTasks.map((task) => [
        task.id,
        task.title,
        `${task.assignedToName} (${task.assignedTo})`,
        task.assignedByName,
        task.department || "N/A",
        task.project || "N/A",
        task.priority.toUpperCase(),
        task.status,
        `${task.progress}%`,
        task.dueDate,
        task.createdAt,
      ]),
    ];

    const csvContent = rows.map((row) => row.map(escapeValue).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `task-report-${selectedMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(
      `Downloaded report for ${new Date(`${selectedMonth}-01`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}`
    );
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    iconBg,
    percentage,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    iconBg: string;
    percentage: number;
  }) => (
    <Card className="border border-border rounded-2xl hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-foreground">{value}</h3>
              <span className={`text-xs ${color}`}>{percentage}%</span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
        <div className="mt-4">
          <Progress value={percentage} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2">Tasks Management</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage project tasks across teams
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={closeCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-brand/90 hover:bg-brand text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Task</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {isManager
                    ? "Assign a task to a team member"
                    : "Create a task for yourself"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Task Title *</Label>
                  <Input
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => setNewTaskData("title", e.target.value)}
                    className="bg-card"
                  />
                  {createErrors.title && (
                    <p className="text-xs text-destructive">{createErrors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{isManager ? "Assign To *" : "Assigned To"}</Label>
                  {isManager ? (
                    <Select
                      value={newTask.assignedTo || undefined}
                      onValueChange={(value) => setNewTaskData("assignedTo", value)}
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStaffOptions.map((staff) => (
                          <SelectItem key={staff.employeeId} value={staff.employeeId}>
                            {staff.name} ({staff.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={
                        currentUserEmployeeId
                          ? `${currentUserName ?? "Current user"} (${currentUserEmployeeId})`
                          : currentUserName ?? "Current user"
                      }
                      disabled
                      className="bg-[#f9fafb]"
                    />
                  )}
                  {createErrors.assignedTo && (
                    <p className="text-xs text-destructive">{createErrors.assignedTo}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={newTask.department || "none"}
                      onValueChange={(value) =>
                        setNewTaskData("department", value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No department</SelectItem>
                        {departments.map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createErrors.department && (
                      <p className="text-xs text-destructive">{createErrors.department}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Input
                      placeholder="Project name"
                      value={newTask.project}
                      onChange={(e) => setNewTaskData("project", e.target.value)}
                      className="bg-card"
                    />
                    {createErrors.project && (
                      <p className="text-xs text-destructive">{createErrors.project}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority *</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value: Task["priority"]) =>
                        setNewTaskData("priority", value)
                      }
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    {createErrors.priority && (
                      <p className="text-xs text-destructive">{createErrors.priority}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTaskData("dueDate", e.target.value)}
                      className="bg-card"
                    />
                    {createErrors.dueDate && (
                      <p className="text-xs text-destructive">{createErrors.dueDate}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Task details and requirements"
                    value={newTask.description}
                    onChange={(e) => setNewTaskData("description", e.target.value)}
                    className="bg-card min-h-[80px]"
                  />
                  {createErrors.description && (
                    <p className="text-xs text-destructive">{createErrors.description}</p>
                  )}
                </div>

                <Button
                  onClick={handleCreateTask}
                  disabled={creatingTask}
                  className="w-full bg-brand/90 hover:bg-brand text-white"
                >
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Active Tasks"
            value={activeTasks}
            icon={ListChecks}
            color="text-[#1E3D34]"
            iconBg="bg-[#e8f1ee]"
            percentage={Math.round((activeTasks / totalTasks) * 100)}
          />
          <StatCard
            title="Pending Tasks"
            value={pendingTasks}
            icon={Clock}
            color="text-[#d97706]"
            iconBg="bg-[#fef3c7]"
            percentage={Math.round((pendingTasks / totalTasks) * 100)}
          />
          <StatCard
            title="Completed This Month"
            value={completedThisMonth}
            icon={Target}
            color="text-[#15803d]"
            iconBg="bg-[#dcfce7] dark:bg-green-950/30"
            percentage={Math.round((completedThisMonth / totalTasks) * 100)}
          />
          <StatCard
            title="Overdue Tasks"
            value={overdueTasks}
            icon={AlertCircle}
            color="text-destructive"
            iconBg="bg-[#fee2e2]"
            percentage={Math.round((overdueTasks / totalTasks) * 100)}
          />
        </div>

        <Card className="border border-border rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks, staff, or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>
              {isManager && (
                <>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-full lg:w-[180px] bg-card">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger className="w-full lg:w-[180px] bg-card">
                      <SelectValue placeholder="Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {availableStaffOptions.map((staff) => (
                        <SelectItem key={staff.employeeId} value={staff.employeeId}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-full lg:w-[180px] bg-card">
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className="w-full lg:w-[150px] bg-card">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              {isManager && monthOptions.length > 0 && (
                <>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full lg:w-[180px] bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={handleDownloadReport}
                    className="border-border"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <DropZone
            status="todo"
            tasks={tasksByStatus.todo}
            title="To Do"
            color="bg-[#94a3b8]"
            onDrop={handleDrop}
            onViewDetails={setSelectedTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
          <DropZone
            status="in-progress"
            tasks={tasksByStatus["in-progress"]}
            title="In Progress"
            color="bg-brand-yellow"
            onDrop={handleDrop}
            onViewDetails={setSelectedTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
          <DropZone
            status="blocked"
            tasks={tasksByStatus.blocked}
            title="Blocked"
            color="bg-destructive"
            onDrop={handleDrop}
            onViewDetails={setSelectedTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
          <DropZone
            status="completed"
            tasks={tasksByStatus.completed}
            title="Completed"
            color="bg-[#15803d]"
            onDrop={handleDrop}
            onViewDetails={setSelectedTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        </div>

        {isManager && (
          <Card className="border border-border rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-foreground">Monthly Performance Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    Track task completion trends over time
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={chartView}
                    onValueChange={(value: "staff" | "department" | "all") =>
                      setChartView(value)
                    }
                  >
                    <SelectTrigger className="w-[140px] bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tasks</SelectItem>
                      <SelectItem value="staff">By Staff</SelectItem>
                      <SelectItem value="department">By Department</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChartType(chartType === "line" ? "bar" : "line")}
                    className="border-border"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReport}
                    className="border-border"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Task analytics chart showing completed, in-progress, and total tasks over time">
              <ResponsiveContainer width="100%" height={300}>
                {chartType === "line" ? (
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                    <XAxis
                      dataKey="month"
                      stroke={colors.axisText}
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke={colors.axisText} style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.tooltipBg,
                        border: `1px solid ${colors.tooltipBorder}`,
                        borderRadius: "8px",
                      }}
                      formatter={(value, name) => {
                        const n = typeof value === 'number' ? value : 0;
                        if (chartView === "department") {
                          return [n, `${name ?? "Value"} - Departments`];
                        }

                        if (chartView === "staff") {
                          return [n, `${name ?? "Value"} - Staff`];
                        }

                        return [n, String(name ?? "Value")];
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke={colors.primary}
                      strokeWidth={2}
                      name="Completed"
                    />
                    <Line
                      type="monotone"
                      dataKey="inProgress"
                      stroke={colors.secondary}
                      strokeWidth={2}
                      name="In Progress"
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke={colors.quaternary}
                      strokeWidth={2}
                      name="Total"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                    <XAxis
                      dataKey="month"
                      stroke={colors.axisText}
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke={colors.axisText} style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.tooltipBg,
                        border: `1px solid ${colors.tooltipBorder}`,
                        borderRadius: "8px",
                      }}
                      formatter={(value, name) => {
                        const n = typeof value === 'number' ? value : 0;
                        if (chartView === "department") {
                          return [n, `${name ?? "Value"} - Departments`];
                        }

                        if (chartView === "staff") {
                          return [n, `${name ?? "Value"} - Staff`];
                        }

                        return [n, String(name ?? "Value")];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" fill={colors.primary} name="Completed" />
                    <Bar dataKey="inProgress" fill={colors.secondary} name="In Progress" />
                    <Bar dataKey="total" fill={colors.quaternary} name="Total" />
                  </BarChart>
                )}
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Task</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update task details
              </DialogDescription>
            </DialogHeader>
            {editingTask && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Task Title *</Label>
                  <Input
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                    className="bg-card"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority *</Label>
                    <Select
                      value={editingTask.priority}
                      onValueChange={(value: Task["priority"]) =>
                        setEditingTask({ ...editingTask, priority: value })
                      }
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={editingTask.dueDate}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, dueDate: e.target.value })
                      }
                      className="bg-card"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Progress (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingTask.progress}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        progress: Number(e.target.value) || 0,
                      })
                    }
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingTask.description ?? ""}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, description: e.target.value })
                    }
                    className="bg-card min-h-[80px]"
                  />
                </div>

                <Button
                  onClick={handleUpdateTask}
                  className="w-full bg-brand/90 hover:bg-brand text-white"
                >
                  Update Task
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {selectedTask && (
          <Sheet
            open={Boolean(selectedTask)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedTask(null);
                setNewComment("");
              }
            }}
          >
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-foreground pr-8">
                  {selectedTask.title}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  Task Details and Activity
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Assigned To</Label>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-brand/90 text-white text-xs">
                          {selectedTask.assignedToName
                            .split(" ")
                            .map((name) => name[0])
                            .join("")
                            .substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {selectedTask.assignedToName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedTask.assignedTo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Assigned By</Label>
                    <span className="text-sm text-foreground block">
                      {selectedTask.assignedByName}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <Badge
                      className={`text-xs ${
                        selectedTask.priority === "high"
                          ? "bg-destructive/10 dark:bg-red-950/30 text-destructive border-destructive/30"
                          : selectedTask.priority === "medium"
                            ? "bg-[#fef9c3] dark:bg-yellow-950/30 text-[#d97706] border-[#fde68a]"
                            : "bg-[#f0f9ff] dark:bg-blue-950/30 text-[#0284c7] border-[#bae6fd]"
                      }`}
                    >
                      {selectedTask.priority === "high"
                        ? "Urgent"
                        : selectedTask.priority.charAt(0).toUpperCase() +
                          selectedTask.priority.slice(1)}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <span className="text-sm text-foreground block">
                      {new Date(selectedTask.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {selectedTask.department && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Department</Label>
                      <span className="text-sm text-foreground block">
                        {selectedTask.department}
                      </span>
                    </div>
                  )}

                  {selectedTask.project && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Project</Label>
                      <span className="text-sm text-foreground block">
                        {selectedTask.project}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 border border-border rounded-xl bg-[#f9fafb]">
                  <p className="text-xs text-muted-foreground">
                    Task assigned on {selectedTask.assignedTimestamp}
                  </p>
                </div>

                {selectedTask.description && (
                  <div className="space-y-2">
                    <Label className="text-foreground">Description</Label>
                    <p className="text-sm text-muted-foreground p-4 border border-border rounded-xl bg-card">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-foreground">
                      Subtasks ({selectedTask.subtasks.filter((subtask) => subtask.completed).length}/
                      {selectedTask.subtasks.length})
                    </Label>
                    <div className="space-y-2">
                      {selectedTask.subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 p-3 border border-border rounded-xl bg-card"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              subtask.completed
                                ? "bg-brand/90 border-[#1E3D34]"
                                : "border-border"
                            }`}
                          >
                            {subtask.completed && (
                              <CheckSquare className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              subtask.completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Progress</Label>
                    <span className="text-sm text-[#1E3D34]">
                      {selectedTask.progress}%
                    </span>
                  </div>
                  <Progress value={selectedTask.progress} className="h-2.5" />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Status</Label>
                  <Select
                    value={selectedTask.status}
                    onValueChange={(value: Task["status"]) => {
                      setSelectedTask({
                        ...selectedTask,
                        status: value,
                        progress: value === "completed" ? 100 : selectedTask.progress,
                      });
                      handleDrop(selectedTask, value);
                    }}
                  >
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 border-t border-border pt-6">
                  <Label className="text-foreground">
                    Activity & Comments ({selectedTask.comments.length})
                  </Label>
                  <div className="space-y-4">
                    {selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-brand/90 text-white text-xs">
                            {comment.authorAvatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">
                              {comment.author}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground border border-border rounded-xl p-3 bg-card">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                    {selectedTask.comments.length === 0 && (
                      <div className="rounded-xl border border-dashed border-[#d1d5db] bg-card p-4 text-sm text-muted-foreground">
                        No comments yet.
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-card min-h-[60px] rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="w-full bg-brand/90 hover:bg-brand text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </DndProvider>
  );
}
TasksPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
