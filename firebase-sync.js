// ==========================================
// 🔥 Firebase Cloud Sync Manager
// ==========================================

class CloudAuthManager {
  constructor() {
    this.currentUser = null;
    this.users = [];
    this.isOnline = navigator.onLine;
    this.syncEnabled = true;
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.goOnline());
    window.addEventListener('offline', () => this.goOffline());
    
    if (this.syncEnabled) {
      this.initCloudSync();
    }
  }

  // Initialize Cloud Sync
  initCloudSync() {
    if (!window.firebase || !window.firebase.database) {
      console.error('❌ Firebase not loaded. Check HTML script tags.');
      return;
    }

    const database = firebase.database();

    // 👥 Real-time users list
    database.ref('users').on('value', (snapshot) => {
      if (snapshot.exists()) {
        const usersObj = snapshot.val();
        this.users = Object.values(usersObj);
        console.log('✅ Users synced from Firebase:', this.users.length);
        if (window.app) app.updateUserUI();
        if (window.app) app.renderLeaderboard();
      }
    }, (error) => {
      console.error('❌ Error loading users:', error);
    });

    // 👤 Monitor current user changes
    const savedUserId = localStorage.getItem('omni_user_id');
    if (savedUserId) {
      database.ref('users/' + savedUserId).on('value', (snapshot) => {
        if (snapshot.exists()) {
          this.currentUser = snapshot.val();
          localStorage.setItem('omni_user', JSON.stringify(this.currentUser));
          console.log('✅ Current user synced:', this.currentUser.username);
          if (window.app) app.updateUserUI();
        }
      });
    }
  }

  // Go Online
  goOnline() {
    this.isOnline = true;
    if (window.app) app.showToast('🟢 เชื่อมต่อเซิร์ฟเวอร์สำเร็จ');
    console.log('🟢 Online mode');
    this.syncToCloud();
  }

  // Go Offline
  goOffline() {
    this.isOnline = false;
    if (window.app) app.showToast('🔴 โหมดออฟไลน์ - ข้อมูลจะซิงค์เมื่อกลับมาออนไลน์');
    console.log('🔴 Offline mode');
  }

  // Sync to Cloud
  syncToCloud() {
    if (!this.currentUser || !this.isOnline) return;
    
    const database = firebase.database();
    database.ref('users/' + this.currentUser.id).set(this.currentUser)
      .then(() => console.log('✅ User data synced to cloud'))
      .catch((err) => console.error('❌ Sync error:', err));
  }

  // Login
  async login(username, password) {
    const database = firebase.database();
    const trimmedName = (username || '').trim();

    try {
      const snapshot = await database.ref('users')
        .orderByChild('username')
        .equalTo(trimmedName)
        .once('value');

      if (!snapshot.exists()) {
        if (window.app) app.showToast('❌ ไม่พบชื่อผู้ใช้นี้');
        return;
      }

      const userData = snapshot.val();
      const userId = Object.keys(userData)[0];
      const user = userData[userId];

      if (user.password !== password) {
        if (window.app) app.showToast('❌ รหัสผ่านไม่ถูกต้อง');
        return;
      }

      // Login Success
      this.currentUser = user;
      localStorage.setItem('omni_user', JSON.stringify(user));
      localStorage.setItem('omni_user_id', user.id);

      if (window.app) {
        app.closeModal('modal-login');
        app.updateUserUI();
        app.showToast(`✅ ยินดีต้อนรับ ${user.username}!`);
        app.handleRoute();
      }

      console.log('✅ Login success:', user.username);
    } catch (error) {
      console.error('❌ Login error:', error);
      if (window.app) app.showToast('❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  }

  // Register
  async register(username, avatar, password) {
    const database = firebase.database();
    const trimmedName = (username || '').trim() || 'Seeker';

    if (!password || password.length < 6) {
      if (window.app) app.showToast('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      // Check if username exists
      const snapshot = await database.ref('users')
        .orderByChild('username')
        .equalTo(trimmedName)
        .once('value');

      if (snapshot.exists()) {
        if (window.app) app.showToast('❌ ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว');
        return;
      }

      // Create new user
      const newUserId = database.ref('users').push().key;
      const newUser = {
        id: newUserId,
        username: trimmedName,
        password: password, // ⚠️ In production, hash this!
        role: 'user',
        xp: 0,
        level: 1,
        rank: 'Bronze Novice',
        avatar: avatar || '🧙‍♂️',
        registeredAt: new Date().toISOString(),
        devices: [navigator.userAgent]
      };

      // Save to Firebase
      await database.ref('users/' + newUserId).set(newUser);

      // Update local state
      this.currentUser = newUser;
      localStorage.setItem('omni_user', JSON.stringify(newUser));
      localStorage.setItem('omni_user_id', newUserId);

      if (window.app) {
        app.closeModal('modal-register');
        app.updateUserUI();
        app.showToast(`✅ สร้างตัวละครสำเร็จ! ยินดีต้อนรับ ${trimmedName}`);
        app.navigate('#/profile');
      }

      console.log('✅ Registration success:', trimmedName);
    } catch (error) {
      console.error('❌ Registration error:', error);
      if (window.app) app.showToast('❌ เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  }

  // Update User XP (with cloud sync)
  async updateUserXP(xpGain) {
    if (!this.currentUser) return;

    this.currentUser.xp += xpGain;
    this.currentUser.level = Math.floor(Math.sqrt(this.currentUser.xp / 25)) + 1;
    this.currentUser.rank = this.getRankForXp(this.currentUser.xp);

    // Update local storage
    localStorage.setItem('omni_user', JSON.stringify(this.currentUser));

    // Sync to cloud if online
    if (this.isOnline) {
      const database = firebase.database();
      try {
        await database.ref('users/' + this.currentUser.id).update({
          xp: this.currentUser.xp,
          level: this.currentUser.level,
          rank: this.currentUser.rank
        });
        console.log('✅ XP synced:', xpGain);
      } catch (error) {
        console.error('❌ XP sync error:', error);
      }
    }
  }

  // Get rank based on XP
  getRankForXp(xp) {
    if (xp >= 1500) return 'Omniscient Sage';
    if (xp >= 600) return 'Platinum Expert';
    if (xp >= 300) return 'Gold Adept';
    if (xp >= 150) return 'Silver Apprentice';
    return 'Bronze Novice';
  }

  // Logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('omni_user');
    localStorage.removeItem('omni_user_id');

    if (window.app) {
      app.updateUserUI();
      app.showToast('👋 ออกจากระบบเรียบร้อยแล้ว');
      app.renderHome();
    }

    console.log('✅ Logout success');
  }
}

// Initialize after Firebase loads
if (window.firebase) {
  const cloudAuth = new CloudAuthManager();
  // Replace window.auth with cloudAuth (if using in your HTML)
}
