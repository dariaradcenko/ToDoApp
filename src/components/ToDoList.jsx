import { useState, useEffect } from "react";
import ToDoItem from "./ToDoItem";
import { fetchTodos, setTodoDone, deleteTodo } from "../services/todoServices";

export default function ToDoList({ listTitle, listId, refreshEvent }) {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    if (refreshEvent && refreshEvent.listId !== listId) {
      return;
    }

    let isCurrent = true;
    async function load() {
      const result = await fetchTodos(listId);
      if (isCurrent) {
        setTodos(result);
      }
    }
    load();
    return () => {
      isCurrent = false;
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

  return (
    <div className="todo-body">
      <h1>{listTitle}</h1>

      {todos.length === 0 ? (
        <p>Nothing to do. Enjoy your day!</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <ToDoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
