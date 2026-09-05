// Auth State & Session Management
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  setUser(user) {
    this.currentUser = user;
    this.notify();
    this.updateNavbarUI();
  }

  async init() {
    const token = API.getToken();
    if (token) {
      try {
        const res = await API.getMe();
        if (res.success && res.user) {
          this.setUser(res.user);
        } else {
          this.setUser(null);
        }
      } catch (err) {
        console.warn('Auto-login failed:', err.message);
        this.setUser(null);
      }
    } else {
      this.setUser(null);
    }
  }

  async login(username, password) {
    const res = await API.login(username, password);
    if (res.success && res.token) {
      API.setToken(res.token);
      this.setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'เข้าสู่ระบบล้มเหลว');
  }

  async register(data) {
    const res = await API.register(data);
    if (res.success && res.token) {
      API.setToken(res.token);
      this.setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'สมัครสมาชิกล้มเหลว');
  }

  logout() {
    API.setToken(null);
    this.setUser(null);
    window.location.hash = '#/';
    if (window.app) window.app.showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  }

  updateNavbarUI() {
    const authActions = document.getElementById('nav-auth-actions');
    const userStatus = document.getElementById('nav-user-status');
    const mobileAvatar = document.getElementById('mobile-nav-avatar');
    const mobileProfileText = document.getElementById('mobile-nav-profile-text');

    if (!authActions || !userStatus) return;

    if (this.currentUser) {
      authActions.style.display = 'none';
      userStatus.style.display = 'flex';

      document.getElementById('nav-user-avatar').innerText = this.currentUser.avatar || '🧙‍♂️';
      document.getElementById('nav-user-name').innerText = this.currentUser.username;
      document.getElementById('nav-user-level').innerText = `LV. ${this.currentUser.level} • ${this.currentUser.rank_tier}`;

      if (mobileAvatar) mobileAvatar.innerText = this.currentUser.avatar || '🧙‍♂️';
      if (mobileProfileText) mobileProfileText.innerText = 'โปรไฟล์';

      // Admin link if applicable
      const adminNav = document.getElementById('nav-admin-link');
      if (adminNav) {
        adminNav.style.display = (this.currentUser.role === 'admin' || this.currentUser.role === 'moderator') ? 'flex' : 'none';
      }
    } else {
      authActions.style.display = 'flex';
      userStatus.style.display = 'none';
      if (mobileAvatar) mobileAvatar.innerText = '👤';
      if (mobileProfileText) mobileProfileText.innerText = 'ล็อกอิน';
      const adminNav = document.getElementById('nav-admin-link');
      if (adminNav) adminNav.style.display = 'none';
    }
  }
}

window.auth = new AuthManager();
