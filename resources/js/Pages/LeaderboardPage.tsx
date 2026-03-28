import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  Award,
  Calendar,
  Users,
  CheckCircle,
  Star,
  Crown,
  Medal,
  Search,
  BarChart3,
  Edit,
  Trash2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BadgesDisplay, DEFAULT_BADGES } from "@/components/BadgesDisplay";

interface PointBreakdown {
  attendance: number;
  nominations: number;
  voting: number;
  peerReviews: number;
  badges: number;
}

interface LeaderboardEntry {
  id: string;
  staffId: string;
  name: string;
  avatar: string;
  department: string;
  totalPoints: number;
  pointBreakdown: PointBreakdown;
  rank: number;
  previousRank: number;
  badges: number;
  earnedBadges: string[];
  previousWins: number;
  category: string;
  status: "Active" | "On Leave";
}

interface LeaderboardPageProps {
  userRole: string;
}

const generateLeaderboardData = (): LeaderboardEntry[] => {
  return [
    {
      id: "1",
      staffId: "EMP001",
      name: "Sarah Johnson",
      avatar: "SJ",
      department: "Video & Production",
      totalPoints: 95,
      pointBreakdown: { attendance: 20, nominations: 18, voting: 20, peerReviews: 17, badges: 20 },
      rank: 1,
      previousRank: 2,
      badges: 4,
      earnedBadges: ["punctual-pro", "active-voice", "culture-star", "top-performer"],
      previousWins: 2,
      category: "Staff of the Month",
      status: "Active",
    },
    {
      id: "2",
      staffId: "EMP023",
      name: "John Rodriguez",
      avatar: "JR",
      department: "Project Management",
      totalPoints: 89,
      pointBreakdown: { attendance: 19, nominations: 17, voting: 19, peerReviews: 16, badges: 18 },
      rank: 2,
      previousRank: 1,
      badges: 4,
      earnedBadges: ["punctual-pro", "active-voice", "top-performer", "task-master"],
      previousWins: 1,
      category: "Staff of the Month",
      status: "Active",
    },
    {
      id: "3",
      staffId: "EMP015",
      name: "Mike Chen",
      avatar: "MC",
      department: "Product Team",
      totalPoints: 86,
      pointBreakdown: { attendance: 20, nominations: 15, voting: 18, peerReviews: 18, badges: 15 },
      rank: 3,
      previousRank: 4,
      badges: 3,
      earnedBadges: ["punctual-pro", "culture-star", "top-performer"],
      previousWins: 0,
      category: "Staff of the Month",
      status: "Active",
    },
    {
      id: "4",
      staffId: "EMP042",
      name: "Emily Davis",
      avatar: "ED",
      department: "Content & Brand Comms",
      totalPoints: 82,
      pointBreakdown: { attendance: 18, nominations: 16, voting: 20, peerReviews: 15, badges: 13 },
      rank: 4,
      previousRank: 3,
      badges: 3,
      earnedBadges: ["active-voice", "team-player", "culture-star"],
      previousWins: 1,
      category: "Culture Champion",
      status: "Active",
    },
    {
      id: "5",
      staffId: "EMP005",
      name: "Alex Wong",
      avatar: "AW",
      department: "Incubator Team",
      totalPoints: 79,
      pointBreakdown: { attendance: 18, nominations: 14, voting: 18, peerReviews: 16, badges: 13 },
      rank: 5,
      previousRank: 5,
      badges: 3,
      earnedBadges: ["punctual-pro", "innovation-leader", "team-player"],
      previousWins: 0,
      category: "Staff of the Month",
      status: "Active",
    },
    {
      id: "6",
      staffId: "EMP008",
      name: "Grace Liu",
      avatar: "GL",
      department: "Graphics Design",
      totalPoints: 76,
      pointBreakdown: { attendance: 17, nominations: 15, voting: 17, peerReviews: 15, badges: 12 },
      rank: 6,
      previousRank: 7,
      badges: 2,
      earnedBadges: ["punctual-pro", "top-performer"],
      previousWins: 0,
      category: "Most Punctual",
      status: "On Leave",
    },
    {
      id: "7",
      staffId: "EMP012",
      name: "Daniel Park",
      avatar: "DP",
      department: "Skillup Team",
      totalPoints: 73,
      pointBreakdown: { attendance: 17, nominations: 14, voting: 16, peerReviews: 16, badges: 10 },
      rank: 7,
      previousRank: 6,
      badges: 2,
      earnedBadges: ["team-player", "active-voice"],
      previousWins: 0,
      category: "Most Helpful",
      status: "Active",
    },
    {
      id: "8",
      staffId: "EMP019",
      name: "Lisa Martinez",
      avatar: "LM",
      department: "DAF Team",
      totalPoints: 70,
      pointBreakdown: { attendance: 16, nominations: 13, voting: 19, peerReviews: 17, badges: 5 },
      rank: 8,
      previousRank: 9,
      badges: 1,
      earnedBadges: ["punctual-pro"],
      previousWins: 0,
      category: "Team Spirit Award",
      status: "Active",
    },
    {
      id: "9",
      staffId: "EMP027",
      name: "Kevin Zhang",
      avatar: "KZ",
      department: "Accounting",
      totalPoints: 68,
      pointBreakdown: { attendance: 16, nominations: 12, voting: 18, peerReviews: 17, badges: 5 },
      rank: 9,
      previousRank: 8,
      badges: 1,
      earnedBadges: ["task-master"],
      previousWins: 0,
      category: "Staff of the Month",
      status: "Active",
    },
    {
      id: "10",
      staffId: "EMP031",
      name: "Maria Garcia",
      avatar: "MG",
      department: "Business Development",
      totalPoints: 65,
      pointBreakdown: { attendance: 15, nominations: 12, voting: 17, peerReviews: 16, badges: 5 },
      rank: 10,
      previousRank: 10,
      badges: 1,
      earnedBadges: ["team-player"],
      previousWins: 0,
      category: "Staff of the Month",
      status: "Active",
    },
  ];
};

