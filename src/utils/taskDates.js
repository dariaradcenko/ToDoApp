// Date inputs need YYYY-MM-DD. Read local calendar parts so a task does not move
// to yesterday when its stored timestamp is displayed in another time zone.
export function dateInputValue(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatTaskDate(value, options = { month: "short", day: "numeric" }) {
  const day = dateInputValue(value);
  return day ? new Date(`${day}T12:00:00`).toLocaleDateString("en-US", options) : "No due date";
}

// Make both homepage cards from the same task array used by the lists.
// Focus shows the three earliest unfinished tasks (overdue first, undated last).
// Coming up shows unfinished tasks due today through the following six days.
export function getTaskOverview(todos, lists, today = new Date()) {
  const editableLists = new Set(lists.filter((list) => list.type !== "supervisor").map((list) => list.id));
  const tasks = todos.filter((todo) => editableLists.has(todo.listId));
  const openTasks = tasks.filter((todo) => !todo.done).sort((a, b) => {
    const first = dateInputValue(a.date) || "9999-12-31";
    const second = dateInputValue(b.date) || "9999-12-31";
    return first.localeCompare(second) || a.text.localeCompare(b.text);
  });
  const firstDay = dateInputValue(today);
  const end = new Date(today);
  end.setDate(end.getDate() + 7);
  const afterLastDay = dateInputValue(end);
  return {
    tasks,
    openTasks,
    focus: openTasks.slice(0, 3),
    upcoming: openTasks.filter((todo) => {
      const day = dateInputValue(todo.date);
      return day && day >= firstDay && day < afterLastDay;
    }).slice(0, 3),
  };
}
