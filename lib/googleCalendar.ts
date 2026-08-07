// Builds a "Add to Google Calendar" deep link — no OAuth/API credentials
// needed, the therapist just taps it and saves the pre-filled event.
export function buildGoogleCalendarLink(params: {
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}) {
  const { title, description, location, date, startTime, endTime } = params;
  const toCompact = (d: string, t: string) => `${d.replace(/-/g, "")}T${t.replace(":", "")}00`;
  const dates = `${toCompact(date, startTime)}/${toCompact(date, endTime)}`;

  const qs = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details: description,
    location,
  });

  return `https://calendar.google.com/calendar/render?${qs.toString()}`;
}
