"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/app/admin/admin.module.css";
import { formatDateToPtBr, formatMonthYear, getMonthDays } from "./admin-formatters";

export type DatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DatePickerField({ value, onChange }: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(`${value}T12:00:00`));
  const containerRef = useRef<HTMLDivElement | null>(null);

  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);
  const todayIso = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  function selectDate(nextValue: string) {
    onChange(nextValue);
    setCurrentMonth(new Date(`${nextValue}T12:00:00`));
    setIsOpen(false);
  }

  function shiftMonth(offset: number) {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  return (
    <div className={styles.calendarField} ref={containerRef}>
      <button
        className={styles.calendarTrigger}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{formatDateToPtBr(value)}</span>
      </button>

      {isOpen ? (
        <div className={styles.calendarPopoverCard}>
          <div className={styles.calendarToolbar}>
            <button className={styles.calendarNavButton} type="button" onClick={() => shiftMonth(-1)}>
              {"<"}
            </button>
            <strong>{formatMonthYear(currentMonth)}</strong>
            <button className={styles.calendarNavButton} type="button" onClick={() => shiftMonth(1)}>
              {">"}
            </button>
          </div>

          <div className={styles.calendarWeekdaysRow}>
            {["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.calendarDaysGrid}>
            {monthDays.map((day) => {
              const isSelected = day.iso === value;
              const isToday = day.iso === todayIso;

              return (
                <button
                  className={`${styles.calendarDayButton} ${
                    !day.isCurrentMonth ? styles.calendarDayOutsideMonth : ""
                  } ${isSelected ? styles.calendarDaySelected : ""} ${
                    isToday ? styles.calendarDayToday : ""
                  }`}
                  key={day.iso}
                  type="button"
                  onClick={() => selectDate(day.iso)}
                >
                  {day.day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function InlineCalendar({ value, onChange }: DatePickerFieldProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(`${value}T12:00:00`));
  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);
  const todayIso = new Date().toISOString().slice(0, 10);

  function shiftMonth(offset: number) {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    setCurrentMonth(nextMonth);
    onChange(nextMonth.toISOString().slice(0, 10));
  }

  return (
    <div className={styles.monthCalendar}>
      <div className={styles.calendarToolbar}>
        <button className={styles.calendarNavButton} type="button" onClick={() => shiftMonth(-1)}>
          {"<"}
        </button>
        <strong>{formatMonthYear(currentMonth)}</strong>
        <button className={styles.calendarNavButton} type="button" onClick={() => shiftMonth(1)}>
          {">"}
        </button>
      </div>

      <div className={styles.calendarWeekdaysRow}>
        {["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.calendarDaysGrid}>
        {monthDays.map((day) => {
          const isSelected = day.iso === value;
          const isToday = day.iso === todayIso;

          return (
            <button
              className={`${styles.calendarDayButton} ${
                !day.isCurrentMonth ? styles.calendarDayOutsideMonth : ""
              } ${isSelected ? styles.calendarDaySelected : ""} ${
                isToday ? styles.calendarDayToday : ""
              }`}
              key={day.iso}
              type="button"
              onClick={() => {
                setCurrentMonth(new Date(`${day.iso}T12:00:00`));
                onChange(day.iso);
              }}
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
