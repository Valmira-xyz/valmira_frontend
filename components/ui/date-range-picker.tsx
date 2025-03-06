"use client"
import { format, subDays } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function DateRangePicker({ className, dateRange, onDateRangeChange }: DateRangePickerProps) {
  const today = new Date()
  const [open, setOpen] = useState(false)

  // Ensure dateRange is valid when component mounts or dateRange prop changes
  useEffect(() => {
    if (!dateRange) {
      onDateRangeChange({ from: subDays(today, 30), to: today })
    } else if (dateRange.from && !dateRange.to) {
      onDateRangeChange({ ...dateRange, to: today })
    }
  }, [dateRange, onDateRangeChange, today])

  const presets = [
    { name: "Last 7 days", range: { from: subDays(today, 7), to: today } },
    { name: "Last 30 days", range: { from: subDays(today, 30), to: today } },
    { name: "Last 90 days", range: { from: subDays(today, 90), to: today } },
    {
      name: "This month",
      range: {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: today,
      },
    },
  ]

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
              "truncate",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50" align="start" side="bottom">
          <div className="border-b border-border p-3">
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onDateRangeChange(preset.range)
                    setOpen(false)
                  }}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                onDateRangeChange(range)
                if (range?.from && range?.to) {
                  setTimeout(() => setOpen(false), 300)
                }
              }}
              numberOfMonths={2}
              disabled={(date) => date > today}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

