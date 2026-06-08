import { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, startOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Cake, Flower2, Wine, Briefcase, PersonStanding, Sparkles } from 'lucide-react';

const EVENT_TYPE_ICONS = {
  'Birthday': Cake,
  'Bridal Shower': Flower2,
  'Bachelorette Party': Wine,
  'Corporate Wellness Event': Briefcase,
  'Private Class': PersonStanding,
  'Other': Sparkles,
};

const STATUS_COLORS = {
  'New':                 '#ec4899',
  'In Conversations':    '#f59e0b',
  'Pending':             '#f59e0b',
  'Waiting for Payment': '#f97316',
  'Confirmed':           '#0ea5e9',
  'Hosted':              '#a855f7',
  'Closed':              '#6b7280',
  'Cancelled':           '#6b7280',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ requests, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const today = startOfDay(new Date());

  const getEventsForDay = (day) =>
    requests.filter(r => r.event_date && isSameDay(new Date(r.event_date + 'T12:00:00'), day));

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.65)',
      boxShadow: '0 4px 20px rgba(241,136,155,0.1)',
    }}>
      {/* Month nav */}
      <div className="flex items-center justify-between px-5 py-4" style={{borderBottom: '1px solid rgba(247,177,189,0.3)', background: 'rgba(251,224,226,0.2)'}}>
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-pink-100/50 transition-colors">
          <ChevronLeft className="w-4 h-4" style={{color: '#b67651'}} />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentMonth(new Date())}
            className="text-xs rounded-full px-3 py-1 font-medium"
            style={{color: '#f1889b', border: '1px solid #f7b1bd', background: 'rgba(251,224,226,0.4)'}}>
            Today
          </button>
          <h3 className="text-sm font-bold w-36 text-center" style={{color: '#7a4a3a'}}>
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-pink-100/50 transition-colors">
          <ChevronRight className="w-4 h-4" style={{color: '#b67651'}} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7" style={{borderBottom: '1px solid rgba(247,177,189,0.25)'}}>
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold py-2 uppercase tracking-widest" style={{color: '#c48a96'}}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const isPast = startOfDay(day) < today;

          return (
            <div
              key={idx}
              className="min-h-[90px] p-2 transition-colors"
              style={{
                borderRight: '1px solid rgba(247,177,189,0.2)',
                borderBottom: '1px solid rgba(247,177,189,0.2)',
                opacity: isCurrentMonth ? 1 : 0.35,
                background: isToday ? 'rgba(241,136,155,0.06)' : isPast ? 'rgba(245,240,242,0.3)' : 'transparent',
              }}
            >
              <div
                className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1"
                style={isToday
                  ? {background: '#f1889b', color: 'white'}
                  : {color: isCurrentMonth ? '#6b4e4e' : '#d4b8bb'}}
              >
                {format(day, 'd')}
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(r => {
                  const Icon = EVENT_TYPE_ICONS[r.event_type] || Sparkles;
                  const color = STATUS_COLORS[r.status] || STATUS_COLORS['New'];
                  return (
                    <button
                      key={r.id}
                      onClick={() => onSelect(r)}
                      className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-left transition-opacity hover:opacity-80"
                      style={{background: `${color}22`, border: `1px solid ${color}44`}}
                    >
                      <Icon className="w-2.5 h-2.5 flex-shrink-0" style={{color}} />
                      <span className="text-xs truncate font-medium" style={{color: '#6b4e4e', fontSize: '10px'}}>
                        {r.full_name}
                      </span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <p className="text-xs pl-1" style={{color: '#c48a96', fontSize: '10px'}}>+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 flex flex-wrap gap-3 justify-end" style={{borderTop: '1px solid rgba(247,177,189,0.15)', background: 'rgba(251,224,226,0.05)'}}>
        {Object.entries(STATUS_COLORS).filter(([status]) => !['Pending', 'Cancelled'].includes(status)).map(([status, color]) => (
          <div key={status} className="legend-item flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background: color}}></div>
            <span className="text-xs font-medium" style={{color: '#7a5555'}}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}