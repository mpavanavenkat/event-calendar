import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  addWeeks,
  addMonths,
  isEqual,
  startOfDay,
  differenceInDays
} from "date-fns";
import { enUS } from "date-fns/locale";
import EventForm from "./components/EventForm";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);
const STORAGE_KEY = "calendar_events";

function App() {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const revived = parsed.map(ev => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end),
        }));
        setEvents(revived);
      }
    } catch (err) {
      console.error("Failed to load events from localStorage:", err);
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      console.error("Failed to save events to localStorage:", err);
    }
  }, [events]);

  const expandRecurringEvent = (event) => {
    const occurrences = [];
    const { recurrence, start, end, recurrenceDays = [], recurrenceInterval = 1 } = event; 
    const maxOccurrences = 50;

    if (!recurrence || recurrence === "none") return [event];

    let currentStart = new Date(start);
    let currentEnd = new Date(end);
    const durationDays = differenceInDays(currentEnd, currentStart);

    if (recurrence === "daily") {
      for (let i = 0; i < maxOccurrences; i++) {
        occurrences.push({ ...event, start: new Date(currentStart), end: addDays(currentStart, durationDays), isRecurring: true });
        currentStart = addDays(currentStart, 1);
      }
    } 
    else if (recurrence === "weekly") {
      let weekStart = startOfWeek(currentStart, { weekStartsOn: 1 });
      let count = 0;
      while (count < maxOccurrences) {
        for (let day of recurrenceDays) {
          const eventDay = addDays(weekStart, day);
          if (eventDay >= start) {
            occurrences.push({
              ...event,
              start: eventDay,
              end: addDays(eventDay, durationDays),
              isRecurring: true,
            });
            count++;
            if (count >= maxOccurrences) break;
          }
        }
        weekStart = addWeeks(weekStart, recurrenceInterval);
      }
    } 
    else if (recurrence === "monthly") {
      for (let i = 0; i < maxOccurrences; i++) {
        occurrences.push({ ...event, start: new Date(currentStart), end: addDays(currentStart, durationDays), isRecurring: true });
        currentStart = addMonths(currentStart, recurrenceInterval);
      }
    }
    else if (recurrence === "custom") {
      for (let i = 0; i < maxOccurrences; i++) {
        occurrences.push({ ...event, start: new Date(currentStart), end: addDays(currentStart, durationDays), isRecurring: true });
        currentStart = addWeeks(currentStart, recurrenceInterval);
      }
    } else {
      return [event];
    }

    return occurrences;
  };

  const getAllEvents = () => {
    const expanded = events.flatMap(event => expandRecurringEvent(event));
    return expanded.filter(ev =>
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const hasConflict = (newEvent) => {
    return getAllEvents().some(ev => {
      return (
        !isEqual(ev.id, newEvent.id) &&
        ev.start < newEvent.end &&
        newEvent.start < ev.end
      );
    });
  };

  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo.start);
    setEditingEvent(null);
  };

  const handleSelectEvent = (event) => {
    setEditingEvent(event);
    setSelectedSlot(null);
  };

  const handleSaveEvent = (eventData) => {
    if (hasConflict(eventData)) {
      alert("Event conflict detected. Please choose a different time.");
      return;
    }

    if (editingEvent) {
      setEvents(events.map(ev => (ev.id === editingEvent.id ? eventData : ev)));
    } else {
      setEvents([...events, { ...eventData, id: Date.now() }]);
    }
    setSelectedSlot(null);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter(ev => ev.id !== id));
    setEditingEvent(null);
  };

  const handleNavigate = (date) => {
    setCurrentDate(date);
  };

  const moveEvent = ({ event, start, end }) => {
    const updatedEvent = { ...event, start, end };
    if (hasConflict(updatedEvent)) {
      alert("Event conflict detected. Please choose a different time.");
      return;
    }
    setEvents(events.map(ev => (ev.id === event.id ? updatedEvent : ev)));
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Event Calendar</h1>

      <input
        type="text"
        placeholder="Search events..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 p-2 border rounded w-full"
      />

      <DnDCalendar
        localizer={localizer}
        events={getAllEvents()}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        defaultView="month"
        views={[Views.MONTH]}
        date={currentDate}
        onNavigate={handleNavigate}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={moveEvent}
        popup
      />

      {(selectedSlot || editingEvent) && (
        <EventForm
          defaultDate={selectedSlot}
          event={editingEvent}
          onSave={handleSaveEvent}
          onCancel={() => {
            setSelectedSlot(null);
            setEditingEvent(null);
          }}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}

export default App;