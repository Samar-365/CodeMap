// Task Service communicating with /api/tasks
export async function fetchTasks() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/tasks', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function createTask(taskData) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });
  return response.json();
}

export async function completeTask(taskId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/tasks/${taskId}/complete`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}
