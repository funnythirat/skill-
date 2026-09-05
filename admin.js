// OmniVerse Admin & Support Backoffice Controller
class AdminPortal {
  constructor() {
    this.currentTab = 'overview';
    this.activeTicketId = null;
  }

  async init() {
    await window.auth.init();

    const user = window.auth.currentUser;
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      this.renderLoginRequired();
      return;
    }

    this.renderDashboard();
  }

  renderLoginRequired() {
    const main = document.getElementById('admin-content-area');
    main.innerHTML = `
      <div style="max-width: 450px; margin: 5rem auto; background: var(--admin-card-bg); border: 1px solid var(--admin-border); border-radius: 16px; padding: 2.5rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🛡️</div>
        <h2 style="color: #fff; margin-bottom: 0.5rem;">ระบบหลังบ้าน (Admin Portal)</h2>
        <p style="color: var(--admin-text-muted); font-size: 0.9rem; margin-bottom: 2rem;">เฉพาะผู้ดูแลระบบหรือเจ้าหน้าที่เท่านั้น</p>
        
        <button class="btn btn-primary" style="width: 100%; margin-bottom: 0.75rem;" onclick="adminPortal.quickAdminLogin()">⚡ ล็อกอินด้วยบัญชี Admin สูงสุด</button>
        <button class="btn btn-outline" style="width: 100%;" onclick="location.href='./index.html'">⬅️ กลับสู่หน้าเว็บหลัก</button>
      </div>
    `;
  }

  async quickAdminLogin() {
    try {
      await window.auth.login('admin', 'admin123');
      location.reload();
    } catch (err) {
      alert('เข้าสู่ระบบไม่สำเร็จ: ' + err.message);
    }
  }

  renderDashboard() {
    this.switchTab('overview');
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    document.querySelectorAll('.admin-menu-item').forEach((item) => {
      if (item.getAttribute('data-tab') === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (tabName === 'overview') this.renderOverview();
    else if (tabName === 'tickets') this.renderTickets();
    else if (tabName === 'users') this.renderUsers();
    else if (tabName === 'curriculum') this.renderCurriculum();
  }

  // =========================================================================
  // 1. Overview & Stats
  // =========================================================================
  async renderOverview() {
    const area = document.getElementById('admin-content-area');
    area.innerHTML = '<div style="text-align: center; padding: 3rem;">กำลังโหลดข้อมูลแดชบอร์ด...</div>';

    try {
      const res = await API.admin.getOverview();
      if (!res.success) throw new Error(res.message);

      const { stats, recentTickets, disciplineStats } = res;

      area.innerHTML = `
        <div class="admin-header">
          <div>
            <h1 style="font-size: 1.8rem; color: #fff;">📊 ภาพรวมระบบและสถิติ (System Analytics)</h1>
            <p style="color: var(--admin-text-muted); font-size: 0.9rem;">ติดตามจำนวนผู้เรียน คำร้องแจ้งปัญหา และความก้าวหน้าทั้งระบบ</p>
          </div>
          <div>
            <button class="btn btn-outline" onclick="adminPortal.renderOverview()">🔄 รีเฟรชข้อมูล</button>
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="color: #38bdf8;">👥</div>
            <div>
              <div class="stat-val">${stats.totalUsers}</div>
              <div class="stat-label">ผู้ใช้งานทั้งหมด</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="color: #f87171;">🚨</div>
            <div>
              <div class="stat-val">${stats.openTickets}</div>
              <div class="stat-label">ปัญหาค้างจัดการ (Open)</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="color: #4ade80;">✅</div>
            <div>
              <div class="stat-val">${stats.resolvedTickets}</div>
              <div class="stat-label">ปัญหาที่แก้ไขสำเร็จ</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="color: #fbbf24;">⚔️</div>
            <div>
              <div class="stat-val">${stats.totalAttempts}</div>
              <div class="stat-label">ครั้งที่ทำแบบทดสอบ</div>
            </div>
          </div>
        </div>

        <!-- Two Columns -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <!-- Recent Tickets -->
          <div class="admin-table-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="color: #fff;">📩 ปัญหาที่ได้รับแจ้งล่าสุด</h3>
              <button class="btn btn-outline" style="font-size: 0.8rem; padding: 0.3rem 0.6rem;" onclick="adminPortal.switchTab('tickets')">ดูทั้งหมด</button>
            </div>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ผู้แจ้ง</th>
                  <th>หัวข้อ</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                ${recentTickets.map((t) => `
                  <tr>
                    <td>${t.user_avatar} ${t.user_name}</td>
                    <td><strong style="color: #fff;">${t.subject}</strong></td>
                    <td><span class="status-chip status-${t.status.replace(/\s+/g, '')}">${t.status}</span></td>
                    <td>
                      <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="adminPortal.openTicketDrawer(${t.id})">เปิดดู</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Discipline Stats -->
          <div class="admin-table-container">
            <h3 style="color: #fff; margin-bottom: 1rem;">🌌 ความนิยมของสายวิชา</h3>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>สายวิชา</th>
                  <th>ผู้เรียน (คน)</th>
                  <th>ทำโจทย์สำเร็จ (ครั้ง)</th>
                </tr>
              </thead>
              <tbody>
                ${disciplineStats.map((d) => `
                  <tr>
                    <td>${d.icon} ${d.name_th}</td>
                    <td><strong>${d.unique_learners}</strong></td>
                    <td><strong style="color: ${d.theme_color};">${d.total_completions}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      area.innerHTML = `<div style="color: #f87171; padding: 2rem;">เกิดข้อผิดพลาด: ${err.message}</div>`;
    }
  }

  // =========================================================================
  // 2. Support Tickets Management
  // =========================================================================
  async renderTickets() {
    const area = document.getElementById('admin-content-area');
    area.innerHTML = '<div style="text-align: center; padding: 3rem;">กำลังโหลดรายการ Ticket ทั้งหมด...</div>';

    try {
      const res = await API.admin.getTickets();
      if (!res.success) throw new Error(res.message);

      area.innerHTML = `
        <div class="admin-header">
          <div>
            <h1 style="font-size: 1.8rem; color: #fff;">🛠️ ระบบจัดการเรื่องแจ้งปัญหา (Ticket Backoffice)</h1>
            <p style="color: var(--admin-text-muted); font-size: 0.9rem;">ตรวจสอบ ตอบกลับ และอัปเดตสถานะปัญหาของผู้ใช้งาน</p>
          </div>
        </div>

        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ผู้แจ้ง</th>
                <th>หัวข้อเรื่อง</th>
                <th>หมวดหมู่</th>
                <th>ความเร่งด่วน</th>
                <th>สถานะ</th>
                <th>วันที่</th>
                <th style="text-align: right;">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              ${res.tickets.map((t) => `
                <tr>
                  <td>#${t.id}</td>
                  <td>${t.user_avatar} ${t.user_name}</td>
                  <td><strong style="color: #fff;">${t.subject}</strong></td>
                  <td><span class="discipline-badge">${t.category}</span></td>
                  <td><span class="priority-${t.priority}">[${t.priority}]</span></td>
                  <td><span class="status-chip status-${t.status.replace(/\s+/g, '')}">${t.status}</span></td>
                  <td style="font-size: 0.8rem; color: var(--admin-text-muted);">${new Date(t.created_at).toLocaleDateString()}</td>
                  <td style="text-align: right;">
                    <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.82rem;" onclick="adminPortal.openTicketDrawer(${t.id})">💬 จัดการ / ตอบกลับ</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      area.innerHTML = `<div style="color: #f87171; padding: 2rem;">เกิดข้อผิดพลาด: ${err.message}</div>`;
    }
  }

  async openTicketDrawer(ticketId) {
    this.activeTicketId = ticketId;
    const modal = document.getElementById('modal-admin-ticket');
    modal.classList.add('active');

    const content = document.getElementById('admin-ticket-content');
    content.innerHTML = '<div style="text-align: center; padding: 2rem;">กำลังโหลดข้อมูลคำร้อง...</div>';

    try {
      const res = await API.getTicketDetails(ticketId);
      if (!res.success) throw new Error(res.message);

      const { ticket, replies } = res;

      content.innerHTML = `
        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.85rem; color: var(--admin-text-muted);">คำร้อง #${ticket.id} โดย ${ticket.creator_name}</span>
            <div style="display: flex; gap: 0.5rem;">
              <select id="select-ticket-status" class="form-select" style="width: auto; padding: 0.3rem 0.6rem; font-size: 0.85rem;" onchange="adminPortal.updateStatus(${ticket.id})">
                <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
                <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                <option value="Closed" ${ticket.status === 'Closed' ? 'selected' : ''}>Closed</option>
              </select>
            </div>
          </div>
          <h2 style="font-size: 1.35rem; color: #fff;">${ticket.subject}</h2>
          <div style="padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px; margin-top: 0.5rem; font-size: 0.92rem;">
            ${ticket.message}
          </div>
        </div>

        <h4 style="margin-bottom: 0.5rem; color: var(--admin-accent);">💬 ประวัติการตอบกลับ</h4>
        <div class="chat-thread" style="max-height: 240px;" id="admin-chat-thread">
          ${replies.map((r) => `
            <div class="chat-bubble ${r.sender_role === 'admin' ? 'admin' : 'user'}">
              <div class="chat-author">
                <span>${r.sender_name} (${r.sender_role})</span>
                <span>${new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div>${r.message}</div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <input type="text" id="admin-reply-input" class="form-input" placeholder="พิมพ์ข้อความตอบกลับผู้ใช้งาน...">
          <button class="btn btn-primary" onclick="adminPortal.sendReply(${ticket.id})">ตอบกลับ 📤</button>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div style="color: #f87171;">เกิดข้อผิดพลาด: ${err.message}</div>`;
    }
  }

  async updateStatus(ticketId) {
    const status = document.getElementById('select-ticket-status').value;
    try {
      const res = await API.admin.updateTicket(ticketId, { status });
      if (res.success) {
        alert('อัปเดตสถานะ Ticket เรียบร้อยแล้ว');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }

  async sendReply(ticketId) {
    const input = document.getElementById('admin-reply-input');
    if (!input || !input.value.trim()) return;

    try {
      const res = await API.replyTicket(ticketId, input.value.trim());
      if (res.success) {
        input.value = '';
        this.openTicketDrawer(ticketId);
      }
    } catch (err) {
      alert('ไม่สามารถตอบกลับได้: ' + err.message);
    }
  }

  // =========================================================================
  // 3. User Moderation Management
  // =========================================================================
  async renderUsers() {
    const area = document.getElementById('admin-content-area');
    area.innerHTML = '<div style="text-align: center; padding: 3rem;">กำลังโหลดรายชื่อผู้ใช้ทั้งหมด...</div>';

    try {
      const res = await API.admin.getUsers();
      if (!res.success) throw new Error(res.message);

      area.innerHTML = `
        <div class="admin-header">
          <div>
            <h1 style="font-size: 1.8rem; color: #fff;">👥 จัดการผู้ใช้งานและสิทธิ์ (User Moderation)</h1>
            <p style="color: var(--admin-text-muted); font-size: 0.9rem;">ปรับเปลี่ยน Role, ระงับบัญชี (Ban/Unban) หรือปรับคะแนน EXP</p>
          </div>
        </div>

        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ผู้ใช้</th>
                <th>ระดับสิทธิ์</th>
                <th>ยศ / Rank</th>
                <th>เลเวล</th>
                <th>EXP</th>
                <th>สถานะ</th>
                <th style="text-align: right;">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              ${res.users.map((u) => `
                <tr>
                  <td>#${u.id}</td>
                  <td>${u.avatar} <strong>${u.username}</strong></td>
                  <td>
                    <select class="form-select" style="width: auto; padding: 0.2rem 0.5rem; font-size: 0.8rem;" onchange="adminPortal.updateUserRole(${u.id}, this.value)">
                      <option value="user" ${u.role === 'user' ? 'selected' : ''}>user</option>
                      <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>moderator</option>
                      <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
                    </select>
                  </td>
                  <td><span style="color: var(--admin-accent);">${u.rank_tier}</span></td>
                  <td>LV. ${u.level}</td>
                  <td>${u.xp}</td>
                  <td>
                    ${u.is_banned ? '<span style="color: #ef4444; font-weight: 700;">⛔ ถูกระงับ</span>' : '<span style="color: #22c55e;">ปกติ</span>'}
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="adminPortal.adjustUserXP(${u.id})">⭐ ปรับ EXP</button>
                    <button class="btn ${u.is_banned ? 'btn-primary' : 'btn-outline'}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-left: 0.3rem;" onclick="adminPortal.toggleBan(${u.id}, ${u.is_banned})">
                      ${u.is_banned ? 'ปลดแบน' : 'ระงับการใช้งาน'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      area.innerHTML = `<div style="color: #f87171; padding: 2rem;">เกิดข้อผิดพลาด: ${err.message}</div>`;
    }
  }

  async updateUserRole(userId, role) {
    try {
      const res = await API.admin.updateUser(userId, { role });
      if (res.success) alert(`อัปเดตสิทธิ์ของ #${userId} เป็น ${role} เรียบร้อยแล้ว`);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }

  async toggleBan(userId, currentBanState) {
    const isBanning = !currentBanState;
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ ${isBanning ? 'ระงับ' : 'ปลดระงับ'} บัญชีผู้ใช้นี้?`)) return;

    try {
      const res = await API.admin.updateUser(userId, { is_banned: isBanning });
      if (res.success) {
        alert('อัปเดตสถานะสำเร็จ');
        this.renderUsers();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }

  async adjustUserXP(userId) {
    const xpChange = prompt('ระบุคะแนน EXP ที่ต้องการเพิ่มหรือลด (เช่น 100 หรือ -50):');
    if (!xpChange || isNaN(xpChange)) return;

    try {
      const res = await API.admin.updateUser(userId, { xp_adjustment: parseInt(xpChange) });
      if (res.success) {
        alert('ปรับเปลี่ยนคะแนน EXP สำเร็จแล้ว');
        this.renderUsers();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }

  // =========================================================================
  // 4. Curriculum & Quiz CRUD Management
  // =========================================================================
  async renderCurriculum() {
    const area = document.getElementById('admin-content-area');
    area.innerHTML = '<div style="text-align: center; padding: 3rem;">กำลังโหลดโครงสร้างหลักสูตร...</div>';

    try {
      const res = await API.getDisciplines();
      if (!res.success) throw new Error(res.message);

      area.innerHTML = `
        <div class="admin-header">
          <div>
            <h1 style="font-size: 1.8rem; color: #fff;">📚 จัดการหลักสูตรและคลังโจทย์ (Curriculum Manager)</h1>
            <p style="color: var(--admin-text-muted); font-size: 0.9rem;">เพิ่มหรือปรับแต่งเนื้อหาบทเรียนและแบบฝึกหัดในแต่ละสายวิชา</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="adminPortal.openCreateLessonModal()">➕ เพิ่มบทเรียนใหม่</button>
            <button class="btn btn-outline" style="margin-left: 0.5rem;" onclick="adminPortal.openCreateQuizModal()">➕ เพิ่มโจทย์ข้อสอบใหม่</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
          ${res.disciplines.map((d) => `
            <div class="stat-card" style="flex-direction: column; align-items: flex-start;">
              <div style="display: flex; align-items: center; gap: 0.75rem; width: 100%;">
                <div class="stat-icon">${d.icon}</div>
                <div>
                  <h3 style="color: #fff; font-size: 1.1rem;">${d.name_th}</h3>
                  <div style="font-size: 0.8rem; color: var(--admin-text-muted);">${d.name_en}</div>
                </div>
              </div>
              <div style="margin-top: 1rem; font-size: 0.88rem; color: var(--admin-text-muted);">
                📜 ${d.totalLessons} บทเรียน • 📝 ${d.totalQuizzes} ข้อสอบ
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      area.innerHTML = `<div style="color: #f87171; padding: 2rem;">เกิดข้อผิดพลาด: ${err.message}</div>`;
    }
  }

  openCreateLessonModal() {
    const modal = document.getElementById('modal-create-lesson');
    if (modal) modal.classList.add('active');
  }

  openCreateQuizModal() {
    const modal = document.getElementById('modal-create-quiz');
    if (modal) modal.classList.add('active');
  }
}

window.adminPortal = new AdminPortal();
document.addEventListener('DOMContentLoaded', () => window.adminPortal.init());
