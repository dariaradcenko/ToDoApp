export default function ToDoItem({ todo, onToggle, onRemove }) {
  return (
    <li
      className={`tasks-page__item${todo.done ? " tasks-page__item--done" : ""}`}
    >
      <input
        className="tasks-page__checkbox"
        type="checkbox"
        checked={Boolean(todo.done)}
        onChange={() => onToggle(todo.id)}
        disabled={!todo.canWrite}
        aria-label={`Mark ${todo.text} ${todo.done ? "incomplete" : "complete"}`}
      />
      <div className="tasks-page__item-content">
        <span className="tasks-page__item-text">{todo.text}</span>
        <div className="tasks-page__item-meta">
          {todo.prio && (
            <span
              className={`tasks-page__priority tasks-page__priority--${todo.prio}`}
            >
              {todo.prio} priority
            </span>
          )}
          {todo.date && (
            <span className="tasks-page__item-date">
              Due {formatTaskDate(todo.date)}
            </span>
          )}
        </div>
      </div>
      {todo.canWrite && (
        <button
          className="tasks-page__remove-button"
          type="button"
          onClick={() => onRemove(todo.id)}
          aria-label={`Delete ${todo.text}`}
          title="Delete task"
        >
          ×
        </button>
      )}
    </li>
  );
}
