import { useState, useEffect } from "react";
import ToDoItem from "./ToDoItem";
import { fetchTodos, setTodoDone, deleteTodo } from "../services/todoServices";

export default function ToDoList({
  listTitle,
  listId,
  listType,
  refreshEvent,
}) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (refreshEvent && refreshEvent.listId !== listId) return;

    let active = true;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchTodos(listId);
        if (active) setTodos(result);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [listId, refreshEvent]);

  async function handleToggle(id) {
    const todo = todos.find((t) => t.id === id);
    await setTodoDone(id, !todo.done);
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  async function handleRemove(id) {
    await deleteTodo(id);
    setTodos(todos.filter((todo) => todo.id !== id));
  }

  const completed = todos.filter((todo) => todo.done).length;
  const description =
    listType === "private"
      ? "Only visible to you"
      : "Collaborate on tasks with your thesis group";

  return (
    <div className="tasks-page__todo-list">
      <div className="tasks-page__list-heading">
        <div>
          <span
            className={`tasks-page__list-kind tasks-page__list-kind--${listType}`}
          >
            {listType === "private" ? "PERSONAL" : "SHARED"}
          </span>
          <h2>{listTitle}</h2>
          <p>{description}</p>
        </div>
        <span className="tasks-page__count">
          {todos.length} {todos.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {error && (
        <p className="task-page-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="tasks-page__empty">Loading tasks…</p>
      ) : todos.length === 0 ? (
        <div className="tasks-page__empty">
          <span className="tasks-page__empty-icon" aria-hidden="true">
            ✓
          </span>
          <p>No tasks yet</p>
          <small>Use the form above to add your first task.</small>
        </div>
      ) : (
        <>
          <ul className="tasks-page__items">
            {todos.map((todo) => (
              <ToDoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onRemove={handleRemove}
              />
            ))}
          </ul>
          <p className="tasks-page__progress">
            {completed} of {todos.length} completed
          </p>
        </>
      )}
    </div>
  );
}
