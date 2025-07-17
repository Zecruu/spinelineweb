import React, { useState, useEffect } from "react";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const EnhancedCalendar = ({ 
  selectedDates = [], 
  onDateSelect, 
  currentDate = new Date(),
  onNavigate,
  dailyCounts = {},
  className = ""
}) => {
  const [date, setDate] = useState(currentDate);

  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);

  const handleCalendarChange = (value, onChange) => {
    const event = {
      target: {
        value: String(value),
      },
    };
    onChange(event);
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  };

  const handleMonthChange = (newMonth) => {
    const updatedDate = new Date(date.getFullYear(), newMonth, 1);
    setDate(updatedDate);
    if (onNavigate) {
      onNavigate(updatedDate);
    }
  };

  // Custom day component to show appointment counts
  const CustomDay = ({ day, modifiers, ...props }) => {
    const dateStr = day.toISOString().split('T')[0];
    const appointmentCount = dailyCounts[dateStr] || 0;
    const isSelected = selectedDates.includes(dateStr);
    
    return (
      <div 
        className={`custom-day ${modifiers.selected ? 'selected' : ''} ${
          modifiers.today ? 'today' : ''
        } ${isSelected ? 'multi-selected' : ''}`}
        {...props}
      >
        <div className="day-number">{day.getDate()}</div>
        {appointmentCount > 0 && (
          <div className="appointment-count">
            {appointmentCount}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`enhanced-calendar ${className}`}>
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateChange}
        className="rounded-md border p-2"
        captionLayout="dropdown-years"
        defaultMonth={date}
        startMonth={new Date(1980, 0)}
        endMonth={new Date(2030, 11)}
        components={{
          Day: CustomDay,
          DropdownNav: (props) => {
            return (
              <div className="flex w-full items-center justify-center gap-3 [&>span]:text-sm [&>span]:font-medium">
                {props.children}
              </div>
            );
          },
          YearsDropdown: (props) => {
            return (
              <Select
                value={String(props.value)}
                onValueChange={(value) => {
                  if (props.onChange) {
                    handleCalendarChange(value, props.onChange);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-fit font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                  {props.options?.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={String(option.value)}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          },
        }}
      />
    </div>
  );
};

export default EnhancedCalendar;
