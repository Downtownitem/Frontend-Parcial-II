const API_URL = 'https://dummyjson.com/c/28e8-a101-4223-a35c';

let currentUser = null;
let userTodos = [];
let apiTodos = [];
let editingTodoId = null;

const logoutBtn = document.getElementById('logoutBtn');
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoError = document.getElementById('todoError');
const userTodoList = document.getElementById('userTodoList');

function showError(element, message) {
  element.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
  element.classList.remove('hidden');
  setTimeout(() => element.classList.add('hidden'), 5000);
}

function saveToLocalStorage() {
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  localStorage.setItem('userTodos', JSON.stringify(userTodos));
}

function loadFromLocalStorage() {
  const savedUser = localStorage.getItem('currentUser');
  const savedTodos = localStorage.getItem('userTodos');

  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }
  if (savedTodos) {
    userTodos = JSON.parse(savedTodos);
  }
}

function generateId() {
  return Date.now() + Math.random();
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function validateTodoText(text, excludeId = null) {
  if (!text || text.trim() === '') {
    return 'El texto de la tarea no puede estar vacío';
  }

  if (text.trim().length < 10) {
    return 'El texto debe tener al menos 10 caracteres';
  }

  if (/^\d+$/.test(text.trim())) {
    return 'El texto no puede contener solo números';
  }

  const isDuplicate = userTodos.some(
    (todo) => todo.text.toLowerCase() === text.trim().toLowerCase() && todo.id !== excludeId
  );

  if (isDuplicate) {
    return 'Ya existe una tarea con este texto';
  }

  return null;
}

function checkAuthStatus() {
  if (!currentUser) {
    window.location.href = 'login.html';
  }
}

function logout() {
  currentUser = null;
  userTodos = [];
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userTodos');
  window.location.href = 'login.html';
}

function createTodo(text) {
  const error = validateTodoText(text);
  if (error) {
    showError(todoError, error);
    return false;
  }

  const todo = {
    id: generateId(),
    text: text.trim(),
    done: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  userTodos.unshift(todo);
  saveToLocalStorage();
  renderUserTodos();
  return true;
}

function updateTodo(id, updates) {
  const todoIndex = userTodos.findIndex((todo) => todo.id === id);
  if (todoIndex === -1) return false;

  if (updates.text !== undefined) {
    const error = validateTodoText(updates.text, id);
    if (error) {
      showError(todoError, error);
      return false;
    }
    updates.text = updates.text.trim();
  }

  userTodos[todoIndex] = {
    ...userTodos[todoIndex],
    ...updates,
    updatedAt: Date.now(),
  };

  saveToLocalStorage();
  renderUserTodos();
  return true;
}

function deleteTodo(id) {
  userTodos = userTodos.filter((todo) => todo.id !== id);
  saveToLocalStorage();
  renderUserTodos();
}

function toggleTodo(id) {
  const todo = userTodos.find((todo) => todo.id === id);
  if (todo) {
    updateTodo(id, { done: !todo.done });
  }
}

function renderUserTodos() {
  const allTodos = [...userTodos, ...apiTodos];

  if (allTodos.length === 0) {
    userTodoList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <div>No tienes tareas creadas aún</div>
            <small>¡Comienza agregando tu primera tarea!</small>
        </div>
    `;
    return;
  }

  const sortedTodos = allTodos.sort((a, b) => b.createdAt - a.createdAt);
  userTodoList.innerHTML = sortedTodos
    .map((todo) => {
      const isUserTodo = userTodos.some((userTodo) => userTodo.id === todo.id);
      return createTodoElement(todo, isUserTodo);
    })
    .join('');
}

function createTodoElement(todo, isEditable) {
  const isEditing = editingTodoId === todo.id;

  return `
      <article class="todo-item ${todo.done ? 'done' : ''}">
          <div class="todo-content">
              <input type="checkbox" class="todo-checkbox" 
                      ${todo.done ? 'checked' : ''} 
                      ${isEditable ? `onchange="toggleTodo(${todo.id})"` : 'disabled'}>
              <div style="flex: 1;">
                  ${
                    isEditing
                      ? `<input type="text" value="${todo.text}" id="editInput-${todo.id}" class="edit-input">`
                      : `<div class="todo-text">${todo.text}</div>`
                  }
                  <div class="todo-meta">
                      <i class="fas fa-calendar-plus"></i> Creada: ${formatDate(
                        todo.createdAt
                      )}
                      ${
                        todo.updatedAt !== todo.createdAt
                          ? `<br><i class="fas fa-edit"></i> Actualizada: ${formatDate(
                              todo.updatedAt
                            )}`
                          : ''
                      }
                      ${
                        !isEditable
                          ? '<br><i class="fas fa-cloud"></i> Tarea de ejemplo'
                          : ''
                      }
                  </div>
              </div>
          </div>
          ${
            isEditable
              ? `
              <div class="todo-actions">
                  ${
                    isEditing
                      ? `<button onclick="saveEdit(${todo.id})" class="save-btn">
                          <i class="fas fa-save"></i> Guardar
                        </button>
                        <button onclick="cancelEdit()" class="cancel-btn">
                          <i class="fas fa-times"></i> Cancelar
                        </button>`
                      : `<button onclick="startEdit(${todo.id})" class="edit-btn">
                          <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="deleteTodo(${todo.id})" class="delete-btn">
                          <i class="fas fa-trash"></i> Eliminar
                        </button>`
                  }
              </div>
          `
              : ''
          }
      </article>
  `;
}

function startEdit(id) {
  editingTodoId = id;
  renderUserTodos();
  setTimeout(() => {
    const input = document.getElementById(`editInput-${id}`);
    if (input) {
      input.focus();
      input.select();
    }
  }, 50);
}

function saveEdit(id) {
  const input = document.getElementById(`editInput-${id}`);
  if (input) {
    const newText = input.value;
    if (updateTodo(id, { text: newText })) {
      editingTodoId = null;
      renderUserTodos();
    }
  }
}

function cancelEdit() {
  editingTodoId = null;
  renderUserTodos();
}

async function loadApiTodos() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Error al cargar datos de la API');
    }
    const data = await response.json();
    apiTodos = Array.isArray(data) ? data : [];
    renderUserTodos();
  } catch (error) {
    console.error('Error loading API todos:', error);
    renderUserTodos();
  }
}

logoutBtn.addEventListener('click', logout);

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = todoInput.value;

  if (createTodo(text)) {
    todoInput.value = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editingTodoId) {
    cancelEdit();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  checkAuthStatus();
  loadApiTodos();
  renderUserTodos();
  setTimeout(() => todoInput.focus(), 100);
});
