// ── DATA ──

// 大公告：放首頁 banner（在 index.html 直接寫）

// 中公告：按課程類別
const categories = [
  {
    id: 'pilates',
    label: '皮拉提斯',
    subcats: ['器械皮拉提斯', '墊上皮拉提斯'],
    announceMid: '因教室租借費用調漲，費用有調整，感謝大家的支持與理解 🙏'
  },
  {
    id: 'aerial',
    label: '空中瑜珈',
    subcats: ['常態團課', '許願加開'],
    announceMid: ''
  },
 {
    id: 'circus',
    label: '旋轉課',
    subcats: ['空環', '舞綢'],
    announceMid: ''
  },
];

// 首頁區塊
const homeSections = {
  notice:      { id: 'noticeRules',        icon: '📋', title: '上課注意事項', text: `• 直接私訊報名，先報名先保留名額（記得設鬧鐘哦）\n• 器械皮拉提斯一對一課程開放預約，有需要包班上課或有許願上課時間要趕快跟我說喔！避免租不到教室\n• 3、4月購買的空瑜課程期限到5月底喔！記得約課使用～\n• 因手機容量不足，請於5/21前下載上課的照片，5/22會清理相簿` },
  about:       { id: 'sectionAbout',       icon: '✨', title: '關於課程',     text: '✔️課程紮實有趣\n暖身、課程主題、放鬆循序完成，會鼓勵你盡力完成，完成成果會幫你拍照記錄，你也可以自行錄影\n(看著自己一次次進步會很有成就感)\n✔️訓練肌力、培養固定運動習慣\n藉由空中掛布體驗在空中飛翔的趣味，在一次次的課程中訓練肌力、養成運動的好習慣\n(找到有興趣可以持續的運動，也許空瑜就是你有興趣的運動)\n✔️安全第一\n我會確保你在安全的狀態下做動作，你也需評估自身身體狀況、專心上課保護自己哦' },
  booking:     { id: 'sectionBooking',     icon: '📣', title: '報名說明',     text: '*舊生請私訊報名，新生請填寫此報名表\n*若有其他許願的需求時間，或是朋友想揪團包班上課，可私訊詢問。' },
  courseIntro: { id: 'sectionCourseIntro', icon: '🧘', title: '其他注意事項', text: '' },
};

// 小公告：每堂課自己的備註
const courses = [
  {
    id: 1, cat: 'aerial', subcat: '常態團課',
    dateStr: '2026-05-20', date: '5/20（三）', time: '18:10~19:10',
    title: '常態空瑜',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 500, minSpots: 3, maxSpots: 5, open: true,
    desc: '',
    announceSmall: '', showRoster: false
  },
  {
    id: 2, cat: 'aerial', subcat: '常態團課',
    dateStr: '2026-05-20', date: '5/20（三）', time: '19:20~20:20',
    title: '中階空瑜',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 500, minSpots: 3, maxSpots: 5, open: true,
    desc: '＊中階空瑜適合已熟悉基礎倒掛、截肢腳，練習至少10堂以上的同學',
    announceSmall: '', showRoster: false
  },
  {
    id: 3, cat: 'aerial', subcat: '常態團課',
    dateStr: '2026-05-20', date: '5/20（三）', time: '20:30~21:30',
    title: '新手特別友善班',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 500, minSpots: 3, maxSpots: 5, open: true,
    desc: '＊新手一定只能報名新手特別友善班嗎？\n沒有喔！因為是自己開班、我更能掌握各個學員的學習狀況，我會視該堂報名學員狀況編排適合的課程。\n但對新手來說、跟同程度的同學一起上課比較不緊張、比較放鬆無壓力，在基礎技巧上我可以花更多時間講解，因此特別開設新手友善班。',
    announceSmall: '', showRoster: false
  },
  {
    id: 4, cat: 'pilates', subcat: '器械皮拉提斯',
    dateStr: '2026-05-21', date: '5/21（四）', time: '18:20~19:20',
    title: '市政府器械皮拉提斯團課',
    location: '市政府', locationDetail: '捷運市政府站',
    price: 800, minSpots: 2, maxSpots: 3, open: false,
    desc: '細節講好講滿、確保你使用正確方式訓練\n讓大家用划算的價格持續讓身體進步',
    announceSmall: '', showRoster: false
  },
  {
    id: 5, cat: 'pilates', subcat: '器械皮拉提斯',
    dateStr: '2026-05-21', date: '5/21（四）', time: '19:30~20:30',
    title: '市政府器械皮拉提斯團課',
    location: '市政府', locationDetail: '捷運市政府站',
    price: 800, minSpots: 2, maxSpots: 3, open: false,
    desc: '細節講好講滿、確保你使用正確方式訓練\n讓大家用划算的價格持續讓身體進步',
    announceSmall: '', showRoster: false
  },
  {
    id: 6, cat: 'pilates', subcat: '器械皮拉提斯',
    dateStr: '2026-05-21', date: '5/21（四）', time: '20:40~21:40',
    title: '市政府器械皮拉提斯團課',
    location: '市政府', locationDetail: '捷運市政府站',
    price: 800, minSpots: 2, maxSpots: 3, open: false,
    desc: '細節講好講滿、確保你使用正確方式訓練\n讓大家用划算的價格持續讓身體進步',
    announceSmall: '', showRoster: false
  },
  {
    id: 7, cat: 'pilates', subcat: '器械皮拉提斯',
    dateStr: '2026-05-22', date: '5/22（五）', time: '18:30~19:30',
    title: '小巨蛋器械皮拉提斯團課',
    location: '小巨蛋', locationDetail: '捷運小巨蛋站5號出口3分鐘',
    price: 800, minSpots: 2, maxSpots: 4, open: false,
    desc: '細節講好講滿、確保你使用正確方式訓練\n讓大家用划算的價格持續讓身體進步',
    announceSmall: '', showRoster: false
  },
  {
    id: 8, cat: 'aerial', subcat: '常態團課',
    dateStr: '2026-05-23', date: '5/23（六）', time: '11:00~12:00',
    title: '常態空瑜',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 500, minSpots: 3, maxSpots: 6, open: true,
    desc: '',
    announceSmall: '', showRoster: false
  },
  {
    id: 9, cat: 'pilates', subcat: '墊上皮拉提斯',
    dateStr: '2026-05-23', date: '5/23（六）', time: '12:15~13:15',
    title: '墊上皮拉提斯',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 500, minSpots: 3, maxSpots: 6, open: true,
    desc: '【5月主題:核心改善圓肩駝背】\n✔透過皮拉提斯式呼吸,釋放肩頸緊繃、穩定脊椎\n✔核心深層肌群的啟動與鍛鍊,減輕腰痛、下背負擔\n✔背部與肩胛肌群訓練,找回肩胛骨中立位,改善上半身體態',
    announceSmall: '', showRoster: false
  },
  {
    id: 10, cat: 'aerial', subcat: '許願加開',
    dateStr: '2026-05-24', date: '5/24（日）', time: '11:30~12:30',
    title: '低空療癒伸展課程',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 600, minSpots: 3, maxSpots: 7, open: true,
    desc: '',
    announceSmall: '', showRoster: false
  },
  {
    id: 11, cat: 'aerial', subcat: '許願加開',
    dateStr: '2026-05-24', date: '5/24（日）', time: '13:00~14:00',
    title: '民權西路站漂亮高空教室',
    location: '民權西路', locationDetail: '捷運民權西路站',
    price: 600, minSpots: 4, maxSpots: 7, open: true,
    desc: '民權西路站漂亮高空教室因租借費用較貴+掛布清潔費，課費為600元/堂',
    announceSmall: '', showRoster: false
  },
  {
    id: 12, cat: 'aerial', subcat: '常態團課',
    dateStr: '2026-05-25', date: '5/25（一）', time: '19:10~20:10',
    title: '常態空瑜',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 500, minSpots: 3, maxSpots: 5, open: true,
    desc: '',
    announceSmall: '', showRoster: false
  },
  {
    id: 13, cat: 'aerial', subcat: '常態團課',
    dateStr: '2026-05-25', date: '5/25（一）', time: '20:20~21:20',
    title: '常態空瑜',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 500, minSpots: 3, maxSpots: 5, open: true,
    desc: '',
    announceSmall: '', showRoster: false
  },
  {
    id: 14, cat: 'aerial', subcat: '常態團課',
    dateStr: '2026-05-26', date: '5/26（二）', time: '19:30~20:30',
    title: '常態空瑜',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 500, minSpots: 3, maxSpots: 5, open: true,
    desc: '',
    announceSmall: '', showRoster: false
  },
  {
    id: 15, cat: 'pilates', subcat: '墊上皮拉提斯',
    dateStr: '2026-05-26', date: '5/26（二）', time: '19:40~20:40',
    title: '墊上皮拉提斯',
    location: '松江南京', locationDetail: '捷運松江南京站',
    price: 500, minSpots: 3, maxSpots: 6, open: true,
    desc: '【5月主題:核心改善圓肩駝背】\n✔透過皮拉提斯式呼吸,釋放肩頸緊繃、穩定脊椎\n✔核心深層肌群的啟動與鍛鍊,減輕腰痛、下背負擔\n✔背部與肩胛肌群訓練,找回肩胛骨中立位,改善上半身體態',
    announceSmall: '', showRoster: false
  },
];

