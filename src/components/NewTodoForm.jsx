import { useState } from "react";

export default function NewTodoForm({ onAdd, lists = [] }) {
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [prio, setPrio] = useState("low");
  const [listId, setListId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState([]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!text.trim() || !listId || !date || saving) return;

    setSaving(true);

    try {
      await onAdd(text.trim(), date, prio, listId);

      setText("");
      setDate("");
      setPrio("low");
      setListId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="tasks-page__task-form" onSubmit={handleSubmit}>
      <div className="tasks-page__field tasks-page__field--task">
        <label htmlFor="new-task-text">Task name</label>
        <input
          id="new-task-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Finish literature review"
          required
        />
      </div>
      <div className="tasks-page__field">
        <label htmlFor="new-task-date">Due date</label>
        <input
          id="new-task-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min="2020-01-01"
          max="2050-01-01"
          required
        />
      </div>
      <div className="tasks-page__field">
        <label htmlFor="new-task-priority">Priority</label>
        <select
          id="new-task-priority"
          value={prio}
          onChange={(e) => setPrio(e.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="tasks-page__field">
        <label htmlFor="new-task-list">Add to list</label>
        <select
          id="new-task-list"
          value={listId}
          onChange={(e) => setListId(e.target.value)}
          required
        >
          <option value="">Choose a list</option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
      </div>
      <div className="tasks-page__form-actions">
        <button
          className="tasks-page__primary-button"
          type="submit"
          disabled={!text.trim() || !listId || !date || saving}
        >
          {saving ? "Saving…" : "+ Add task"}
        </button>
      </div>
      {error && (
        <p
          className="tasks-page__error tasks-page__form-error"
          role="alert"
        ></p>
      )}
    </form>
  );
}
