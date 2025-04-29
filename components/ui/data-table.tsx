'use client';

import { useState, useEffect, useMemo } from 'react';
import { type DateRange } from 'react-day-picker';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download, Search, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/date-range-picker';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay, parseISO, isWithinInterval, format } from 'date-fns';
import { Input } from './input';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { SparklineChart } from '@/components/ui/sparkline-chart';
import { motion, AnimatePresence } from 'framer-motion';

export interface TableTab {
  label: string;
  value: string;
}

export interface ColumnChild {
  name: string;
  type: ColumnType;
}

export type ColumnType = 'normal' | 'price' | 'percent' | 'time' | 'graph' | 'status' | 'link';

export interface Column {
  name: string;
  type: ColumnType;
  displayName?: string;
  sort?: boolean;
  child?: ColumnChild;
  linkPrefix?: string;
}

interface TableColumn {
  key: string;
  title: string;
  type: ColumnType;
  child?: ColumnChild;
  sort?: boolean;
  linkPrefix?: string;
}

interface DataTableProps {
  data: Record<string, any>[];
  hideColumns?: string[];
  showColumns?: Column[];
  filterOption?: { key: { label: string; value: string }; options: string[] };
  dateFieldName?: string;
  showCheckbox?: boolean;
  showSearchInput?: boolean;
  showPagination?: boolean;
  showDateRange?: boolean;
  showDateButtons?: boolean;
  showDownloadButton?: boolean;
  showPageSizeSelect?: boolean;
  showTableHeaderInVertical?: boolean;
  pageSize?: number;
  className?: string;
  title?: string;
  description?: string;
  onRowSelect?: (selectedRows: Record<string, any>[]) => void;
  onFilterChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
  emptyStateIcon?: JSX.Element;
}