const bookings = {};
courses.forEach(c => bookings[c.id] = []);

// ── LOCALSTORAGE ──
function saveToStorage() {
  try {
    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.setItem('courses_extra', JSON.stringify(
      courses.map(c => ({
        id: c.id, open: c.open, announceSmall: c.announceSmall,
        showRoster: c.showRoster, minSpots: c.minSpots, maxSpots: c.maxSpots,
        title: c.title, dateStr: c.dateStr, date: c.date, time: c.time,
        location: c.location, locationDetail: c.locationDetail,
        price: c.price, desc: c.desc
      }))
    ));
    // 儲存新增的課程（id 超過原始最大值的）
    const extraCourses = courses.filter(c => c.id > 15);
    if (extraCourses.length) {
      localStorage.setItem('courses_added', JSON.stringify(extraCourses));
    }
    // 儲存公告
    localStorage.setItem('categories_announce', JSON.stringify(
      categories.map(c => ({ id: c.id, announceMid: c.announceMid }))
    ));
    localStorage.setItem('homeSections_text', JSON.stringify(
      Object.fromEntries(Object.entries(homeSections).map(([k,v]) => [k, v.text]))
    ));
    localStorage.setItem('globalNotice', document.getElementById('globalNotice').innerHTML);
  } catch(e) { console.warn('儲存失敗', e); }
}

function loadFromStorage() {
  try {
    // 讀取報名名單
    const savedBookings = localStorage.getItem('bookings');
    if (savedBookings) {
      const parsed = JSON.parse(savedBookings);
      Object.assign(bookings, parsed);
    }
    // 讀取課程異動（編輯欄位）
    const savedExtra = localStorage.getItem('courses_extra');
    if (savedExtra) {
      const parsed = JSON.parse(savedExtra);
      parsed.forEach(saved => {
        const c = courses.find(x => x.id === saved.id);
        if (c) Object.assign(c, saved);
      });
    }
    // 讀取新增課程
    const savedAdded = localStorage.getItem('courses_added');
    if (savedAdded) {
      const added = JSON.parse(savedAdded);
      added.forEach(nc => {
        if (!courses.find(c => c.id === nc.id)) {
          courses.push(nc);
          if (!bookings[nc.id]) bookings[nc.id] = [];
        }
      });
    }
    // 讀取公告
    const savedAnnounce = localStorage.getItem('categories_announce');
    if (savedAnnounce) {
      JSON.parse(savedAnnounce).forEach(saved => {
        const cat = categories.find(c => c.id === saved.id);
        if (cat) cat.announceMid = saved.announceMid;
      });
    }
    const savedSections = localStorage.getItem('homeSections_text');
    if (savedSections) {
      const parsed = JSON.parse(savedSections);
      Object.entries(parsed).forEach(([k, v]) => {
        if (homeSections[k]) homeSections[k].text = v;
      });
    }
    const savedNotice = localStorage.getItem('globalNotice');
    if (savedNotice) {
      document.getElementById('globalNotice').innerHTML = savedNotice;
    }
  } catch(e) { console.warn('讀取失敗', e); }
}

