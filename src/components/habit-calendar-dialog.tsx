import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame } from 'lucide-react';
import { HabitDayStatus, getHabitDayStatus, getHabitDoneSet } from '@/lib/habit-status';
import { HabitShareHabit } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';

interface HabitCalendarDialogProps {
  habit: HabitShareHabit | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  onSetDayStatus?: (habitId: string, dateStr: string, status: HabitDayStatus) => void;
}

export function HabitCalendarDialog({ habit, isOpen, onClose, canEdit = false, onSetDayStatus }: HabitCalendarDialogProps) {
  const [viewDate, setViewDate] = React.useState<Date>(new Date());
  const [statusPickerDate, setStatusPickerDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setViewDate(new Date());
      setStatusPickerDate(null);
    }
  }, [isOpen, habit?.id]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const doneCount = React.useMemo(() => getHabitDoneSet(habit?.checkIns || []).size, [habit?.checkIns]);

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[88dvh] w-[95vw] overflow-y-auto rounded-3xl border-none p-0 pb-[max(env(safe-area-inset-bottom),12px)] shadow-2xl sm:max-w-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        {!habit ? (
          <DialogHeader><DialogTitle className="sr-only">Loading habit details</DialogTitle><DialogDescription className="sr-only">Please wait while the habit loads.</DialogDescription></DialogHeader>
        ) : (
          <>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white pb-10 relative">
               <DialogHeader>
                 <DialogTitle className="text-2xl font-black text-white flex items-center justify-between shadow-sm">
                   <span className="flex-1 truncate pr-4">{habit.name}</span>
                   <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm shrink-0">
                      <Flame className="h-4 w-4 text-orange-300" fill="currentColor" />
                      <span>{doneCount} done</span>
                    </div>
                  </DialogTitle>
                 <DialogDescription className="sr-only">Monthly Calendar for {habit.name}</DialogDescription>
               </DialogHeader>
               {habit.description && <p className="text-indigo-100 text-sm mt-1 mb-2">{habit.description}</p>}
            </div>

            <div className="px-6 pb-6 bg-white -mt-6 rounded-t-3xl relative z-10">
               <div className="flex items-center justify-between py-4">
                 <Button variant="outline" size="icon" onClick={() => setViewDate(subMonths(viewDate, 1))} className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                    <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <div className="font-bold text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-indigo-500" />
                    {format(viewDate, 'MMMM yyyy')}
                 </div>
                 <Button variant="outline" size="icon" onClick={() => setViewDate(addMonths(viewDate, 1))} className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                    <ChevronRight className="h-4 w-4" />
                 </Button>
               </div>

                <div className="grid grid-cols-7 gap-y-2 gap-x-1 mb-2">
                 {weekDays.map(day => (
                   <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                     {day}
                   </div>
                 ))}
                 
                 {Array.from({ length: startDayOfWeek }).map((_, i) => (
                   <div key={`empty-${i}`} className="h-10 w-full" />
                 ))}
                 
                   {daysInMonth.map((day) => {
                     const dateStr = format(day, 'yyyy-MM-dd');
                     const dayStatus = getHabitDayStatus(habit.checkIns, dateStr);
                     const isFuture = dateStr > format(new Date(), 'yyyy-MM-dd');
                    
                    return (
                      <div key={dateStr} className="flex justify-center items-center">
                         <button
                           type="button"
                           onClick={() => {
                              if (!canEdit || !onSetDayStatus || isFuture) return;
                            setStatusPickerDate(dateStr);
                           }}
                          disabled={!canEdit || isFuture}
                           className={`h-10 w-10 flex items-center justify-center rounded-2xl text-sm font-semibold transition-all ${
                             dayStatus === 'done'
                             ? 'bg-gradient-to-tr from-green-400 to-green-500 text-white shadow-md shadow-green-500/30 ring-2 ring-green-100 ring-offset-1 ring-offset-white' 
                             : dayStatus === 'skipped'
                               ? 'bg-slate-300 text-slate-700 ring-1 ring-slate-400'
                             : isFuture
                               ? 'bg-white text-slate-400 ring-1 ring-slate-200'
                               : 'bg-rose-100 text-rose-500 hover:bg-rose-200'
                           } ${!canEdit || isFuture ? 'cursor-default opacity-80' : ''}`}
                           title={dateStr}
                          >
                           {dayStatus === 'none' && !isFuture ? (
                             <span className="text-2xl font-black leading-none">×</span>
                           ) : (
                             format(day, 'd')
                           )}
                         </button>
                       </div>
                     );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold bg-slate-50 hover:bg-slate-100 w-full hover:text-slate-800">
                    Close Calendar
                  </Button>
                </div>
             </div>

            {canEdit && statusPickerDate && onSetDayStatus ? (
              <div className="absolute inset-0 z-20 flex items-end justify-center bg-slate-900/35 p-4 sm:items-center">
                <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 text-center text-sm font-bold text-slate-700">
                    Choose status for {format(new Date(`${statusPickerDate}T00:00:00`), 'dd MMM yyyy')}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      type="button"
                      className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600"
                      onClick={() => {
                        onSetDayStatus(habit.id, statusPickerDate, 'done');
                        setStatusPickerDate(null);
                      }}
                    >
                      Green (Done)
                    </Button>
                    <Button
                      type="button"
                      className="h-10 rounded-xl bg-rose-500 hover:bg-rose-600"
                      onClick={() => {
                        onSetDayStatus(habit.id, statusPickerDate, 'none');
                        setStatusPickerDate(null);
                      }}
                    >
                      Red (Missed)
                    </Button>
                    <Button
                      type="button"
                      className="h-10 rounded-xl bg-slate-500 hover:bg-slate-600"
                      onClick={() => {
                        onSetDayStatus(habit.id, statusPickerDate, 'skipped');
                        setStatusPickerDate(null);
                      }}
                    >
                      Gray (Skip)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl"
                      onClick={() => setStatusPickerDate(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
