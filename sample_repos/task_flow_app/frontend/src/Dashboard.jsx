import React, { useEffect, useState } from 'react';
import { fetchTasks, createTask, completeTask } from './services/taskService';

export function Dashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const data = await fetchTasks();
    setTasks(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newTask = await createTask({ title, userId: user.id });
    setTasks([...tasks, newTask]);
    setTitle('');
  };

  return (
    <div className="dashboard-container">
      <h1>Task Dashboard</h1>
      <form onSubmit={handleCreate}>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="New task title..." 
        />
        <button type="submit">Add Task</button>
      </form>
      <ul className="task-list">
        {tasks.map(t => (
          <li key={t.id} className={t.completed ? 'done' : ''}>
            <span>{t.title}</span>
            <button onClick={() => completeTask(t.id)}>Done</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