let currentCat = 'all';
let currentCourse = null;
let currentView = 'calendar';
let calYear = 2026, calMonth = 4;
let selectedDay = null;

// ── TABS ──
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentView = tab.dataset.view || 'list';
    if (tab.dataset.cat) currentCat = tab.dataset.cat;
    if (currentView === 'calendar') {
      document.getElementById('listView').style.display = 'none';
      document.getElementById('calendarView').style.display = 'block';
      renderCalendar();
    } else {
      document.getElementById('listView').style.display = 'block';
      document.getElementById('calendarView').style.display = 'none';
      selectedDay = null;
      renderList();
    }
  });
});

// ── HELPERS ──
function isAdmin() {
  return document.getElementById('adminBtn').textContent.includes('登出');
}

function buildSpotsHtml(state, remaining, maxSpots) {
  if (state === 'closed')  return `<div class="spots-num full-text">報名<br>已關閉</div>`;
  if (state === 'full')    return `<div class="spots-num full-text">已滿班</div><div class="spots-label">(${maxSpots}人滿班)</div>`;
  if (state === 'pending') return `<div class="spots-num full-text" style="font-size:0.85rem">待開班</div><div class="spots-label">餘 ${remaining} 位</div>`;
  return `<div class="spots-num">${remaining}</div><div class="spots-label">剩餘名額</div>`;
}

function buildAnnounceHtml(cat, course) {
  const mid = (cat && cat.announceMid)
    ? `<div class="modal-announce-mid"><div class="announce-title">📢 課程公告</div>${cat.announceMid}</div>` : '';
  const small = course.announceSmall
    ? `<div class="modal-announce-small"><div class="announce-title">📌 課程備註</div>${course.announceSmall}</div>` : '';
  return mid + small;
}

function catLabel(catId) {
  return catId === 'pilates' ? '皮拉提斯' : '空中瑜珈';
}

// ── STATUS ──
function courseStatus(c) {
  if (!c.open) return { state: 'closed', remaining: 0 };
  const booked   = (bookings[c.id] || []).length;
  const maxSpots = c.maxSpots || 6;
  const minSpots = c.minSpots ?? c.spots ?? 0;
  const remaining = maxSpots - booked;
  if (remaining <= 0)    return { state: 'full',    remaining: 0 };
  if (booked < minSpots) return { state: 'pending', remaining };
  return { state: 'open', remaining };
}

