import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './calendar.css';

const Calendar = ({ className = '', ...props }) => {
  return (
    <DayPicker
      className={`calendar-dayPicker ${className}`}
      showOutsideDays={true}
      {...props}
    />
  );
};

export { Calendar };
