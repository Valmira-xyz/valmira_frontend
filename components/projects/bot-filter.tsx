"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface BotFilterProps {
  bots: { id: string; name: string }[]
  selectedBot: string | null
  onSelectBot: (botId: string | null) => void
  className?: string
}

export function BotFilter({ bots, selectedBot, onSelectBot, className }: BotFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const selectedBotName = selectedBot ? bots.find((bot) => bot.id === selectedBot)?.name || "All Bots" : "All Bots"

  // Filter bots based on search term
  const filteredBots = React.useMemo(() => {
    if (!searchTerm) return bots
    return bots.filter((bot) => bot.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [bots, searchTerm])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between truncate", className)}
          title={selectedBotName} // Add title for tooltip on hover
        >
          <span className="truncate">{selectedBotName}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search bot..." value={searchTerm} onValueChange={setSearchTerm} />
          <CommandList>
            <CommandEmpty>No bot found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onSelectBot(null)
                  setOpen(false)
                  setSearchTerm("")
                }}
                className="cursor-pointer"
              >
                <Check className={cn("mr-2 h-4 w-4", selectedBot === null ? "opacity-100" : "opacity-0")} />
                All Bots
              </CommandItem>
              {filteredBots.map((bot) => (
                <CommandItem
                  key={bot.id}
                  value={bot.name}
                  onSelect={() => {
                    onSelectBot(bot.id)
                    setOpen(false)
                    setSearchTerm("")
                  }}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedBot === bot.id ? "opacity-100" : "opacity-0")} />
                  {bot.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