// ── LIST VIEW ──
function renderList() {
  const wrap = document.getElementById('listView');
  wrap.innerHTML = '';

  function buildCard(c) {
    const { state, remaining } = courseStatus(c);
    const isFull = state === 'full' || state === 'closed';
    const dotClass = state === 'open'    ? 'dot-available'
                   : state === 'pending' ? 'dot-few'
                   : 'dot-full';

    let spotsHtml = buildSpotsHtml(state, remaining, c.maxSpots);

    const wrapper = document.createElement('div');
    wrapper.className = 'course-card-wrap';

    const card = document.createElement('div');
    card.className = 'course-card' + (isFull ? ' full' : '');
    card.innerHTML = `
      <div class="card-dot ${dotClass}"></div>
      <div class="card-body">
        <div class="card-date">${c.date} ${c.time}</div>
        <div class="card-title">${c.title}</div>
        <div class="card-location">📍 ${c.location}</div>
        ${isAdmin() ? `<div style="display:flex;gap:6px;margin-top:4px"><button class="edit-toggle-btn" id="cardEditBtn_${c.id}">✏️ 編輯</button><button class="edit-toggle-btn" id="ccopy_${c.id}">📋 複製</button></div>` : ''}
      </div>
      <div class="card-spots">${spotsHtml}</div>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.edit-toggle-btn')) return;
      openModal(c);
    });
    wrapper.appendChild(card);

    if (isAdmin()) {
      const bookedList = bookings[c.id];
      const editSection = document.createElement('div');
      editSection.id = `cardEdit_${c.id}`;
      editSection.className = 'card-edit-section hidden';
      editSection.innerHTML = `
        <div class="admin-card card-edit-inner">
          <div class="cei-row">
            <span class="cei-label">課程名稱</span>
            <input type="text" class="cei-input" id="ctitle_${c.id}" value="${c.title}">
          </div>
          <div class="cei-row">
            <span class="cei-label">日期</span>
            <input type="date" class="cei-input" id="cdateStr_${c.id}" value="${c.dateStr}">
          </div>
          <div class="cei-row">
            <span class="cei-label">時間</span>
            <input type="text" class="cei-input" id="ctime_${c.id}" value="${c.time}" placeholder="20:30~21:30">
          </div>
          <div class="cei-row">
            <span class="cei-label">地點</span>
            <input type="text" class="cei-input" id="cloc_${c.id}" value="${c.location}">
          </div>
          <div class="admin-announce cei-textarea-block">
            <div class="admin-announce-label">地點說明</div>
            <textarea id="clocDetail_${c.id}" rows="2" placeholder="例：捷運松江南京站走路3分鐘，留空則不顯示">${c.locationDetail}</textarea>
          </div>
          <div class="cei-row">
            <span class="cei-label">價格</span>
            <input type="number" class="cei-input" id="cprice_${c.id}" value="${c.price}">
          </div>
          <div class="cei-spots-section">
            <div class="cei-spots-header">
              <span class="cei-label">名額</span>
              <div class="toggle-row">
                <span class="toggle-label" id="cardTlabel_${c.id}">${c.open ? '開放報名' : '關閉報名'}</span>
                <label class="toggle">
                  <input type="checkbox" id="cardToggle_${c.id}" ${c.open ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="cei-spots-row">
              <span class="spots-unit">開班門檻</span>
              <input type="number" class="spots-input" id="cspots_${c.id}" value="${c.minSpots ?? c.spots ?? 0}" min="0">
              <span class="spots-unit">人</span>
              <span class="spots-unit cei-spots-gap">滿班人數</span>
              <input type="number" class="spots-input" id="cmaxspots_${c.id}" value="${c.maxSpots}" min="1">
              <span class="spots-unit">人</span>
            </div>
          </div>
          <div class="admin-announce cei-textarea-block">
            <div class="admin-announce-label">課程說明</div>
            <textarea id="cdesc_${c.id}" rows="3" placeholder="用於說明課程內容、適合對象等，留空則不顯示">${c.desc}</textarea>
          </div>
          <div class="admin-announce cei-textarea-block">
            <div class="admin-announce-label">📌 課程備註（小公告）</div>
            <textarea id="csmall_${c.id}" placeholder="課程專屬備註，留空不顯示">${c.announceSmall}</textarea>
            <button class="save-announce" id="csaveSmall_${c.id}">儲存備註</button>
          </div>
          <button class="save-announce cei-save-main" id="csaveCourse_${c.id}">儲存</button>
          <div class="roster-list">
            <div class="roster-section-title">
              已報名學員（${bookedList.length} 人）
               <span class="toggle-label roster-visibility-label" id="showRosterLabel_${c.id}">${c.showRoster ? '學員可見' : '學員不可見'}</span>
               <label class="toggle roster-visibility-toggle">
                <input type="checkbox" id="showRosterToggle_${c.id}" ${c.showRoster ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
             
            </div>
            ${bookedList.length === 0
              ? '<div class="no-roster">尚無報名</div>'
              : bookedList.map((b,i) => `
                <div class="roster-item">
                  <div><span class="roster-name">${i+1}. ${b.name}</span>${b.phone ? `　<span class="roster-phone">${b.phone}</span>` : ''}</div>
                  <div class="roster-time">報名於 ${b.time}</div>
                </div>`).join('')}
          </div>
        </div>
      `;
      wrapper.appendChild(editSection);

      card.querySelector(`#cardEditBtn_${c.id}`).addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !editSection.classList.contains('hidden');
        editSection.classList.toggle('hidden', isOpen);
        e.target.textContent = isOpen ? '✏️ 編輯' : '✕ 收起';
        card.classList.toggle('card-editing', !isOpen);
      });

      editSection.querySelector(`#cardToggle_${c.id}`).addEventListener('change', function() {
        c.open = this.checked;
        document.getElementById(`cardTlabel_${c.id}`).textContent = c.open ? '開放報名' : '關閉報名';
      });
      editSection.querySelector(`#csaveSmall_${c.id}`).addEventListener('click', () => {
        c.announceSmall = editSection.querySelector(`#csmall_${c.id}`).value.trim();
        saveToStorage();
        alert('備註已儲存！');
      });

      editSection.querySelector(`#csaveCourse_${c.id}`).addEventListener('click', () => {
        c.title = editSection.querySelector(`#ctitle_${c.id}`).value.trim();
        const dateVal = editSection.querySelector(`#cdateStr_${c.id}`).value.trim();
        c.dateStr = dateVal;
        if (dateVal) {
          const [y, m, d] = dateVal.split('-');
          const DOW_CHARS = ['日','一','二','三','四','五','六'];
          const dow = new Date(+y, +m-1, +d).getDay();
          c.date = `${+m}/${+d}（${DOW_CHARS[dow]}）`;
        }
        c.time = editSection.querySelector(`#ctime_${c.id}`).value.trim();
        c.location = editSection.querySelector(`#cloc_${c.id}`).value.trim();
        c.locationDetail = editSection.querySelector(`#clocDetail_${c.id}`).value.trim();
        c.price = parseInt(editSection.querySelector(`#cprice_${c.id}`).value) || 0;
        const spotsVal = parseInt(editSection.querySelector(`#cspots_${c.id}`).value);
        const maxVal = parseInt(editSection.querySelector(`#cmaxspots_${c.id}`).value);
        if (!isNaN(spotsVal) && spotsVal >= 0) c.minSpots = spotsVal;
        if (!isNaN(maxVal) && maxVal >= 1) c.maxSpots = maxVal;
        c.open = editSection.querySelector(`#cardToggle_${c.id}`).checked;
        c.desc = editSection.querySelector(`#cdesc_${c.id}`).value.trim();
        saveToStorage();
        alert(`已儲存「${c.title}」`);
      });

      editSection.querySelector(`#showRosterToggle_${c.id}`).addEventListener('change', function() {
        c.showRoster = this.checked;
        document.getElementById(`showRosterLabel_${c.id}`).textContent = c.showRoster ? '學員可見' : '學員不可見';
      });

      card.querySelector(`#ccopy_${c.id}`).addEventListener('click', (e) => {
        e.stopPropagation();
        const adminTabs = document.querySelectorAll('.admin-tab');
        adminTabs.forEach(b => b.classList.remove('active'));
        const courseTab = [...adminTabs].find(b => b.dataset.tab === 'course');
        if (courseTab) {
          courseTab.classList.add('active');
          document.getElementById('adminHomeSection').style.display = 'none';
          document.getElementById('adminCourseSection').style.display = 'block';
        }
        setTimeout(() => {
          const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
          setVal('newTitle', c.title);
          setVal('newDateStr', '');
          setVal('newTime', c.time);
          setVal('newLoc', c.location);
          setVal('newLocDetail', c.locationDetail);
          setVal('newPrice', c.price);
          setVal('newMinSpots', c.minSpots ?? 0);
          setVal('newMaxSpots', c.maxSpots);
          setVal('newDesc', c.desc);
          const catSel = document.getElementById('newCat');
          if (catSel) {
            catSel.value = c.cat;
            catSel.dispatchEvent(new Event('change'));
            setTimeout(() => {
              const subSel = document.getElementById('newSubcat');
              if (subSel) subSel.value = c.subcat;
            }, 50);
          }
          const openChk = document.getElementById('newOpen');
          if (openChk) {
            openChk.checked = c.open;
            document.getElementById('newOpenLabel').textContent = c.open ? '開放報名' : '關閉報名';
          }
          document.getElementById('confirmAddCourse')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      });
    }

    return wrapper;
  }

  if (currentCat === 'all') {
    const sorted = [
  ...courses
    .filter(c => { const s = courseStatus(c).state; return s === 'open' || s === 'pending'; })
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
  ...courses
    .filter(c => { const s = courseStatus(c).state; return s === 'full' || s === 'closed'; })
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
    ];

    const list = document.createElement('div');
    list.className = 'course-list';
    sorted.forEach(c => list.appendChild(buildCard(c)));
    wrap.appendChild(list);

  } else {
    const catsToShow = categories.filter(cat => cat.id === currentCat);
    catsToShow.forEach(cat => {
      let catCourses = courses.filter(c => c.cat === cat.id);
      catCourses = [
  ...catCourses
    .filter(c => { const s = courseStatus(c).state; return s === 'open' || s === 'pending'; })
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
  ...catCourses
    .filter(c => { const s = courseStatus(c).state; return s === 'full' || s === 'closed'; })
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
];

      const hdr = document.createElement('div');
      hdr.className = 'section-header';
      hdr.innerHTML = `<div class="section-title">${cat.label}</div><div class="section-line"></div>`;
      wrap.appendChild(hdr);

      if (cat.announceMid) {
        const mid = document.createElement('div');
        mid.className = 'announce-mid';
        mid.innerHTML = `<div class="announce-mid-title">📢 課程公告</div>${cat.announceMid}`;
        wrap.appendChild(mid);
      }

      const list = document.createElement('div');
      list.className = 'course-list';
      catCourses.forEach(c => list.appendChild(buildCard(c)));
      wrap.appendChild(list);
    });
  }
}

// ── CALENDAR ──
const DOW = ['日','一','二','三','四','五','六'];
const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function renderCalendar() {
  const title = document.getElementById('calTitle');
  const grid = document.getElementById('calGrid');
  title.textContent = `${calYear}年 ${MONTHS[calMonth]}`;
  grid.innerHTML = '';

  DOW.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-dow';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayCourses = courses.filter(c => c.dateStr === dateStr);
    const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
    const isSelected = selectedDay === dateStr;

    const el = document.createElement('div');
    el.className = 'cal-day' + (dayCourses.length ? ' has-course' : '') + (isToday ? ' today' : '');
    if (isSelected) el.style.background = 'var(--rose-light)';

    const numEl = document.createElement('div');
    numEl.className = 'cal-day-num';
    numEl.textContent = d;
    el.appendChild(numEl);

    if (dayCourses.length) {
      const dotRow = document.createElement('div');
      dotRow.className = 'cal-dot-row';
      dayCourses.forEach(c => {
        const { state } = courseStatus(c);
        const dot = document.createElement('div');
        dot.className = 'cal-dot ' + (state === 'open' ? 'available' : state === 'pending' ? 'few' : 'full');
        dotRow.appendChild(dot);
      });
      el.appendChild(dotRow);

      el.addEventListener('click', () => {
        selectedDay = selectedDay === dateStr ? null : dateStr;
        renderCalendar();
        renderDayDetail(dateStr, dayCourses);
      });
    }

    grid.appendChild(el);
  }

  if (selectedDay) {
    const dayCourses = courses.filter(c => c.dateStr === selectedDay);
    if (dayCourses.length) renderDayDetail(selectedDay, dayCourses);
  } else {
    document.getElementById('dayDetail').innerHTML = '';
  }
}

