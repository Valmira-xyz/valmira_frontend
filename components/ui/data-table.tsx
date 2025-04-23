'use client';

import { useState, useEffect, useMemo } from 'react';
import { type DateRange } from 'react-day-picker';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/date-range-picker';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { Input } from './input';

export interface TableTab {
  label: string;
  value: string;
}

interface DataTableProps {
  data: Record<string, any>[];
  hideColumns?: string[];
  filterOption?: string;
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
}

export function DataTable({
  data,
  hideColumns = [],
  filterOption,
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
}: DataTableProps) {
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>();
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedDateButton, setSelectedDateButton] = useState('1D');
  const [searchQuery, setSearchQuery] = useState('');


  // Reset page when page size changes
  useEffect(() => {
    setPage(1);
  }, [currentPageSize]);

  // Automatically determine columns from data
  const columns = data.length > 0 
    ? Object.keys(data[0])
      .filter(key => !hideColumns.includes(key))
      .map(key => ({
        key,
        title: key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
      }))
    : [];

  // Generate filter options from the specified column
  const filterOptions = useMemo(() => {
    if (!filterOption || !data.length) return [];
    
    const uniqueValues = Array.from(new Set(data.map(item => item[filterOption])))
      .filter(Boolean)
      .sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b;
        }
        return String(a).localeCompare(String(b));
      });

    return [
      { label: 'All', value: 'all' },
      ...uniqueValues.map(value => ({
        label: String(value),
        value: String(value)
      }))
    ];
  }, [data, filterOption]);

  // Filter data based on selected filter and date range
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply column filter
    if (filterOption && selectedFilter !== 'all') {
      filtered = filtered.filter(item => String(item[filterOption]) === selectedFilter);
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
    if (filtered.length > 0 && 'date' in filtered[0]) {
      filtered = filtered.filter(item => {
        try {
          const itemDate = parseISO(item.date);
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

    return filtered;
  }, [data, filterOption, selectedFilter, dateRange, selectedDateButton, searchQuery, columns]);

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
    setSelectedDateButton(''); // Clear date button selection when using custom range
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

  return (
    <Card className="overflow-hidden">
      <div className={showTableHeaderInVertical ? "" : "flex flex-col lg:flex-row gap-x-4 justify-between flex-wrap"}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription >{description}</CardDescription>
        </CardHeader>
        <div className={`flex flex-col flex-wrap gap-4 px-4 sm:px-6 pb-0 sm:flex-row justify-start ${showSearchInput ? "lg:justify-between" : "lg:justify-end"}`}>
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
          
          <div className="flex flex-col gap-4 sm:flex-row md:items-center justify-start flex-wrap lg:flex-nowrap">
            <div className="flex flex-col sm:flex-row gap-4 justify-start w-full md:w-fit">
              {filterOption && filterOptions.length > 0 && (
                <Select value={selectedFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={`Filter by ${filterOption}`} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {columns.filter(col => col.key === filterOption)[0].title}: {option.label}
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
      </div>
    
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {showCheckbox && (
                  <TableHead className="w-[30px]">
                    <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.title}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row, index) => (
                <TableRow key={index}>
                  {showCheckbox && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(row)}
                        onCheckedChange={() => handleSelectRow(row)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key}>{row[column.key]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {showPagination && (
          <div className="mt-4 sm:mt-6 gap-4 flex-wrap flex flex-row sm:items-center justify-between">
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
                <span className="text-sm text-muted-foreground">{page} of {totalPages}</span>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
} 