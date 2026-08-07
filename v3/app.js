// FIRESTORE 資料結構
//
// teachers/
//   {teacherId}/
//     info        → 老師基本資料
//     settings/   → 公告、首頁區塊
//     courses/    → 課程列表
//     students/
//       {userId}/
//         name            → 學生姓名
//         email           → 學生 email
//         remainingCredits → 未用堂數
//         orders/         → 訂單紀錄
//           {orderId}/
//             courses[]   → 報名的課程
//             status      → pending / confirmed / cancelled
//             amount      → 老師填的金額
//             note        → 備註
//
// users/
//   {userId}/
//     profile     → 姓名、email
//     bookings/   → 報名了哪些老師的哪些課
//
// ══════════════════════════════════════════
//
// ⚠️ TODO：目前 teacherId 寫死為測試值 'test_aerial'
//    等 Google 登入完成後，改為動態讀取登入者的 uid
//    const teacherId = auth.currentUser.uid;
//
// ══════════════════════════════════════════

// ── FIREBASE ──
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2pcS4xZViD7bhP8OpXK-tYAh851szUIE",
  authDomain: "bookingtest-aa55e.firebaseapp.com",
  projectId: "bookingtest-aa55e",
  storageBucket: "bookingtest-aa55e.firebasestorage.app",
  messagingSenderId: "828880797363",
  appId: "1:828880797363:web:a8baef6bc10fab70cbbac6"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

let teacherId = null;        // 動態從 admins/{uid}.teacherId 拿
let teacherName = null;     // 從 admins/{uid}.name 拿
let currentTeacher = null;  // Google 登入的老師（Firebase User）
let currentStudent = null;  // Google 登入的學生
let studentOrders = [];     // 學生登入後從 users/{uid}/orders/ 撈回來的訂單
let currentStudentCredits = {}; // 學生登入後自己的未用堂數（從 users/{uid}.remainingCredits 讀，v3.3 第二階段）

// ── CART ──
const TEACHER_ID_STATIC = 'test_aerial';
let cart = []; // [{ courseId, title, date, time, price }]

// ── DATA ──

// ══════════════════════════════════════════
// 公告分三層：
//   大公告 → 全站 banner，直接寫在 index.html #globalNoticeWrap
//   中公告 → 按課程類別，存在 categories[].announceMid
//   小公告 → 每堂課自己的備註，存在 courses[].announceSmall
// ══════════════════════════════════════════

// 大公告：放首頁 banner（在 index.html 直接寫）