// ── DAY DETAIL ──
function renderDayDetail(dateStr, dayCourses) {
  const detail = document.getElementById('dayDetail');
  if (!dayCourses.length) { detail.innerHTML = ''; return; }

  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(+y, +m-1, +d);
  const label = `${+m}月${+d}日（${DOW[dateObj.getDay()]}）`;

  let html = `<div class="day-detail"><div class="day-detail-title">📅 ${label} 的課程</div>`;
  dayCourses.forEach(c => {
    const { state, remaining } = courseStatus(c);
    const isFull = state === 'closed' || state === 'full';
    const dotColor = state === 'open' ? 'var(--rose)' : state === 'pending' ? 'var(--gold)' : '#ccc';
    const spotsText = state === 'closed' ? '已關閉' : state === 'full' ? '已滿班' : state === 'pending' ? `待開班・餘 ${remaining} 位` : `餘 ${remaining} 位`;

    html += `
      <div class="day-course-item ${isFull ? 'is-full' : ''}" data-id="${c.id}">
        <div class="dci-dot" style="background:${dotColor}"></div>
        <div class="dci-body">
          <div class="dci-time">${c.time}</div>
          <div class="dci-name">${c.title}</div>
          <div class="dci-loc">📍 ${c.location}</div>
        </div>
        <div class="dci-spots">${spotsText}</div>
      </div>`;
  });
  html += '</div>';
  detail.innerHTML = html;

  detail.querySelectorAll('.day-course-item:not(.is-full)').forEach(el => {
    el.addEventListener('click', () => {
      const c = courses.find(x => x.id === +el.dataset.id);
      if (c) openModal(c);
    });
  });
}

document.getElementById('calPrev').addEventListener('click', () => {
  calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
  selectedDay = null; renderCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
  calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
  selectedDay = null; renderCalendar();
});

