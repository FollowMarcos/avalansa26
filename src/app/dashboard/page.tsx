"use client";

import { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Search,
  MoreHorizontal,
  Eye,
  UserCog,
  ChevronRight,
  Filter,
  Download,
  ArrowUpRight,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ModeToggle } from "@/components/mode-toggle";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Mock Data (will be replaced with real data) ---
const USERS_DATA = [
  {
    id: "1",
    name: "Alex Rivier",
    username: "ariver",
    email: "alex@avalansa.com",
    role: "admin",
    status: "completed",
    joined: "2023-10-12",
    avatar: "AR",
  },
  {
    id: "2",
    name: "Sarah Chen",
    username: "schen_dev",
    email: "sarah@avalansa.com",
    role: "user",
    status: "completed",
    joined: "2023-11-05",
    avatar: "SC",
  },
  {
    id: "3",
    name: "Marcus Thorne",
    username: "mthorne",
    email: "m.thorne@gmail.com",
    role: "user",
    status: "pending",
    joined: "2024-01-15",
    avatar: "MT",
  },
  {
    id: "4",
    name: "Elena Rodriguez",
    username: "elena_r",
    email: "elena@avalansa.com",
    role: "admin",
    status: "completed",
    joined: "2023-09-20",
    avatar: "ER",
  },
  {
    id: "5",
    name: "Julian Voss",
    username: "jvoss",
    email: "julian@work.io",
    role: "user",
    status: "completed",
    joined: "2024-02-01",
    avatar: "JV",
  },
  {
    id: "6",
    name: "Amara Okoro",
    username: "amara_o",
    email: "amara@design.co",
    role: "user",
    status: "onboarding",
    joined: "2024-02-14",
    avatar: "AO",
  },
  {
    id: "7",
    name: "David Kim",
    username: "dkim_sf",
    email: "david.kim@avalansa.com",
    role: "user",
    status: "completed",
    joined: "2023-12-10",
    avatar: "DK",
  },
  {
    id: "8",
    name: "Sophie Laurent",
    username: "slaurent",
    email: "sophie@web.fr",
    role: "user",
    status: "pending",
    joined: "2024-02-18",
    avatar: "SL",
  },
];

const STATS_CONFIG = [
  {
    label: "Total Users",
    value: "2,842",
    icon: Users,
    trend: "+12.5%",
    color: "text-primary",
  },
  {
    label: "Active Users",
    value: "1,920",
    icon: UserCheck,
    trend: "+8.2%",
    color: "text-emerald-500",
  },
  {
    label: "New Users",
    value: "148",
    icon: UserPlus,
    trend: "+24.1%",
    color: "text-amber-500",
  },
  {
    label: "Admin Users",
    value: "12",
    icon: ShieldCheck,
    trend: "0%",
    color: "text-blue-500",
  },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState(USERS_DATA);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, users]);

  const handleRoleChange = (id: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      {/* Header & Breadcrumbs */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
          <span className="hover:text-primary cursor-pointer transition-colors">
            Home
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Dashboard</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Welcome back to Avalansa Admin. Here&apos;s what&apos;s happening
              today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-9 gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button className="h-9 gap-2 bg-primary text-primary-foreground hover:opacity-90">
              <UserPlus className="w-4 h-4" /> Add User
            </Button>
            <div className="h-9 w-px bg-border mx-2" />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CONFIG.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-card group hover:border-primary/50 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className="p-2 rounded-xl bg-background border border-border group-hover:border-primary/30 transition-colors">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-emerald-500 flex items-center">
                    {stat.trend} <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    vs last month
                  </span>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content: User Table */}
      <Card className="border-border/50 bg-card overflow-hidden">
        <CardHeader className="px-6 py-6 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">User Management</CardTitle>
              <CardDescription>
                A complete directory of all registered users and their current
                status.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email..."
                  className="pl-9 bg-background/50 border-border focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-border hover:bg-muted"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <div className="relative">
          <Table className="relative">
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[80px]">User</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead className="hidden md:table-cell">Username</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Email Address
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">
                  Joined Date
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={user.id}
                    className="group border-border/40 hover:bg-muted/20 transition-colors"
                  >
                    <TableCell>
                      <Avatar className="h-9 w-9 border-2 border-background">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.name}
                      <div className="md:hidden text-xs text-muted-foreground font-normal mt-0.5">
                        @{user.username}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-sm">
                        @{user.username}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm truncate max-w-[180px] block">
                        {user.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`capitalize font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-full ${user.role === "admin"
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                          }`}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${user.status === "completed"
                            ? "bg-emerald-500"
                            : user.status === "onboarding"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                            }`}
                        />
                        <span className="text-xs capitalize text-muted-foreground font-medium">
                          {user.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                      {new Date(user.joined).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-card border-border shadow-none"
                        >
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Eye className="w-4 h-4 text-muted-foreground" />{" "}
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                            Management
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() =>
                              handleRoleChange(
                                user.id,
                                user.role === "admin" ? "user" : "admin"
                              )
                            }
                          >
                            <UserCog className="w-4 h-4 text-muted-foreground" />
                            Switch to {user.role === "admin" ? "User" : "Admin"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="bg-muted/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                No users found matching your search.
              </p>
              <Button
                variant="link"
                onClick={() => setSearchQuery("")}
                className="text-primary"
              >
                Clear search query
              </Button>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredUsers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{users.length}</span>{" "}
            users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 px-3 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-primary/20 text-primary"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 hidden md:block">
        <Button
          size="icon"
          className="w-12 h-12 rounded-full border border-border bg-primary hover:scale-105 transition-transform"
        >
          <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
        </Button>
      </div>
    </div>
  );
}
