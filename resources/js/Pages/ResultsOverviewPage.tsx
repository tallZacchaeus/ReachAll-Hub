import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Medal,
  Crown,
  Users,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Voter {
  id: string;
  name: string;
  staffId: string;
  avatar: string;
  department: string;
}

interface AwardResult {
  id: string;
  title: string;
  icon: any;
  color: string;
  totalVotes: number;
  winner: { name: string; avatar: string; staffId: string; votes: number };
  topFive: Array<{
    name: string;
    avatar: string;
    staffId: string;
    votes: number;
    voters?: Voter[];
  }>;
}

interface ResultsOverviewPageProps {
  userRole: string;
}

const COLORS = ["#1F6E4A", "#FFD400", "#4ade80", "#60a5fa", "#f59e0b", "#ec4899"];

export default function ResultsOverviewPage({ userRole }: ResultsOverviewPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedNominee, setSelectedNominee] = useState<{
    name: string;
    voters: Voter[];
  } | null>(null);
  const lastUpdated = new Date().toLocaleString();

  const isAdmin = userRole === "superadmin" || userRole === "hr" || userRole === "management";

  // Generate mock voters
  const generateVoters = (count: number): Voter[] => {
    const departments = [
      "Video & Production",
      "Project Management",
      "Product Team",
      "Content & Brand Comms",
      "Incubator Team",
      "Skillup Team",
      "DAF Team",
      "Graphics Design",
      "Accounting",
    ];
    const names = [
      "Alice Johnson",
      "Bob Smith",
      "Carol Williams",
      "David Brown",
      "Emma Davis",
      "Frank Wilson",
      "Grace Lee",
      "Henry Taylor",
      "Ivy Martinez",
      "Jack Anderson",
      "Kelly Thomas",
      "Liam Jackson",
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `voter-${i}`,
      name: names[i % names.length],
      staffId: `EMP${String(100 + i).padStart(3, "0")}`,
      avatar: names[i % names.length]
        .split(" ")
        .map((n) => n[0])
        .join(""),
      department: departments[i % departments.length],
    }));
  };

  const awardResults: AwardResult[] = [
    {
      id: "staff-of-year",
      title: "Staff of the Year",
      icon: Crown,
      color: "#1F6E4A",
      totalVotes: 234,
      winner: { name: "Sarah Johnson", avatar: "SJ", staffId: "EMP023", votes: 58 },
      topFive: [
        {
          name: "Sarah Johnson",
          avatar: "SJ",
          staffId: "EMP023",
          votes: 58,
          voters: generateVoters(58),
        },
        {
          name: "John Smith",
          avatar: "JS",
          staffId: "EMP001",
          votes: 52,
          voters: generateVoters(52),
        },
        {
          name: "Mike Chen",
          avatar: "MC",
          staffId: "EMP015",
          votes: 48,
          voters: generateVoters(48),
        },
        {
          name: "Emily Davis",
          avatar: "ED",
          staffId: "EMP042",
          votes: 41,
          voters: generateVoters(41),
        },
        {
          name: "Lisa Park",
          avatar: "LP",
          staffId: "EMP009",
          votes: 35,
          voters: generateVoters(35),
        },
      ],
    },
    {
      id: "culture-champion",
      title: "Culture Champion",
      icon: Award,
      color: "#FFD400",
      totalVotes: 198,
      winner: { name: "Alex Wong", avatar: "AW", staffId: "EMP005", votes: 51 },
      topFive: [
        {
          name: "Alex Wong",
          avatar: "AW",
          staffId: "EMP005",
          votes: 51,
          voters: generateVoters(51),
        },
        {
          name: "Grace Liu",
          avatar: "GL",
          staffId: "EMP006",
          votes: 45,
          voters: generateVoters(45),
        },
        {
          name: "Emma Wilson",
          avatar: "EW",
          staffId: "EMP008",
          votes: 38,
          voters: generateVoters(38),
        },
        {
          name: "David Kim",
          avatar: "DK",
          staffId: "EMP007",
          votes: 35,
          voters: generateVoters(35),
        },
        {
          name: "Rachel Green",
          avatar: "RG",
          staffId: "EMP013",
          votes: 29,
          voters: generateVoters(29),
        },
      ],
    },
    {
      id: "innovation-leader",
      title: "Innovation Leader",
      icon: Trophy,
      color: "#1F6E4A",
      totalVotes: 187,
      winner: { name: "Kevin Zhang", avatar: "KZ", staffId: "EMP020", votes: 49 },
      topFive: [
        {
          name: "Kevin Zhang",
          avatar: "KZ",
          staffId: "EMP020",
          votes: 49,
          voters: generateVoters(49),
        },
        {
          name: "Daniel Park",
          avatar: "DP",
          staffId: "EMP018",
          votes: 44,
          voters: generateVoters(44),
        },
        {
          name: "Lisa Park",
          avatar: "LP",
          staffId: "EMP009",
          votes: 39,
          voters: generateVoters(39),
        },
        {
          name: "James Wilson",
          avatar: "JW",
          staffId: "EMP014",
          votes: 32,
          voters: generateVoters(32),
        },
        {
          name: "Tom Brown",
          avatar: "TB",
          staffId: "EMP010",
          votes: 23,
          voters: generateVoters(23),
        },
      ],
    },
    {
      id: "team-player",
      title: "Best Team Player",
      icon: Medal,
      color: "#FFD400",
      totalVotes: 223,
      winner: { name: "Maria Garcia", avatar: "MG", staffId: "EMP015", votes: 56 },
      topFive: [
        {
          name: "Maria Garcia",
          avatar: "MG",
          staffId: "EMP015",
          votes: 56,
          voters: generateVoters(56),
        },
        {
          name: "Chris Martin",
          avatar: "CM",
          staffId: "EMP012",
          votes: 50,
          voters: generateVoters(50),
        },
        {
          name: "Michelle Wong",
          avatar: "MW",
          staffId: "EMP019",
          votes: 47,
          voters: generateVoters(47),
        },
        {
          name: "Jennifer Lee",
          avatar: "JL",
          staffId: "EMP017",
          votes: 38,
          voters: generateVoters(38),
        },
        {
          name: "Robert Taylor",
          avatar: "RT",
          staffId: "EMP016",
          votes: 32,
          voters: generateVoters(32),
        },
      ],
    },
    {
      id: "punctuality-award",
      title: "Punctuality Award",
      icon: Trophy,
      color: "#1F6E4A",
      totalVotes: 210,
      winner: { name: "Mike Chen", avatar: "MC", staffId: "EMP015", votes: 62 },
      topFive: [
        {
          name: "Mike Chen",
          avatar: "MC",
          staffId: "EMP015",
          votes: 62,
          voters: generateVoters(62),
        },
        {
          name: "Anna Lee",
          avatar: "AL",
          staffId: "EMP011",
          votes: 48,
          voters: generateVoters(48),
        },
        {
          name: "John Smith",
          avatar: "JS",
          staffId: "EMP001",
          votes: 45,
          voters: generateVoters(45),
        },
        {
          name: "Emily Davis",
          avatar: "ED",
          staffId: "EMP042",
          votes: 31,
          voters: generateVoters(31),
        },
        {
          name: "Alex Wong",
          avatar: "AW",
          staffId: "EMP005",
          votes: 24,
          voters: generateVoters(24),
        },
      ],
    },
  ];

  const currentAward = awardResults[currentIndex];
  const Icon = currentAward.icon;

  const handleNext = () => {
    if (currentIndex < awardResults.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0:
        return "from-yellow-400 to-yellow-600";
      case 1:
        return "from-gray-300 to-gray-500";
      case 2:
        return "from-orange-400 to-orange-600";
      default:
        return "from-[#1F6E4A] to-[#1a5a3d]";
    }
  };

  // Prepare data for bar chart (top 6 nominees)
  const barChartData = currentAward.topFive.slice(0, 6).map((staff) => ({
    name: staff.name.split(" ")[0], // First name only for chart readability
    votes: staff.votes,
    fullName: staff.name,
  }));

  const totalVotesAllCategories = awardResults.reduce(
    (sum, award) => sum + award.totalVotes,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Results Overview</h1>
          <p className="text-muted-foreground">Real-time evaluation results by category</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-[#1F6E4A]" />
            <span className="text-[#1F6E4A]">Live</span>
          </Badge>
          <span className="text-xs text-muted-foreground">Updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Votes Cast</p>
            <p className="text-foreground" style={{ fontSize: "2rem", fontWeight: "600" }}>
              {totalVotesAllCategories.toLocaleString()}
            </p>
            <Badge className="bg-[#f0fdf4] dark:bg-muted text-[#1F6E4A] hover:bg-muted mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              Across {awardResults.length} categories
            </Badge>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Current Category</p>
            <p className="text-foreground" style={{ fontSize: "2rem", fontWeight: "600" }}>
              {currentIndex + 1}/{awardResults.length}
            </p>
            <Badge className="bg-[#fff9e6] text-foreground hover:bg-[#fff9e6] mt-2">
              {currentAward.title}
            </Badge>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Current Leader</p>
            <p className="text-foreground" style={{ fontSize: "1.5rem", fontWeight: "600" }}>
              {currentAward.winner.name}
            </p>
            <Badge className="bg-[#1F6E4A] text-white hover:bg-[#1F6E4A] mt-2">
              {currentAward.winner.votes} votes
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Award Results Card with Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAward.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-card shadow-lg rounded-2xl">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${currentAward.color}15` }}
                  >
                    <Icon className="w-8 h-8" style={{ color: currentAward.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">{currentAward.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {currentAward.totalVotes} total votes received
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-muted-foreground">
                    {currentIndex + 1} of {awardResults.length}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNext}
                      disabled={currentIndex === awardResults.length - 1}
                      className="h-8 w-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Winner Highlight */}
              <Card
                className="border-2 shadow-lg rounded-2xl"
                style={{
                  borderColor: currentAward.color,
                  backgroundColor: `${currentAward.color}08`,
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-foreground flex items-center gap-2">
                      <Trophy className="w-5 h-5" style={{ color: currentAward.color }} />
                      Current Winner
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white">
                      <span className="text-lg">🏆</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Avatar
                      className="w-16 h-16 border-4"
                      style={{ borderColor: currentAward.color }}
                    >
                      <AvatarFallback
                        className="text-white text-xl"
                        style={{ backgroundColor: currentAward.color }}
                      >
                        {currentAward.winner.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-foreground text-xl">{currentAward.winner.name}</p>
                      <p className="text-sm text-muted-foreground">{currentAward.winner.staffId}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-foreground"
                        style={{ fontSize: "2rem", fontWeight: "600" }}
                      >
                        {currentAward.winner.votes}
                      </p>
                      <p className="text-sm text-muted-foreground">votes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vote Distribution Bar Chart (Admin/HR/Management Only) */}
              {isAdmin && (
                <Card className="bg-muted rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-foreground">Vote Distribution</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Top 6 nominees for {currentAward.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          label={{ value: 'Votes', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-card p-3 rounded-lg shadow-lg border-2 border-[#1F6E4A]">
                                  <p className="text-sm text-foreground">{payload[0].payload.fullName}</p>
                                  <p className="text-lg text-[#1F6E4A]">{payload[0].value} votes</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="votes" fill={currentAward.color} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Top 5 Ranking */}
              <div>
                <h3 className="text-foreground mb-4">Top 5 Rankings</h3>
                <div className="space-y-3">
                  {currentAward.topFive.map((staff, index) => (
                    <motion.div
                      key={staff.staffId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-card hover:shadow-md transition-all rounded-xl">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor(
                                index
                              )} flex items-center justify-center text-white flex-shrink-0`}
                            >
                              #{index + 1}
                            </div>
                            <Avatar className="w-12 h-12 border-2 border-border">
                              <AvatarFallback className="bg-[#1F6E4A] text-white">
                                {staff.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-foreground">{staff.name}</p>
                              <p className="text-sm text-muted-foreground">{staff.staffId}</p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <p className="text-foreground text-xl">{staff.votes}</p>
                                <p className="text-xs text-muted-foreground">votes</p>
                              </div>
                              {isAdmin && staff.voters && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedNominee({
                                      name: staff.name,
                                      voters: staff.voters || [],
                                    })
                                  }
                                  className="border-[#1F6E4A] text-[#1F6E4A] hover:bg-muted"
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  View Voters
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-2">
        {awardResults.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? "w-8 bg-[#1F6E4A]"
                : "w-2 bg-[#e5e7eb] hover:bg-[#1F6E4A]/50"
            }`}
          />
        ))}
      </div>

      {/* Voters Dialog */}
      <Dialog open={!!selectedNominee} onOpenChange={() => setSelectedNominee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Voters for {selectedNominee?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedNominee?.voters.length} staff members voted for this nominee
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-2">
              {selectedNominee?.voters.map((voter) => (
                <Card key={voter.id} className="bg-muted border-none">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-[#1F6E4A] text-white text-xs">
                          {voter.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{voter.name}</p>
                        <p className="text-xs text-muted-foreground">{voter.staffId}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-card text-[#1F6E4A] border-[#1F6E4A]"
                      >
                        {voter.department}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
ResultsOverviewPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