// ── MODAL ROSTER (admin) ──
function renderModalRoster(course) {
  const list = bookings[course.id];
  const itemsHtml = list.length === 0
    ? '<div class="modal-no-roster">尚無報名學員</div>'
    : list.map((b, i) => `
        <div class="modal-roster-item" data-index="${i}">
          <div>
            <span class="modal-roster-name">${i + 1}. ${b.name}</span>
            ${b.phone ? `<span class="modal-roster-phone">${b.phone}</span>` : ''}
          </div>
          <button class="modal-delete-btn" data-index="${i}">🗑</button>
        </div>`).join('');

  return `
      <div class="modal-roster-title">已報名學員（${list.length} 人）</div>
      <div id="modalRosterItems">${itemsHtml}</div>
      <button class="modal-add-btn" id="modalAddBtn">＋ 手動新增</button>
      <div class="modal-add-form" id="modalAddForm">
        <input type="text" id="modalAddName" placeholder="姓名" maxlength="20">
        <input type="tel" id="modalAddPhone" placeholder="聯絡電話（選填）" maxlength="15">
        <button class="btn-primary" id="modalAddConfirm">新增</button>
      </div>
    </div>`;
}

function bindModalRosterEvents(course) {

  // 刪除
  document.querySelectorAll('.modal-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      bookings[course.id].splice(idx, 1);
      saveToStorage();
      openModal(course);
      if (currentView === 'calendar') renderCalendar(); else renderList();
    });
  });

  // 展開新增表單
  document.getElementById('modalAddBtn').addEventListener('click', () => {
    const form = document.getElementById('modalAddForm');
    const isOpen = form.classList.contains('open');
    form.classList.toggle('open', !isOpen);
    document.getElementById('modalAddBtn').textContent = isOpen ? '＋ 手動新增' : '✕ 取消';
  });

  // 確認新增
  document.getElementById('modalAddConfirm').addEventListener('click', () => {
    const name = document.getElementById('modalAddName').value.trim();
    if (!name) {
      document.getElementById('modalAddName').style.borderColor = '#e74c3c';
      document.getElementById('modalAddName').focus();
      return;
    }
    const phone = document.getElementById('modalAddPhone').value.trim();
    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    bookings[course.id].push({ name, phone, time: now });
    saveToStorage();
    openModal(course);
    if (currentView === 'calendar') renderCalendar(); else renderList();
  });
}

