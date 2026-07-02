const USERS_KEY = 'planam_users'
const SESSION_KEY = 'planam_session'

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}
function getSession() {
  const s = localStorage.getItem(SESSION_KEY)
  return s ? JSON.parse(s) : null
}

const AuthService = {
  signup({ name, email, password }) {
    const users = getUsers()
    if (users.find(u => u.email === email)) {
      return { ok: false, error: 'Email already registered' }
    }
    const user = {
      id: 'usr-' + Date.now(),
      name,
      email,
      password,
      avatar: null,
      createdAt: new Date().toISOString(),
    }
    users.push(user)
    saveUsers(users)
    const session = { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return { ok: true, user: session }
  },

  login({ email, password }) {
    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)
    if (!user) return { ok: false, error: 'Invalid email or password' }
    const session = { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return { ok: true, user: session }
  },

  logout() {
    localStorage.removeItem(SESSION_KEY)
  },

  getCurrentUser() {
    return getSession()
  },

  updateProfile(updates) {
    const session = getSession()
    if (!session) return null
    const users = getUsers()
    const idx = users.findIndex(u => u.id === session.id)
    if (idx === -1) return null
    Object.assign(users[idx], updates)
    saveUsers(users)
    const updated = { id: users[idx].id, name: users[idx].name, email: users[idx].email, avatar: users[idx].avatar }
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
    return updated
  },
}

export default AuthService
