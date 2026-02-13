'use client';

import {
  Users,
  UserCheck,
  UserPlus,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminStats } from '@/types/database';

const STATS_CONFIG = [
  {
    key: 'totalUsers' as const,
    label: 'Total Users',
    icon: Users,
    color: 'text-primary',
  },
  {
    key: 'activeUsers' as const,
    label: 'Active Users',
    icon: UserCheck,
    color: 'text-emerald-500',
  },
  {
    key: 'newUsers' as const,
    label: 'New Users (30d)',
    icon: UserPlus,
    color: 'text-amber-500',
  },
  {
    key: 'adminUsers' as const,
    label: 'Admin Users',
    icon: ShieldCheck,
    color: 'text-blue-500',
  },
];

interface StatsCardsProps {
  stats: AdminStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS_CONFIG.map((stat, idx) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/50 transition-[border-color,background-color] duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="p-2 rounded-xl bg-background border border-border group-hover:border-primary/30 transition-colors">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats[stat.key].toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center">
                  <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
                <span className="text-[10px] text-muted-foreground">
                  from database
                </span>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