// 中公告：按課程類別
const categories = [
  {
    id: 'pilates',
    label: '皮拉提斯',
    subcats: ['器械皮拉提斯', '墊上皮拉提斯'],
    announceMid: '因教室租借費用調漲，費用有調整喔🙏'
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

// 小公告：每堂課自己的備註（announceSmall）
// → 顯示在課程 modal 的「課程備註」區塊
// → 管理員可在課程卡的編輯區塊單獨儲存，不影響其他課程資料
let courses = [
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

// bookings：本地暫存各課程的報名名單
// 格式：{ [courseId]: [{ name, phone, time }, ...] }
// 初始化時以課程 id 為 key，預設空陣列
const bookings = {};
courses.forEach(c => bookings[c.id] = []);

// ── FIRESTORE ──

// ══════════════════════════════════════════
// Firestore 文件路徑：
//   teachers/{teacherId}/settings/bookings
//   teachers/{teacherId}/settings/courses_extra
//   teachers/{teacherId}/settings/courses_added
//   teachers/{teacherId}/settings/categories_announce
//   teachers/{teacherId}/settings/homeSections_text
//   teachers/{teacherId}/settings/globalNotice
// ══════════════════════════════════════════

function teacherDoc(name) {
  return doc(db, 'teachers', teacherId, 'settings', name);
}

// ══════════════════════════════════════════
// ── 堂數池 (v3.3) ──
// Firestore: teachers/{teacherId}/students/{studentId}
//   name              → 學生姓名（方便老師端不用每次都查訂單）
//   remainingCredits  → { [poolKey]: 未用堂數 }
// 同步鏡射一份到 users/{studentId}.remainingCredits，供學生端讀取（v3.3 第二階段用）
// ══════════════════════════════════════════

// 判斷一堂課歸屬哪個堂數池：
//   空中瑜珈－常態團課：固定 key，彼此互通（不管課程名稱）
//   其他所有類別（含空瑜許願加開）：用課名本身當 key，需同名稱才互通
function getPoolKey(course) {
  if (!course) return '';
  if (course.cat === 'aerial' && course.subcat === '常態團課') return 'aerial_regular';
  return course.title || '';
}

// poolKey 轉成給老師看的顯示文字
function poolLabel(poolKey) {
  return poolKey === 'aerial_regular' ? '空瑜常態團課' : poolKey;
}

// 目前系統中所有課程涵蓋到的 poolKey（供手動調整下拉選單使用）
function allPoolKeys() {
  const set = new Set();
  courses.forEach(c => set.add(getPoolKey(c)));
  return [...set].filter(Boolean);
}

function studentDocRef(tid, studentId) {
  return doc(db, 'teachers', tid, 'students', studentId);
}

// 讀取單一學生目前的堂數池（不存在則回傳空物件）
async function getStudentCredits(tid, studentId) {
  if (!tid || !studentId) return {};
  try {
    const snap = await getDoc(studentDocRef(tid, studentId));
    return snap.exists() ? (snap.data().remainingCredits || {}) : {};
  } catch (e) {
    console.warn('讀取學生堂數失敗', e);
    return {};
  }
}

// 學生端：把未用堂數畫進「🎫 未用堂數」卡片（v3.3 第二階段，改成獨立卡片，方便未來多老師擴充）
function renderStudentCreditList(credits) {
  const wrap = document.getElementById('studentCreditList');
  if (!wrap) return;
  const entries = Object.entries(credits || {}).filter(([, v]) => v);
  wrap.innerHTML = entries.length
    ? `<div class="credit-tags" style="justify-content:center">${entries.map(([pk, v]) => `<span class="student-credit-tag">${poolLabel(pk)}　剩餘 <b>${v}</b> 堂</span>`).join('')}</div>`
    : `<div class="student-credit-empty">目前沒有未用堂數</div>`;
}

// 從課程時間欄位（例如 "19:20-20:20"、"18:10~19:10"）解析出開始時間 "HH:MM"
// 不依賴分隔符號（~ 或 -），直接抓字串裡第一個「數字:數字」樣式，兩種輸入格式都吃得下去
function parseCourseStartTime(timeStr) {
  const match = (timeStr || '').match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : '';
}

// ── 共用堂數調整函式 ──
// 訂單審核完成時「未使用堂數異動」用這個：在原本堂數上累加 delta（可正可負，未來請假退堂也會用）
async function adjustCredits(tid, studentId, studentName, poolKey, delta) {
  if (!tid || !studentId || !poolKey || !delta) return null;
  const ref = studentDocRef(tid, studentId);
  try {
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};
    const credits = { ...(existing.remainingCredits || {}) };
    credits[poolKey] = (credits[poolKey] || 0) + delta;
    await setDoc(ref, {
      name: studentName || existing.name || '',
      remainingCredits: credits,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    // 鏡射一份到 users/{uid}，供學生端讀取
    try {
      await setDoc(doc(db, 'users', studentId), { remainingCredits: credits }, { merge: true });
    } catch (mirrorErr) {
      console.warn('學生端堂數鏡射失敗（不影響老師端）', mirrorErr);
    }
    return credits;
  } catch (e) {
    console.warn('堂數調整失敗', e);
    return null;
  }
}

// ✍️手動調整未用堂數（學生管理頁用）：直接把某個 poolKey 設成「總堂數」，不是累加
// 跟 adjustCredits 分開是因為這裡老師想看到、改到的是最終總數，不是要加減幾堂
async function setCredits(tid, studentId, studentName, poolKey, total) {
  if (!tid || !studentId || !poolKey || total == null || isNaN(total)) return null;
  const ref = studentDocRef(tid, studentId);
  try {
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};
    const credits = { ...(existing.remainingCredits || {}) };
    credits[poolKey] = total;
    await setDoc(ref, {
      name: studentName || existing.name || '',
      remainingCredits: credits,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    try {
      await setDoc(doc(db, 'users', studentId), { remainingCredits: credits }, { merge: true });
    } catch (mirrorErr) {
      console.warn('學生端堂數鏡射失敗（不影響老師端）', mirrorErr);
    }
    return credits;
  } catch (e) {
    console.warn('堂數調整失敗', e);
    return null;
  }
}

// 儲存所有資料到 Firestore
async function saveToStorage() {
  if (!teacherId) return;
  try {
    await setDoc(teacherDoc('bookings'), { data: JSON.stringify(bookings) });

    await setDoc(teacherDoc('courses_extra'), {
      data: JSON.stringify(courses.map(c => ({
        id: c.id, open: c.open, announceSmall: c.announceSmall,
        showRoster: c.showRoster, minSpots: c.minSpots, maxSpots: c.maxSpots,
        title: c.title, dateStr: c.dateStr, date: c.date, time: c.time,
        location: c.location, locationDetail: c.locationDetail,
        price: c.price, desc: c.desc, cat: c.cat, subcat: c.subcat
      })))
    });

    const extraCourses = courses.filter(c => c.id > 15);
    await setDoc(teacherDoc('courses_added'), {
      data: JSON.stringify(extraCourses)
    });

    await setDoc(teacherDoc('categories_announce'), {
      data: JSON.stringify(categories.map(c => ({ id: c.id, announceMid: c.announceMid })))
    });

    await setDoc(teacherDoc('homeSections_text'), {
      data: JSON.stringify(Object.fromEntries(Object.entries(homeSections).map(([k,v]) => [k, v.text])))
    });

    const globalTitle = document.getElementById('globalNoticeTitle')?.innerText.trim() || '';
    const globalBody  = document.getElementById('globalNoticeBody')?.innerText.trim() || '';
    await setDoc(teacherDoc('globalNotice'), { title: globalTitle, body: globalBody });

  } catch(e) { console.warn('Firestore 儲存失敗', e); }
}

// 從 Firestore 讀取所有資料
async function loadFromStorage() {
  if (!teacherId) return;
  try {
    const bookingsSnap = await getDoc(teacherDoc('bookings'));
    if (bookingsSnap.exists()) {
      const parsed = JSON.parse(bookingsSnap.data().data);
      Object.keys(parsed).forEach(k => { bookings[+k] = parsed[k]; });
    }

    const extraSnap = await getDoc(teacherDoc('courses_extra'));
    if (extraSnap.exists()) {
      const parsed = JSON.parse(extraSnap.data().data);
      parsed.forEach(saved => {
        const c = courses.find(x => x.id === saved.id);
        if (c) Object.assign(c, saved);
      });
    }

    const addedSnap = await getDoc(teacherDoc('courses_added'));
    if (addedSnap.exists()) {
      const added = JSON.parse(addedSnap.data().data);
      added.forEach(nc => {
        if (!courses.find(c => c.id === nc.id)) {
          courses.push(nc);
          if (!bookings[nc.id]) bookings[nc.id] = [];
        }
      });
    }

    const annSnap = await getDoc(teacherDoc('categories_announce'));
    if (annSnap.exists()) {
      JSON.parse(annSnap.data().data).forEach(saved => {
        const cat = categories.find(c => c.id === saved.id);
        if (cat) cat.announceMid = saved.announceMid;
      });
    }

    const secSnap = await getDoc(teacherDoc('homeSections_text'));
    if (secSnap.exists()) {
      const parsed = JSON.parse(secSnap.data().data);
      Object.entries(parsed).forEach(([k, v]) => {
        if (homeSections[k]) homeSections[k].text = v;
      });
    }

    const noticeSnap = await getDoc(teacherDoc('globalNotice'));
    if (noticeSnap.exists()) {
      const { title, body } = noticeSnap.data();
      const noticeTitleEl = document.getElementById('globalNoticeTitle');
      const noticeBodyEl  = document.getElementById('globalNoticeBody');
      const noticeWrap    = document.getElementById('globalNoticeWrap');
      if (noticeTitleEl && title) noticeTitleEl.innerText = title;
      if (noticeBodyEl  && body)  noticeBodyEl.innerText  = body;
      if (noticeWrap) noticeWrap.style.display = (title || body) ? '' : 'none';
    }

  } catch(e) { console.warn('Firestore 讀取失敗', e); }
}

let currentCat = 'all';
let currentCourse = null;
let currentView = 'calendar';
const _now = new Date();
let calYear = _now.getFullYear(), calMonth = _now.getMonth();
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
// isAdmin()：驗證目前登入的 Google 帳號是否為授權老師
function isAdmin() {
  return currentTeacher !== null && teacherId !== null;
}

function buildSpotsHtml(state, remaining, maxSpots) {
  if (state === 'closed')  return `<div class="spots-num full-text">報名<br>已關閉</div>`;
  if (state === 'full')    return `<div class="spots-num full-text">已滿班</div><div class="spots-label">(${maxSpots}人滿班)</div>`;
  if (state === 'pending') return `<div class="spots-num full-text" style="font-size:0.85rem">待開班</div><div class="spots-label">餘 ${remaining} 位</div>`;
  return `<div class="spots-num">${remaining}</div><div class="spots-label">剩餘名額</div>`;
}

// 組合公告 HTML：
//   mid   → 類別中公告（📢 課程公告），同類所有課程共用
//   small → 課程小公告（📌 課程備註），每堂課獨立設定
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
// 根據 open 旗標與報名人數，回傳課程狀態：
//   closed  → 老師手動關閉報名
//   full    → 報名人數已達 maxSpots
//   pending → 報名人數未達開班門檻 minSpots（待開班）
//   open    → 正常開放報名
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

    // 學生端：已報名 / 審核中 / 請假申請中 / 已請假 標籤
    const leaveTag     = (!isAdmin() && hasPendingLeave(c.id)) ? '<span class="tag-leave">🙋 請假申請中</span>' : '';
    const leaveDoneTag = (!isAdmin() && !hasPendingLeave(c.id) && hasApprovedDeductLeave(c.id)) ? '<span class="tag-leave-done">🙋 已請假</span>' : '';
    const enrolledTag  = (!isAdmin() && !hasPendingLeave(c.id) && !hasApprovedDeductLeave(c.id) && isEnrolled(c.id))    ? '<span class="tag-enrolled">✓ 已報名</span>' : '';
    const pendingTag   = (!isAdmin() && !isEnrolled(c.id) && hasPendingOrder(c.id)) ? '<span class="tag-pending">⏳ 審核中</span>' : '';
    const statusTag    = leaveTag || leaveDoneTag || enrolledTag || pendingTag;

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
        ${isAdmin() ? `<div style="display:flex;gap:6px;margin-top:4px"><button class="edit-toggle-btn" id="cardEditBtn_${c.id}">✏️ 編輯</button><button class="edit-toggle-btn" id="ccopy_${c.id}">📋 複製</button><button class="edit-toggle-btn" id="cdelete_${c.id}">🗑️ 刪除</button></div>` : ''}
      </div>
      <div class="card-spots">
        ${statusTag ? `<div class="card-status-tag">${statusTag}</div>` : ''}
        <div class="card-spots-num">${spotsHtml}</div>
      </div>
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
          <div class="cei-spots-section">
            <div class="cei-spots-header">
             <span class="cei-label">價格</span>
             <div class="toggle-row">
               <span class="toggle-label" id="showPriceLabel_${c.id}">${c.showPrice === true ? '顯示價格' : '隱藏價格'}</span>
               <label class="toggle">
                 <input type="checkbox" id="showPriceToggle_${c.id}" ${c.showPrice === true ? 'checked' : ''}>
                 <span class="toggle-slider"></span>
               </label>
             </div>
           </div>
           <input type="number" class="cei-input" id="cprice_${c.id}" value="${c.price}">
           <div class="cei-spots-header">
             <span class="cei-label">需先付款</span>
             <div class="toggle-row">
               <span class="toggle-label" id="requirePaymentLabel_${c.id}">${c.requirePayment ? '需要' : '不需要'}</span>
               <label class="toggle">
                 <input type="checkbox" id="requirePaymentToggle_${c.id}" ${c.requirePayment ? 'checked' : ''}>
                <span class="toggle-slider"></span>
               </label>
             </div>
           </div>
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
      editSection.querySelector(`#showPriceToggle_${c.id}`).addEventListener('change', function() {
        document.getElementById(`showPriceLabel_${c.id}`).textContent = this.checked ? '顯示價格' : '隱藏價格';
      });
      editSection.querySelector(`#requirePaymentToggle_${c.id}`).addEventListener('change', function() {
        document.getElementById(`requirePaymentLabel_${c.id}`).textContent = this.checked ? '需要' : '不需要';
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
        c.showPrice = editSection.querySelector(`#showPriceToggle_${c.id}`).checked;
        c.requirePayment = editSection.querySelector(`#requirePaymentToggle_${c.id}`).checked;
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


      card.querySelector(`#cdelete_${c.id}`).addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm(`確定要刪除「${c.title}」嗎？此操作無法復原。`)) return;
        const idx = courses.findIndex(x => x.id === c.id);
        if (idx !== -1) courses.splice(idx, 1);
        delete bookings[c.id];
        saveToStorage();
        if (currentView === 'calendar') renderCalendar(); else renderList();
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

      if (cat.announceMid) {
        const mid = document.createElement('div');
        mid.className = 'announce-mid';
        mid.innerHTML = `<div class="announce-mid-title">📢 ${cat.label}課程公告</div>${cat.announceMid}`;
        wrap.appendChild(mid);
      }

      cat.subcats.forEach(subcat => {
        const subCourses = catCourses.filter(c => c.subcat === subcat);
        if (!subCourses.length) return;

        const subHdr = document.createElement('div');
        subHdr.className = 'section-header';
        subHdr.innerHTML = `<div class="section-title">${subcat}</div><div class="section-line"></div>`;
        wrap.appendChild(subHdr);

        const list = document.createElement('div');
        list.className = 'course-list';
        subCourses.forEach(c => list.appendChild(buildCard(c)));
        wrap.appendChild(list);
      });
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
    const dciTag = (!isAdmin() && hasPendingLeave(c.id)) ? '<span class="tag-leave">🙋 請假申請中</span>'
                 : (!isAdmin() && hasApprovedDeductLeave(c.id)) ? '<span class="tag-leave-done">🙋 已請假</span>'
                 : (!isAdmin() && isEnrolled(c.id)) ? '<span class="tag-enrolled">✓ 已報名</span>'
                 : (!isAdmin() && hasPendingOrder(c.id)) ? '<span class="tag-pending">⏳ 審核中</span>' : '';

    html += `
      <div class="day-course-item ${isFull ? 'is-full' : ''}" data-id="${c.id}">
        <div class="dci-dot" style="background:${dotColor}"></div>
        <div class="dci-body">
          <div class="dci-time">${c.time}</div>
          <div class="dci-name">${c.title}</div>
          <div class="dci-loc">📍 ${c.location}</div>
        </div>
        <div class="dci-spots">
          <div class="dci-spots-text">${spotsText}</div>
          <div class="dci-spots-tag">${dciTag}</div>
        </div>
      </div>`;
  });
  html += '</div>';
  detail.innerHTML = html;

  detail.querySelectorAll('.day-course-item').forEach(el => {
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
  const list = bookings[course.id] || [];
  const itemsHtml = list.length === 0
    ? '<div class="modal-no-roster">尚無報名學員</div>'
    : list.map((b, i) => `
        <div class="modal-roster-item" data-index="${i}">
          <div>
            <span class="modal-roster-name">${i + 1}. ${b.name}</span>
            ${b.phone ? `<span class="modal-roster-phone">${b.phone}</span>` : ''}
            ${b.studentId ? '<span class="modal-roster-linked">已登入</span>' : '<span class="modal-roster-guest">訪客</span>'}
            ${b.studentId && b.orderId ? `<span class="modal-roster-leave-tag" id="rosterLeaveTag_${i}" style="display:none">🙋 已請假</span>` : ''}
          </div>
          <div class="roster-item-actions">
            ${b.studentId ? `<button class="roster-credit-toggle" type="button" data-idx="${i}" data-student-id="${b.studentId}" data-student-name="${b.name}" title="手動調整未用堂數">✍️</button>` : ''}
            <button class="modal-delete-btn" data-index="${i}" data-student-id="${b.studentId || ''}" data-order-id="${b.orderId || ''}">🗑</button>
          </div>
        </div>
        ${b.studentId ? `
        <div class="roster-credit-form" id="rosterCreditForm_${i}" style="display:none">
          <select class="roster-credit-pool"><option>載入中…</option></select>
          <input class="roster-credit-total" type="number" value="0">
          <span class="roster-credit-unit">堂</span>
          <button class="roster-credit-apply" type="button" data-student-id="${b.studentId}" data-student-name="${b.name}">套用</button>
        </div>` : ''}`).join('');

  return `
      <div class="modal-roster-title">已報名學員（${list.length} 人）</div>
      <div id="modalRosterItems">${itemsHtml}</div>
      <button class="modal-add-btn" id="modalAddBtn">＋ 手動新增學生</button>
      <div class="modal-add-form" id="modalAddForm">
        <div class="modal-search-wrap">
          <input type="text" id="modalSearchInput" placeholder="搜尋學生姓名…" maxlength="20" autocomplete="off">
          <div class="modal-search-dropdown" id="modalSearchDropdown"></div>
        </div>
        <input type="tel" id="modalAddPhone" placeholder="聯絡電話（選填）" maxlength="15">
        <button class="btn-primary" id="modalAddConfirm">新增</button>
      </div>
    </div>`;
}

// 老師端報名名單：標出「已扣堂請假」的學員（扣堂設計上仍佔名額、留在名單上，
// 但老師光看名單看不出是請假扣堂還是正常出席，所以額外撈一次訂單狀態來加小標籤）
async function annotateRosterLeaveStatus(course) {
  const tid = teacherId || TEACHER_ID_STATIC;
  const list = bookings[course.id] || [];
  await Promise.all(list.map(async (b, i) => {
    if (!b.studentId || !b.orderId) return;
    const tag = document.getElementById(`rosterLeaveTag_${i}`);
    if (!tag) return;
    try {
      const snap = await getDoc(doc(db, 'teachers', tid, 'orders', b.orderId));
      if (!snap.exists()) return;
      const c = (snap.data().courses || []).find(x => x.courseId === course.id);
      if (c && c.leaveStatus === 'approved_deduct') {
        tag.style.display = 'inline';
      }
    } catch (e) { /* 標籤是輔助資訊，撈取失敗就不顯示，不影響主要功能 */ }
  }));
}

function bindModalRosterEvents(course) {
  const tid = teacherId;

  // 刪除
  document.querySelectorAll('.modal-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.index);
      const studentId = btn.dataset.studentId;
      const orderId = btn.dataset.orderId;

      // 有綁定帳號 → 只取消該堂課，重新計算 order status
      if (studentId && orderId) {
        try {
          const orderRef = doc(db, 'teachers', tid, 'orders', orderId);
          const orderSnap = await getDoc(orderRef);
          if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            const updatedCourses = orderData.courses.map(c =>
              c.courseId === course.id ? { ...c, result: 'cancelled' } : c
            );
            const allCancelled = updatedCourses.every(c => c.result === 'cancelled');
            const newStatus = allCancelled ? 'cancelled' : 'confirmed';
            await updateDoc(orderRef, { courses: updatedCourses, status: newStatus });
            await updateDoc(doc(db, 'users', studentId, 'orders', orderId), { courses: updatedCourses, status: newStatus });
          }
        } catch(e) { console.warn('取消單堂失敗', e); }
      }

      bookings[course.id].splice(idx, 1);
      saveToStorage();
      openModal(course);
      if (currentView === 'calendar') renderCalendar(); else renderList();
    });
  });

  // ── ✍️手動調整未用堂數（每位已登入學員名字旁邊那個小圖示，跟學生管理頁共用同一顆 setCredits）──
  document.querySelectorAll('.roster-credit-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = btn.dataset.idx;
      const form = document.getElementById(`rosterCreditForm_${idx}`);
      if (!form) return;
      const isOpen = form.style.display !== 'none';
      if (isOpen) { form.style.display = 'none'; return; }
      form.style.display = 'flex';
      const select = form.querySelector('.roster-credit-pool');
      // 第一次打開才去撈這位學生目前的堂數，撈過就不用再撈
      if (!select.dataset.loaded) {
        const studentId = btn.dataset.studentId;
        const credits = await getStudentCredits(tid, studentId);
        const keys = allPoolKeys();
        select.innerHTML = keys.map(pk => `<option value="${pk}" data-current="${credits[pk] || 0}">${poolLabel(pk)}</option>`).join('');
        select.dataset.loaded = '1';
        const totalInput = form.querySelector('.roster-credit-total');
        totalInput.value = credits[keys[0]] || 0;
        select.addEventListener('change', () => {
          const opt = select.options[select.selectedIndex];
          totalInput.value = opt.dataset.current || 0;
        });
      }
    });
  });
  document.querySelectorAll('.roster-credit-apply').forEach(btn => {
    btn.addEventListener('click', async () => {
      const form = btn.closest('.roster-credit-form');
      const select = form.querySelector('.roster-credit-pool');
      const poolKey = select.value;
      const total = Number(form.querySelector('.roster-credit-total').value);
      if (isNaN(total) || total < 0) { showToast('請輸入正確的總堂數'); return; }
      btn.textContent = '處理中…'; btn.disabled = true;
      try {
        const result = await setCredits(tid, btn.dataset.studentId, btn.dataset.studentName, poolKey, total);
        if (result) {
          showToast(`已將 ${poolLabel(poolKey)} 設為 ${total} 堂`);
        } else {
          showToast('調整失敗，請再試一次');
        }
      } catch(e) {
        showToast('調整失敗，請再試一次');
      }
      btn.textContent = '套用'; btn.disabled = false;
    });
  });

  // 展開新增表單
  document.getElementById('modalAddBtn').addEventListener('click', () => {
    const form = document.getElementById('modalAddForm');
    const isOpen = form.classList.contains('open');
    form.classList.toggle('open', !isOpen);
    document.getElementById('modalAddBtn').textContent = isOpen ? '＋ 手動新增學生' : '✕ 取消';
    if (!isOpen) {
      setTimeout(() => document.getElementById('modalSearchInput')?.focus(), 50);
    }
  });

  // 搜尋框：撈歷史學生
  let selectedStudent = null; // { studentId, studentName, studentEmail, lastCourse }

  document.getElementById('modalSearchInput').addEventListener('input', async (e) => {
    const keyword = e.target.value.trim();
    selectedStudent = null;
    const dropdown = document.getElementById('modalSearchDropdown');

    if (keyword.length < 1) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('open');
      return;
    }

    // 從老師的 orders 撈符合名字的學生
    try {
      const snap = await getDocs(collection(db, 'teachers', tid, 'orders'));
      const seen = new Map(); // studentId → 最新一筆 order
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data.studentName || !data.studentId) return;
        if (!data.studentName.includes(keyword)) return;
        // 同一個 studentId 只保留最新的
        if (!seen.has(data.studentId) || data.createdAt > seen.get(data.studentId).createdAt) {
          seen.set(data.studentId, {
            studentId: data.studentId,
            studentName: data.studentName,
            studentEmail: data.studentEmail || '',
            lastCourse: data.courses?.[0]?.title || '',
            lastDate: data.courses?.[0]?.date || '',
            orderId: d.id
          });
        }
      });

      const results = [...seen.values()];
      if (results.length === 0) {
        dropdown.innerHTML = `<div class="modal-search-hint">找不到此學生的報名紀錄，將以訪客方式新增（不連動帳號）</div>`;
      } else {
        dropdown.innerHTML = results.map(r => `
          <div class="modal-search-item" data-student-id="${r.studentId}" data-student-name="${r.studentName}" data-student-email="${r.studentEmail}" data-last-course="${r.lastCourse}" data-last-date="${r.lastDate}">
            <span class="modal-search-name">${r.studentName}</span>
            <span class="modal-search-meta">${r.lastCourse} ${r.lastDate}</span>
          </div>`).join('');

        dropdown.querySelectorAll('.modal-search-item').forEach(item => {
          item.addEventListener('click', () => {
            selectedStudent = {
              studentId: item.dataset.studentId,
              studentName: item.dataset.studentName,
              studentEmail: item.dataset.studentEmail,
              lastCourse: item.dataset.lastCourse,
              lastDate: item.dataset.lastDate
            };
            document.getElementById('modalSearchInput').value = item.dataset.studentName;
            dropdown.innerHTML = '';
            dropdown.classList.remove('open');
          });
        });
      }
      dropdown.classList.add('open');
    } catch(e) {
      console.warn('搜尋學生失敗', e);
    }
  });

  // 確認新增
  document.getElementById('modalAddConfirm').addEventListener('click', async () => {
    const nameInput = document.getElementById('modalSearchInput');
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.style.borderColor = '#e74c3c';
      nameInput.focus();
      return;
    }
    const phone = document.getElementById('modalAddPhone').value.trim();
    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

    // 防呆：檢查是否已在名單中
    const existing = bookings[course.id] || [];
    if (selectedStudent) {
      if (existing.some(b => b.studentId === selectedStudent.studentId)) {
        showToast(`${selectedStudent.studentName} 已在名單中`);
        return;
      }
    } else {
      if (existing.some(b => b.name === name)) {
        showToast(`「${name}」已在名單中`);
        return;
      }
    }

    if (selectedStudent) {
      // ── 綁帳號模式：建 confirmed order + 寫 bookings ──
      const orderId = 'order_' + Date.now();
      const orderData = {
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.studentName,
        studentEmail: selectedStudent.studentEmail || '',
        phone,
        courses: [{
          courseId: course.id,
          title: course.title,
          date: course.date,
          time: course.time,
          price: course.price,
          result: 'confirmed'
        }],
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        note: '',
        amount: null,
        manualAdd: true
      };
      try {
        await setDoc(doc(db, 'teachers', tid, 'orders', orderId), orderData);
        await setDoc(doc(db, 'users', selectedStudent.studentId, 'orders', orderId), {
          ...orderData,
          teacherId: tid
        });
        bookings[course.id].push({
          name: selectedStudent.studentName,
          phone,
          time: now,
          studentId: selectedStudent.studentId,
          orderId
        });
        saveToStorage();
        showToast(`已新增 ${selectedStudent.studentName}（綁定帳號）`);
      } catch(e) {
        console.warn('新增綁定學生失敗', e);
        showToast('新增失敗，請稍後再試');
        return;
      }
    } else {
      // ── 純佔位模式：只寫 bookings ──
      bookings[course.id].push({ name, phone, time: now });
      saveToStorage();
      showToast(`已新增 ${name}（訪客）`);
    }

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
    ${course.showPrice === true ? `
    <div class="modal-price">
      <div class="price-label">課程費用</div>
      <div class="price-amount">$${course.price}<span class="price-per-person">/人</span></div>
    </div>` : ''}
    <div class="modal-desc">${course.desc}</div>
    ${announceHtml}
    <div class="spots-display">
      <div class="spots-big ${isFull ? 'zero' : ''}">${isFull ? '✕' : remaining}</div>
      <div class="spots-sub">${isFull ? '本堂已滿班' : isPending ? `待開班・共${course.maxSpots}人` : `剩餘名額（共${course.maxSpots}人）`}</div>
    </div>
    ${course.showRoster && !isAdmin() ? (() => {
  const roster = bookings[course.id] || [];
  return `
  <div class="modal-roster">
    <div class="modal-roster-title">已報名學員（${roster.length} 人）</div>
    <div>${roster.map((b,i) => `<div class="modal-roster-item"><span class="modal-roster-name">${i+1}. ${b.name}</span></div>`).join('')}</div>
  </div>`;
})() : ''}
${isAdmin() ? renderModalRoster(course) : (hasPendingLeave(course.id) ? `
    <div id="cartBtnArea">
      <div class="cart-added-label">🙋 請假審核中</div>
      <button class="btn-cart btn-cart-added" disabled>等待老師確認</button>
    </div>` : hasApprovedDeductLeave(course.id) ? `
    <div id="cartBtnArea">
      <div class="cart-added-label">🙋 已請假</div>
      <button class="btn-cart btn-cart-added" disabled>本堂已請假</button>
    </div>` : isEnrolled(course.id) ? `
    <div id="cartBtnArea">
      <div class="cart-added-label">已經報名囉！</div>
      <button class="btn-cart btn-cart-added" disabled>✓ 已報名</button>
      <button class="btn-leave-request" id="leaveRequestBtn">🙋 申請請假</button>
    </div>` : hasPendingOrder(course.id) ? `
    <div id="cartBtnArea">
      <div class="cart-added-label">⏳ 訂單審核中</div>
      <button class="btn-cart btn-cart-added" disabled>審核中</button>
    </div>` : !isFull ? `
    <div id="cartBtnArea">
      ${cartHasItem(course.id)
        ? '<div class="cart-added-label">✓ 已加入購物車</div><button class="btn-cart btn-cart-added" disabled>已在購物車中</button>'
        : '<button class="btn-cart" id="addToCartBtn">🛒 加入購物車</button>'
      }
    </div>` : `
    <div class="full-notice">本班已額滿，如有需要請向老師詢問候補 🙏</div>
    `)}
    <button class="btn-close" id="closeModalBtn">關閉</button>
  `;

  if (isAdmin()) {
    bindModalRosterEvents(course);
    annotateRosterLeaveStatus(course);
  } else {
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        addToCart(course);
        const area = document.getElementById('cartBtnArea');
        if (area) area.innerHTML = '<div class="cart-added-label">✓ 已加入購物車</div><button class="btn-cart btn-cart-added" disabled>已在購物車中</button>';
      });
    }
    const leaveRequestBtn = document.getElementById('leaveRequestBtn');
    if (leaveRequestBtn) {
      leaveRequestBtn.addEventListener('click', () => submitLeaveRequest(course));
    }
  }
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('overlay').classList.add('open');
}

// ── CART FUNCTIONS ──
function cartHasItem(courseId) {
  return cart.some(item => item.courseId === courseId);
}

function addToCart(course) {
  if (cartHasItem(course.id)) return;
  if (isEnrolled(course.id)) {
    showToast('你已報名此課程');
    return;
  }
  if (hasPendingOrder(course.id)) {
    showToast('此課程已有待審核的訂單');
    return;
  }
  cart.push({ courseId: course.id, title: course.title, date: course.date, time: course.time, price: course.price });
  updateCartBtn();
  showToast(`已加入購物車：${course.title}`);
}

function removeFromCart(courseId) {
  cart = cart.filter(item => item.courseId !== courseId);
  updateCartBtn();
  renderCartOverlay();
}

// ── STUDENT ORDERS ──
let studentOrdersUnsubscribe = null;

function loadStudentOrders(uid) {
  // 先取消上一個監聽（防止重複訂閱）
  if (studentOrdersUnsubscribe) {
    studentOrdersUnsubscribe();
    studentOrdersUnsubscribe = null;
  }
  return new Promise((resolve) => {
    let resolved = false;
    studentOrdersUnsubscribe = onSnapshot(
      query(collection(db, 'users', uid, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => {
        studentOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!resolved) {
          resolved = true;
          resolve();
        } else {
          // 老師更新後自動刷新學生畫面
          if (currentView === 'calendar') renderCalendar(); else renderList();
        }
      },
      (err) => {
        console.warn('訂單監聽失敗', err);
        studentOrders = [];
        resolve();
      }
    );
  });
}

// 該課程已有「confirmed」的訂單 → 顯示「已報名」標籤
function isEnrolled(courseId) {
  return studentOrders.some(o =>
    o.courses?.some(c => c.courseId === courseId && c.result === 'confirmed')
  );
}

// 該課程有「pending」的訂單 → 顯示「審核中」標籤，同時擋重複加入
function hasPendingOrder(courseId) {
  return studentOrders.some(o =>
    o.courses?.some(c => c.courseId === courseId && c.result === 'pending')
  );
}

// 該課程已送出請假申請、等待老師審核（v3.3 第三階段）
function hasPendingLeave(courseId) {
  return studentOrders.some(o =>
    o.courses?.some(c => c.courseId === courseId && c.leaveStatus === 'pending')
  );
}

// 該課程請假已審核完成、老師選擇「扣堂」→ 卡片顯示「已請假」而不是「已報名」（v3.3 第四階段）
function hasApprovedDeductLeave(courseId) {
  return studentOrders.some(o =>
    o.courses?.some(c => c.courseId === courseId && c.leaveStatus === 'approved_deduct')
  );
}

// 找出這個學生「已報名、可以申請請假」的那筆訂單（confirmed 且尚未有請假申請）
function findLeaveableOrder(courseId) {
  return studentOrders.find(o =>
    o.courses?.some(c => c.courseId === courseId && c.result === 'confirmed' && (!c.leaveStatus || c.leaveStatus === 'none'))
  );
}

// 學生送出請假申請：把該筆訂單裡對應課程標記 leaveStatus = 'pending'
// 老師端審核（v3.3 第四階段）會依此欄位處理扣堂／退堂
async function submitLeaveRequest(course) {
  if (!currentStudent) return;
  const order = findLeaveableOrder(course.id);
  if (!order) { showToast('找不到對應的報名紀錄'); return; }
  if (!confirm(`確定要申請「${course.title}」${course.date} ${course.time} 的請假嗎？`)) return;
  const tid = order.teacherId || TEACHER_ID_STATIC;
  try {
    const ref = doc(db, 'teachers', tid, 'orders', order.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) { showToast('訂單不存在，請重新整理再試'); return; }
    const data = snap.data();
    const updatedCourses = (data.courses || []).map(c =>
      c.courseId === course.id ? { ...c, leaveStatus: 'pending', leaveRequestedAt: new Date().toISOString() } : c
    );
    await updateDoc(ref, { courses: updatedCourses });
    // 同步寫入學生端鏡射（跟訂單審核流程用同一個模式），確保重整後資料一致
    try {
      await updateDoc(doc(db, 'users', order.studentId, 'orders', order.id), { courses: updatedCourses });
    } catch (syncErr) {
      console.warn('學生端請假鏡射失敗（不影響老師端）', syncErr);
    }
    // 更新本地快取，畫面立即反映
    order.courses = updatedCourses;
    showToast('請假申請已送出，等待老師審核');
    closeModal();
    if (currentView === 'calendar') renderCalendar(); else renderList();
  } catch (e) {
    showToast('申請失敗，請再試一次');
  }
}

function updateCartBtn() {
  const btn = document.getElementById('cartBtn');
  const badge = document.getElementById('cartCount');
  if (!btn) return;
  if (currentTeacher) {
    btn.style.display = 'none';
    return;
  }
  btn.style.display = '';
  if (!badge) return;
  if (cart.length > 0) {
    badge.textContent = cart.length;
    badge.style.display = 'inline-flex';
  } else {
    badge.textContent = '';
    badge.style.display = 'none';
  }
}

function openCartOverlay() {
  renderCartOverlay();
  document.getElementById('cartOverlay').classList.add('open');
}

function renderCartOverlay() {
  const itemsEl = document.getElementById('cartItems');
  const checkoutForm = document.getElementById('cartCheckoutForm');
  const loginPrompt = document.getElementById('cartLoginPrompt');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="cart-empty">購物車是空的</div>';
    checkoutForm.style.display = 'none';
    loginPrompt.style.display = 'none';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-meta">📅 ${item.date} ${item.time}</div>
      </div>
      <button class="cart-item-remove" data-id="${item.courseId}">✕</button>
    </div>
  `).join('');

  itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(+btn.dataset.id));
  });

  if (currentStudent) {
    checkoutForm.style.display = 'block';
    loginPrompt.style.display = 'none';
    getDoc(doc(db, 'users', currentStudent.uid)).then(snap => {
      const nickname = snap.exists() ? (snap.data().nickname || '') : '';
      const nameInput = document.getElementById('cartName');
      if (nameInput && !nameInput.value) {
        nameInput.value = nickname || currentStudent.displayName?.split(' ')[0] || '';
      }
    }).catch(() => {});
  } else {
    checkoutForm.style.display = 'none';
    loginPrompt.style.display = 'block';
  }
}

