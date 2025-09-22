const users = [{ username: 'admin', password: 'admin' }];

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

function showError(element, message) {
  element.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
  element.classList.remove('hidden');
  setTimeout(() => element.classList.add('hidden'), 5000);
}

function login(username, password) {
  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'tasklist.html';
    return true;
  }
  return false;
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!login(username, password)) {
    showError(loginError, 'Usuario o contraseña incorrectos');
  }
});

function checkAuthStatus() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    window.location.href = 'tasklist.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setTimeout(() => document.getElementById('username').focus(), 100);
});