const categories = ["All Categories", "Staff of the Month", "Culture Champion", "Most Punctual", "Most Helpful"];
const timeFilters = ["November 2025", "October 2025", "September 2025"];

export default function LeaderboardPage({ userRole }: LeaderboardPageProps) {
  const [selectedStaff, setSelectedStaff] = useState<LeaderboardEntry | null>(null);
  const [showBadges, setShowBadges] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedTime, setSelectedTime] = useState("November 2025");
  const [searchQuery, setSearchQuery] = useState("");

  const leaderboardData = generateLeaderboardData();
  const filteredData = leaderboardData.filter((entry) => {
    const matchesCategory = selectedCategory === "All Categories" || entry.category === selectedCategory;
    const matchesSearch =
      entry.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const top3 = filteredData.slice(0, 3);
  const restOfList = filteredData.slice(3);

  const getRankIcon = (rank: number, previousRank: number) => {
    if (rank < previousRank) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (rank > previousRank) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="relative z-10">
        <div className="mb-6">
          <h1 className="text-foreground mb-2 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-[#FFD400]" />
            Leaderboard & Recognition Center
          </h1>
          <p className="text-muted-foreground">
            Celebrating dedication, teamwork, and impact across our organization
          </p>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-2 border-[#1F6E4A]/10">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-foreground">Filter by Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground">Filter by Time</label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeFilters.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground">Search Staff</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID or Department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-border"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3D Podium Section */}
      <div className="relative">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F8F9FA] to-[#E8E9EB] rounded-[32px] overflow-hidden border-4 border-white shadow-2xl">
          {/* Confetti particles */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ["#FFD43B", "#1F6E4A", "#95E1D3"][i % 3],
                left: `${Math.random() * 100}%`,
                top: `-10%`,
              }}
              animate={{
                y: ["0vh", "120vh"],
                rotate: [0, 360],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear",
              }}
            />
          ))}

          {/* Floating balloons */}
          <motion.div
            className="absolute left-[10%] top-[10%] w-10 h-14 rounded-full bg-gradient-to-b from-[#FFD43B]/20 to-transparent"
            animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[10%] top-[15%] w-8 h-12 rounded-full bg-gradient-to-b from-[#1F6E4A]/15 to-transparent"
            animate={{ y: [10, -10, 10], x: [5, -5, 5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-10 pt-12 pb-16">
          {/* Title */}
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl text-foreground mb-2 flex items-center justify-center gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className="w-7 h-7 text-[#FFD43B]" />
              Top Performers of the Month 🎉
              <Sparkles className="w-7 h-7 text-[#FFD43B]" />
            </motion.h2>
            <p className="text-muted-foreground">Celebrating excellence across the team</p>
          </div>

          {/* 3D Podium */}
          <div className="flex items-end justify-center gap-8 max-w-5xl mx-auto">
            {/* 2nd Place - Left */}
            {top3[1] && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex-1 max-w-xs"
              >
                <Card className="rounded-3xl border-4 border-white shadow-2xl bg-gradient-to-b from-[#F2F2F2] to-[#C0C0C0] relative overflow-hidden group hover:scale-105 transition-transform">
                  {/* Top glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-white/40 blur-3xl" />
                  
                  <CardContent className="p-8 relative z-10">
                    {/* Medal & Rank */}
                    <div className="text-center mb-3">
                      <div className="text-5xl mb-2">🥈</div>
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#C0C0C0] to-[#A9A9A9] flex items-center justify-center shadow-xl ring-4 ring-white/50 mb-2">
                        <Medal className="w-7 h-7 text-white" />
                      </div>
                      <p className="text-xs text-gray-700">Outstanding Contributor</p>
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-white shadow-xl">
                      <AvatarFallback className="bg-[#1F6E4A] text-white text-lg">
                        {top3[1].avatar}
                      </AvatarFallback>
                    </Avatar>

                    {/* Staff Info */}
                    <div className="text-center mb-3">
                      <p className="text-lg text-foreground mb-1">{top3[1].staffId}</p>
                      <p className="text-xs text-gray-600">{top3[1].department}</p>
                    </div>

                    {/* Points */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl py-2 px-3 mb-3">
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-4 h-4 text-[#C0C0C0]" />
                        <span className="text-2xl text-foreground">{top3[1].totalPoints}</span>
                        <span className="text-xs text-gray-600">pts</span>
                      </div>
                    </div>

                    {/* Actions - Hover visible */}
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>

                  {/* Podium base */}
                  <div className="h-24 bg-gradient-to-b from-[#C0C0C0] to-[#A9A9A9] flex items-center justify-center text-white text-2xl shadow-inner">
                    #2
                  </div>
                </Card>
              </motion.div>
            )}

            {/* 1st Place - Center (Tallest) */}
            {top3[0] && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="flex-1 max-w-xs scale-110"
              >
                <Card className="rounded-3xl border-4 border-white shadow-2xl bg-gradient-to-b from-[#FFF3B0] to-[#FFD43B] relative overflow-hidden group hover:scale-105 transition-transform">
                  {/* Pulsing glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Crown sparkle */}
                  <motion.div
                    className="absolute top-4 right-4 text-2xl"
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✨
                  </motion.div>
                  
                  <CardContent className="p-8 relative z-10">
                    {/* Medal & Rank */}
                    <div className="text-center mb-3">
                      <div className="text-5xl mb-2">🥇</div>
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#FFD43B] to-[#FFA500] flex items-center justify-center shadow-xl ring-4 ring-white/50 mb-2">
                        <Crown className="w-8 h-8 text-[#1F6E4A]" />
                      </div>
                      <p className="text-xs text-amber-800">Champion of the Month</p>
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-white shadow-xl ring-4 ring-[#FFD43B]/30">
                      <AvatarFallback className="bg-[#1F6E4A] text-white text-xl">
                        {top3[0].avatar}
                      </AvatarFallback>
                    </Avatar>

                    {/* Staff Info */}
                    <div className="text-center mb-3">
                      <p className="text-xl text-foreground mb-1">{top3[0].staffId}</p>
                      <p className="text-xs text-amber-800">{top3[0].department}</p>
                      {top3[0].previousWins > 0 && (
                        <Badge className="bg-card text-[#FFD43B] border-0 mt-2">
                          <Crown className="w-3 h-3 mr-1" />
                          {top3[0].previousWins}x Winner
                        </Badge>
                      )}
                    </div>

                    {/* Points */}
                    <div className="bg-card backdrop-blur-sm rounded-2xl py-3 px-4 mb-3 shadow-lg">
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-5 h-5 text-[#FFD43B]" />
                        <span className="text-3xl text-foreground">{top3[0].totalPoints}</span>
                        <span className="text-xs text-gray-600">pts</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>

                  {/* Podium base */}
                  <div className="h-28 bg-gradient-to-b from-[#FFD43B] to-[#FFA500] flex items-center justify-center text-white text-2xl shadow-inner">
                    #1
                  </div>
                </Card>
              </motion.div>
            )}

            {/* 3rd Place - Right */}
            {top3[2] && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="flex-1 max-w-xs"
              >
                <Card className="rounded-3xl border-4 border-white shadow-2xl bg-gradient-to-b from-[#E9CBB2] to-[#CD7F32] relative overflow-hidden group hover:scale-105 transition-transform">
                  {/* Top glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-white/30 blur-3xl" />
                  
                  <CardContent className="p-8 relative z-10">
                    {/* Medal & Rank */}
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">🥉</div>
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#CD7F32] to-[#A0522D] flex items-center justify-center shadow-xl ring-4 ring-white/50 mb-3">
                        <Medal className="w-7 h-7 text-white" />
                      </div>
                      <p className="text-sm text-amber-900">Great Team Player</p>
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-white shadow-xl">
                      <AvatarFallback className="bg-[#1F6E4A] text-white text-lg">
                        {top3[2].avatar}
                      </AvatarFallback>
                    </Avatar>

                    {/* Staff Info */}
                    <div className="text-center mb-3">
                      <p className="text-lg text-foreground mb-1">{top3[2].staffId}</p>
                      <p className="text-xs text-amber-900">{top3[2].department}</p>
                    </div>

                    {/* Points */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl py-2 px-3 mb-3">
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-4 h-4 text-[#CD7F32]" />
                        <span className="text-2xl text-foreground">{top3[2].totalPoints}</span>
                        <span className="text-xs text-gray-600">pts</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>

                  {/* Podium base */}
                  <div className="h-20 bg-gradient-to-b from-[#CD7F32] to-[#A0522D] flex items-center justify-center text-white text-2xl shadow-inner">
                    #3
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Stage shadow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/20 blur-xl rounded-full" />
        </div>
      </div>

      {/* Ranking Table Section */}
      {restOfList.length > 0 && (
        <Card className="rounded-2xl border-2 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-[#1F6E4A]" />
                  Ranking Table
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Showing nominees ranked 4–{3 + restOfList.length}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 p-6">
              {restOfList.map((entry, index) => {
                const isTop10 = entry.rank <= 10;
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`rounded-2xl border-2 transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] group ${
                        isEven ? "bg-card" : "bg-card"
                      } ${isTop10 ? "border-l-4 border-l-[#C9A227]" : "border-border"}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-6">
                          {/* Rank Number */}
                          <div className="flex-shrink-0">
                            <div
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-2xl ${
                                entry.rank <= 6
                                  ? "bg-gradient-to-br from-[#C9A227] to-[#FFD43B] text-white"
                                  : "bg-gradient-to-br from-[#1F6E4A] to-[#15803d] text-white"
                              }`}
                            >
                              #{entry.rank}
                            </div>
                          </div>

                          {/* Avatar */}
                          <Avatar className="w-12 h-12 border-2 border-border shadow-md shrink-0">
                            <AvatarFallback className="bg-[#1F6E4A] text-white">
                              {entry.avatar}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-lg text-foreground">{entry.staffId}</p>
                              {getRankIcon(entry.rank, entry.previousRank)}
                              {entry.category && (
                                <Badge variant="outline" className="text-xs border-[#1F6E4A] text-[#1F6E4A]">
                                  {entry.category === "Staff of the Month" ? "🏅" : "🌟"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{entry.department}</p>
                            {/* Progress Bar */}
                            <div className="flex items-center gap-3">
                              <Progress value={entry.totalPoints} className="h-2 flex-1" />
                              <span className="text-sm text-muted-foreground min-w-[50px] text-right">
                                {entry.totalPoints}%
                              </span>
                            </div>
                          </div>

                          {/* Points & Status */}
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end mb-1">
                                <Trophy className="w-5 h-5 text-[#FFD400]" />
                                <span className="text-2xl text-foreground">{entry.totalPoints}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">points</p>
                            </div>

                            <Badge
                              className={
                                entry.status === "Active"
                                  ? "bg-green-100 text-green-700 border-0"
                                  : "bg-orange-100 text-orange-700 border-0"
                              }
                            >
                              {entry.status}
                            </Badge>
                          </div>

                          {/* Actions - Hover visible */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="border-t border-border p-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Showing 1–{restOfList.length} of 50</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Detail Dialog */}
      <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {selectedStaff?.staffId} - Performance Breakdown
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Detailed metrics for {selectedStaff?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-background">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Rank</p>
                    <p className="text-2xl text-foreground">#{selectedStaff.rank}</p>
                  </CardContent>
                </Card>
                <Card className="bg-background">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Points</p>
                    <p className="text-2xl text-foreground">{selectedStaff.totalPoints}</p>
                  </CardContent>
                </Card>
                <Card className="bg-background">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Badges</p>
                    <p className="text-2xl text-foreground">{selectedStaff.badges}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="text-foreground">Point Distribution</h4>
                {Object.entries(selectedStaff.pointBreakdown).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground capitalize">{key}</span>
                      <span className="text-sm text-muted-foreground">{value} / 20</span>
                    </div>
                    <Progress value={(value / 20) * 100} className="h-2" />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-foreground">Earned Badges</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedStaff.earnedBadges.map((badgeId) => {
                    const badge = DEFAULT_BADGES.find((b) => b.id === badgeId);
                    return (
                      badge && (
                        <div key={badgeId} className="flex flex-col items-center p-3 bg-background rounded-xl">
                          <div className="text-3xl mb-2">{badge.icon}</div>
                          <p className="text-xs text-foreground text-center">{badge.name}</p>
                        </div>
                      )
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Badges Gallery Dialog */}
      <Dialog open={showBadges} onOpenChange={setShowBadges}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">All Available Badges</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Earn badges by achieving various milestones and goals
            </DialogDescription>
          </DialogHeader>
          <BadgesDisplay badges={[]} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
LeaderboardPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
