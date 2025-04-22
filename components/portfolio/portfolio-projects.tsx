'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { format } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Search,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SparklineChart } from '@/components/ui/sparkline-chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber } from '@/lib/utils';

interface PortfolioProjectsProps {
  dateRange: DateRange | undefined;
  sortBy?: 'profit' | 'volume' | 'activity';
}

export function PortfolioProjects({
  dateRange,
  sortBy = 'profit',
}: PortfolioProjectsProps) {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { toast } = useToast();

  // Mock data - in a real app, this would come from an API
  const projects = [
    {
      id: '1',
      name: 'TokenX',
      contractAddress: '0x1234...5678',
      network: 'Ethereum',
      status: 'Active',
      profit: 12500,
      profitChange: 15.2,
      volume: 450000,
      volumeChange: 8.7,
      trades: 850,
      tradesChange: 5.3,
      profitTrend: [100, 120, 110, 130, 150, 140, 160],
      volumeTrend: [1000, 1200, 1100, 1300, 1500, 1400, 1600],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'CryptoY',
      contractAddress: '0x9876...5432',
      network: 'BSC',
      status: 'Active',
      profit: 8200,
      profitChange: -3.5,
      volume: 320000,
      volumeChange: 12.1,
      trades: 620,
      tradesChange: 9.8,
      profitTrend: [80, 85, 90, 88, 92, 95, 98],
      volumeTrend: [900, 950, 980, 970, 990, 1000, 987],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'DeFiZ',
      contractAddress: '0xabcd...ef12',
      network: 'Polygon',
      status: 'Active',
      profit: 3980,
      profitChange: 22.7,
      volume: 180000,
      volumeChange: 15.3,
      trades: 372,
      tradesChange: -2.1,
      profitTrend: [50, 55, 60, 58, 56, 54, 55],
      volumeTrend: [500, 520, 550, 540, 530, 545, 543],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'MetaToken',
      contractAddress: '0xfedc...ba98',
      network: 'Arbitrum',
      status: 'Paused',
      profit: 0,
      profitChange: 0,
      volume: 0,
      volumeChange: 0,
      trades: 0,
      tradesChange: 0,
      profitTrend: [40, 45, 50, 48, 46, 44, 0],
      volumeTrend: [400, 420, 450, 440, 430, 445, 0],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '5',
      name: 'GameFi',
      contractAddress: '0x7654...3210',
      network: 'Optimism',
      status: 'Active',
      profit: 0,
      profitChange: 0,
      volume: 300000,
      volumeChange: 18.9,
      trades: 0,
      tradesChange: 0,
      profitTrend: [0, 0, 0, 0, 0, 0, 0],
      volumeTrend: [300, 320, 350, 340, 330, 345, 343],
      lastUpdated: new Date().toISOString(),
    },
  ];

  // Sort projects based on sortBy and sortDirection
  const sortedProjects = [...projects].sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
      case 'profit':
        valueA = a.profit;
        valueB = b.profit;
        break;
      case 'volume':
        valueA = a.volume;
        valueB = b.volume;
        break;
      case 'activity':
        valueA = a.trades;
        valueB = b.trades;
        break;
      default:
        valueA = a.profit;
        valueB = b.profit;
    }

    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
  });

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const getSortIcon = () => {
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  const handleExport = () => {
    // Implement export functionality
    toast({
      title: 'Exporting data',
      description: 'Your portfolio data is being exported as CSV.',
    });
    console.log('Exporting data...');
  };

  const filteredProjects = sortedProjects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || project.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredProjects.map((project) => project.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (checked: boolean, projectId: string) => {
    if (checked) {
      setSelectedRows([...selectedRows, projectId]);
    } else {
      setSelectedRows(selectedRows.filter((id) => id !== projectId));
    }
  };

  const isAllSelected =
    filteredProjects.length > 0 &&
    selectedRows.length === filteredProjects.length;

  return (
    <Card className="border-none">
      <CardHeader className="!p-0 my-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start gap-2 md:items-center  justify-between">
            <CardTitle>Project Performance</CardTitle>
            <CardDescription>
              {dateRange?.from && dateRange?.to ? (
                <>
                  Performance from {format(dateRange.from, 'MMM d, yyyy')} to{' '}
                  {format(dateRange.to, 'MMM d, yyyy')}
                </>
              ) : (
                <>Recent performance across all projects</>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full md:w-[280px]"
              />
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-1/2 md:w-[160px]">
                  <SelectValue placeholder="Status: All Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: All Project</SelectItem>
                  <SelectItem value="active">Status: Active</SelectItem>
                  <SelectItem value="paused">Status: Paused</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="default"
                onClick={handleExport}
                className="w-1/2 md:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="border rounded-lg !p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Network</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={sortBy === 'profit' ? toggleSortDirection : undefined}
              >
                <div className="flex items-center">
                  Profit {sortBy === 'profit' && getSortIcon()}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hidden md:table-cell"
                onClick={sortBy === 'volume' ? toggleSortDirection : undefined}
              >
                <div className="flex items-center">
                  Volume {sortBy === 'volume' && getSortIcon()}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hidden lg:table-cell"
                onClick={
                  sortBy === 'activity' ? toggleSortDirection : undefined
                }
              >
                <div className="flex items-center">
                  Trades {sortBy === 'activity' && getSortIcon()}
                </div>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Trend</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="w-[50px]">
                  <Checkbox
                    checked={selectedRows.includes(project.id)}
                    onCheckedChange={(checked) =>
                      handleSelectRow(checked as boolean, project.id)
                    }
                    aria-label={`Select ${project.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      project.status === 'Active' ? 'success' : 'secondary'
                    }
                  >
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {project.network}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      ${formatNumber(project.profit)}
                    </span>
                    {project.profitChange !== 0 && (
                      <span
                        className={`text-xs flex items-center ${project.profitChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {project.profitChange > 0 ? (
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                        )}
                        {Math.abs(project.profitChange)}%
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      ${formatNumber(project.volume)}
                    </span>
                    {project.volumeChange !== 0 && (
                      <span
                        className={`text-xs flex items-center ${project.volumeChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {project.volumeChange > 0 ? (
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                        )}
                        {Math.abs(project.volumeChange)}%
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatNumber(project.trades)}
                    </span>
                    {project.tradesChange !== 0 && (
                      <span
                        className={`text-xs flex items-center ${project.tradesChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {project.tradesChange > 0 ? (
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                        )}
                        {Math.abs(project.tradesChange)}%
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="h-10 w-24">
                    <SparklineChart
                      data={
                        sortBy === 'volume'
                          ? project.volumeTrend
                          : project.profitTrend
                      }
                      color={
                        project.status === 'Active'
                          ? 'hsl(var(--chart-1))'
                          : 'hsl(var(--muted-foreground))'
                      }
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/projects/${project.id}`}>
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View Project</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