// ── NOTIFICATIONS ──
let notifItems = [];
let notifUnsubscribe = null;
let notifPathType = null; // 'teachers' | 'users'
let notifOwnerId = null;

function courseSummaryText(courses) {
  if (!courses || courses.length === 0) return '';
  const first = courses[0];
  const base = `${first.title} ${first.date}${first.time}`;
  return courses.length > 1 ? `${base}\u3000等時段` : base;
}

async function pushNotification(pathType, ownerId, { type, message, detail }) {
  if (!ownerId) return;
  try {
    await addDoc(collection(db, pathType, ownerId, 'notifications'), {
      type,
      message,
      detail: detail || '',
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('通知寫入失敗（不影響主要流程）', e);
  }
}

function loadNotifications(pathType, ownerId) {
  if (notifUnsubscribe) { notifUnsubscribe(); notifUnsubscribe = null; }
  if (!ownerId) return;
  notifPathType = pathType;
  notifOwnerId = ownerId;
  notifUnsubscribe = onSnapshot(
    query(collection(db, pathType, ownerId, 'notifications'), orderBy('createdAt', 'desc'), limit(30)),
    (snap) => {
      notifItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderNotifDropdown();
      updateNotifBadge();
    },
    (err) => {
      console.warn('通知讀取失敗', err);
      notifItems = [];
      renderNotifDropdown();
      updateNotifBadge();
    }
  );
}

function clearNotifications() {
  if (notifUnsubscribe) { notifUnsubscribe(); notifUnsubscribe = null; }
  notifItems = [];
  notifPathType = null;
  notifOwnerId = null;
  updateNotifBadge();
  renderNotifDropdown();
}

function updateNotifBtn() {
  const btn = document.getElementById('notifBtn');
  if (!btn) return;
  btn.style.display = (currentTeacher || currentStudent) ? '' : 'none';
}

function updateNotifBadge() {
  const badge = document.getElementById('notifCount');
  if (!badge) return;
  const unread = notifItems.filter(n => !n.read).length;
  if (unread > 0) {
    badge.textContent = unread > 9 ? '9+' : String(unread);
    badge.style.display = 'flex';
  } else {
    badge.textContent = '';
    badge.style.display = 'none';
  }
}

function formatNotifTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderNotifDropdown() {
  const list = document.getElementById('notifList');
  if (!list) return;
  if (notifItems.length === 0) {
    list.innerHTML = '<div class="notif-empty">目前沒有通知</div>';
    return;
  }
  list.innerHTML = notifItems.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div class="notif-item-msg">${n.message || ''}</div>
      ${n.detail ? `<div class="notif-item-detail">${n.detail}</div>` : ''}
      <div class="notif-item-time">${formatNotifTime(n.createdAt)}</div>
    </div>
  `).join('');
}

async function markAllNotifsRead() {
  const unread = notifItems.filter(n => !n.read);
  if (unread.length === 0 || !notifPathType || !notifOwnerId) return;
  // 先更新本地畫面（立即消紅點），再非同步寫回
  notifItems = notifItems.map(n => ({ ...n, read: true }));
  updateNotifBadge();
  renderNotifDropdown();
  try {
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, notifPathType, notifOwnerId, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  } catch (e) {
    console.warn('標記已讀失敗', e);
  }
}

document.getElementById('notifBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const dd = document.getElementById('notifDropdown');
  const willOpen = !dd.classList.contains('open');
  document.getElementById('studentDropdown').classList.remove('open');
  document.getElementById('teacherDropdown').classList.remove('open');
  document.getElementById('loginDropdown').classList.remove('open');
  dd.classList.toggle('open', willOpen);
  if (willOpen) markAllNotifsRead();
});

async function submitOrder() {
  // 未登入 → 跳登入，登入後自動重開購物車
  if (!currentStudent) {
    document.getElementById('cartOverlay').classList.remove('open');
    document.getElementById('studentLoginError').textContent = '';
    document.getElementById('studentLoginOverlay').classList.add('open');
    return;
  }
  const name = document.getElementById('cartName').value.trim();
  if (!name) {
    document.getElementById('cartName').style.borderColor = '#e74c3c';
    document.getElementById('cartName').focus();
    return;
  }
  const phone = document.getElementById('cartPhone').value.trim();
  const note = document.getElementById('cartNote').value.trim().slice(0, 100);
  const btn = document.getElementById('cartSubmitBtn');
  btn.textContent = '送出中…';
  btn.disabled = true;

  const tid = teacherId || TEACHER_ID_STATIC;
  const orderId = 'order_' + Date.now();
  const orderData = {
    studentId: currentStudent.uid,
    studentName: name,
    studentEmail: currentStudent.email || '',
    phone,
    courses: cart.map(item => ({
      courseId: item.courseId,
      title: item.title,
      date: item.date,
      time: item.time,
      price: item.price,
      result: 'pending'
    })),
    status: 'pending',
    createdAt: new Date().toISOString(),
    note,
    amount: null
  };

  try {
    await setDoc(doc(db, 'teachers', tid, 'orders', orderId), orderData);
    // 同時寫入學生端，方便學生查詢自己的訂單與審核結果
    await setDoc(doc(db, 'users', currentStudent.uid, 'orders', orderId), {
      ...orderData,
      teacherId: tid
    });
    // 通知老師有新訂單申請
    pushNotification('teachers', tid, {
      type: 'new_order',
      message: `您有一筆來自 ${name} 的課程申請`,
      detail: courseSummaryText(orderData.courses)
    });
    // 更新本地 studentOrders（加在最前面，因為是最新的）
    studentOrders.unshift({ id: orderId, ...orderData, teacherId: tid });
    cart = [];
    updateCartBtn();
    btn.textContent = '送出訂單';
    btn.disabled = false;
    document.getElementById('cartOverlay').classList.remove('open');
    showToast('訂單已送出！等待老師審核 ✨');
  } catch(e) {
    showToast('送出失敗，請再試一次');
    btn.textContent = '送出訂單';
    btn.disabled = false;
  }
}

document.getElementById('cartBtn').addEventListener('click', openCartOverlay);
document.getElementById('cartCloseBtn').addEventListener('click', () => {
  document.getElementById('cartOverlay').classList.remove('open');
});
document.getElementById('cartSubmitBtn').addEventListener('click', submitOrder);
document.getElementById('cartLoginBtn').addEventListener('click', () => {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('studentLoginError').textContent = '';
  document.getElementById('studentLoginOverlay').classList.add('open');
});

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  currentCourse = null;
}
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) closeModal();
});

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toastNotice');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ── TEACHER LOGIN ──
function updateTeacherBtn() {
  const loginBtn = document.getElementById('loginBtn');
  const cartBtn = document.getElementById('cartBtn');
  if (currentTeacher) {
    loginBtn.textContent = `${teacherName || '老師'} 🔒`;
    if (cartBtn) cartBtn.style.display = 'none';
  } else if (!currentStudent) {
    loginBtn.textContent = '登入 ▾';
    if (cartBtn) cartBtn.style.display = '';
  }
  updateNotifBtn();
}

document.getElementById('loginBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('notifDropdown').classList.remove('open');
  if (currentTeacher) {
    const dd = document.getElementById('teacherDropdown');
    dd.classList.toggle('open', !dd.classList.contains('open'));
  } else if (currentStudent) {
    const dd = document.getElementById('studentDropdown');
    dd.classList.toggle('open', !dd.classList.contains('open'));
  } else {
    const dd = document.getElementById('loginDropdown');
    dd.classList.toggle('open', !dd.classList.contains('open'));
  }
});

document.getElementById('teacherLoginDropBtn').addEventListener('click', () => {
  document.getElementById('loginDropdown').classList.remove('open');
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginOverlay').classList.add('open');
});

document.getElementById('studentLoginDropBtn').addEventListener('click', () => {
  document.getElementById('loginDropdown').classList.remove('open');
  document.getElementById('studentLoginError').textContent = '';
  document.getElementById('studentLoginOverlay').classList.add('open');
});

document.getElementById('teacherLogoutBtn').addEventListener('click', () => {
  document.getElementById('teacherDropdown').classList.remove('open');
  document.getElementById('teacherLogoutName').textContent = teacherName || '老師';
  document.getElementById('teacherLogoutOverlay').classList.add('open');
});

document.getElementById('teacherLogoutCancel').addEventListener('click', () => {
  document.getElementById('teacherLogoutOverlay').classList.remove('open');
});

document.getElementById('teacherLogoutConfirm').addEventListener('click', async () => {
  currentTeacher = null;
  teacherId = null;
  teacherName = null;
  sessionStorage.removeItem('loginRole');
  clearNotifications();
  updateTeacherBtn();
  document.getElementById('teacherLogoutOverlay').classList.remove('open');
  document.getElementById('adminPanel').classList.remove('open');
  await signOut(auth);
  if (currentView === 'calendar') renderCalendar(); else renderList();
  showToast('已登出！');
});

document.getElementById('loginCancel').addEventListener('click', () => {
  document.getElementById('loginOverlay').classList.remove('open');
});

document.getElementById('teacherGoogleLoginBtn').addEventListener('click', () => {
  const btn = document.getElementById('teacherGoogleLoginBtn');
  btn.textContent = '登入中…';
  btn.disabled = true;
  document.getElementById('loginError').textContent = '';

  // 同步觸發 popup（不 await 任何東西，確保 user gesture 有效）
  signInWithPopup(auth, googleProvider).then(async result => {
    const user = result?.user;
    if (!user) throw new Error('no user');
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (!adminSnap.exists()) {
      await signOut(auth);
      document.getElementById('loginError').textContent = '此帳號沒有老師權限';
      btn.innerHTML = GOOGLE_BTN_INNER;
      btn.disabled = false;
      return;
    }
    if (currentStudent) {
      currentStudent = null;
      updateStudentBtn();
      resetGoogleLoginBtn();
    }
    currentTeacher = user;
    teacherId = adminSnap.data().teacherId;
    teacherName = adminSnap.data().name || null;
    sessionStorage.setItem('loginRole', 'teacher');
    btn.innerHTML = GOOGLE_BTN_INNER;
    btn.disabled = false;
    document.getElementById('loginOverlay').classList.remove('open');
    updateTeacherBtn();
    loadNotifications('teachers', teacherId);
    await loadFromStorage();
    const splash = document.getElementById('loginSuccess');
    const nameEl = document.getElementById('loginSuccessName');
    if (nameEl) nameEl.textContent = `${teacherName || '老師'}，歡迎回來！`;
    splash.style.display = 'flex';
    setTimeout(() => {
      splash.style.display = 'none';
      openAdmin();
      if (currentView === 'calendar') renderCalendar(); else renderList();
    }, 1500);
  }).catch(e => {
    if (e.code !== 'auth/popup-closed-by-user') {
      document.getElementById('loginError').textContent = '登入失敗：' + (e.code || e.message);
    }
    btn.innerHTML = GOOGLE_BTN_INNER;
    btn.disabled = false;
  });
});

// ── STUDENT LOGIN ──
const GOOGLE_BTN_INNER = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" style="vertical-align:middle;margin-right:8px">以 Google 登入';

function resetGoogleLoginBtn() {
  const btn = document.getElementById('googleLoginBtn');
  if (btn) { btn.innerHTML = GOOGLE_BTN_INNER; btn.disabled = false; }
}

function updateStudentBtn(nickname) {
  const loginBtn = document.getElementById('loginBtn');
  const cartBtn = document.getElementById('cartBtn');
  if (currentStudent) {
    const name = nickname || (currentStudent.displayName ? currentStudent.displayName.split(' ')[0] : '學生');
    loginBtn.textContent = `${name} ▾`;
    updateCartBtn();
  } else if (!currentTeacher) {
    loginBtn.textContent = '登入 ▾';
  }
  updateNotifBtn();
}

// 學生按鈕邏輯已合併到 loginBtn

// 點其他地方關閉下拉
document.addEventListener('click', () => {
  document.getElementById('studentDropdown').classList.remove('open');
  document.getElementById('teacherDropdown').classList.remove('open');
  document.getElementById('loginDropdown').classList.remove('open');
  document.getElementById('notifDropdown').classList.remove('open');
});

// 登入
document.getElementById('studentLoginCancel').addEventListener('click', () => {
  document.getElementById('studentLoginOverlay').classList.remove('open');
});

document.getElementById('googleLoginBtn').addEventListener('click', () => {
  const btn = document.getElementById('googleLoginBtn');
  btn.textContent = '登入中…';
  btn.disabled = true;
  document.getElementById('studentLoginError').textContent = '';

  signInWithPopup(auth, googleProvider).then(async result => {
    const user = result?.user;
    if (!user) return;
    if (currentTeacher) {
      currentTeacher = null;
      teacherId = null;
      teacherName = null;
      updateTeacherBtn();
      document.getElementById('adminPanel').classList.remove('open');
    }
    currentStudent = user;
    sessionStorage.setItem('loginRole', 'student');
    loadNotifications('users', user.uid);
    document.getElementById('studentLoginOverlay').classList.remove('open');
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const nickname = snap.exists() ? snap.data().nickname : null;
      currentStudentCredits = snap.exists() ? (snap.data().remainingCredits || {}) : {};
      updateStudentBtn(nickname);
    } catch(e) {
      updateStudentBtn();
    }
    // 撈學生訂單，才能顯示「已報名」標籤和擋重複報名
    await loadStudentOrders(user.uid);
    if (currentView === 'calendar') renderCalendar(); else renderList();
    btn.innerHTML = GOOGLE_BTN_INNER;
    btn.disabled = false;
    showToast('登入成功！');
    if (cart.length > 0) setTimeout(() => openCartOverlay(), 300);
  }).catch(e => {
    if (e.code !== 'auth/popup-closed-by-user') {
      document.getElementById('studentLoginError').textContent = '登入失敗：' + e.code;
    }
    btn.innerHTML = GOOGLE_BTN_INNER;
    btn.disabled = false;
  });
});

// 個人資料
// 🎫 未用堂數卡片
document.getElementById('studentCreditBtn').addEventListener('click', async () => {
  document.getElementById('studentDropdown').classList.remove('open');
  document.getElementById('studentCreditList').innerHTML = '<div class="student-credit-empty">讀取中…</div>';
  document.getElementById('studentCreditOverlay').classList.add('open');
  try {
    const snap = await getDoc(doc(db, 'users', currentStudent.uid));
    currentStudentCredits = snap.exists() ? (snap.data().remainingCredits || {}) : {};
  } catch(e) {}
  renderStudentCreditList(currentStudentCredits);
});

document.getElementById('studentCreditClose').addEventListener('click', () => {
  document.getElementById('studentCreditOverlay').classList.remove('open');
});

document.getElementById('studentProfileBtn').addEventListener('click', async () => {
  document.getElementById('studentDropdown').classList.remove('open');
  document.getElementById('studentProfileEmail').textContent = currentStudent.email || '';
  // 讀取已儲存的暱稱
  try {
    const snap = await getDoc(doc(db, 'users', currentStudent.uid));
    const nickname = snap.exists() ? (snap.data().nickname || '') : '';
    document.getElementById('studentNicknameInput').value = nickname || currentStudent.displayName || '';
  } catch(e) {
    document.getElementById('studentNicknameInput').value = currentStudent.displayName || '';
  }
  document.getElementById('studentProfileOverlay').classList.add('open');
});

document.getElementById('studentProfileSave').addEventListener('click', async () => {
  const nickname = document.getElementById('studentNicknameInput').value.trim();
  if (!nickname) return;
  await setDoc(doc(db, 'users', currentStudent.uid), { nickname, email: currentStudent.email }, { merge: true });
  updateStudentBtn(nickname);
  document.getElementById('studentProfileOverlay').classList.remove('open');
});

document.getElementById('studentProfileCancel').addEventListener('click', () => {
  document.getElementById('studentProfileOverlay').classList.remove('open');
});

// 登出
document.getElementById('studentLogoutBtn').addEventListener('click', () => {
  document.getElementById('studentDropdown').classList.remove('open');
  document.getElementById('studentLogoutName').textContent = currentStudent.displayName || '學生';
  document.getElementById('studentLogoutOverlay').classList.add('open');
});

document.getElementById('studentLogoutCancel').addEventListener('click', () => {
  document.getElementById('studentLogoutOverlay').classList.remove('open');
});

document.getElementById('studentLogoutConfirm').addEventListener('click', async () => {
  if (studentOrdersUnsubscribe) { studentOrdersUnsubscribe(); studentOrdersUnsubscribe = null; }
  currentStudent = null;
  studentOrders = [];
  currentStudentCredits = {};
  sessionStorage.removeItem('loginRole');
  clearNotifications();
  updateStudentBtn();
  resetGoogleLoginBtn();
  document.getElementById('studentLogoutOverlay').classList.remove('open');
  await signOut(auth);
  if (currentView === 'calendar') renderCalendar(); else renderList();
  showToast('已登出！');
});

// onAuthStateChanged 已在 init 區塊統一處理



document.getElementById('closeAdmin').addEventListener('click', () => {
  document.getElementById('adminPanel').classList.remove('open');
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
    <button class="admin-tab" data-tab="orders">訂單管理</button>
    <button class="admin-tab" data-tab="leave">請假管理</button>
    <button class="admin-tab" data-tab="students">學生管理</button>
  `;
  body.appendChild(tabBar);

  const homeSection = document.createElement('div');
  homeSection.id = 'adminHomeSection';

  const courseSection = document.createElement('div');
  courseSection.id = 'adminCourseSection';
  courseSection.style.display = 'none';

  const orderSection = document.createElement('div');
  orderSection.id = 'adminOrderSection';
  orderSection.style.display = 'none';

  const leaveSection = document.createElement('div');
  leaveSection.id = 'adminLeaveSection';
  leaveSection.style.display = 'none';

  const studentSection = document.createElement('div');
  studentSection.id = 'adminStudentSection';
  studentSection.style.display = 'none';

  body.appendChild(homeSection);
  body.appendChild(courseSection);
  body.appendChild(orderSection);
  body.appendChild(leaveSection);
  body.appendChild(studentSection);

  tabBar.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      homeSection.style.display = 'none';
      courseSection.style.display = 'none';
      orderSection.style.display = 'none';
      leaveSection.style.display = 'none';
      studentSection.style.display = 'none';
      if (btn.dataset.tab === 'home') {
        homeSection.style.display = 'block';
      } else if (btn.dataset.tab === 'course') {
        courseSection.style.display = 'block';
      } else if (btn.dataset.tab === 'orders') {
        orderSection.style.display = 'block';
        renderOrderSection();
      } else if (btn.dataset.tab === 'leave') {
        leaveSection.style.display = 'block';
        renderLeaveSection();
      } else if (btn.dataset.tab === 'students') {
        studentSection.style.display = 'block';
        renderStudentSection();
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
      <div class="admin-hint">顯示在首頁最上方，標題與內容皆留空則不顯示</div>
      <div class="admin-announce">
        <input type="text" id="bigAnnounceTitle" class="admin-announce-title-input" placeholder="請輸入公告標題" value="${localStorage.getItem('globalNoticeTitle') || document.getElementById('globalNoticeTitle')?.innerText || ''}">
        <textarea id="bigAnnounce" placeholder="請輸入公告內容">${localStorage.getItem('globalNoticeBody') || document.getElementById('globalNoticeBody')?.innerText || ''}</textarea>
        <button class="save-announce" id="saveBigAnn">儲存</button>
      </div>
    `;
    homeSection.appendChild(bigCard);
    document.getElementById('saveBigAnn').addEventListener('click', () => {
      const title = document.getElementById('bigAnnounceTitle').value.trim();
      const body = document.getElementById('bigAnnounce').value.trim();
      const noticeTitleEl = document.getElementById('globalNoticeTitle');
      const noticeBodyEl = document.getElementById('globalNoticeBody');
      const noticeWrap = document.getElementById('globalNoticeWrap');
      if (noticeTitleEl) noticeTitleEl.innerText = title;
      if (noticeBodyEl) noticeBodyEl.innerText = body;
      if (noticeWrap) noticeWrap.style.display = (title || body) ? '' : 'none';
      localStorage.setItem('globalNoticeTitle', title);
      localStorage.setItem('globalNoticeBody', body);
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

    // 批次隱藏所有課程價格
    const batchTitle = document.createElement('div');
    batchTitle.className = 'admin-section-title';
    batchTitle.textContent = '課程功能設定（批次管理）';
    courseSection.appendChild(batchTitle);

    const batchCard = document.createElement('div');
    batchCard.className = 'admin-card';
    batchCard.innerHTML = `
      <div class="batch-feature-row">
        <span class="batch-feature-label">顯示價格</span>
        <div class="batch-feature-btns">
          <button class="batch-btn" data-feature="showPrice" data-val="true">全部開啟</button>
          <button class="batch-btn" data-feature="showPrice" data-val="false">全部關閉</button>
        </div>
      </div>
      <div class="batch-feature-row">
        <span class="batch-feature-label">開放報名</span>
        <div class="batch-feature-btns">
          <button class="batch-btn" data-feature="open" data-val="true">全部開啟</button>
          <button class="batch-btn" data-feature="open" data-val="false">全部關閉</button>
        </div>
      </div>
      <div class="batch-feature-row">
        <span class="batch-feature-label">需先付款</span>
        <div class="batch-feature-btns">
          <button class="batch-btn" data-feature="requirePayment" data-val="true">全部開啟</button>
          <button class="batch-btn" data-feature="requirePayment" data-val="false">全部關閉</button>
        </div>
      </div>
      <div class="batch-feature-row">
        <span class="batch-feature-label">顯示學員名單</span>
        <div class="batch-feature-btns">
          <button class="batch-btn" data-feature="showRoster" data-val="true">全部開啟</button>
          <button class="batch-btn" data-feature="showRoster" data-val="false">全部關閉</button>
        </div>
      </div>
    `;
    courseSection.appendChild(batchCard);

    const featureLabels = { showPrice: '顯示價格', open: '開放報名', requirePayment: '需先付款', showRoster: '顯示學員名單' };
    batchCard.querySelectorAll('.batch-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const feature = btn.dataset.feature;
        const val = btn.dataset.val === 'true';
        const label = featureLabels[feature];
        const action = val ? '全部開啟' : '全部關閉';
        if (!confirm(`確定要將所有課程的「${label}」${action}嗎？`)) return;
        courses.forEach(c => { c[feature] = val; });
        await saveToStorage();
        if (currentView === 'calendar') renderCalendar(); else renderList();
        showToast(`已將所有課程的「${label}」${action}`);
        renderCourseSection();
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
      <div class="cei-spots-section">
        <div class="cei-spots-header">
         <span class="cei-label">價格</span>
         <div class="toggle-row">
           <span class="toggle-label" id="newShowPriceLabel">隱藏價格</span>
           <label class="toggle">
             <input type="checkbox" id="newShowPrice">
             <span class="toggle-slider"></span>
           </label>
         </div>
       </div>
         <input type="number" class="cei-input" id="newPrice" value="500">
       </div>
        <div class="cei-spots-header">
         <span class="cei-label">需先付款</span>
          <div class="toggle-row">
           <span class="toggle-label" id="newRequirePaymentLabel">不需要</span>
           <label class="toggle">
             <input type="checkbox" id="newRequirePayment">
             <span class="toggle-slider"></span>
           </label>
         </div>
        </div>
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
    document.getElementById('newShowPrice').addEventListener('change', function() {
      document.getElementById('newShowPriceLabel').textContent = this.checked ? '顯示價格' : '隱藏價格';
    });
    document.getElementById('newRequirePayment').addEventListener('change', function() {
      document.getElementById('newRequirePaymentLabel').textContent = this.checked ? '需要' : '不需要';
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
        showPrice: document.getElementById('newShowPrice').checked,
        requirePayment: document.getElementById('newRequirePayment').checked,
      };
      courses.push(newCourse);
      bookings[newId] = [];
      saveToStorage();
      if (currentView === 'calendar') renderCalendar(); else renderList();
      alert(`「${titleVal}」已新增！`);
      renderCourseSection();
    });
  }

  // ── 訂單管理 ──
  async function renderOrderSection() {
    orderSection.innerHTML = '<div class="admin-section-title">訂單管理</div><div style="padding:16px;color:#aaa;font-size:0.85rem">載入中…</div>';

    const tid = teacherId || TEACHER_ID_STATIC;
    let orders = [];
    try {
      const snap = await getDocs(collection(db, 'teachers', tid, 'orders'));
      snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
    } catch(e) {
      orderSection.innerHTML = '<div style="padding:16px;color:#e74c3c">讀取失敗，請重試</div>';
      return;
    }

    orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // 撈這批訂單涉及到的所有學生目前未用堂數（資料已在記憶體，審核時不用多查一次）
    const creditsMap = new Map(); // studentId → { [poolKey]: 數量 }
    const uniqueStudentIds = [...new Set(orders.map(o => o.studentId).filter(Boolean))];
    await Promise.all(uniqueStudentIds.map(async sid => {
      creditsMap.set(sid, await getStudentCredits(tid, sid));
    }));

    orderSection.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'admin-section-title';
    title.textContent = '訂單管理';
    orderSection.appendChild(title);

    if (orders.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'order-empty-hint';
      empty.textContent = '目前還沒有訂單';
      orderSection.appendChild(empty);
      return;
    }

    const filterBar = document.createElement('div');
    filterBar.className = 'admin-tab-bar';
    filterBar.style.marginBottom = '12px';
    filterBar.innerHTML = `
      <button class="admin-tab active" data-filter="pending">待審核 (${orders.filter(o=>o.status==='pending').length})</button>
      <button class="admin-tab" data-filter="reviewed">已審核 (${orders.filter(o=>o.status!=='pending').length})</button>
    `;
    orderSection.appendChild(filterBar);

    const listWrap = document.createElement('div');
    orderSection.appendChild(listWrap);

    const CANCEL_REASONS = ['已額滿', '時間衝突', '課程取消', '其他'];

    function renderFilteredOrders(filter) {
      listWrap.innerHTML = '';
      const filtered = filter === 'reviewed'
      ? orders.filter(o => o.status !== 'pending')
      : orders.filter(o => o.status === filter);
      if (filtered.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'order-empty-hint';
        hint.textContent = `沒有${filter === 'pending' ? '待審核' : '已審核'}的訂單`;
        listWrap.appendChild(hint);
        return;
      }

      filtered.forEach(order => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.style.marginBottom = '12px';

        const dateStr = order.createdAt
          ? new Date(order.createdAt).toLocaleString('zh-TW', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })
          : '';

        // 計算每堂課超收狀態
        const coursesWithStatus = (order.courses || []).map(c => {
          const booked = (bookings[c.courseId] || []).length;
          const course = courses.find(x => x.id === c.courseId);
          const maxSpots = course ? course.maxSpots : null;
          const isOver = maxSpots !== null && booked >= maxSpots;
          return { ...c, booked, maxSpots, isOver };
        });

        const isPending = order.status === 'pending';

        // ── 堂數池：這筆訂單涉及的 poolKey，以及該學生目前各池未用堂數 ──
        const studentCredits = creditsMap.get(order.studentId) || {};
        const orderPoolKeys = [...new Set(
          (order.courses || []).map(c => getPoolKey(courses.find(cs => cs.id === c.courseId) || { title: c.title }))
        )].filter(Boolean);

        // ── 審核時「本次新增幾堂」輸入（只有待審核訂單需要，值會暫存 localStorage）──
        // 預設空白不是 0：0 也是一個「有意義的輸入」，空白才代表老師還沒填
        const creditAddHtml = isPending && order.studentId && orderPoolKeys.length ? `
          <div class="credit-add-wrap" data-order-id="${order.id}">
            <div class="credit-add-title">未使用堂數異動（增加請填正數、減少請填負數）<br>（審核完成後自動套用，不用手動計算目前總堂數）</div>
            ${orderPoolKeys.map(pk => {
              const draft = localStorage.getItem(`credit_draft_${order.id}_${pk}`);
              const val = draft != null ? draft : '';
              return `
              <div class="credit-add-row">
                <span class="credit-add-label">${poolLabel(pk)}</span>
                <input class="credit-add-input" type="number" placeholder="0" value="${val}" data-pool="${pk}" data-order-id="${order.id}">
                <span class="credit-add-unit">堂</span>
              </div>
            `;
            }).join('')}
          </div>
        ` : '';

        // ── 目前未用堂數：只有待審核訂單顯示，放在最上面「聯絡資訊」的位置（展開才看得到）──
        // 標題沿用 order-contact 那個灰色（跟日期同一種灰），標籤不額外包深色底，跟學生管理頁視覺一致
        const contactHtml = isPending && order.studentId && orderPoolKeys.length ? `
          <div class="order-contact">未用堂數</div>
          <div class="credit-tags" style="margin-bottom:8px">
            ${orderPoolKeys.map(pk => `<span class="credit-tag">${poolLabel(pk)} <b>${studentCredits[pk] || 0}</b>堂</span>`).join('')}
          </div>
        ` : `<div class="order-contact">本行文字待定，預計填寫email/手機/line名稱</div>`;

        // ── ✍️手動調整未用堂數（已審核訂單才顯示，補堂／修正用，跟學生管理頁共用同一顆 setCredits）──
        const manualAdjustHtml = !isPending && order.studentId ? (() => {
          const allKeys = allPoolKeys();
          const firstKey = allKeys[0] || '';
          return `
          <div class="credit-manual-wrap" data-student-id="${order.studentId}" data-student-name="${order.studentName || ''}">
            <button class="credit-manual-toggle" type="button">✍️手動調整未用堂數</button>
            <div class="credit-manual-form" style="display:none">
              <select class="credit-manual-pool">
                ${allKeys.map(pk => `<option value="${pk}" data-current="${studentCredits[pk] || 0}">${poolLabel(pk)}</option>`).join('')}
              </select>
              <input class="credit-manual-total" type="number" value="${studentCredits[firstKey] || 0}">
              <span class="credit-add-unit">堂</span>
              <button class="credit-manual-apply" type="button">套用</button>
            </div>
          </div>
        `;
        })() : '';

        const coursesHtml = coursesWithStatus.map((c, idx) => `
          <div class="order-course-item" data-course-idx="${idx}">
            <div class="order-course-left">
              <span class="order-course-title">${c.title}${c.isOver ? ` <span class="order-overbook-tag">超收</span>` : ''}${c.maxSpots !== null ? `<span class="order-course-spots">名額 ${c.booked}/${c.maxSpots}</span>` : ''}</span>
              <span class="order-course-meta">📅 ${c.date} ${c.time}</span>
            </div>
            <div class="order-course-right">
              <span class="order-course-price">$${c.price}</span>
              ${isPending ? `
                <div class="order-course-actions">
                  <button class="order-course-btn-confirm" data-order-id="${order.id}" data-course-idx="${idx}">✓</button>
                  <button class="order-course-btn-cancel" data-order-id="${order.id}" data-course-idx="${idx}">✕</button>
                </div>
              ` : c.result === 'confirmed' ? '<div class="order-course-actions"><button class="order-course-btn-confirm selected" disabled>✓</button></div>' : c.result === 'cancelled' ? '<div class="order-course-actions"><button class="order-course-btn-cancel selected" disabled>✕</button></div>' : ''}
            </div>
          </div>
        `).join('');

        // 自動加總金額
        const autoAmount = (order.courses || []).reduce((sum, c) => sum + (c.price || 0), 0);
        const savedAmount = localStorage.getItem(`amount_draft_${order.id}`);
        const displayAmount = savedAmount != null ? savedAmount : (order.amount != null ? order.amount : autoAmount);
        const isPaid = order.paid === true;

        const amountHtml = `
          <div class="order-amount-row">
            <span class="order-amount-label">金額</span>
            <span class="order-amount-wrap">$<input class="order-amount-input" type="number" value="${displayAmount}" min="0" data-id="${order.id}"></span>
            <button class="order-paid-btn ${isPaid ? 'paid' : ''}" data-id="${order.id}">${isPaid ? '✓ 已付款' : '未付款'}</button>
            <button class="order-amount-save-btn" data-id="${order.id}">儲存金額</button>
          </div>
        `;

        const bulkActionHtml = isPending ? `
          <div class="order-bulk-actions">
            <button class="order-course-btn-confirm order-btn-bulk-confirm" data-id="${order.id}">✓ 全部確認</button>
            <button class="order-course-btn-cancel order-btn-bulk-cancel" data-id="${order.id}">✕ 全部取消</button>
          </div>
          <div class="order-cancel-reason-wrap order-bulk-cancel-reason" style="display:none">
            <div class="order-cancel-reason-label">全部取消原因</div>
            <div class="order-cancel-reason-btns">
              ${CANCEL_REASONS.map(r => `<button class="order-bulk-reason-btn" data-reason="${r}">${r}</button>`).join('')}
            </div>
          </div>
          ${creditAddHtml}
          ${amountHtml}
          <div class="order-actions" style="margin-top:8px">
            <button class="order-btn-finish" data-id="${order.id}">審核完成</button>
            <button class="order-btn-cancel" data-id="${order.id}">取消整筆</button>
          </div>
        ` : amountHtml;

        card.innerHTML = `
          <div class="order-header order-header-toggle">
            <div class="order-student-name">${order.studentName || '未知學生'}</div>
            <div class="order-date">${dateStr} <span class="order-collapse-arrow">▼</span></div>
          </div>
          <div class="order-card-body" style="display:none">
          ${contactHtml}
          ${order.phone ? `<div class="order-phone">📞 ${order.phone}</div>` : ''}
          <div class="order-courses">${coursesHtml}</div>
          ${order.note ? `<div class="order-note">備註：${order.note}</div>` : ''}
          ${manualAdjustHtml}
          <div class="order-cancel-reason-wrap order-single-cancel-reason" style="display:none">
            <div class="order-cancel-reason-label">取消原因</div>
            <div class="order-cancel-reason-btns">
              ${CANCEL_REASONS.map(r => `<button class="order-reason-btn" data-reason="${r}">${r}</button>`).join('')}
            </div>
          </div>
          ${bulkActionHtml}
          </div>
        `;
        // 點 header 展開/收合
        card.querySelector('.order-header-toggle').addEventListener('click', () => {
          const body = card.querySelector('.order-card-body');
          const arrow = card.querySelector('.order-collapse-arrow');
          const isOpen = body.style.display !== 'none';
          body.style.display = isOpen ? 'none' : 'block';
          arrow.textContent = isOpen ? '▼' : '▲';
        });
        listWrap.appendChild(card);
      });

      // ── 單堂確認（本地暫存，標綠）──
      listWrap.querySelectorAll('.order-course-btn-confirm').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.dataset.orderId;
          const idx = parseInt(btn.dataset.courseIdx);
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          const card = btn.closest('.admin-card');
          // 取消同一堂的叉選中狀態
          const cancelBtn = card.querySelector(`.order-course-btn-cancel[data-order-id="${orderId}"][data-course-idx="${idx}"]`);
          if (cancelBtn) cancelBtn.classList.remove('selected');
          // 關掉單堂取消理由區（如果有開）
          const singleReason = card.querySelector('.order-single-cancel-reason');
          if (singleReason && singleReason.dataset.courseIdx == idx) {
            singleReason.style.display = 'none';
            delete order.courses[idx].cancelReason;
          }
          // 切換選中狀態
          if (btn.classList.contains('selected')) {
            btn.classList.remove('selected');
            delete order.courses[idx].localResult;
          } else {
            btn.classList.add('selected');
            order.courses[idx].localResult = 'confirmed';
          }
        });
      });

      // ── 單堂取消（選理由後本地暫存；已選中再按切換取消）──
      listWrap.querySelectorAll('.order-course-btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.dataset.orderId;
          const idx = parseInt(btn.dataset.courseIdx);
          const card = btn.closest('.admin-card');
          const singleReason = card.querySelector('.order-single-cancel-reason');
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          // 已選中 → 切換取消
          if (btn.classList.contains('selected')) {
            btn.classList.remove('selected');
            delete order.courses[idx].localResult;
            delete order.courses[idx].cancelReason;
            singleReason.style.display = 'none';
            return;
          }
          // 開理由選單
          singleReason.style.display = 'block';
          singleReason.dataset.orderId = orderId;
          singleReason.dataset.courseIdx = idx;
        });
      });

      // ── 單堂取消理由按鈕（本地暫存）──
      listWrap.querySelectorAll('.order-reason-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const reasonWrap = btn.closest('.order-single-cancel-reason');
          const orderId = reasonWrap.dataset.orderId;
          const idx = parseInt(reasonWrap.dataset.courseIdx);
          const reason = btn.dataset.reason;
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          const card = btn.closest('.admin-card');
          // 取消同一堂的勾選中狀態
          const confirmBtn = card.querySelector(`.order-course-btn-confirm[data-order-id="${orderId}"][data-course-idx="${idx}"]`);
          if (confirmBtn) confirmBtn.classList.remove('selected');
          // 標記叉為選中
          const cancelBtn = card.querySelector(`.order-course-btn-cancel[data-order-id="${orderId}"][data-course-idx="${idx}"]`);
          if (cancelBtn) cancelBtn.classList.add('selected');
          // 本地暫存
          order.courses[idx].localResult = 'cancelled';
          order.courses[idx].cancelReason = reason;
          reasonWrap.style.display = 'none';
          showToast(`${order.courses[idx].title} 標記為取消（${reason}）`);
        });
      });

      // ── 全部確認（本地暫存，全標綠）──
      listWrap.querySelectorAll('.order-btn-bulk-confirm').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.dataset.id;
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          const card = btn.closest('.admin-card');
          order.courses.forEach((c, idx) => {
            c.localResult = 'confirmed';
            delete c.cancelReason;
            const confirmBtn = card.querySelector(`.order-course-btn-confirm[data-order-id="${orderId}"][data-course-idx="${idx}"]`);
            const cancelBtn = card.querySelector(`.order-course-btn-cancel[data-order-id="${orderId}"][data-course-idx="${idx}"]`);
            if (confirmBtn) confirmBtn.classList.add('selected');
            if (cancelBtn) cancelBtn.classList.remove('selected');
          });
          // 關掉理由區
          card.querySelector('.order-single-cancel-reason').style.display = 'none';
          card.querySelector('.order-bulk-cancel-reason').style.display = 'none';
        });
      });

      // ── 全部取消（選理由後本地暫存，全標紅）──
      listWrap.querySelectorAll('.order-btn-bulk-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.dataset.id;
          const card = btn.closest('.admin-card');
          const bulkReason = card.querySelector('.order-bulk-cancel-reason');
          bulkReason.style.display = 'block';
          bulkReason.dataset.orderId = orderId;
        });
      });

      // ── 全部取消理由按鈕（本地暫存）──
      listWrap.querySelectorAll('.order-bulk-reason-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const reasonWrap = btn.closest('.order-bulk-cancel-reason');
          const orderId = reasonWrap.dataset.orderId;
          const reason = btn.dataset.reason;
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          const card = btn.closest('.admin-card');
          order.courses.forEach((c, idx) => {
            c.localResult = 'cancelled';
            c.cancelReason = reason;
            const confirmBtn = card.querySelector(`.order-course-btn-confirm[data-order-id="${orderId}"][data-course-idx="${idx}"]`);
            const cancelBtn = card.querySelector(`.order-course-btn-cancel[data-order-id="${orderId}"][data-course-idx="${idx}"]`);
            if (confirmBtn) confirmBtn.classList.remove('selected');
            if (cancelBtn) cancelBtn.classList.add('selected');
          });
          reasonWrap.style.display = 'none';
          showToast(`全部標記為取消（${reason}）`);
        });
      });

      // ── 已付款切換 ──
      listWrap.querySelectorAll('.order-paid-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orderId = btn.dataset.id;
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          const newPaid = !order.paid;
          order.paid = newPaid;
          btn.classList.toggle('paid', newPaid);
          btn.textContent = newPaid ? '✓ 已付款' : '未付款';
          try {
            const tid = teacherId || TEACHER_ID_STATIC;
            await updateDoc(doc(db, 'teachers', tid, 'orders', orderId), { paid: newPaid });
          } catch(e) {
            console.warn('付款狀態儲存失敗', e);
          }
        });
      });

      // ── 金額輸入暫存到 localStorage ──
      listWrap.querySelectorAll('.order-amount-input').forEach(input => {
        input.addEventListener('input', () => {
          localStorage.setItem(`amount_draft_${input.dataset.id}`, input.value);
        });
      });

      // ── 未使用堂數異動暫存到 localStorage（跟金額一樣，重整或切出去不會不見）──
      listWrap.querySelectorAll('.credit-add-input').forEach(input => {
        input.addEventListener('input', () => {
          localStorage.setItem(`credit_draft_${input.dataset.orderId}_${input.dataset.pool}`, input.value);
        });
      });

      // ── 儲存金額（寫入 Firestore，清除暫存）──
      listWrap.querySelectorAll('.order-amount-save-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orderId = btn.dataset.id;
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          const input = listWrap.querySelector(`.order-amount-input[data-id="${orderId}"]`);
          const finalAmount = Number(input.value);
          order.amount = finalAmount;
          btn.textContent = '儲存中…'; btn.disabled = true;
          try {
            const tid = teacherId || TEACHER_ID_STATIC;
            await updateDoc(doc(db, 'teachers', tid, 'orders', orderId), { amount: finalAmount });
            localStorage.removeItem(`amount_draft_${orderId}`);
            showToast('金額已儲存');
          } catch(e) {
            showToast('儲存失敗，請再試一次');
          }
          btn.textContent = '儲存金額'; btn.disabled = false;
        });
      });

      // ── 審核完成（一次寫入 Firestore）──
      listWrap.querySelectorAll('.order-btn-finish').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orderId = btn.dataset.id;
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          // 確認每堂都有標記
          const allMarked = order.courses.every(c => c.localResult === 'confirmed' || c.localResult === 'cancelled');
          if (!allMarked) {
            showToast('請先對每堂課標記確認或取消');
            return;
          }
          // 若課程需先付款，檢查是否已付款
          const needsPayment = order.courses.some(c => {
            const course = courses.find(cs => cs.id === c.courseId);
            return course && course.requirePayment;
          });
          if (needsPayment && !order.paid) {
            showToast('此課程需先付款，請確認付款狀態');
            return;
          }
          // 防呆：這筆訂單有堂數池、但「未使用堂數異動」整排都還沒填，跳出來確認一下，避免忘記填就送出
          const addWrapCheck = listWrap.querySelector(`.credit-add-wrap[data-order-id="${orderId}"]`);
          if (addWrapCheck) {
            const addInputsCheck = [...addWrapCheck.querySelectorAll('.credit-add-input')];
            const allEmpty = addInputsCheck.some(inp => inp.value.trim() === '');
            const hasConfirmed = order.courses.some(c => c.localResult === 'confirmed');
            if (allEmpty && hasConfirmed) {
              const proceed = confirm('未使用堂數異動還沒填寫，確定不調整堂數直接送出審核嗎？');
              if (!proceed) return;
            }
          }
          btn.textContent = '儲存中…'; btn.disabled = true;
          try {
            const tid = teacherId || TEACHER_ID_STATIC;
            // 把 localResult 寫入 result
            order.courses = order.courses.map(({ localResult, ...c }) => ({ ...c, result: localResult }));
            const allConfirmed = order.courses.every(c => c.result === 'confirmed');
            const newStatus = allConfirmed ? 'confirmed' : 'cancelled';
            const amountInput = listWrap.querySelector(`.order-amount-input[data-id="${orderId}"]`);
            const finalAmount = amountInput ? Number(amountInput.value) : (order.amount || 0);
            order.amount = finalAmount;
            await updateDoc(doc(db, 'teachers', tid, 'orders', orderId), { status: newStatus, courses: order.courses, amount: finalAmount, paid: order.paid || false });
            // 同步更新學生端訂單狀態與各堂課結果
            try {
              await updateDoc(doc(db, 'users', order.studentId, 'orders', orderId), {
                status: newStatus,
                courses: order.courses
              });
            } catch(syncErr) {
              console.warn('學生端同步失敗（不影響老師端）', syncErr);
            }
            // 更新 bookings（只加確認的）
            for (const c of order.courses) {
              if (c.result !== 'confirmed') continue;
              const list = bookings[c.courseId] || [];
              if (!list.some(b => b.studentId === order.studentId || b.name === order.studentName)) {
                const now = new Date().toLocaleString('zh-TW', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
                list.push({
                  name: order.studentName,
                  phone: order.phone || '',
                  time: now,
                  studentId: order.studentId,
                  orderId: orderId
                });
                bookings[c.courseId] = list;
              }
            }
            await saveToStorage();
            order.status = newStatus;
            // 未使用堂數異動：讀取「本次新增幾堂」輸入框，自動加總到對應堂數池
            if (order.studentId) {
              const addWrap = listWrap.querySelector(`.credit-add-wrap[data-order-id="${orderId}"]`);
              if (addWrap) {
                const addInputs = addWrap.querySelectorAll('.credit-add-input');
                for (const input of addInputs) {
                  const raw = input.value.trim();
                  const delta = raw === '' ? 0 : Number(raw);
                  const poolKey = input.dataset.pool;
                  if (delta) {
                    await adjustCredits(tid, order.studentId, order.studentName, poolKey, delta);
                  }
                  // 審核完成了，清掉這筆訂單這個 pool 的本地暫存
                  localStorage.removeItem(`credit_draft_${orderId}_${poolKey}`);
                }
              }
            }
            // 通知學生審核結果
            pushNotification('users', order.studentId, {
              type: 'order_updated',
              message: '您的課程申請狀態已更新',
              detail: courseSummaryText(order.courses)
            });
            if (currentView === 'calendar') renderCalendar(); else renderList();
            showToast(`審核完成：${order.studentName}`);
            renderOrderSection();
          } catch(e) {
            showToast('操作失敗，請再試一次');
            btn.textContent = '審核完成'; btn.disabled = false;
          }
        });
      });

      // ── 取消整筆（直接寫 Firestore，不用理由）──
      listWrap.querySelectorAll('.order-btn-cancel').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orderId = btn.dataset.id;
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          btn.textContent = '處理中…'; btn.disabled = true;
          try {
            const tid = teacherId || TEACHER_ID_STATIC;
            order.courses = order.courses.map(c => ({ ...c, result: 'cancelled' }));
            await updateDoc(doc(db, 'teachers', tid, 'orders', orderId), { status: 'cancelled', courses: order.courses });
            // 同步更新學生端
            try {
              await updateDoc(doc(db, 'users', order.studentId, 'orders', orderId), {
                status: 'cancelled',
                courses: order.courses
              });
            } catch(syncErr) {
              console.warn('學生端同步失敗（不影響老師端）', syncErr);
            }
            order.status = 'cancelled';
            // 通知學生訂單已取消
            pushNotification('users', order.studentId, {
              type: 'order_updated',
              message: '您的訂單已取消',
              detail: courseSummaryText(order.courses)
            });
            showToast(`已取消 ${order.studentName} 的訂單`);
            renderOrderSection();
          } catch(e) {
            showToast('操作失敗，請再試一次');
            btn.textContent = '取消整筆'; btn.disabled = false;
          }
        });
      });

      // ── ✍️手動調整未用堂數（已審核訂單，跟學生管理頁共用同一顆 setCredits）──
      listWrap.querySelectorAll('.credit-manual-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const form = btn.nextElementSibling;
          const isOpen = form.style.display !== 'none';
          form.style.display = isOpen ? 'none' : 'flex';
        });
      });
      listWrap.querySelectorAll('.credit-manual-pool').forEach(select => {
        select.addEventListener('change', () => {
          const totalInput = select.closest('.credit-manual-form').querySelector('.credit-manual-total');
          const opt = select.options[select.selectedIndex];
          totalInput.value = opt.dataset.current || 0;
        });
      });
      listWrap.querySelectorAll('.credit-manual-apply').forEach(btn => {
        btn.addEventListener('click', async () => {
          const wrap = btn.closest('.credit-manual-wrap');
          const studentId = wrap.dataset.studentId;
          const studentName = wrap.dataset.studentName;
          const poolKey = wrap.querySelector('.credit-manual-pool').value;
          const total = Number(wrap.querySelector('.credit-manual-total').value);
          if (isNaN(total) || total < 0) { showToast('請輸入正確的總堂數'); return; }
          btn.textContent = '處理中…'; btn.disabled = true;
          try {
            const tid2 = teacherId || TEACHER_ID_STATIC;
            const result = await setCredits(tid2, studentId, studentName, poolKey, total);
            if (result) {
              showToast(`已將 ${poolLabel(poolKey)} 設為 ${total} 堂`);
              renderOrderSection();
            } else {
              showToast('調整失敗，請再試一次');
            }
          } catch(e) {
            showToast('調整失敗，請再試一次');
          }
          btn.textContent = '套用'; btn.disabled = false;
        });
      });
    }

    filterBar.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFilteredOrders(btn.dataset.filter);
      });
    });

    renderFilteredOrders('pending');
  }

  // ── 請假管理（v3.3 第四階段）──
  // 資料來源跟訂單管理同一個 collection，但撈的是「訂單裡任一堂課有 leaveStatus」的紀錄，
  // 攤平成一筆一筆請假申請卡片（一張訂單可能有多堂課分別請假，各自獨立處理）
  async function renderLeaveSection() {
    leaveSection.innerHTML = '<div class="admin-section-title">請假管理</div><div style="padding:16px;color:#aaa;font-size:0.85rem">載入中…</div>';

    const tid = teacherId || TEACHER_ID_STATIC;

    // 請假截止時間設定（預設24小時），存在 teachers/{tid}/settings/leaveSettings
    let deadlineHours = 24;
    try {
      const settingsSnap = await getDoc(teacherDoc('leaveSettings'));
      if (settingsSnap.exists() && settingsSnap.data().deadlineHours != null) {
        deadlineHours = settingsSnap.data().deadlineHours;
      }
    } catch (e) { /* 讀取失敗就用預設值 */ }

    let orders = [];
    try {
      const snap = await getDocs(collection(db, 'teachers', tid, 'orders'));
      snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
    } catch (e) {
      leaveSection.innerHTML = '<div style="padding:16px;color:#e74c3c">讀取失敗，請重試</div>';
      return;
    }

    // 攤平：每筆訂單裡每一堂課，只要有 leaveStatus 就是一筆請假紀錄
    const leaveItems = [];
    orders.forEach(order => {
      (order.courses || []).forEach((c, idx) => {
        if (c.leaveStatus && c.leaveStatus !== 'none') {
          leaveItems.push({ order, courseIdx: idx });
        }
      });
    });

    leaveItems.sort((a, b) =>
      (b.order.courses[b.courseIdx].leaveRequestedAt || '').localeCompare(a.order.courses[a.courseIdx].leaveRequestedAt || '')
    );

    leaveSection.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'admin-section-title';
    title.textContent = '請假管理';
    leaveSection.appendChild(title);

    // 請假截止時間設定
    const settingsWrap = document.createElement('div');
    settingsWrap.className = 'leave-settings-wrap';
    settingsWrap.innerHTML = `
      <span class="leave-settings-label">請假截止時間</span>
      <input type="number" class="leave-settings-input" id="leaveDeadlineInput" value="${deadlineHours}" min="0">
      <span class="leave-settings-label">小時</span>
      <button class="leave-settings-save" id="leaveDeadlineSave">儲存</button>
    `;
    leaveSection.appendChild(settingsWrap);

    settingsWrap.querySelector('#leaveDeadlineSave').addEventListener('click', async () => {
      const val = Number(settingsWrap.querySelector('#leaveDeadlineInput').value);
      if (isNaN(val) || val < 0) { showToast('請輸入正確的小時數'); return; }
      try {
        await setDoc(teacherDoc('leaveSettings'), { deadlineHours: val }, { merge: true });
        showToast('已更新請假截止時間');
        renderLeaveSection();
      } catch (e) { showToast('儲存失敗，請再試一次'); }
    });

    if (leaveItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'order-empty-hint';
      empty.textContent = '目前還沒有請假申請';
      leaveSection.appendChild(empty);
      return;
    }

    const filterBar = document.createElement('div');
    filterBar.className = 'admin-tab-bar';
    filterBar.style.marginBottom = '12px';
    filterBar.innerHTML = `
      <button class="admin-tab active" data-filter="pending">待處理 (${leaveItems.filter(i => i.order.courses[i.courseIdx].leaveStatus === 'pending').length})</button>
      <button class="admin-tab" data-filter="reviewed">已處理 (${leaveItems.filter(i => i.order.courses[i.courseIdx].leaveStatus !== 'pending').length})</button>
    `;
    leaveSection.appendChild(filterBar);

    const listWrap = document.createElement('div');
    leaveSection.appendChild(listWrap);

    function renderFilteredLeaves(filter) {
      listWrap.innerHTML = '';
      const filtered = filter === 'reviewed'
        ? leaveItems.filter(i => i.order.courses[i.courseIdx].leaveStatus !== 'pending')
        : leaveItems.filter(i => i.order.courses[i.courseIdx].leaveStatus === 'pending');

      if (filtered.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'order-empty-hint';
        hint.textContent = `沒有${filter === 'pending' ? '待處理' : '已處理'}的請假`;
        listWrap.appendChild(hint);
        return;
      }

      filtered.forEach(({ order, courseIdx }) => {
        const c = order.courses[courseIdx];
        const card = document.createElement('div');
        card.className = 'admin-card leave-card';
        card.style.marginBottom = '12px';

        const isPending = c.leaveStatus === 'pending';

        // 距離開課還有幾小時：用老師打開審核當下的即時時間計算（不是學生送出申請的時間）
        const startTime = parseCourseStartTime(c.time);
        const classDateTime = (c.dateStr && startTime) ? new Date(`${c.dateStr}T${startTime}:00`) : null;
        const hoursLeft = classDateTime ? (classDateTime - new Date()) / 3600000 : null;
        const hoursLeftText = hoursLeft === null ? '未知'
          : hoursLeft < 0 ? '已經開課'
          : `${Math.round(hoursLeft)} 小時`;

        // 超過截止時間（notice 給得夠早）→ 預選「是」增加剩餘堂數；未超過 → 預選「否」
        const defaultIncrease = hoursLeft !== null && hoursLeft > deadlineHours;

        const resultTagHtml = !isPending ? (
          c.leaveStatus === 'approved_refund' ? '<span class="leave-result-tag refund">✓ 不扣堂・已退回</span>'
          : c.leaveStatus === 'approved_deduct' ? '<span class="leave-result-tag deduct">✓ 已扣堂・已請假</span>'
          : c.leaveStatus === 'rejected' ? '<span class="leave-result-tag rejected">✗ 已拒絕・恢復報名</span>'
          : ''
        ) : '';

        const leaveRequestedAtText = c.leaveRequestedAt
          ? new Date(c.leaveRequestedAt).toLocaleString('zh-TW', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })
          : '';

        card.innerHTML = `
          <div class="order-header">
            <div class="order-student-name">${order.studentName || '未知學生'}</div>
            ${isPending ? `
              <div class="order-course-actions leave-actions">
                <button class="order-course-btn-confirm leave-btn-approve" data-order-id="${order.id}" data-course-idx="${courseIdx}">✓</button>
                <button class="order-course-btn-cancel leave-btn-reject" data-order-id="${order.id}" data-course-idx="${courseIdx}">✕</button>
              </div>
            ` : `<div class="order-date">${leaveRequestedAtText}</div>`}
          </div>
          <div class="order-course-title">${c.title}</div>
          <div class="order-course-meta">📅 ${c.date} ${c.time}${isPending && leaveRequestedAtText ? `　<span class="leave-requested-at">申請於 ${leaveRequestedAtText}</span>` : ''}</div>
          <div class="order-contact leave-countdown">${isPending ? `距離開課還有 ${hoursLeftText}` : ''}</div>
          ${isPending ? `
            <div class="leave-expand" style="display:none">
              <div class="credit-add-title">是否增加未使用堂數（系統依截止時間預選，可覆蓋）</div>
              <div class="order-course-actions" style="margin-bottom:8px">
                <button type="button" class="order-course-btn-confirm leave-toggle-btn ${defaultIncrease ? 'selected' : ''}" data-value="yes" style="width:auto;padding:4px 14px">是</button>
                <button type="button" class="order-course-btn-cancel leave-toggle-btn ${!defaultIncrease ? 'selected' : ''}" data-value="no" style="width:auto;padding:4px 14px">否</button>
              </div>
              <div class="credit-add-row">
                <span class="credit-add-label">堂數異動</span>
                <input class="credit-add-input leave-delta-input leave-delta-default" type="number" value="${defaultIncrease ? 1 : 0}" data-touched="false">
                <span class="credit-add-unit">堂</span>
              </div>
              <div class="order-actions" style="margin-top:8px">
                <button class="order-btn-finish leave-btn-finish" data-order-id="${order.id}" data-course-idx="${courseIdx}">審核完成</button>
                <button class="order-btn-cancel leave-btn-undo">取消／改筆</button>
              </div>
            </div>
          ` : `<div style="margin-top:8px">${resultTagHtml}</div>`}
        `;
        listWrap.appendChild(card);
      });

      // ✓ 展開審核表單
      listWrap.querySelectorAll('.leave-btn-approve').forEach(btn => {
        btn.addEventListener('click', () => {
          const card = btn.closest('.leave-card');
          card.querySelector('.leave-actions').style.display = 'none';
          card.querySelector('.leave-expand').style.display = 'block';
        });
      });

      // 取消／改筆：收合回去，不做任何異動
      listWrap.querySelectorAll('.leave-btn-undo').forEach(btn => {
        btn.addEventListener('click', () => {
          const card = btn.closest('.leave-card');
          card.querySelector('.leave-expand').style.display = 'none';
          card.querySelector('.leave-actions').style.display = 'flex';
        });
      });

      // 是／否 切換，連動堂數異動預設值（切換過視為「已確認」，取消反灰）
      listWrap.querySelectorAll('.leave-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const group = btn.parentElement;
          group.querySelectorAll('.leave-toggle-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          const deltaInput = btn.closest('.leave-expand').querySelector('.leave-delta-input');
          deltaInput.value = btn.dataset.value === 'yes' ? 1 : 0;
          deltaInput.dataset.touched = 'true';
          deltaInput.classList.remove('leave-delta-default');
        });
      });

      // 手動改數字欄位也視為「已確認」，取消反灰
      listWrap.querySelectorAll('.leave-delta-input').forEach(input => {
        input.addEventListener('input', () => {
          input.dataset.touched = 'true';
          input.classList.remove('leave-delta-default');
        });
      });

      // ✕ 拒絕：整筆請假申請打回，學生恢復「已報名」，堂數／名額都不動
      listWrap.querySelectorAll('.leave-btn-reject').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orderId = btn.dataset.orderId;
          const courseIdx = Number(btn.dataset.courseIdx);
          const item = leaveItems.find(i => i.order.id === orderId && i.courseIdx === courseIdx);
          if (!item) return;
          if (!confirm('確定要拒絕這筆請假申請嗎？學生會恢復為已報名狀態，堂數／名額都不變。')) return;
          btn.disabled = true;
          try {
            const order = item.order;
            const cc = order.courses[courseIdx];
            const updatedCourses = order.courses.map((x, idx) =>
              idx === courseIdx ? { ...x, leaveStatus: 'rejected', leaveReviewedAt: new Date().toISOString() } : x
            );
            await updateDoc(doc(db, 'teachers', tid, 'orders', orderId), { courses: updatedCourses });
            try {
              await updateDoc(doc(db, 'users', order.studentId, 'orders', orderId), { courses: updatedCourses });
            } catch (syncErr) { console.warn('學生端同步失敗（不影響老師端）', syncErr); }
            order.courses = updatedCourses;
            pushNotification('users', order.studentId, {
              type: 'leave_reviewed',
              message: '您的請假申請未通過，已恢復為已報名狀態',
              detail: `${cc.title} ${cc.date}${cc.time}`
            });
            if (currentView === 'calendar') renderCalendar(); else renderList();
            showToast('已拒絕這筆請假申請');
            renderLeaveSection();
          } catch (e) {
            showToast('操作失敗，請再試一次');
            btn.disabled = false;
          }
        });
      });

      // 審核完成：依「是否增加剩餘堂數」寫回堂數池／名額／狀態，並通知學生
      listWrap.querySelectorAll('.leave-btn-finish').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orderId = btn.dataset.orderId;
          const courseIdx = Number(btn.dataset.courseIdx);
          const item = leaveItems.find(i => i.order.id === orderId && i.courseIdx === courseIdx);
          if (!item) return;
          const card = btn.closest('.leave-card');
          const isIncrease = card.querySelector('.leave-toggle-btn.selected').dataset.value === 'yes';
          const deltaInputEl = card.querySelector('.leave-delta-input');
          const deltaRaw = deltaInputEl.value.trim();
          const delta = deltaRaw === '' ? 0 : Number(deltaRaw);
          if (isNaN(delta)) { showToast('堂數異動請輸入數字'); return; }

          // 防呆：如果整組（是/否切換、數字欄）從打開表單到現在完全沒被動過，跳確認框再送出
          if (deltaInputEl.dataset.touched !== 'true') {
            if (!confirm(`堂數異動維持系統預設值 ${delta} 堂，確定送出嗎？`)) return;
          }

          btn.textContent = '儲存中…'; btn.disabled = true;
          try {
            const order = item.order;
            const cOld = order.courses[courseIdx];
            const courseObj = courses.find(cs => cs.id === cOld.courseId) || { title: cOld.title };
            const poolKey = getPoolKey(courseObj);

            // 堂數異動（0 的話 adjustCredits 內部會自動跳過，不用另外判斷）
            if (poolKey && delta) {
              await adjustCredits(tid, order.studentId, order.studentName, poolKey, delta);
            }

            const updatedCourses = order.courses.map((x, idx) => {
              if (idx !== courseIdx) return x;
              return {
                ...x,
                leaveStatus: isIncrease ? 'approved_refund' : 'approved_deduct',
                leaveReviewedAt: new Date().toISOString(),
                result: isIncrease ? 'cancelled' : x.result
              };
            });
            const allCancelled = updatedCourses.every(x => x.result === 'cancelled');
            const newOrderStatus = allCancelled ? 'cancelled' : 'confirmed';

            await updateDoc(doc(db, 'teachers', tid, 'orders', orderId), { courses: updatedCourses, status: newOrderStatus });
            try {
              await updateDoc(doc(db, 'users', order.studentId, 'orders', orderId), { courses: updatedCourses, status: newOrderStatus });
            } catch (syncErr) { console.warn('學生端同步失敗（不影響老師端）', syncErr); }
            order.courses = updatedCourses;
            order.status = newOrderStatus;

            // 不扣堂 → 名額退回：把這位學生從該堂課的報名名單移除，空出名額
            if (isIncrease) {
              const list = bookings[cOld.courseId] || [];
              const bIdx = list.findIndex(b => b.studentId === order.studentId || b.name === order.studentName);
              if (bIdx !== -1) {
                list.splice(bIdx, 1);
                bookings[cOld.courseId] = list;
                await saveToStorage();
              }
            }

            pushNotification('users', order.studentId, {
              type: 'leave_reviewed',
              message: isIncrease ? '您的請假申請已通過，堂數已退回' : '您的請假申請已處理，本次照常扣堂',
              detail: `${cOld.title} ${cOld.date}${cOld.time}`
            });

            if (currentView === 'calendar') renderCalendar(); else renderList();
            showToast('請假審核完成');
            renderLeaveSection();
          } catch (e) {
            showToast('操作失敗，請再試一次');
            btn.textContent = '審核完成'; btn.disabled = false;
          }
        });
      });
    }

    filterBar.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFilteredLeaves(btn.dataset.filter);
      });
    });

    renderFilteredLeaves('pending');
  }

  // ── 學生管理（v3.3）：列出每人各堂數池未用堂數 ＋ 手動調整入口 ──
  async function renderStudentSection() {
    studentSection.innerHTML = '<div class="admin-section-title">學生管理</div><div style="padding:16px;color:#aaa;font-size:0.85rem">載入中…</div>';

    const tid = teacherId || TEACHER_ID_STATIC;

    // 從訂單去重，整理出目前有紀錄的學生名單（與現有「手動新增學生」搜尋邏輯相同做法）
    let studentList = [];
    try {
      const snap = await getDocs(collection(db, 'teachers', tid, 'orders'));
      const seen = new Map();
      snap.forEach(d => {
        const data = d.data();
        if (!data.studentId || !data.studentName) return;
        if (!seen.has(data.studentId) || (data.createdAt || '') > (seen.get(data.studentId).createdAt || '')) {
          seen.set(data.studentId, {
            studentId: data.studentId,
            studentName: data.studentName,
            studentEmail: data.studentEmail || '',
            createdAt: data.createdAt || ''
          });
        }
      });
      studentList = [...seen.values()].sort((a, b) => a.studentName.localeCompare(b.studentName, 'zh-Hant'));
    } catch(e) {
      studentSection.innerHTML = '<div style="padding:16px;color:#e74c3c">讀取失敗，請重試</div>';
      return;
    }

    // 撈每人目前堂數池（資料量不大，直接一次撈完）
    await Promise.all(studentList.map(async s => {
      s.remainingCredits = await getStudentCredits(tid, s.studentId);
    }));

    studentSection.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'admin-section-title';
    title.textContent = '學生管理';
    studentSection.appendChild(title);

    if (studentList.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'order-empty-hint';
      empty.textContent = '目前還沒有學生紀錄';
      studentSection.appendChild(empty);
      return;
    }

    const searchWrap = document.createElement('div');
    searchWrap.style.marginBottom = '12px';
    searchWrap.innerHTML = `<input type="text" class="student-list-search" placeholder="搜尋學生姓名…">`;
    studentSection.appendChild(searchWrap);

    const listWrap = document.createElement('div');
    studentSection.appendChild(listWrap);

    function renderStudentList(keyword) {
      listWrap.innerHTML = '';
      const kw = (keyword || '').trim();
      const filtered = kw ? studentList.filter(s => s.studentName.includes(kw)) : studentList;
      if (filtered.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'order-empty-hint';
        hint.textContent = '沒有符合的學生';
        listWrap.appendChild(hint);
        return;
      }

      filtered.forEach(s => {
        const credits = s.remainingCredits || {};
        const poolEntries = Object.entries(credits).filter(([, v]) => v);
        const firstPool = allPoolKeys()[0] || '';
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.style.marginBottom = '10px';
        card.innerHTML = `
          <div class="order-header">
            <div class="order-student-name">${s.studentName}</div>
            ${s.studentEmail ? `<div class="order-date">${s.studentEmail}</div>` : ''}
          </div>
          <div class="credit-tags" style="margin:6px 0">
            ${poolEntries.length
              ? poolEntries.map(([pk, v]) => `<span class="credit-tag">${poolLabel(pk)}　剩餘 <b>${v}</b> 堂</span>`).join('')
              : `<span class="credit-tag credit-tag-empty">尚無未用堂數</span>`}
          </div>
          <div class="credit-manual-wrap" data-student-id="${s.studentId}" data-student-name="${s.studentName}">
            <button class="credit-manual-toggle" type="button">✍️手動調整堂數</button>
            <div class="credit-manual-form" style="display:none">
              <select class="credit-manual-pool">
                ${allPoolKeys().map(pk => `<option value="${pk}" data-current="${credits[pk] || 0}">${poolLabel(pk)}</option>`).join('')}
              </select>
              <input class="credit-manual-total" type="number" value="${credits[firstPool] || 0}">
              <span class="credit-add-unit">堂</span>
              <button class="credit-manual-apply" type="button">套用</button>
            </div>
          </div>
        `;
        listWrap.appendChild(card);
      });

      listWrap.querySelectorAll('.credit-manual-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const form = btn.nextElementSibling;
          const isOpen = form.style.display !== 'none';
          form.style.display = isOpen ? 'none' : 'flex';
        });
      });
      // 切換 poolKey 下拉時，數字欄自動換成該 pool 目前的總堂數，避免老師看錯池子改錯數字
      listWrap.querySelectorAll('.credit-manual-pool').forEach(select => {
        select.addEventListener('change', () => {
          const totalInput = select.closest('.credit-manual-form').querySelector('.credit-manual-total');
          const opt = select.options[select.selectedIndex];
          totalInput.value = opt.dataset.current || 0;
        });
      });
      listWrap.querySelectorAll('.credit-manual-apply').forEach(btn => {
        btn.addEventListener('click', async () => {
          const wrap = btn.closest('.credit-manual-wrap');
          const studentId = wrap.dataset.studentId;
          const studentName = wrap.dataset.studentName;
          const poolKey = wrap.querySelector('.credit-manual-pool').value;
          const total = Number(wrap.querySelector('.credit-manual-total').value);
          if (isNaN(total) || total < 0) { showToast('請輸入正確的總堂數'); return; }
          btn.textContent = '處理中…'; btn.disabled = true;
          try {
            const tid2 = teacherId || TEACHER_ID_STATIC;
            const result = await setCredits(tid2, studentId, studentName, poolKey, total);
            if (result) {
              showToast(`已將 ${poolLabel(poolKey)} 設為 ${total} 堂`);
              renderStudentSection();
            } else {
              showToast('調整失敗，請再試一次');
            }
          } catch(e) {
            showToast('調整失敗，請再試一次');
          }
          btn.textContent = '套用'; btn.disabled = false;
        });
      });
    }

    searchWrap.querySelector('.student-list-search').addEventListener('input', (e) => {
      renderStudentList(e.target.value);
    });

    renderStudentList('');
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
(async () => {
  // 公開資料（課程名額、公告）用固定 teacherId 先撈，不需要等登入
  teacherId = TEACHER_ID_STATIC;
  await loadFromStorage();
  teacherId = null; // 撈完還原，等老師登入後才正式設定
  renderCalendar();
  renderHomeSections();

  // 登入狀態監聽：重整後恢復老師或學生狀態
  onAuthStateChanged(auth, async user => {
    if (!user) {
      if (studentOrdersUnsubscribe) { studentOrdersUnsubscribe(); studentOrdersUnsubscribe = null; }
      currentStudent = null;
      currentTeacher = null;
      teacherId = null;
      teacherName = null;
      studentOrders = [];
      currentStudentCredits = {};
      clearNotifications();
      updateStudentBtn();
      updateTeacherBtn();
      updateCartBtn();
      if (currentView === 'calendar') renderCalendar(); else renderList();
      return;
    }
    // 已經有狀態（popup登入剛處理完）→ 不重複處理
    if (currentTeacher || currentStudent) return;
    // 依 sessionStorage 記錄的身份恢復
    const savedRole = sessionStorage.getItem('loginRole');
    if (savedRole === 'teacher') {
      // 恢復老師狀態
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        if (adminSnap.exists()) {
          currentTeacher = user;
          teacherId = adminSnap.data().teacherId;
          teacherName = adminSnap.data().name || null;
          updateTeacherBtn();
          loadNotifications('teachers', teacherId);
          await loadFromStorage();
          openAdmin();
          return;
        }
      } catch(e) {}
    }
    if (savedRole === 'student') {
      // 恢復學生狀態
      currentStudent = user;
      loadNotifications('users', user.uid);
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const nickname = snap.exists() ? snap.data().nickname : null;
        currentStudentCredits = snap.exists() ? (snap.data().remainingCredits || {}) : {};
        updateStudentBtn(nickname);
      } catch(e) {
        updateStudentBtn();
      }
      await loadStudentOrders(user.uid);
      if (currentView === 'calendar') renderCalendar(); else renderList();
      updateCartBtn();
      return;
    }
    // savedRole 不存在（舊 session 或直接訪問）→ 預設當學生
    currentStudent = user;
    loadNotifications('users', user.uid);
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const nickname = snap.exists() ? snap.data().nickname : null;
      currentStudentCredits = snap.exists() ? (snap.data().remainingCredits || {}) : {};
      updateStudentBtn(nickname);
    } catch(e) {
      updateStudentBtn();
    }
    await loadStudentOrders(user.uid);
    if (currentView === 'calendar') renderCalendar(); else renderList();
    updateCartBtn();
  });

})();
