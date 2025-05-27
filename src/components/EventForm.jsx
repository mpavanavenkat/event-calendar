import { useState } from "react";

const recurrenceOptions = ["None", "Daily", "Weekly", "Monthly"];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper to convert Date to local datetime-local input value string
const toLocalDateTimeInputValue = (date) => {
  if (!date) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const EventForm = ({ defaultDate, event, onSave, onCancel, onDelete }) => {
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [start, setStart] = useState(event?.start || defaultDate);
  const [end, setEnd] = useState(event?.end || defaultDate);
  const [recurrence, setRecurrence] = useState(event?.recurrence || "None");
  const [recurrenceInterval, setRecurrenceInterval] = useState(event?.recurrenceInterval || 1);
  const [recurrenceDays, setRecurrenceDays] = useState(event?.recurrenceDays || []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (new Date(end) <= new Date(start)) {
      alert("End time must be after start time");
      return;
    }

    onSave({
      id: event?.id || Date.now(),
      title,
      description,
      start: new Date(start),
      end: new Date(end),
      recurrence,
      recurrenceInterval,
      recurrenceDays: recurrence === "Weekly" ? recurrenceDays : [],
    });
  };

  const handleWeekdayToggle = (dayIndex) => {
    setRecurrenceDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-[400px]">
        <h2 className="text-xl font-semibold mb-4">{event ? "Edit" : "Add"} Event</h2>
        <input
          className="w-full border p-2 mb-2"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border p-2 mb-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="block mb-1">Start Time:</label>
        <input
          type="datetime-local"
          className="w-full border p-2 mb-2"
          value={toLocalDateTimeInputValue(start)}
          onChange={(e) => setStart(new Date(e.target.value))}
        />
        <label className="block mb-1">End Time:</label>
        <input
          type="datetime-local"
          className="w-full border p-2 mb-2"
          value={toLocalDateTimeInputValue(end)}
          onChange={(e) => setEnd(new Date(e.target.value))}
        />

        <label className="block mb-1">Recurrence:</label>
        <select
          className="w-full border p-2 mb-2"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
        >
          {recurrenceOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {recurrence !== "None" && (
          <>
            <label className="block mb-1">Repeat every:</label>
            <input
              type="number"
              min="1"
              className="w-full border p-2 mb-2"
              value={recurrenceInterval}
              onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
            />
          </>
        )}

        {recurrence === "Weekly" && (
          <div className="mb-2">
            <label className="block mb-1">Repeat on:</label>
            <div className="flex flex-wrap gap-2">
              {weekdays.map((day, index) => (
                <label key={index} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={recurrenceDays.includes(index)}
                    onChange={() => handleWeekdayToggle(index)}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
            Save
          </button>
          <button className="bg-gray-400 text-white px-4 py-2 rounded" type="button" onClick={onCancel}>
            Cancel
          </button>
          {event && (
            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              type="button"
              onClick={() => onDelete(event.id)}
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EventForm;