// ── MODAL ──
function openModal(course) {
  currentCourse = course;
  const { state, remaining } = courseStatus(course);
  const isFull = state === 'full' || state === 'closed';
  const isPending = state === 'pending';

  // 中公告 + 小公告
  const cat = categories.find(c => c.id === course.cat);
  const announceHtml = buildAnnounceHtml(cat, course);

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-tag">${catLabel(course.cat)}</div>
    <div class="modal-title">${course.title}</div>
    <div class="modal-meta">
      <span>📅 ${course.date} ${course.time}</span>
      <span>📍 ${course.location}・${course.locationDetail}</span>
    </div>
    <div class="modal-price">
      <div class="price-label">課程費用</div>
      <div class="price-amount">$${course.price}<span class="price-per-person">/人</span></div>
    </div>
    <div class="modal-desc">${course.desc}</div>
    ${announceHtml}
    <div class="spots-display">
      <div class="spots-big ${isFull ? 'zero' : ''}">${isFull ? '✕' : remaining}</div>
      <div class="spots-sub">${isFull ? '本堂已滿班' : isPending ? `待開班・共${course.maxSpots}人` : `剩餘名額（共${course.maxSpots}人）`}</div>
    </div>
    ${course.showRoster && !isAdmin() ? `
  <div class="modal-roster">
    <div class="modal-roster-title">已報名學員（${bookings[course.id].length} 人）</div>
    <div>${bookings[course.id].map((b,i) => `<div class="modal-roster-item"><span class="modal-roster-name">${i+1}. ${b.name}</span></div>`).join('')}</div>
  </div>
` : ''}
${isAdmin() ? renderModalRoster(course) : (!isFull ? `
    <div class="booking-form" id="bookingForm">
      <input type="text" id="bookName" placeholder="你的姓名" maxlength="20">
      <input type="tel" id="bookPhone" placeholder="聯絡電話（選填）" maxlength="15">
      <button class="btn-primary" id="confirmBtn">確認報名</button>
    </div>` : `
    <div class="full-notice">本班已額滿，如有需要請向老師詢問候補 🙏</div>
    `)}
    <button class="btn-close" id="closeModalBtn">關閉</button>
  `;

  if (isAdmin()) {
    bindModalRosterEvents(course);
  } else {
    if (!isFull) document.getElementById('confirmBtn').addEventListener('click', handleBooking);
  }
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('overlay').classList.add('open');
}

// ── BOOKING ──
function handleBooking() {
  const name = document.getElementById('bookName').value.trim();
  if (!name) {
    document.getElementById('bookName').style.borderColor = '#e74c3c';
    document.getElementById('bookName').focus();
    return;
  }
  const phone = document.getElementById('bookPhone').value.trim();
  const now = new Date().toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit'});
  bookings[currentCourse.id].push({ name, phone, time: now });
  saveToStorage();

  document.getElementById('modalContent').innerHTML = `
    <div class="success-box">
      <div class="success-icon">💮</div>
      <h3>報名成功！</h3>
      <p>${currentCourse.date} ${currentCourse.time}<br>${currentCourse.title}<br><br>期待在課堂上見到你 ✨</p>
      <button class="btn-primary btn-full-mt" id="closeAfterBook">完成</button>
    </div>
  `;
  document.getElementById('closeAfterBook').addEventListener('click', () => {
    closeModal();
    if (currentView === 'calendar') renderCalendar();
    else renderList();
  });
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  currentCourse = null;
}
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) closeModal();
});

// ── LOGIN ──
document.getElementById('adminBtn').addEventListener('click', () => {
  if (document.getElementById('adminBtn').textContent.includes('登出')) {
    document.getElementById('adminBtn').textContent = '老師登入';
    alert('已登出！');
    document.getElementById('adminPanel').classList.remove('open');
    if (currentView === 'calendar') renderCalendar(); else renderList();
    return;
  }
  document.getElementById('loginOverlay').classList.add('open');
  document.getElementById('pwInput').value = '';
  document.getElementById('loginError').textContent = '';
  setTimeout(() => document.getElementById('pwInput').focus(), 100);
});
document.getElementById('loginCancel').addEventListener('click', () => {
  document.getElementById('loginOverlay').classList.remove('open');
});
document.getElementById('loginConfirm').addEventListener('click', doLogin);
document.getElementById('pwInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
function doLogin() {
  const pw = document.getElementById('pwInput').value;
  if (pw === '1234') {
    document.getElementById('loginOverlay').classList.remove('open');
    document.getElementById('adminBtn').textContent = '🔓 登出';
    isLoggedIn = true;
    const splash = document.getElementById('loginSuccess');
    splash.style.display = 'flex';
    setTimeout(() => {
      splash.style.display = 'none';
      openAdmin();
      if (currentView === 'calendar') renderCalendar(); else renderList();
    }, 1500);
  } else {
    document.getElementById('loginError').textContent = '密碼錯誤，請再試一次';
    document.getElementById('pwInput').value = '';
    document.getElementById('pwInput').focus();
  }
}

// ── ADMIN ──
document.getElementById('closeAdmin').addEventListener('click', () => {
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('adminBtn').textContent = '老師登入';
  if (currentView === 'calendar') renderCalendar(); else renderList();
});

function openAdmin() {
  renderAdmin();
  document.getElementById('adminPanel').classList.add('open');
}

function renderAdmin() {
  const body = document.getElementById('adminBody');
  body.innerHTML = '';

  // ── 後台 tab ──
  let currentAdminTab = 'home';

  const tabBar = document.createElement('div');
  tabBar.className = 'admin-tab-bar';
  tabBar.innerHTML = `
    <button class="admin-tab active" data-tab="home">首頁管理</button>
    <button class="admin-tab" data-tab="course">課程管理</button>
  `;
  body.appendChild(tabBar);

  const homeSection = document.createElement('div');
  homeSection.id = 'adminHomeSection';

  const courseSection = document.createElement('div');
  courseSection.id = 'adminCourseSection';
  courseSection.style.display = 'none';

  body.appendChild(homeSection);
  body.appendChild(courseSection);

  tabBar.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.tab === 'home') {
        homeSection.style.display = 'block';
        courseSection.style.display = 'none';
      } else {
        homeSection.style.display = 'none';
        courseSection.style.display = 'block';
      }
    });
  });

  // ── 首頁管理 ──
  function renderHomeSection() {
    homeSection.innerHTML = '';

    // 大公告
    const bigTitle = document.createElement('div');
    bigTitle.className = 'admin-section-title';
    bigTitle.textContent = '首頁大公告';
    homeSection.appendChild(bigTitle);

    const bigCard = document.createElement('div');
    bigCard.className = 'admin-card';
    bigCard.innerHTML = `
      <div class="admin-announce">
        <div class="admin-hint">顯示在首頁最上方</div>
        <textarea id="bigAnnounce" placeholder="留空則不顯示">${document.getElementById('globalNotice').innerText}</textarea>
        <button class="save-announce" id="saveBigAnn">儲存</button>
      </div>
    `;
    homeSection.appendChild(bigCard);
    document.getElementById('saveBigAnn').addEventListener('click', () => {
      document.getElementById('globalNotice').innerHTML = document.getElementById('bigAnnounce').value.trim();
      saveToStorage();
      alert('大公告已儲存！');
    });

    // 首頁區塊
    Object.values(homeSections).forEach(s => {
      const secTitle = document.createElement('div');
      secTitle.className = 'admin-section-title';
      secTitle.textContent = `${s.icon} ${s.title}`;
      homeSection.appendChild(secTitle);

      const secCard = document.createElement('div');
      secCard.className = 'admin-card';
      secCard.innerHTML = `
        <div class="admin-announce">
          <div class="admin-hint">顯示在首頁「${s.title}」區塊</div>
          <textarea id="sec_${s.id}" placeholder="留空則只顯示標題" rows="5">${s.text}</textarea>
          <button class="save-announce" id="saveBtn_${s.id}">儲存</button>
        </div>
      `;
      homeSection.appendChild(secCard);
      document.getElementById(`saveBtn_${s.id}`).addEventListener('click', () => {
        s.text = document.getElementById(`sec_${s.id}`).value.trim();
        renderHomeSections();
        saveToStorage();
        alert(`「${s.title}」已儲存！`);
      });
    });
  }

  // ── 課程管理 ──
  function renderCourseSection() {
    courseSection.innerHTML = '';

    // 課程公告
    const midTitle = document.createElement('div');
    midTitle.className = 'admin-section-title';
    midTitle.textContent = '課程公告管理';
    courseSection.appendChild(midTitle);

    categories.forEach(cat => {
      const midCard = document.createElement('div');
      midCard.className = 'admin-card';
      const midId = `mid_${cat.id}`;
      midCard.innerHTML = `
        <div class="admin-card-title">${cat.label}</div>
        <button class="edit-toggle-btn" id="editMidBtn_${cat.id}">✏️ 編輯公告</button>
        <div class="edit-section" id="editMidSection_${cat.id}" style="display:none">
          <div class="admin-announce admin-announce-spaced">
            <div class="admin-hint">📢 顯示在該類別課程上方</div>
            <textarea id="${midId}" placeholder="留空則不顯示">${cat.announceMid}</textarea>
            <button class="save-announce" id="saveMid_${cat.id}">儲存</button>
          </div>
        </div>
      `;
      courseSection.appendChild(midCard);

      document.getElementById(`editMidBtn_${cat.id}`).addEventListener('click', () => {
        const sec = document.getElementById(`editMidSection_${cat.id}`);
        const btn = document.getElementById(`editMidBtn_${cat.id}`);
        const isOpen = sec.style.display !== 'none';
        sec.style.display = isOpen ? 'none' : 'block';
        btn.textContent = isOpen ? '✏️ 編輯公告' : '✕ 收起';
      });
      document.getElementById(`saveMid_${cat.id}`).addEventListener('click', () => {
        cat.announceMid = document.getElementById(midId).value.trim();
        saveToStorage();
        alert(`已儲存「${cat.label}」課程公告`);
      });
    });

    // 新增課程
    const addTitle = document.createElement('div');
    addTitle.className = 'admin-section-title';
    addTitle.textContent = '💡 新增課程';
    courseSection.appendChild(addTitle);

    const addCard = document.createElement('div');
    addCard.className = 'admin-card card-edit-inner';
    addCard.style.borderRadius = 'var(--radius)'; 

    const catOptions = categories.map(cat =>
      `<option value="${cat.id}">${cat.label}</option>`
    ).join('');

    const firstCat = categories[0];
    const subcatOptions = firstCat.subcats.map(s =>
      `<option value="${s}">${s}</option>`
    ).join('');

    addCard.innerHTML = `
      <div class="cei-row">
        <span class="cei-label">分類</span>
        <select class="cei-input" id="newCat">${catOptions}</select>
      </div>
      <div class="cei-row">
        <span class="cei-label">子分類</span>
        <select class="cei-input" id="newSubcat">${subcatOptions}</select>
      </div>
      <div class="cei-row">
        <span class="cei-label">課程名稱</span>
        <input type="text" class="cei-input" id="newTitle" placeholder="例：常態空瑜">
      </div>
      <div class="cei-row">
        <span class="cei-label">日期</span>
        <input type="date" class="cei-input" id="newDateStr">
      </div>
      <div class="cei-row">
        <span class="cei-label">時間</span>
        <input type="text" class="cei-input" id="newTime" placeholder="20:30~21:30">
      </div>
      <div class="cei-row">
        <span class="cei-label">地點</span>
        <input type="text" class="cei-input" id="newLoc" placeholder="例：松江南京">
      </div>
      <div class="admin-announce cei-textarea-block">
        <div class="admin-announce-label">地點說明</div>
        <textarea id="newLocDetail" rows="2" placeholder="例：捷運松江南京站走路3分鐘，留空則不顯示"></textarea>
      </div>
      <div class="cei-row">
        <span class="cei-label">價格</span>
        <input type="number" class="cei-input" id="newPrice" value="500">
      </div>
      <div class="cei-spots-section">
        <div class="cei-spots-header">
          <span class="cei-label">開放報名</span>
          <div class="toggle-row">
            <span class="toggle-label" id="newOpenLabel">開放報名</span>
            <label class="toggle">
              <input type="checkbox" id="newOpen" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="cei-spots-row">
          <span class="spots-unit">開班門檻</span>
          <input type="number" class="spots-input" id="newMinSpots" value="3" min="0">
          <span class="spots-unit">人</span>
          <span class="spots-unit cei-spots-gap">滿班人數</span>
          <input type="number" class="spots-input" id="newMaxSpots" value="6" min="1">
          <span class="spots-unit">人</span>
        </div>
      </div>
      <div class="admin-announce cei-textarea-block">
        <div class="admin-announce-label">課程說明</div>
        <textarea id="newDesc" rows="3" placeholder="用於說明課程內容、適合對象等，留空則不顯示"></textarea>
      </div>
      <button class="save-announce cei-save-main" id="confirmAddCourse">＋ 新增課程</button>
    `;
    courseSection.appendChild(addCard);

    document.getElementById('newCat').addEventListener('change', function() {
      const cat = categories.find(c => c.id === this.value);
      const sub = document.getElementById('newSubcat');
      sub.innerHTML = cat.subcats.map(s => `<option value="${s}">${s}</option>`).join('');
    });

    document.getElementById('newOpen').addEventListener('change', function() {
      document.getElementById('newOpenLabel').textContent = this.checked ? '開放報名' : '關閉報名';
    });

    document.getElementById('confirmAddCourse').addEventListener('click', () => {
      const dateVal = document.getElementById('newDateStr').value;
      const titleVal = document.getElementById('newTitle').value.trim();
      if (!titleVal || !dateVal) {
        alert('請填寫課程名稱和日期！');
        return;
      }
      const DOW_CHARS = ['日','一','二','三','四','五','六'];
      const [y, m, d] = dateVal.split('-');
      const dow = new Date(+y, +m-1, +d).getDay();
      const dateLabel = `${+m}/${+d}（${DOW_CHARS[dow]}）`;
      const newId = Math.max(...courses.map(c => c.id)) + 1;
      const newCourse = {
        id: newId,
        cat: document.getElementById('newCat').value,
        subcat: document.getElementById('newSubcat').value,
        dateStr: dateVal,
        date: dateLabel,
        time: document.getElementById('newTime').value.trim(),
        title: titleVal,
        location: document.getElementById('newLoc').value.trim(),
        locationDetail: document.getElementById('newLocDetail').value.trim(),
        price: parseInt(document.getElementById('newPrice').value) || 0,
        minSpots: parseInt(document.getElementById('newMinSpots').value) || 0,
        maxSpots: parseInt(document.getElementById('newMaxSpots').value) || 6,
        open: document.getElementById('newOpen').checked,
        desc: document.getElementById('newDesc').value.trim(),
        announceSmall: '',
        showRoster: false,
      };
      courses.push(newCourse);
      bookings[newId] = [];
      saveToStorage();
      if (currentView === 'calendar') renderCalendar(); else renderList();
      alert(`「${titleVal}」已新增！`);
      renderCourseSection();
    });
  }

  renderHomeSection();
  renderCourseSection();
}

// ── HOMEPAGE SECTIONS ──
function renderHomeSections() {
  Object.values(homeSections).forEach(s => {
    const el = document.getElementById(s.id);
    if (!el) return;
    el.innerHTML = `<div class="rules-title">${s.icon} ${s.title}</div>${s.text ? `<div class="rules-body">${s.text.replace(/\n/g, '<br>')}</div>` : ''}`;
  });
}

// ── INIT初始化 ──
loadFromStorage();
renderCalendar();
renderHomeSections();