export function DataTable({
  data,
  hideColumns = [],
  showColumns,
  filterOption,
  dateFieldName,
  showCheckbox = true,
  showSearchInput = true,
  showPagination = true,
  showDateRange = true,
  showDateButtons = true,
  showDownloadButton = true,
  showPageSizeSelect = true,
  showTableHeaderInVertical = true,
  pageSize = 5,
  className,
  title,
  description,
  onRowSelect,
  onFilterChange,
  onSearchChange,
  isLoading = false,
  emptyStateMessage = "No data available",
  emptyStateIcon,
}: DataTableProps) {
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>();
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedDateButton, setSelectedDateButton] = useState('1M');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Reset page when page size changes
  useEffect(() => {
    setPage(1);
  }, [currentPageSize]);

  // Automatically determine columns from data or use showColumns if provided
  const columns = useMemo<TableColumn[]>(() => {
    if (showColumns && showColumns.length > 0) {
      return showColumns.map(column => ({
        key: column.name,
        title: column.displayName || column.name
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase()),
        type: column.type,
        child: column.child,
        sort: column.sort ?? false,
        linkPrefix: column.linkPrefix
      }));
    }
    
    return data.length > 0 
      ? Object.keys(data[0])
        .filter(key => !hideColumns.includes(key.toLowerCase()))
        .map(key => ({
          key,
          title: key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase()),
          type: 'normal' as ColumnType,
          sort: false,
          linkPrefix: undefined
        }))
      : [];
  }, [data, hideColumns, showColumns]);

  // Generate filter options from the specified column and data from database
  // const filterOptions = useMemo(() => {
  //   if (!filterOption || !data.length) return [];
    
  //   const uniqueValues = Array.from(new Set(data.map(item => item[filterOption.key.value])))
  //     .filter(Boolean)
  //     .sort((a, b) => {
  //       if (typeof a === 'number' && typeof b === 'number') {
  //         return a - b;
  //       }
  //       return String(a).localeCompare(String(b));
  //     });

  //   return [
  //     { label: 'All', value: 'all' },
  //     ...uniqueValues.map(value => ({
  //       label: String(value),
  //       value: String(value)
  //     }))
  //   ];
  // }, [data, filterOption]);

  // Find the date column name from showColumns
  const dateColumnName = useMemo(() => {
    if (dateFieldName) return dateFieldName;
    if (!showColumns) return 'date';
    const dateColumn = showColumns.find(col => col.type === 'time');
    return dateColumn?.name || 'date';
  }, [showColumns]);

  // Filter data based on selected filter and date range
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply column filter
    if (filterOption && selectedFilter !== 'All') {
      filtered = filtered.filter(item => String(item[filterOption.key.value]).includes(selectedFilter));
    }

    // Apply search filter
    if (showSearchInput && searchQuery) {
      filtered = filtered.filter(item => 
        columns.some(col => 
          String(item[col.key]).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );  
    }

    // Apply date filter if date field exists in data
    if (filtered.length > 0) {
      filtered = filtered.filter(item => {
        try {
          // Skip if the item doesn't have the date field
          if (!item[dateColumnName]) return true;
          
          const itemDate = parseISO(item[dateColumnName]);
          const now = new Date();
          
          // Use custom date range if selected
          if (dateRange?.from) {
            const start = startOfDay(dateRange.from);
            const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(now);
            return isWithinInterval(itemDate, { start, end });
          }
          
          // Use date button range
          if (selectedDateButton) {
            let start: Date;
            switch (selectedDateButton) {
              case '1D':
                start = subDays(now, 1);
                break;
              case '1W':
                start = subWeeks(now, 1);
                break;
              case '1M':
                start = subMonths(now, 1);
                break;
              default:
                return true; // No date filter if no button selected
            }

            setDateRange({
              from: start,
              to: now
            });

            return isWithinInterval(itemDate, {
              start: startOfDay(start),
              end: endOfDay(now)
            });
          }
          
          return true; // No date filter if neither range nor button selected
        } catch (error) {
          console.error('Error parsing date:', error);
          return false; // Exclude items with invalid dates
        }
      });
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    data, 
    filterOption, 
    selectedFilter, 
    dateRange, 
    selectedDateButton, 
    searchQuery, 
    columns, 
    sortConfig,
    dateColumnName
  ]);

  const totalPages = Math.ceil(filteredData.length / currentPageSize);
  const startIndex = (page - 1) * currentPageSize;
  const endIndex = startIndex + currentPageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData);
    }
    setSelectAll(!selectAll);
    onRowSelect?.(selectedRows);
  };

  const handleSelectRow = (row: Record<string, any>) => {
    const isSelected = selectedRows.includes(row);
    const newSelectedRows = isSelected
      ? selectedRows.filter((r) => r !== row)
      : [...selectedRows, row];
    setSelectedRows(newSelectedRows);
    onRowSelect?.(newSelectedRows);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // setSelectedDateButton(''); // Clear date button selection when using custom range
    setPage(1);
  };

  const handleDateButtonChange = (value: string) => {
    setSelectedDateButton(value);
    setDateRange(undefined); // Clear date range when using buttons
    setPage(1);
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    setPage(1);
    onFilterChange?.(value);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    onSearchChange?.(value);
  };

  const handleDownload = () => {
    // Convert data to CSV
    const headers = columns.map(col => col.title).join(',');
    const rows = selectedRows.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Handle values that might contain commas
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"`
          : value;
      }).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'table-data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Format cell value based on column type
  const formatCellValue = (value: any, column: { key: string; type: ColumnType; child?: ColumnChild; linkPrefix?: string }) => {
    if (value === undefined || value === null) return '';

    switch (column.type) {
      case 'price':
        const priceValue = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(priceValue) ? value : `$${priceValue.toFixed(2)}`;
      
      case 'percent':
        const percentValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(percentValue)) return value;
        
        const isPositive = percentValue >= 0;
        const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
        
        return (
          <div className="flex items-center gap-1 mt-1">
            <Icon className={cn(
              "h-4 w-4",
              isPositive ? "text-green-500" : "text-red-500"
            )} />
            <span className={cn(
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {Math.abs(percentValue).toFixed(2)}%
            </span>
          </div>
        );
      
      case 'time':
        try {
          const date = typeof value === 'string' ? new Date(value) : value;
          return format(date, 'yyyy-MM-dd HH:mm:ss');
        } catch (error) {
          return value;
        }
      
      case 'status':
        return (
          <Badge 
            variant={value.toLowerCase() === 'active' ? 'success' : 'destructive'}
            className="capitalize"
          >
            {value}
          </Badge>
        );
      
      case 'link':
        const href = column.linkPrefix ? `${column.linkPrefix}${value}` : value;
        return (
          <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        );
      
      case 'graph':
        if (!Array.isArray(value)) return value;
        return (
          <div className="w-24">
            <SparklineChart
              data={value}
              color="hsl(var(--chart-1))"
            />
          </div>
        );
      
      case 'normal':
        if (column.key === 'botName') {
          return value.split('-')[0];
        }
      default:
        return value;
    }
  };

  // Render cell with optional child value
  const renderCell = (row: Record<string, any>, column: { key: string; type: ColumnType; child?: ColumnChild }) => {
    const value = row[column.key];
    const childValue = column.child ? row[column.child.name] : undefined;
    
    return (
      <div className="flex flex-col">
        <div>{formatCellValue(value, column)}</div>
        {column.child && childValue !== undefined && (
          <div className="text-xs text-muted-foreground">
            {formatCellValue(childValue, { key: column.child!.name, type: column.child!.type })}
          </div>
        )}
      </div>
    );
  };

  // Add sorting handler
  const handleSort = (column: TableColumn) => {
    if (!column.sort) return;

    setSortConfig(current => {
      if (current?.key === column.key) {
        return {
          key: column.key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key: column.key,
        direction: 'asc'
      };
    });
  };

  // Animation variants
  const tableVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn("w-full", className)}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {/* Controls section */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between flex-wrap">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-start">
                {showSearchInput && (
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row md:items-center justify-start flex-wrap lg:flex-nowrap gap-2">
                <div className="flex flex-col sm:flex-row gap-4 justify-start w-full md:w-fit">
                  {filterOption && (
                    <Select value={selectedFilter} onValueChange={handleFilterChange}>
                      <SelectTrigger className="w-[180px] text-start">
                        <SelectValue placeholder={`Filter by ${filterOption}`}>
                          {selectedFilter && (
                            <span className="inline-block max-w-[130px] pt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                              {/* {columns.filter(col => col.key === filterOption.key.value)[0].title}: {
                                filterOptions.find(opt => opt.value === selectedFilter)?.label
                              } */}
                              {filterOption.key.label}: {selectedFilter}
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {/* {filterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-start">
                            {columns.filter(col => col.key === filterOption.key)[0].title}: {option.label}
                          </SelectItem>
                        ))} */}
                        {filterOption.options.map((option) => (
                          <SelectItem key={option} value={option} className="text-start">
                            {filterOption.key.label}: {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {showDateRange && (
                    <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-start w-full w-fit">
                  {showDateButtons && (
                    <Tabs value={selectedDateButton} className="w-fit flex-wrap" onValueChange={handleDateButtonChange}>
                      <TabsList className="flex w-full grid-cols-4">
                        <TabsTrigger value="1D">1D</TabsTrigger>
                        <TabsTrigger value="1W">1W</TabsTrigger>
                        <TabsTrigger value="1M">1M</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                  {showDownloadButton && (
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Loading state */}
            {isLoading ? (
              <motion.div 
                className="rounded-md border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {showCheckbox && (
                        <TableHead className="w-[30px]">
                          <div className="h-4 w-4 rounded bg-muted animate-pulse"></div>
                        </TableHead>
                      )}
                      {columns.map((column) => (
                        <TableHead key={column.key}>
                          <div className="h-4 w-24 rounded bg-muted animate-pulse"></div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        {showCheckbox && (
                          <TableCell>
                            <div className="h-4 w-4 rounded bg-muted animate-pulse"></div>
                          </TableCell>
                        )}
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            <div className="h-4 w-full rounded bg-muted animate-pulse"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {filteredData.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center py-12 space-y-4"
                  >
                    {emptyStateIcon ? (
                      emptyStateIcon
                    ) : (
                      <div className="h-12 w-12 text-muted-foreground">
                        <Search className="h-full w-full" />
                      </div>
                    )}
                    <p className="text-muted-foreground text-center">
                      {dateRange?.from || selectedDateButton !== 'all' 
                        ? "No data available for the selected date range" 
                        : emptyStateMessage}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="table"
                    className="rounded-md border"
                    variants={tableVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {showCheckbox && (
                            <TableHead className="w-[30px]">
                              <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                            </TableHead>
                          )}
                          {columns.map((column) => (
                            <TableHead 
                              key={column.key}
                              className={cn(
                                column.sort && "cursor-pointer hover:bg-muted",
                                "transition-colors"
                              )}
                              onClick={() => handleSort(column)}
                            >
                              <div className="flex items-center gap-2">
                                {column.title}
                                {column.sort && (
                                  <div className="flex flex-col">
                                    <ChevronUp 
                                      className={cn(
                                        "h-3 w-3 -mb-1",
                                        sortConfig?.key === column.key && sortConfig.direction === 'asc' 
                                          ? "text-foreground" 
                                          : "text-muted-foreground"
                                      )}
                                    />
                                    <ChevronDown 
                                      className={cn(
                                        "h-3 w-3",
                                        sortConfig?.key === column.key && sortConfig.direction === 'desc' 
                                          ? "text-foreground" 
                                          : "text-muted-foreground"
                                      )}
                                    />
                                  </div>
                                )}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {currentData.map((row, index) => (
                            <motion.tr
                              key={index}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              layout
                            >
                              {showCheckbox && (
                                <TableCell>
                                  <Checkbox
                                    checked={selectedRows.includes(row)}
                                    onCheckedChange={() => handleSelectRow(row)}
                                  />
                                </TableCell>
                              )}
                              {columns.map((column) => (
                                <TableCell key={column.key}>
                                  {renderCell(row, column)}
                                </TableCell>
                              ))}
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Pagination section with animation */}
            {showPagination && !isLoading && filteredData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between gap-4 py-4 flex-wrap"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedRows.length} of {filteredData.length} row(s) selected.
                  </div>
                  {showPageSizeSelect && (
                    <Select
                      value={currentPageSize.toString()}
                      onValueChange={(value) => setCurrentPageSize(Number(value))}
                    >
                      <SelectTrigger className="w-[80px] h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 25, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Page</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={page}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1 && value <= totalPages) {
                          setPage(value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = parseInt(e.currentTarget.value);
                          if (value >= 1 && value <= totalPages) {
                            setPage(value);
                          }
                        }
                      }}
                      className="w-16 h-10 text-start"
                    />
                    <span className="text-sm text-muted-foreground">of {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Add this new function for sorting
const sortData = (data: any[], column: Column, direction: 'asc' | 'desc') => {
  return [...data].sort((a, b) => {
    const aValue = a[column.name];
    const bValue = b[column.name];
    
    if (direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });
}; 