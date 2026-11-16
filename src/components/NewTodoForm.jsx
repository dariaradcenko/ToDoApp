import { useState } from "react";

export default function NewTodoForm({ onAdd, lists = [] }) {
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [prio, setPrio] = useState("low");
  const [listId, setListId] = useState("");
  const [saving, setSaving] = useState(false);

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
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="New task"
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min="2020-01-01"
        max="2050-01-01"
      />

      <label htmlFor="prio">Priority</label>
      <select id="prio" value={prio} onChange={(e) => setPrio(e.target.value)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <label htmlFor="list">List</label>
      <select
        id="list"
        value={listId}
        onChange={(e) => setListId(e.target.value)}
      >
        <option value="">Choose a list</option>

        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name}
          </option>
        ))}
      </select>

      <button
        id="add-btn"
        type="submit"
        disabled={!text.trim() || !listId || !date || saving}
      >
        {saving ? "Saving..." : "Add"}
      </button>
    </form>
  );
}
