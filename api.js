// API Client Helper with Full Offline / GitHub Pages Static Fallback Mode
const API = {
  baseUrl: '/api',
  isOfflineMode: false,

  getToken() {
    return localStorage.getItem('omni_token');
  },

  setToken(token) {
    if (token) localStorage.setItem('omni_token', token);
    else localStorage.removeItem('omni_token');
  },

  async request(endpoint, options = {}) {
    // If already detected offline/static hosting
    if (this.isOfflineMode) {
      return this.handleOfflineRequest(endpoint, options);
    }

    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Backend API not found (e.g. running on static GitHub Pages)
          console.warn('Backend API 404 detected. Switching to Static / Offline Mode.');
          this.isOfflineMode = true;
          return this.handleOfflineRequest(endpoint, options);
        }
        if (response.status === 401) {
          if (token && !endpoint.includes('/auth/login')) {
            this.setToken(null);
            if (window.auth) window.auth.setUser(null);
          }
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      }

      return await response.json();
    } catch (error) {
      // Network error / CORS / static hosting fallback
      console.warn(`API Error [${endpoint}] -> Falling back to Client-side Data:`, error.message);
      this.isOfflineMode = true;
      return this.handleOfflineRequest(endpoint, options);
    }
  },

  // Client-Side Offline / Static Hosting Mock Data Handler
  async handleOfflineRequest(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    // 1. Auth: Login
    if (endpoint === '/auth/login') {
      const user = {
        id: 2,
        username: body.username || 'PlayerOne',
        email: 'player@omniverse.local',
        role: body.username === 'admin' ? 'admin' : 'user',
        xp: parseInt(localStorage.getItem('omni_xp') || '180'),
        level: parseInt(localStorage.getItem('omni_level') || '2'),
        rank_tier: localStorage.getItem('omni_rank') || 'Silver Apprentice',
        title: 'นักผจญภัยมือใหม่',
        avatar: '⚡',
        streak_days: 1
      };
      this.setToken('static_demo_token');
      localStorage.setItem('omni_user', JSON.stringify(user));
      return { success: true, token: 'static_demo_token', user };
    }

    // 2. Auth: Register
    if (endpoint === '/auth/register') {
      const user = {
        id: Date.now(),
        username: body.username || 'Hero',
        email: body.email || null,
        role: 'user',
        xp: 0,
        level: 1,
        rank_tier: 'Bronze Novice',
        title: 'ผู้แสวงหาความรู้ (Seeker)',
        avatar: body.avatar || '🧙‍♂️',
        streak_days: 1
      };
      this.setToken('static_demo_token');
      localStorage.setItem('omni_user', JSON.stringify(user));
      return { success: true, token: 'static_demo_token', user };
    }

    // 3. Auth: Me Profile
    if (endpoint === '/auth/me') {
      const savedUser = JSON.parse(localStorage.getItem('omni_user') || 'null') || {
        id: 2,
        username: 'PlayerOne',
        role: 'user',
        xp: parseInt(localStorage.getItem('omni_xp') || '180'),
        level: parseInt(localStorage.getItem('omni_level') || '2'),
        rank_tier: localStorage.getItem('omni_rank') || 'Silver Apprentice',
        title: 'นักผจญภัยมือใหม่',
        avatar: '⚡',
        streak_days: 1
      };

      return {
        success: true,
        user: savedUser,
        badges: [
          { id: 'first_step', name_th: 'ก้าวแรกสู่ปราชญ์', description: 'ทำแบบทดสอบข้อแรกสำเร็จ', icon: '🌱' },
          { id: 'academic_scholar', name_th: 'บัณฑิตดาราศาสตร์ & วิทยาศาสตร์', description: 'ผ่านแบบทดสอบสายวิชาการ', icon: '📜' }
        ],
        disciplineStats: this.mockDisciplines.map((d) => ({
          ...d,
          quizzes_completed: 2,
          xp_earned: 90
        })),
        recentActivity: []
      };
    }

    // 4. Disciplines List
    if (endpoint === '/curriculum/disciplines') {
      const userXp = parseInt(localStorage.getItem('omni_xp') || '180');
      return {
        success: true,
        disciplines: this.mockDisciplines.map((d) => ({
          ...d,
          totalLessons: 4,
          totalQuizzes: 12,
          userProgress: 25,
          userXpInDiscipline: Math.round(userXp / 7)
        }))
      };
    }

    // 5. Single Discipline Details
    if (endpoint.startsWith('/curriculum/disciplines/')) {
      const id = endpoint.replace('/curriculum/disciplines/', '');
      const disc = this.mockDisciplines.find((d) => d.id === id) || this.mockDisciplines[0];
      return {
        success: true,
        discipline: disc,
        lessons: this.mockLessons.filter((l) => l.discipline_id === disc.id)
      };
    }

    // 6. Single Lesson Details
    if (endpoint.startsWith('/curriculum/lessons/')) {
      const lessonId = parseInt(endpoint.replace('/curriculum/lessons/', ''));
      const lesson = this.mockLessons.find((l) => l.id === lessonId) || this.mockLessons[0];
      const disc = this.mockDisciplines.find((d) => d.id === lesson.discipline_id) || this.mockDisciplines[0];
      return {
        success: true,
        lesson,
        discipline: disc,
        quizzes: lesson.quizzes || []
      };
    }

    // 7. Submit Quiz Answer
    if (endpoint === '/curriculum/quiz/submit') {
      const { quizId, selectedOption, comboStreak = 1 } = body;
      const baseXP = 50;
      const streakBonus = Math.min(20, (comboStreak - 1) * 5);
      const gained = baseXP + streakBonus;

      let curXp = parseInt(localStorage.getItem('omni_xp') || '180') + gained;
      let curLevel = Math.floor(Math.sqrt(curXp / 25)) + 1;
      let curRank = 'Silver Apprentice';
      if (curXp >= 600) curRank = 'Platinum Expert';
      else if (curXp >= 300) curRank = 'Gold Adept';

      localStorage.setItem('omni_xp', curXp);
      localStorage.setItem('omni_level', curLevel);
      localStorage.setItem('omni_rank', curRank);

      return {
        success: true,
        isCorrect: true,
        correctOption: selectedOption,
        explanation: 'คำตอบถูกต้องยอดเยี่ยม! (ระบบกำลังทำงานในโหมด Offline Demonstration)',
        xpGained: gained,
        streakBonus,
        newTotalXp: curXp,
        newLevel: curLevel,
        newRank: curRank,
        levelUp: false,
        rankUp: false,
        unlockedBadges: []
      };
    }

    // 8. Leaderboard
    if (endpoint === '/gamification/leaderboard/global') {
      const curXp = parseInt(localStorage.getItem('omni_xp') || '180');
      return {
        success: true,
        leaderboard: [
          { id: 1, username: 'admin', role: 'admin', xp: 1500, level: 10, rank_tier: 'Omniscient Sage', avatar: '🧙‍♂️' },
          { id: 2, username: 'PlayerOne', role: 'user', xp: curXp, level: Math.floor(Math.sqrt(curXp / 25)) + 1, rank_tier: 'Silver Apprentice', avatar: '⚡' },
          { id: 3, username: 'StarSeeker', role: 'user', xp: 280, level: 3, rank_tier: 'Silver Apprentice', avatar: '🌌' },
          { id: 4, username: 'BushcraftMaster', role: 'user', xp: 220, level: 3, rank_tier: 'Silver Apprentice', avatar: '🌲' }
        ]
      };
    }

    // 9. Tickets
    if (endpoint === '/tickets/my' || endpoint === '/tickets') {
      const savedTickets = JSON.parse(localStorage.getItem('omni_tickets') || '[]');
      if (method === 'POST') {
        savedTickets.unshift({
          id: Date.now(),
          subject: body.subject,
          category: body.category || 'general',
          priority: body.priority || 'Medium',
          status: 'Open',
          message: body.message,
          reply_count: 1,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('omni_tickets', JSON.stringify(savedTickets));
        return { success: true, message: 'ส่งเรื่องแจ้งปัญหาเรียบร้อยแล้ว' };
      }
      return { success: true, tickets: savedTickets };
    }

    // 10. Fallback default
    return { success: true, message: 'Offline Demo Mode' };
  },

  // Auth APIs
  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getMe() {
    return this.request('/auth/me');
  },

  updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Curriculum APIs
  getDisciplines() {
    return this.request('/curriculum/disciplines');
  },

  getDiscipline(id) {
    return this.request(`/curriculum/disciplines/${id}`);
  },

  getLesson(id) {
    return this.request(`/curriculum/lessons/${id}`);
  },

  submitQuiz(quizId, selectedOption, comboStreak) {
    return this.request('/curriculum/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ quizId, selectedOption, comboStreak })
    });
  },

  // Gamification APIs
  getGlobalLeaderboard() {
    return this.request('/gamification/leaderboard/global');
  },

  getDisciplineLeaderboard(discId) {
    return this.request(`/gamification/leaderboard/discipline/${discId}`);
  },

  getBadges() {
    return this.request('/gamification/badges');
  },

  getStats() {
    return this.request('/gamification/stats');
  },

  // Support Tickets
  createTicket(ticketData) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  },

  getMyTickets() {
    return this.request('/tickets/my');
  },

  getTicketDetails(ticketId) {
    return this.request(`/tickets/${ticketId}`);
  },

  replyTicket(ticketId, message) {
    return this.request(`/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  // Admin APIs
  admin: {
    getOverview() {
      return API.request('/admin/overview');
    },
    getTickets(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.request(`/admin/tickets?${query}`);
    },
    updateTicket(ticketId, data) {
      return API.request(`/admin/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    getUsers(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.request(`/admin/users?${query}`);
    },
    updateUser(userId, data) {
      return API.request(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    createLesson(data) {
      return API.request('/admin/lessons', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    createQuiz(data) {
      return API.request('/admin/quizzes', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    deleteContent(type, id) {
      return API.request(`/admin/content/${type}/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Built-in Seed Data for Static Fallback
  mockDisciplines: [
    {
      id: 'academic',
      name_th: 'วิชาการ & วิทยาศาสตร์สากล',
      name_en: 'Academic & Sciences',
      description: 'ศึกษาและไขความลับของจักรวาล ฟิสิกส์ ดาราศาสตร์ คณิตศาสตร์ พันธุศาสตร์ จิตวิทยา และตรรกศาสตร์สากล',
      icon: '🌌',
      theme_color: '#38bdf8',
      bg_gradient: 'linear-gradient(135deg, #0b1329 0%, #1e293b 50%, #172554 100%)',
      quote: 'ความรู้คือแสงสว่างที่ส่องทะลุความมืดมิดของจักรวาล',
      order_index: 1
    },
    {
      id: 'survival',
      name_th: 'การเอาตัวรอด & ถิ่นทุรกันดาร',
      name_en: 'Wilderness & Tactical Survival',
      description: 'ศาสตร์แห่งการเอาชีวิตรอดในสภาพแวดล้อมสุดขั้ว การก่อไฟ การหาน้ำสะอาด ปฐมพยาบาล และการนำทางตามธรรมชาติ',
      icon: '🌲',
      theme_color: '#22c55e',
      bg_gradient: 'linear-gradient(135deg, #0a180d 0%, #142a17 50%, #1b3d1f 100%)',
      quote: 'ธรรมชาติไม่ได้ใจร้าย แต่ธรรมชาติไม่เคยให้โอกาสคนที่ไม่เตรียมพร้อม',
      order_index: 2
    },
    {
      id: 'tech',
      name_th: 'เทคโนโลยี & ไซเบอร์เนติกส์',
      name_en: 'Technology & Cybernetics',
      description: 'การเขียนโปรแกรม ปัญญาประดิษฐ์ ความมั่นคงปลอดภัยทางไซเบอร์ คลาวด์ และสถาปัตยกรรมระบบดิจิทัล',
      icon: '💻',
      theme_color: '#06b6d4',
      bg_gradient: 'linear-gradient(135deg, #051622 0%, #0d2838 50%, #0f172a 100%)',
      quote: 'ในโลกดิจิทัล โค้ดคือเวทมนตร์ที่กำหนดความเป็นจริง',
      order_index: 3
    },
    {
      id: 'arts',
      name_th: 'ศิลปะ & นิเทศศิลป์สร้างสรรค์',
      name_en: 'Creative Arts & Media',
      description: 'ทฤษฎีสี การเล่าเรื่องและการเขียนบท การออกแบบประสบการณ์ (UI/UX) และการประพันธ์ดนตรี',
      icon: '🎨',
      theme_color: '#c084fc',
      bg_gradient: 'linear-gradient(135deg, #1b0a2a 0%, #2f1547 50%, #3b0764 100%)',
      quote: 'ศิลปะคือการถ่ายทอดจิตวิญญาณและความรู้สึกที่ภาษาพูดไม่อาจเอื้อมถึง',
      order_index: 4
    },
    {
      id: 'combat',
      name_th: 'สมรรถภาพกาย & ศิลปะการต่อสู้',
      name_en: 'Combat & Physical Mastery',
      description: 'ศิลปะการป้องกันตัว ชีวกลศาสตร์ โภชนาการกีฬา และยุทธวิธีในการควบคุมสถานการณ์และเอาตัวรอด',
      icon: '🥋',
      theme_color: '#ef4444',
      bg_gradient: 'linear-gradient(135deg, #240a0a 0%, #3e1212 50%, #450a0a 100%)',
      quote: 'ร่างกายที่แข็งแกร่งและจิตใจที่นิ่งสงบคือเกราะกำบังที่ดีที่สุด',
      order_index: 5
    },
    {
      id: 'wealth',
      name_th: 'ทักษะชีวิต & ธุรกิจการเงิน',
      name_en: 'Life Mastery & Wealth Creation',
      description: 'การบริหารการเงินส่วนบุคคล การลงทุน จิตวิทยาการเจรจาต่อรอง การวิเคราะห์ธุรกิจ และการบริหารเวลา',
      icon: '💼',
      theme_color: '#10b981',
      bg_gradient: 'linear-gradient(135deg, #062016 0%, #0f3826 50%, #064e3b 100%)',
      quote: 'อิสรภาพทางการเงินไม่ได้เกิดจากโชค แต่เกิดจากวินัยและกลยุทธ์',
      order_index: 6
    },
    {
      id: 'engineering',
      name_th: 'วิศวกรรม & งานช่างประดิษฐ์',
      name_en: 'Engineering & Craftsmanship',
      description: 'วงจรอิเล็กทรอนิกส์ การซ่อมบำรุงเครื่องยนต์กลไก การออกแบบ 3D CAD และระบบอัตโนมัติ IoT',
      icon: '🔧',
      theme_color: '#f59e0b',
      bg_gradient: 'linear-gradient(135deg, #231505 0%, #3d2407 50%, #451a03 100%)',
      quote: 'สิ่งที่มองเห็นรอบตัว มนุษย์เราสามารถเข้าใจ แก้ไข และสร้างมันขึ้นมาใหม่ได้เสมอ',
      order_index: 7
    }
  ],

  mockLessons: [
    {
      id: 1,
      discipline_id: 'academic',
      title_th: 'ความลับแห่งจักรวาลและทฤษฎีสัมพัทธภาพ',
      title_en: 'Mysteries of Cosmos & General Relativity',
      description: 'เข้าใจการบิดโค้งของกาลอวกาศ (Spacetime) และพฤติกรรมของหลุมดำ',
      content: `### กาลอวกาศ (Spacetime)
ไอน์สไตน์เสนอว่าอวกาศและเวลาถักทอเป็นผืนผ้า 4 มิติ เรียกว่า Spacetime มวลมหาศาลจะทำให้กาลอวกาศโค้งงอเกิดเป็นแรงโน้มถ่วง`,
      difficulty: 'Intermediate',
      xp_reward: 80,
      quizzes: [
        {
          id: 1,
          question: 'ตามทฤษฎีสัมพัทธภาพทั่วไปของไอน์สไตน์ แรงโน้มถ่วงเกิดขึ้นจากสิ่งใด?',
          scenario: 'การสังเกตแสงจากดาวฤกษ์ที่เบี่ยงเบนเฉียดดวงอาทิตย์',
          option_a: 'การดูดกันของอนุภาคแม่เหล็กไฟฟ้า',
          option_b: 'การบิดโค้งงอของผืนผ้ากาลอวกาศ (Spacetime) จากมวลของวัตถุ',
          option_c: 'ความกดอากาศในอวกาศ',
          option_d: 'การเสียดสีของอนุภาคมืด',
          correct_option: 'B',
          xp_reward: 50
        }
      ]
    },
    {
      id: 2,
      discipline_id: 'survival',
      title_th: 'กฎแห่งเลข 3 และลำดับความสำคัญในภาวะวิกฤต',
      title_en: 'Rule of 3s & Wilderness Priorities',
      description: 'ลำดับความสำคัญในการตัดสินใจเพื่อเอาตัวรอดในสถานการณ์ฉุกเฉิน',
      content: `### กฎแห่งเลข 3 (Rule of 3s)
1. 3 นาที ไร้อากาศหายใจ
2. 3 ชั่วโมง ในสภาวะอากาศสุดขั้วโดยไร้ที่พักพิง
3. 3 วัน โดยปราศจากน้ำดื่มบริสุทธิ์
4. 3 สัปดาห์ โดยปราศจากอาหาร`,
      difficulty: 'Beginner',
      xp_reward: 70,
      quizzes: [
        {
          id: 2,
          question: 'ตามกฎแห่งเลข 3 สิ่งใดทำให้มนุษย์เสียชีวิตเร็วที่สุดในอากาศหนาวจัดฝนตกหนัก?',
          scenario: 'หลงอยู่ในป่า อุณหภูมิ 1 องศาเซลเซียส เสื้อผ้าเปียกชื้น',
          option_a: 'การขาดอาหาร',
          option_b: 'การขาดน้ำดื่ม',
          option_c: 'ภาวะอุณหภูมิร่างกายต่ำเกินไป (Hypothermia) ใน 3 ชั่วโมง',
          option_d: 'การนอนไม่หลับ',
          correct_option: 'C',
          xp_reward: 55
        }
      ]
    },
    {
      id: 3,
      discipline_id: 'tech',
      title_th: 'Cybersecurity Fundamentals & ป้องกันการถูกแฮก',
      title_en: 'Cybersecurity Fundamentals & Threat Defense',
      description: 'การป้องกันตนเองจากการโจมตี Phishing, Social Engineering และความปลอดภัยของข้อมูล',
      content: `### กฎทองแห่งความปลอดภัย
ใช้งาน 2FA / MFA เสมอ ใช้ Password Manager และตรวจสอบชื่อ Domain URL ทุกครั้ง`,
      difficulty: 'Beginner',
      xp_reward: 75,
      quizzes: [
        {
          id: 3,
          question: 'คุณได้รับอีเมลน่าสงสัยพร้อมลิงก์แปลกปลอม ควรรับมืออย่างไร?',
          scenario: 'ได้รับอีเมลแจ้งบัญชีถูกระงับให้คลิกลิงก์ยืนยันรหัสผ่านด่วน',
          option_a: 'คลิกลิงก์ทันที',
          option_b: 'เพิกเฉย ไม่คลิกลิงก์ ตรวจสอบ Domain และรายงาน Phishing',
          option_c: 'ส่งต่อให้เพื่อนทุกคนช่วยคลิก',
          option_d: 'แนบบัตรประชาชนตอบกลับ',
          correct_option: 'B',
          xp_reward: 50
        }
      ]
    }
  ]
};

window.API = API;
