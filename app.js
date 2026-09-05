// Main SPA Application Controller
class OmniApp {
  constructor() {
    this.currentRoute = '#/';
    this.currentDiscipline = null;
    this.currentQuizIndex = 0;
    this.currentQuizzes = [];
    this.quizCombo = 1;
    this.isAnswering = false;
  }

  async init() {
    await window.auth.init();

    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();

    // Sound toggle button setup
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isEnabled = window.soundEngine.toggle();
        soundBtn.innerText = isEnabled ? '🔊' : '🔇';
        this.showToast(isEnabled ? 'เปิดเสียงเอฟเฟกต์แล้ว' : 'ปิดเสียงเอฟเฟกต์แล้ว');
      });
    }

    // Modal listeners
    this.initModalListeners();
  }

  handleRoute() {
    const hash = window.location.hash || '#/';
    this.currentRoute = hash;

    // Reset theme to default when navigating back to root
    if (hash === '#/' || hash === '#/leaderboard' || hash === '#/profile' || hash === '#/tickets') {
      window.themeManager.setTheme('default');
    }

    // Update active nav links (both desktop and mobile)
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach((item) => {
      const target = item.getAttribute('data-route');
      if (target && (hash === target || (target !== '#/' && hash.startsWith(target)))) {
        item.classList.add('active');
      } else if (target === '#/' && (hash === '#/' || hash === '')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (hash === '#/' || hash === '') {
      this.renderHome();
    } else if (hash.startsWith('#/discipline/')) {
      const discId = hash.replace('#/discipline/', '');
      this.renderDiscipline(discId);
    } else if (hash.startsWith('#/lesson/')) {
      const lessonId = hash.replace('#/lesson/', '');
      this.renderLesson(lessonId);
    } else if (hash === '#/leaderboard') {
      this.renderLeaderboard();
    } else if (hash === '#/profile') {
      this.renderProfile();
    } else if (hash === '#/tickets') {
      this.renderTickets();
    } else if (hash.startsWith('#/ticket/')) {
      const ticketId = hash.replace('#/ticket/', '');
      this.renderTicketChat(ticketId);
    }
  }

  // =========================================================================
  // 1. HOME VIEW (7 Universal Disciplines & RPG Hero)
  // =========================================================================
  async renderHome() {
    const container = document.getElementById('app-view');
    const user = window.auth.currentUser;

    container.innerHTML = `
      <div class="view-container">
        <!-- Hero RPG Banner -->
        <div class="hero-banner">
          <div class="hero-content">
            <div class="hero-badge">⚡ UNIVERSAL MASTERY PLATFORM</div>
            <h1 class="hero-title">ยินดีต้อนรับสู่ OmniVerse Academy</h1>
            <p class="hero-quote">ศูนย์รวมความรู้และการฝึกฝนทุกสายวิชาบนโลก — ยกระดับสติปัญญา ทักษะ และแรงค์ของคุณสู่ความเป็นเลิศ</p>
            
            ${user ? `
              <div class="hero-user-progression">
                <div class="prog-header">
                  <span class="prog-rank-tag">🏆 ${user.rank_tier} (LV. ${user.level})</span>
                  <span class="prog-xp-text">✨ ${user.xp} EXP</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${Math.min(100, (user.xp % 100))}%"></div>
                </div>
              </div>
            ` : `
              <div style="margin-top: 1rem;">
                <button class="btn btn-primary" onclick="app.openModal('modal-login')">🎮 เข้าสู่ระบบเพื่อเริ่มสะสม EXP</button>
                <button class="btn btn-outline" style="margin-left: 0.5rem;" onclick="app.quickDemoLogin()">⚡ ล็อกอินผู้ใช้ทดสอบ</button>
              </div>
            `}
          </div>
        </div>

        <!-- Disciplines Section -->
        <div class="section-header">
          <h2 class="section-title">🌌 สำรวจสายวิชาสากลทั้งหมด</h2>
          <span style="font-size: 0.9rem; color: var(--text-muted);">เลือกสายวิชาเพื่อเปลี่ยนธีมและเริ่มฝึกฝน</span>
        </div>

        <div id="disciplines-grid-container" class="disciplines-grid">
          <div style="text-align: center; padding: 2rem; color: var(--text-muted); grid-column: 1/-1;">
            กำลังโหลดข้อมูลสายวิชา...
          </div>
        </div>
      </div>
    `;

    try {
      const res = await API.getDisciplines();
      if (res.success) {
        this.renderDisciplinesGrid(res.disciplines);
      }
    } catch (err) {
      this.showToast('ไม่สามารถโหลดข้อมูลสายวิชาได้', 'error');
    }
  }

  renderDisciplinesGrid(disciplines) {
    const grid = document.getElementById('disciplines-grid-container');
    if (!grid) return;

    grid.innerHTML = disciplines.map((d) => `
      <div class="discipline-card" onclick="location.hash='#/discipline/${d.id}'" onmouseenter="themeManager.setTheme('${d.id}')" onmouseleave="if(!app.currentDiscipline) themeManager.setTheme('default')">
        <div class="card-top">
          <div class="discipline-icon-box">${d.icon}</div>
          <span class="discipline-badge">${d.totalLessons} บทเรียน • ${d.totalQuizzes} โจทย์</span>
        </div>
        <h3 class="discipline-name">${d.name_th}</h3>
        <div class="discipline-name-en">${d.name_en}</div>
        <p class="discipline-desc">${d.description}</p>
        
        <div class="discipline-progress-wrapper">
          <div class="disc-prog-info">
            <span>ความก้าวหน้า</span>
            <strong>${d.userProgress}% (${d.userXpInDiscipline} XP)</strong>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${d.userProgress}%"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 2. DISCIPLINE DETAILS & SKILL TREE VIEW
  // =========================================================================
  async renderDiscipline(discId) {
    const container = document.getElementById('app-view');
    window.themeManager.setTheme(discId);

    container.innerHTML = `
      <div class="view-container">
        <div class="back-btn-bar">
          <button class="btn btn-outline" onclick="location.hash='#/'">⬅️ กลับหน้าหลัก</button>
        </div>
        <div style="text-align: center; padding: 3rem;">กำลังโหลดข้อมูลหลักสูตร...</div>
      </div>
    `;

    try {
      const res = await API.getDiscipline(discId);
      if (!res.success) throw new Error(res.message);

      const d = res.discipline;
      this.currentDiscipline = d;

      container.innerHTML = `
        <div class="view-container">
          <div class="back-btn-bar">
            <button class="btn btn-outline" onclick="location.hash='#/'">⬅️ กลับสู่คลังวิชา</button>
            <span style="color: var(--text-muted);">|</span>
            <span style="font-weight: 600; color: var(--accent);">${d.name_th}</span>
          </div>

          <div class="hero-banner">
            <div class="hero-content">
              <div class="hero-badge">${d.icon} ${d.name_en}</div>
              <h1 class="hero-title">${d.name_th}</h1>
              <p class="hero-quote">"${d.quote || d.description}"</p>
            </div>
          </div>

          <div class="section-header">
            <h2 class="section-title">📜 ผังบทเรียนและการฝึกฝน (Curriculum Tree)</h2>
          </div>

          <div class="lesson-list">
            ${res.lessons.map((l, index) => `
              <div class="lesson-card" onclick="location.hash='#/lesson/${l.id}'">
                <div class="lesson-info">
                  <span class="lesson-tag">บทที่ ${index + 1} • ${l.difficulty}</span>
                  <h3 class="lesson-title">${l.title_th}</h3>
                  <div class="lesson-desc">${l.description || ''}</div>
                </div>
                <div class="lesson-reward">
                  ${l.isCompleted ? '✅ <span style="color: #4ade80;">สำเร็จแล้ว</span>' : `⭐ +${l.xp_reward} XP`}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      this.showToast('เกิดข้อผิดพลาดในการโหลดบทเรียน', 'error');
    }
  }

  // =========================================================================
  // 3. LESSON READER & INTERACTIVE SIMULATOR QUIZ
  // =========================================================================
  async renderLesson(lessonId) {
    const container = document.getElementById('app-view');
    this.isAnswering = false;

    container.innerHTML = `<div style="text-align: center; padding: 3rem;">กำลังโหลดเนื้อหาบทเรียน...</div>`;

    try {
      const res = await API.getLesson(lessonId);
      if (!res.success) throw new Error(res.message);

      const { lesson, discipline, quizzes } = res;
      this.currentQuizzes = quizzes;
      this.currentQuizIndex = 0;
      this.quizCombo = 1;

      window.themeManager.setTheme(discipline.id);

      // Render Markdown-like content cleanly
      const formattedContent = lesson.content
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>');

      container.innerHTML = `
        <div class="view-container">
          <div class="back-btn-bar">
            <button class="btn btn-outline" onclick="location.hash='#/discipline/${discipline.id}'">⬅️ ย้อนกลับไปสายวิชา</button>
            <span style="font-weight: 600; color: var(--accent);">${discipline.name_th}</span>
          </div>

          <!-- Lesson Content Card -->
          <div class="lesson-reader">
            <span class="lesson-tag">${discipline.icon} ${lesson.difficulty}</span>
            <h1 style="font-size: 1.8rem; margin: 0.5rem 0 1rem; color: #fff;">${lesson.title_th}</h1>
            <div style="font-family: 'Cinzel', serif; color: var(--text-muted); margin-bottom: 1.5rem;">${lesson.title_en}</div>
            
            <div style="font-size: 1.05rem; color: var(--text-main); line-height: 1.8;">
              ${formattedContent}
            </div>
          </div>

          <!-- Quiz Interactive Area -->
          <div class="section-header">
            <h2 class="section-title">⚔️ บททดสอบวัดความรู้ & เก็บ EXP</h2>
          </div>

          <div class="quiz-container" id="quiz-runner-box">
            ${this.renderQuizQuestionHTML(quizzes[0], 0, quizzes.length)}
          </div>
        </div>
      `;
    } catch (err) {
      this.showToast('เกิดข้อผิดพลาดในการโหลดบทเรียน', 'error');
    }
  }

  renderQuizQuestionHTML(quiz, index, total) {
    if (!quiz) {
      return `
        <div class="quiz-card" style="text-align: center; padding: 3rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
          <h2>คุณทำบททดสอบของบทเรียนนี้เสร็จสิ้นแล้ว!</h2>
          <p style="color: var(--text-muted); margin: 1rem 0 1.5rem;">ยอดเยี่ยมมาก คุณได้รับ EXP และพัฒนาตนเองไปอีกขั้น</p>
          <button class="btn btn-primary" onclick="location.hash='#/'">กลับสู่หน้าหลัก</button>
        </div>
      `;
    }

    return `
      <div class="quiz-card">
        <div class="quiz-header">
          <span style="font-weight: 700; color: var(--accent);">ข้อที่ ${index + 1} จาก ${total}</span>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            ${this.quizCombo > 1 ? `<span class="combo-badge">🔥 COMBO x${this.quizCombo}</span>` : ''}
            <span style="font-weight: 700; color: #fbbf24;">⭐ +${quiz.xp_reward} EXP</span>
          </div>
        </div>

        ${quiz.scenario ? `
          <div class="scenario-box">
            <strong>🎯 สถานการณ์จำลอง:</strong> ${quiz.scenario}
          </div>
        ` : ''}

        <div class="quiz-question-text">${quiz.question}</div>

        <div class="quiz-options-list">
          <button class="option-btn" onclick="app.submitAnswer(${quiz.id}, 'A', this)">
            <span class="option-key">A</span>
            <span>${quiz.option_a}</span>
          </button>
          <button class="option-btn" onclick="app.submitAnswer(${quiz.id}, 'B', this)">
            <span class="option-key">B</span>
            <span>${quiz.option_b}</span>
          </button>
          <button class="option-btn" onclick="app.submitAnswer(${quiz.id}, 'C', this)">
            <span class="option-key">C</span>
            <span>${quiz.option_c}</span>
          </button>
          <button class="option-btn" onclick="app.submitAnswer(${quiz.id}, 'D', this)">
            <span class="option-key">D</span>
            <span>${quiz.option_d}</span>
          </button>
        </div>

        <div id="quiz-result-area"></div>
      </div>
    `;
  }

  async submitAnswer(quizId, selectedOption, btnElement) {
    if (this.isAnswering) return;

    if (!window.auth.currentUser) {
      this.showToast('กรุณาเข้าสู่ระบบก่อนทำแบบทดสอบเพื่อบันทึก EXP ครับ', 'info');
      this.openModal('modal-login');
      return;
    }

    this.isAnswering = true;
    window.soundEngine.playClick();

    // Disable all options while checking
    document.querySelectorAll('.option-btn').forEach((b) => b.disabled = true);

    try {
      const res = await API.submitQuiz(quizId, selectedOption, this.quizCombo);

      if (res.isCorrect) {
        window.soundEngine.playCorrect();
        btnElement.classList.add('correct');
        this.quizCombo += 1;

        // Update local user state
        const user = window.auth.currentUser;
        user.xp = res.newTotalXp;
        user.level = res.newLevel;
        user.rank_tier = res.newRank;
        window.auth.setUser(user);

        // Show result feedback
        document.getElementById('quiz-result-area').innerHTML = `
          <div class="explanation-card" style="border-left: 4px solid #22c55e;">
            <div class="explanation-title" style="color: #4ade80;">
              <span>✅ ถูกต้องยอดเยี่ยม!</span>
              <span style="margin-left: auto;">+${res.xpGained} EXP</span>
            </div>
            <p style="font-size: 0.92rem; color: var(--text-muted); margin-top: 0.4rem;">${res.explanation}</p>
            <div style="margin-top: 1rem; text-align: right;">
              <button class="btn btn-primary" onclick="app.nextQuizQuestion()">ข้อถัดไป ➡️</button>
            </div>
          </div>
        `;

        // Check celebratory modal triggers
        if (res.rankUp) {
          window.soundEngine.playLevelUp();
          this.showCelebrationModal('🏆 เลื่อนขั้นยศใหม่ (RANK UP!)', `ยินดีด้วย! คุณได้รับการเลื่อนขั้นสู่ตำแหน่ง "${res.newRank}"`, '👑');
        } else if (res.levelUp) {
          window.soundEngine.playLevelUp();
          this.showCelebrationModal('⚡ เลเวลอัป (LEVEL UP!)', `ยินดีด้วย! คุณเลเวลอัปสู่ Level ${res.newLevel}`, '✨');
        }

        if (res.unlockedBadges && res.unlockedBadges.length > 0) {
          res.unlockedBadges.forEach((b) => {
            this.showToast(`🏅 ปลดล็อกเหรียญตรา: "${b.name_th}"!`, 'success');
          });
        }
      } else {
        window.soundEngine.playWrong();
        btnElement.classList.add('wrong');
        this.quizCombo = 1; // Reset combo

        // Highlight correct button
        document.querySelectorAll('.option-btn').forEach((b) => {
          if (b.innerText.trim().startsWith(res.correctOption)) {
            b.classList.add('correct');
          }
        });

        document.getElementById('quiz-result-area').innerHTML = `
          <div class="explanation-card" style="border-left: 4px solid #ef4444;">
            <div class="explanation-title" style="color: #f87171;">
              <span>❌ ยังไม่ถูกต้อง</span>
            </div>
            <p style="font-size: 0.92rem; color: var(--text-muted); margin-top: 0.4rem;">${res.explanation}</p>
            <div style="margin-top: 1rem; text-align: right;">
              <button class="btn btn-outline" onclick="app.nextQuizQuestion()">ทำข้อต่อไป ➡️</button>
            </div>
          </div>
        `;
      }
    } catch (err) {
      this.showToast('เกิดข้อผิดพลาดในการส่งคำตอบ', 'error');
      this.isAnswering = false;
    }
  }

  nextQuizQuestion() {
    this.currentQuizIndex += 1;
    this.isAnswering = false;
    const container = document.getElementById('quiz-runner-box');
    if (container) {
      container.innerHTML = this.renderQuizQuestionHTML(
        this.currentQuizzes[this.currentQuizIndex],
        this.currentQuizIndex,
        this.currentQuizzes.length
      );
    }
  }

  // =========================================================================
  // 4. LEADERBOARD VIEW
  // =========================================================================
  async renderLeaderboard() {
    const container = document.getElementById('app-view');
    window.themeManager.setTheme('default');

    container.innerHTML = `
      <div class="view-container">
        <div class="section-header">
          <div>
            <h1 class="section-title">🏆 หอเกียรติยศ (Hall of Grandmasters)</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">ตารางจัดอันดับผู้แสวงหาความรู้ที่มีคะแนน EXP สูงสุดในโลก</p>
          </div>
        </div>

        <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 1.25rem; backdrop-filter: blur(12px);" class="table-responsive">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th style="width: 80px;">อันดับ</th>
                <th>ผู้เล่น</th>
                <th>ยศ / ฉายา</th>
                <th>เลเวล</th>
                <th style="text-align: right;">EXP สะสม</th>
              </tr>
            </thead>
            <tbody id="leaderboard-body">
              <tr><td colspan="5" style="text-align: center; padding: 2rem;">กำลังโหลดข้อมูลตารางอันดับ...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const res = await API.getGlobalLeaderboard();
      if (res.success) {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = res.leaderboard.map((u, i) => `
          <tr>
            <td><span class="rank-badge-num ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}">#${i + 1}</span></td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.4rem;">${u.avatar || '🧙‍♂️'}</span>
                <div>
                  <strong style="color: #fff;">${u.username}</strong>
                  ${u.role === 'admin' ? '<span style="font-size: 0.7rem; background: #38bdf8; color: #000; padding: 0.1rem 0.4rem; border-radius: 4px; margin-left: 0.4rem; font-weight: 700;">ADMIN</span>' : ''}
                </div>
              </div>
            </td>
            <td><span style="color: var(--accent); font-weight: 600;">${u.rank_tier}</span></td>
            <td><strong>LV. ${u.level}</strong></td>
            <td style="text-align: right;"><strong style="color: #fbbf24;">${u.xp} EXP</strong></td>
          </tr>
        `).join('');
      }
    } catch (err) {
      this.showToast('ไม่สามารถโหลดตารางอันดับได้', 'error');
    }
  }

  // =========================================================================
  // 5. USER PROFILE & BADGES VIEW
  // =========================================================================
  async renderProfile() {
    const container = document.getElementById('app-view');
    const user = window.auth.currentUser;

    if (!user) {
      container.innerHTML = `
        <div class="view-container" style="text-align: center; padding: 4rem 1rem;">
          <h2>กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์และสถิติ</h2>
          <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="app.openModal('modal-login')">เข้าสู่ระบบ</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div style="text-align: center; padding: 3rem;">กำลังโหลดข้อมูลโปรไฟล์...</div>`;

    try {
      const res = await API.getMe();
      if (!res.success) throw new Error(res.message);

      const { user: profileUser, badges, disciplineStats } = res;

      container.innerHTML = `
        <div class="view-container">
          <div class="profile-grid-layout" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; margin-bottom: 2.5rem;">
            <!-- Profile Card -->
            <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 2rem; text-align: center; backdrop-filter: blur(12px);">
              <div style="font-size: 4.5rem; margin-bottom: 0.5rem;">${profileUser.avatar}</div>
              <h2 style="color: #fff; margin-bottom: 0.25rem;">${profileUser.username}</h2>
              <div style="color: var(--accent); font-weight: 700; margin-bottom: 1rem;">${profileUser.rank_tier}</div>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">${profileUser.title}</p>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; text-align: center; padding: 1rem; background: rgba(0,0,0,0.25); border-radius: 10px; margin-bottom: 1.5rem;">
                <div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">เลเวลรวม</div>
                  <strong style="font-size: 1.3rem; color: #fff;">LV. ${profileUser.level}</strong>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">EXP รวม</div>
                  <strong style="font-size: 1.3rem; color: #fbbf24;">${profileUser.xp}</strong>
                </div>
              </div>

              <button class="btn btn-outline" style="width: 100%;" onclick="window.auth.logout()">🚪 ออกจากระบบ</button>
            </div>

            <!-- Discipline Mastery Breakdown -->
            <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 2rem; backdrop-filter: blur(12px);">
              <h3 style="margin-bottom: 1.5rem;">📊 ความชำนาญแยกตามสายวิชา (Mastery Levels)</h3>
              <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                ${disciplineStats.map((d) => `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.4rem;">
                      <span>${d.icon} ${d.name_th}</span>
                      <strong style="color: ${d.theme_color};">${d.xp_earned} EXP (${d.quizzes_completed} โจทย์)</strong>
                    </div>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill" style="width: ${Math.min(100, (d.xp_earned / 300) * 100)}%; background: ${d.theme_color};"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Badges Showcase -->
          <div class="section-header">
            <h2 class="section-title">🏅 เหรียญเกียรติยศที่ปลดล็อก (${badges.length})</h2>
          </div>

          <div class="badges-grid">
            ${badges.map((b) => `
              <div class="badge-item">
                <div class="badge-item-icon">${b.icon}</div>
                <div class="badge-item-name">${b.name_th}</div>
                <div class="badge-item-desc">${b.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      this.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์', 'error');
    }
  }

  // =========================================================================
  // 6. SUPPORT TICKETS & CHAT (User Side)
  // =========================================================================
  async renderTickets() {
    const container = document.getElementById('app-view');
    const user = window.auth.currentUser;

    if (!user) {
      container.innerHTML = `
        <div class="view-container" style="text-align: center; padding: 4rem 1rem;">
          <h2>กรุณาเข้าสู่ระบบก่อนเพื่อส่งและติดตามเรื่องแจ้งปัญหา</h2>
          <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="app.openModal('modal-login')">เข้าสู่ระบบ</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="view-container">
        <div class="section-header">
          <div>
            <h1 class="section-title">🛠️ ศูนย์ช่วยเหลือและแจ้งปัญหา (Support Center)</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">แจ้งข้อผิดพลาด เสนอแนะเนื้อหาใหม่ หรือสอบถามทีมงานหลังบ้าน</p>
          </div>
          <button class="btn btn-primary" onclick="app.openModal('modal-create-ticket')">➕ ส่งเรื่องแจ้งปัญหาใหม่</button>
        </div>

        <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 1.5rem; backdrop-filter: blur(12px);">
          <div id="tickets-list-body">
            <div style="text-align: center; padding: 2rem;">กำลังโหลดรายการแจ้งปัญหา...</div>
          </div>
        </div>
      </div>
    `;

    try {
      const res = await API.getMyTickets();
      if (res.success) {
        const listDiv = document.getElementById('tickets-list-body');
        if (res.tickets.length === 0) {
          listDiv.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
              คุณยังไม่เคยส่งเรื่องแจ้งปัญหา หากพบจุดผิดพลาดสามารถกดปุ่ม "ส่งเรื่องแจ้งปัญหาใหม่" ได้ทันทีครับ
            </div>
          `;
          return;
        }

        listDiv.innerHTML = `
          <div class="table-responsive">
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th>หัวข้อเรื่อง</th>
                  <th>หมวดหมู่</th>
                  <th>ความเร่งด่วน</th>
                  <th>สถานะ</th>
                  <th>ตอบกลับ</th>
                  <th style="text-align: right;">การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                ${res.tickets.map((t) => `
                  <tr>
                    <td><strong style="color: #fff;">${t.subject}</strong></td>
                    <td><span class="discipline-badge">${t.category}</span></td>
                    <td><span class="priority-${t.priority}">${t.priority}</span></td>
                    <td><span class="status-chip status-${t.status.replace(/\s+/g, '')}">${t.status}</span></td>
                    <td>💬 ${t.reply_count} ข้อความ</td>
                    <td style="text-align: right;">
                      <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="location.hash='#/ticket/${t.id}'">ดูรายละเอียด / แชท</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      this.showToast('เกิดข้อผิดพลาดในการโหลดรายการ Ticket', 'error');
    }
  }

  async renderTicketChat(ticketId) {
    const container = document.getElementById('app-view');

    container.innerHTML = `<div style="text-align: center; padding: 3rem;">กำลังเปิดห้องแชทของคำร้อง...</div>`;

    try {
      const res = await API.getTicketDetails(ticketId);
      if (!res.success) throw new Error(res.message);

      const { ticket, replies } = res;

      container.innerHTML = `
        <div class="view-container" style="max-width: 860px; margin: 0 auto;">
          <div class="back-btn-bar">
            <button class="btn btn-outline" onclick="location.hash='#/tickets'">⬅️ กลับหน้ารวมรายการแจ้งปัญหา</button>
          </div>

          <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; backdrop-filter: blur(12px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
              <div>
                <span class="status-chip status-${ticket.status.replace(/\s+/g, '')}">${ticket.status}</span>
                <span class="priority-${ticket.priority}" style="margin-left: 0.5rem;">[${ticket.priority} Priority]</span>
                <h1 style="font-size: 1.5rem; color: #fff; margin-top: 0.5rem;">${ticket.subject}</h1>
              </div>
            </div>
            <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 10px;">
              ${ticket.message}
            </p>
          </div>

          <!-- Chat Replies Thread -->
          <div class="chat-thread" id="ticket-chat-thread">
            ${replies.map((r) => `
              <div class="chat-bubble ${r.sender_role === 'admin' ? 'admin' : 'user'}">
                <div class="chat-author">
                  <span>${r.sender_avatar || '👤'} ${r.sender_name} (${r.sender_role})</span>
                  <span>${new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>${r.message}</div>
              </div>
            `).join('')}
          </div>

          <!-- Reply Input Box -->
          <div style="display: flex; gap: 0.75rem;">
            <input type="text" id="input-reply-message" class="form-input" placeholder="พิมพ์ข้อความตอบกลับทีมงาน...">
            <button class="btn btn-primary" onclick="app.sendTicketReply(${ticket.id})">ส่ง 📤</button>
          </div>
        </div>
      `;

      // Scroll to bottom of chat
      const chatThread = document.getElementById('ticket-chat-thread');
      if (chatThread) chatThread.scrollTop = chatThread.scrollHeight;
    } catch (err) {
      this.showToast('เกิดข้อผิดพลาดในการโหลดแชท', 'error');
    }
  }

  async sendTicketReply(ticketId) {
    const input = document.getElementById('input-reply-message');
    if (!input || !input.value.trim()) return;

    try {
      const res = await API.replyTicket(ticketId, input.value.trim());
      if (res.success) {
        input.value = '';
        this.renderTicketChat(ticketId);
        this.showToast('ส่งข้อความตอบกลับแล้ว', 'success');
      }
    } catch (err) {
      this.showToast('ไม่สามารถส่งข้อความได้', 'error');
    }
  }

  // =========================================================================
  // Modals & UI Helpers
  // =========================================================================
  initModalListeners() {
    // Login form submit
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('login-username').value;
        const p = document.getElementById('login-password').value;
        try {
          await window.auth.login(u, p);
          this.closeModal('modal-login');
          this.showToast(`ยินดีต้อนรับกลับ ${u}!`, 'success');
          this.handleRoute();
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }

    // Register form submit
    const regForm = document.getElementById('form-register');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const avatar = document.getElementById('reg-avatar').value || '🧙‍♂️';
        try {
          await window.auth.register({ username, email, password, avatar });
          this.closeModal('modal-register');
          this.showToast(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับสู่ OmniVerse Academy`, 'success');
          this.handleRoute();
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }

    // Create ticket form submit
    const ticketForm = document.getElementById('form-create-ticket');
    if (ticketForm) {
      ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subject = document.getElementById('ticket-subject-input').value;
        const category = document.getElementById('ticket-category-select').value;
        const priority = document.getElementById('ticket-priority-select').value;
        const message = document.getElementById('ticket-message-input').value;

        try {
          const res = await API.createTicket({ subject, category, priority, message });
          if (res.success) {
            this.closeModal('modal-create-ticket');
            this.showToast('ส่งเรื่องแจ้งปัญหาเรียบร้อยแล้ว!', 'success');
            ticketForm.reset();
            if (this.currentRoute === '#/tickets') this.renderTickets();
          }
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }
  }

  async quickDemoLogin() {
    try {
      await window.auth.login('PlayerOne', '123456');
      this.showToast('เข้าสู่ระบบด้วยบัญชีผู้ใช้ทดสอบสำเร็จ!', 'success');
      this.handleRoute();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  showCelebrationModal(title, text, icon = '🎉') {
    const modal = document.getElementById('modal-celebrate');
    if (!modal) return;
    document.getElementById('celebrate-title').innerText = title;
    document.getElementById('celebrate-text').innerText = text;
    document.getElementById('celebrate-icon').innerText = icon;
    modal.classList.add('active');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

window.app = new OmniApp();
document.addEventListener('DOMContentLoaded', () => window.app.init());
