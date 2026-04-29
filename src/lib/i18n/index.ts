/**
 * KARYIKA — Internationalization System
 * 3 languages: English | हिंदी | Hinglish
 *
 * Usage:
 *   import { t, T } from '@/lib/i18n'
 *   t(T.newTask, lang)           // → string
 *   t(T.greetMorning, lang)('Kartar') // → string (for functions)
 */

export type Lang = 'en' | 'hi' | 'hinglish'

export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  hi: 'हिंदी',
  hinglish: 'Hinglish',
}

// ─── TYPE HELPERS ──────────────────────────────────────────────────────────────
type Str  = { en: string; hi: string; hinglish: string }
type StrFn<A extends any[]> = { en: (...a: A) => string; hi: (...a: A) => string; hinglish: (...a: A) => string }

// Translate: handles both Str (returns string) and StrFn (returns function)
export function t(token: Str, lang: Lang): string
export function t<A extends any[]>(token: StrFn<A>, lang: Lang): (...args: A) => string
export function t(token: any, lang: Lang): any {
  const val = token[lang] ?? token.en
  return val
}

// ─── ALL TRANSLATIONS ──────────────────────────────────────────────────────────
export const T = {

  // ── APP ────────────────────────────────────────────────────────────────────
  appName: { en: 'Karyika', hi: 'कार्यिका', hinglish: 'Karyika' } as Str,
  search:  { en: 'Search', hi: 'खोजें', hinglish: 'Search' } as Str,
  logout:  { en: 'Logout', hi: 'लॉग आउट', hinglish: 'Logout' } as Str,
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...', hinglish: 'Load ho raha hai...' } as Str,

  // ── NAV ────────────────────────────────────────────────────────────────────
  nav: {
    home:         { en: 'Home',           hi: 'होम',             hinglish: 'Home' } as Str,
    tasks:        { en: 'Tasks',          hi: 'कार्य',           hinglish: 'Tasks' } as Str,
    projects:     { en: 'Projects',       hi: 'परियोजनाएं',     hinglish: 'Projects' } as Str,
    habits:       { en: 'Habits',         hi: 'आदतें',           hinglish: 'Habits' } as Str,
    goals:        { en: 'Goals & OKRs',   hi: 'लक्ष्य',         hinglish: 'Goals & OKRs' } as Str,
    calendar:     { en: 'Calendar',       hi: 'कैलेंडर',         hinglish: 'Calendar' } as Str,
    analytics:    { en: 'Analytics',      hi: 'विश्लेषण',        hinglish: 'Analytics' } as Str,
    ai:           { en: 'AI Assistant',   hi: 'AI सहायक',        hinglish: 'AI Assistant' } as Str,
    automations:  { en: 'Automations',    hi: 'स्वचालन',         hinglish: 'Automations' } as Str,
    timer:        { en: 'Focus Timer',    hi: 'फ़ोकस टाइमर',     hinglish: 'Focus Timer' } as Str,
    notes:        { en: 'Pages',          hi: 'पृष्ठ',           hinglish: 'Pages' } as Str,
    settings:     { en: 'Settings',       hi: 'सेटिंग्स',        hinglish: 'Settings' } as Str,
    team:         { en: 'Team',           hi: 'टीम',             hinglish: 'Team' } as Str,
    gantt:        { en: 'Gantt',          hi: 'गैंट',            hinglish: 'Gantt' } as Str,
    workload:     { en: 'Workload',       hi: 'कार्यभार',        hinglish: 'Workload' } as Str,
    integrations: { en: 'Integrations',   hi: 'एकीकरण',          hinglish: 'Integrations' } as Str,
    unique:       { en: 'Unique ✨',      hi: 'अनोखा ✨',         hinglish: 'Unique ✨' } as Str,
  },

  // ── GREETINGS (functions) ──────────────────────────────────────────────────
  greetMorning:   {
    en:       (n: string) => `☀️ Good morning, ${n}!`,
    hi:       (n: string) => `☀️ सुप्रभात, ${n}!`,
    hinglish: (n: string) => `☀️ Subah ki shuruat, ${n}!`,
  } as StrFn<[string]>,
  greetAfternoon: {
    en:       (n: string) => `🌤 Good afternoon, ${n}!`,
    hi:       (n: string) => `🌤 शुभ दोपहर, ${n}!`,
    hinglish: (n: string) => `🌤 Dopahar ka time, ${n}!`,
  } as StrFn<[string]>,
  greetEvening:   {
    en:       (n: string) => `🌅 Good evening, ${n}!`,
    hi:       (n: string) => `🌅 शुभ संध्या, ${n}!`,
    hinglish: (n: string) => `🌅 Shaam ki productivity, ${n}!`,
  } as StrFn<[string]>,
  greetNight:     {
    en:       (n: string) => `🌙 Burning the midnight oil, ${n}?`,
    hi:       (n: string) => `🌙 रात को जाग रहे हो, ${n}?`,
    hinglish: (n: string) => `🌙 Raat ko kaam, ${n}?`,
  } as StrFn<[string]>,

  // ── MOTIVATION (functions) ─────────────────────────────────────────────────
  motiveDone:    {
    en:       (n: number) => `Amazing! ${n} tasks done today! 🏆`,
    hi:       (n: number) => `शाबाश! ${n} काम पूरे! 🏆`,
    hinglish: (n: number) => `Wah bhai! Aaj ${n} tasks done! 🏆`,
  } as StrFn<[number]>,
  motiveOverdue: {
    en:       (n: number) => `${n} tasks overdue — tackle them! 💪`,
    hi:       (n: number) => `${n} काम बाकी — अभी करो! 💪`,
    hinglish: (n: number) => `${n} tasks overdue — aaj pakad lo! 💪`,
  } as StrFn<[number]>,
  motiveToday:   {
    en:       (n: number) => `${n} tasks due today — focus! ⚡`,
    hi:       (n: number) => `आज ${n} काम — ध्यान दो! ⚡`,
    hinglish: (n: number) => `Aaj ${n} tasks — focus karo! ⚡`,
  } as StrFn<[number]>,
  motiveDefault: { en: 'Start one task — the rest follows! 🚀', hi: 'एक काम शुरू करो! 🚀', hinglish: 'Ek kaam shuru karo — baaki khud hoga! 🚀' } as Str,

  // ── THOUGHTS (arrays) ─────────────────────────────────────────────────────
  thoughts: {
    en: [
      'Today is yours — do one thing your future self will thank you for! 🙏',
      'Do the hard task first — the rest will feel easy! 💪',
      'Consistency is the key — a little every day! 🔑',
      'Whatever you need to do, do it today — tomorrow is just an idea! 💡',
    ],
    hi: [
      'आज का दिन तुम्हारा है — एक काम करो जो भविष्य में काम आए! 🙏',
      'मुश्किल काम पहले करो — बाकी सब आसान लगेगा! 💪',
      'निरंतरता ही सफलता है — रोज़ थोड़ा-थोड़ा करो! 🔑',
      'जो करना है आज करो — कल सिर्फ एक विचार है! 💡',
    ],
    hinglish: [
      'Aaj ka din tumhara hai — ek kaam karo jo future tumhe thank kare! 🙏',
      'Mushkil kaam pehle karo — baaki sab aasaan lagega! 💪',
      'Consistency is the key — roz thoda thoda karo! 🔑',
      'Jo karna hai, aaj karo — kal sirf ek idea hai! 💡',
    ],
  },

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  todayTasks:   { en: "Today's Tasks",     hi: 'आज के काम',          hinglish: 'Aaj ke Tasks' } as Str,
  progress:     { en: 'Progress Overview', hi: 'प्रगति',              hinglish: 'Progress Overview' } as Str,
  highPriority: { en: 'High Priority',     hi: 'उच्च प्राथमिकता',    hinglish: 'High Priority' } as Str,
  thisWeek:     { en: 'This Week',         hi: 'इस सप्ताह',           hinglish: 'This Week' } as Str,
  noTasksToday: { en: 'Nothing due today!', hi: 'आज कोई काम नहीं!', hinglish: 'Aaj koi task nahi!' } as Str,
  noTasksSub:   { en: 'Plan ahead or relax 😎', hi: 'आराम या योजना बनाएं 😎', hinglish: 'Chill ya plan karo 😎' } as Str,
  noUrgent:     { en: 'No urgent tasks!',  hi: 'कोई जरूरी काम नहीं!', hinglish: 'Koi urgent task nahi!' } as Str,
  pending:      { en: 'Pending',           hi: 'बाकी',                hinglish: 'Pending' } as Str,
  done:         { en: 'Done',              hi: 'हो गया',              hinglish: 'Done' } as Str,
  habits:       { en: 'Habits',            hi: 'आदतें',               hinglish: 'Habits' } as Str,
  goals:        { en: 'Goals',             hi: 'लक्ष्य',              hinglish: 'Goals' } as Str,

  // Quick actions
  qa: {
    addTask:    { en: 'Add a Task',    hi: 'काम जोड़ें',           hinglish: 'Task Add Karo' } as Str,
    trackHabit: { en: 'Track Habit',   hi: 'आदत ट्रैक करें',      hinglish: 'Habit Track Karo' } as Str,
    setGoal:    { en: 'Set a Goal',    hi: 'लक्ष्य बनाएं',         hinglish: 'Goal Set Karo' } as Str,
    askAI:      { en: 'Ask AI',        hi: 'AI से पूछो',           hinglish: 'AI Se Poocho' } as Str,
  },

  // ── TASKS PAGE ─────────────────────────────────────────────────────────────
  newTask:        { en: '+ New Task',        hi: '+ नया काम',          hinglish: '+ New Task' } as Str,
  searchTasks:    { en: 'Search tasks... (N for new)', hi: 'काम खोजें... (N दबाएं)', hinglish: 'Tasks dhundo... (N dabao)' } as Str,
  overallProgress:{ en: 'Overall Progress',  hi: 'कुल प्रगति',         hinglish: 'Overall Progress' } as Str,
  selectAll:      { en: 'Select All',        hi: 'सभी चुनें',           hinglish: 'Select All' } as Str,
  deselectAll:    { en: 'Deselect All',      hi: 'सभी हटाएं',           hinglish: 'Deselect All' } as Str,

  // Views
  views: {
    list:   { en: 'List',   hi: 'सूची',      hinglish: 'List' } as Str,
    kanban: { en: 'Board',  hi: 'बोर्ड',     hinglish: 'Board' } as Str,
    sprint: { en: 'Sprint', hi: 'स्प्रिंट',  hinglish: 'Sprint' } as Str,
    matrix: { en: 'Matrix', hi: 'मैट्रिक्स', hinglish: 'Matrix' } as Str,
  },

  // Filters
  filter: {
    all:       { en: 'All',          hi: 'सभी',             hinglish: 'All' } as Str,
    today:     { en: '⏰ Today',     hi: '⏰ आज',           hinglish: '⏰ Today' } as Str,
    pending:   { en: '⏳ Pending',   hi: '⏳ बाकी',         hinglish: '⏳ Pending' } as Str,
    overdue:   { en: '⚠️ Overdue',  hi: '⚠️ बाकी पड़े',   hinglish: '⚠️ Overdue' } as Str,
    completed: { en: '✅ Done',      hi: '✅ हो गया',        hinglish: '✅ Done' } as Str,
    noDue:     { en: '📭 No Due',   hi: '📭 तिथि नहीं',    hinglish: '📭 No Due' } as Str,
    tomorrow:  { en: '🔜 Tomorrow', hi: '🔜 कल',           hinglish: '🔜 Tomorrow' } as Str,
  },

  // Sort
  sort: {
    dueDate:  { en: 'Due Date',  hi: 'देय तिथि',     hinglish: 'Due Date' } as Str,
    priority: { en: 'Priority',  hi: 'प्राथमिकता',   hinglish: 'Priority' } as Str,
    title:    { en: 'Title',     hi: 'शीर्षक',       hinglish: 'Title' } as Str,
    points:   { en: 'Points',    hi: 'अंक',          hinglish: 'Points' } as Str,
  },

  // Priority labels
  priority: {
    urgent: { en: '🔴 Urgent', hi: '🔴 अत्यावश्यक', hinglish: '🔴 Urgent' } as Str,
    high:   { en: '🟠 High',   hi: '🟠 उच्च',       hinglish: '🟠 High' } as Str,
    medium: { en: '🟡 Medium', hi: '🟡 मध्यम',      hinglish: '🟡 Medium' } as Str,
    low:    { en: '🟢 Low',    hi: '🟢 कम',         hinglish: '🟢 Low' } as Str,
    none:   { en: '⚪ None',   hi: '⚪ कोई नहीं',   hinglish: '⚪ None' } as Str,
  },

  // Status labels
  status: {
    'todo':        { en: 'To Do',       hi: 'करना है',     hinglish: 'To Do' } as Str,
    'in-progress': { en: 'In Progress', hi: 'चल रहा है',   hinglish: 'In Progress' } as Str,
    'review':      { en: 'In Review',   hi: 'समीक्षा में', hinglish: 'In Review' } as Str,
    'blocked':     { en: 'Blocked',     hi: 'अटका हुआ',   hinglish: 'Blocked' } as Str,
    'hold':        { en: 'On Hold',     hi: 'रोका गया',    hinglish: 'On Hold' } as Str,
    'done':        { en: 'Done',        hi: 'हो गया',      hinglish: 'Done' } as Str,
    'cancelled':   { en: 'Cancelled',   hi: 'रद्द',        hinglish: 'Cancelled' } as Str,
  },

  // Sprint
  sprint: {
    backlog:  { en: '📦 Backlog',  hi: '📦 बैकलॉग',    hinglish: '📦 Backlog' } as Str,
    sprint1:  { en: '🏃 Sprint 1', hi: '🏃 स्प्रिंट 1', hinglish: '🏃 Sprint 1' } as Str,
    sprint2:  { en: '🏃 Sprint 2', hi: '🏃 स्प्रिंट 2', hinglish: '🏃 Sprint 2' } as Str,
    noTasks:  { en: 'No tasks here', hi: 'कोई काम नहीं', hinglish: 'Koi task nahi' } as Str,
  },

  // Matrix
  matrix: {
    doFirst:   { en: 'DO FIRST 🔥',  hi: 'पहले करें 🔥',    hinglish: 'PEHLE KARO 🔥' } as Str,
    schedule:  { en: 'SCHEDULE 📅',  hi: 'योजना बनाएं 📅',  hinglish: 'PLAN KARO 📅' } as Str,
    delegate:  { en: 'DELEGATE 👥',  hi: 'सौंपें 👥',        hinglish: 'DELEGATE 👥' } as Str,
    eliminate: { en: 'ELIMINATE 🗑', hi: 'हटाएं 🗑',         hinglish: 'HATAO 🗑' } as Str,
  },

  // Empty states
  empty: {
    noTasks:    { en: 'No tasks found',      hi: 'कोई काम नहीं मिला', hinglish: 'Koi task nahi mila' } as Str,
    noSearch:   { en: 'Try different search', hi: 'अलग खोज करें',     hinglish: 'Alag search karo' } as Str,
    noTasksSub: { en: 'Add your first task!', hi: 'पहला काम जोड़ें!', hinglish: 'Pehla task add karo!' } as Str,
  },

  // ── TASK FORM ──────────────────────────────────────────────────────────────
  form: {
    newTask:    { en: '+ New Task',         hi: '+ नया काम',              hinglish: '+ New Task' } as Str,
    editTask:   { en: 'Edit Task',          hi: 'काम संपादित करें',       hinglish: 'Task Edit Karo' } as Str,
    tabBasic:   { en: 'Basic',              hi: 'बुनियादी',               hinglish: 'Basic' } as Str,
    tabDetails: { en: 'Details',            hi: 'विवरण',                  hinglish: 'Details' } as Str,
    tabSubtasks:{ en: 'Subtasks',           hi: 'उप-कार्य',               hinglish: 'Subtasks' } as Str,
    tabCustom:  { en: 'Fields',             hi: 'फ़ील्ड',                  hinglish: 'Fields' } as Str,
    templates:  { en: 'Quick Templates',   hi: 'त्वरित टेम्पलेट',        hinglish: 'Quick Templates' } as Str,
    title:      { en: 'Title *',            hi: 'शीर्षक *',               hinglish: 'Title *' } as Str,
    titlePh:    { en: 'What needs to be done?', hi: 'क्या करना है?',     hinglish: 'Kya karna hai?' } as Str,
    desc:       { en: 'Description',        hi: 'विवरण',                  hinglish: 'Description' } as Str,
    descPh:     { en: 'Details, steps, notes...', hi: 'विवरण, चरण, नोट्स...', hinglish: 'Details, steps ya notes...' } as Str,
    priority:   { en: 'Priority',           hi: 'प्राथमिकता',             hinglish: 'Priority' } as Str,
    status:     { en: 'Status',             hi: 'स्थिति',                 hinglish: 'Status' } as Str,
    dueDate:    { en: 'Due Date',           hi: 'देय तिथि',               hinglish: 'Due Date' } as Str,
    dueTime:    { en: 'Due Time',           hi: 'देय समय',                hinglish: 'Due Time' } as Str,
    project:    { en: 'Project',            hi: 'परियोजना',               hinglish: 'Project' } as Str,
    noProject:  { en: 'No project',         hi: 'कोई परियोजना नहीं',     hinglish: 'No project' } as Str,
    tags:       { en: 'Tags',               hi: 'टैग',                    hinglish: 'Tags' } as Str,
    tagPh:      { en: 'Add tag + Enter',    hi: 'टैग + Enter',            hinglish: 'Tag + Enter' } as Str,
    estTime:    { en: 'Est. Time (min)',    hi: 'अनुमानित समय (मिनट)',   hinglish: 'Est. Time (min)' } as Str,
    points:     { en: 'Story Points',       hi: 'स्टोरी पॉइंट',          hinglish: 'Story Points' } as Str,
    urgency:    { en: 'Urgency',            hi: 'जरूरी',                  hinglish: 'Urgency' } as Str,
    importance: { en: 'Importance',         hi: 'महत्व',                  hinglish: 'Importance' } as Str,
    recurring:  { en: 'Recurring',          hi: 'दोहराएं',                hinglish: 'Recurring' } as Str,
    sprint:     { en: 'Sprint',             hi: 'स्प्रिंट',               hinglish: 'Sprint' } as Str,
    coverColor: { en: 'Cover Color',        hi: 'कवर रंग',                hinglish: 'Cover Color' } as Str,
    addSubtask: { en: 'Add subtask + Enter', hi: 'उप-कार्य + Enter',     hinglish: 'Subtask + Enter' } as Str,
    noSubtasks: { en: 'No subtasks yet',    hi: 'कोई उप-कार्य नहीं',    hinglish: 'Abhi koi subtask nahi' } as Str,
    cancel:     { en: 'Cancel',             hi: 'रद्द करें',              hinglish: 'Cancel' } as Str,
    save:       { en: 'Add Task',           hi: 'जोड़ें',                  hinglish: 'Add Karo' } as Str,
    update:     { en: 'Update Task',        hi: 'अपडेट करें',             hinglish: 'Update Karo' } as Str,
    saving:     { en: 'Saving...',          hi: 'सहेज रहे हैं...',        hinglish: 'Save ho raha hai...' } as Str,
  },

  // ── BULK ACTIONS ───────────────────────────────────────────────────────────
  bulk: {
    selected:    {
      en:       (n: number) => `${n} selected`,
      hi:       (n: number) => `${n} चुने`,
      hinglish: (n: number) => `${n} selected`,
    } as StrFn<[number]>,
    markDone:    { en: '✓ Mark Done',       hi: '✓ हो गया करें',       hinglish: '✓ Done Karo' } as Str,
    setPriority: { en: 'Set Priority...',   hi: 'प्राथमिकता चुनें...', hinglish: 'Priority set karo...' } as Str,
    delete:      { en: '🗑 Delete',         hi: '🗑 हटाएं',             hinglish: '🗑 Delete' } as Str,
    clear:       { en: '✕',               hi: '✕',                   hinglish: '✕' } as Str,
  },

  // ── TOAST MESSAGES ────────────────────────────────────────────────────────
  toast: {
    taskAdded:   { en: 'Task added! 🎉',     hi: 'काम जुड़ गया! 🎉',    hinglish: 'Task add ho gaya! 🎉' } as Str,
    taskUpdated: { en: 'Task updated ✅',    hi: 'काम अपडेट हुआ ✅',    hinglish: 'Task update ho gaya ✅' } as Str,
    taskDeleted: { en: 'Deleted!',           hi: 'हटा दिया!',            hinglish: 'Delete ho gaya!' } as Str,
    error:       { en: 'Something went wrong', hi: 'कुछ गड़बड़ हुई',    hinglish: 'Kuch galat ho gaya' } as Str,
    doneBulk: {
      en:       (n: number) => `✅ ${n} tasks done!`,
      hi:       (n: number) => `✅ ${n} काम हुए!`,
      hinglish: (n: number) => `✅ ${n} done ho gaye!`,
    } as StrFn<[number]>,
    deletedBulk: {
      en:       (n: number) => `🗑 ${n} deleted!`,
      hi:       (n: number) => `🗑 ${n} हटाए!`,
      hinglish: (n: number) => `🗑 ${n} delete ho gaye!`,
    } as StrFn<[number]>,
    priorUpdated: { en: 'Priority updated!', hi: 'प्राथमिकता बदली!', hinglish: 'Priority update ho gayi!' } as Str,
  },

  // ── CONFIRM DIALOGS ───────────────────────────────────────────────────────
  confirm: {
    deleteTask: { en: 'Delete this task?', hi: 'यह काम हटाएं?', hinglish: 'Ye task delete karo?' } as Str,
    deleteBulk: {
      en:       (n: number) => `Delete ${n} tasks?`,
      hi:       (n: number) => `${n} काम हटाएं?`,
      hinglish: (n: number) => `${n} tasks delete karein?`,
    } as StrFn<[number]>,
  },

  // ── AUTH ──────────────────────────────────────────────────────────────────
  auth: {
    welcome:   { en: 'Welcome back!',          hi: 'वापस स्वागत है!',       hinglish: 'Karyika mein swagat!' } as Str,
    sub:       { en: 'Sign in to your account', hi: 'खाते में लॉग इन करें', hinglish: 'Account mein sign in karo' } as Str,
    google:    { en: 'Continue with Google',   hi: 'Google से जारी रखें',   hinglish: 'Google se continue karo' } as Str,
    or:        { en: 'or',                     hi: 'या',                     hinglish: 'ya' } as Str,
    email:     { en: 'Email',                  hi: 'ईमेल',                  hinglish: 'Email' } as Str,
    password:  { en: 'Password',               hi: 'पासवर्ड',               hinglish: 'Password' } as Str,
    forgot:    { en: 'Forgot?',                hi: 'भूल गए?',                hinglish: 'Bhool gaye?' } as Str,
    signin:    { en: 'Sign In →',              hi: 'लॉग इन करें →',         hinglish: 'Sign In karo →' } as Str,
    signingIn: { en: 'Signing in...',          hi: 'लॉग इन हो रहा है...',   hinglish: 'Sign in ho raha hai...' } as Str,
    noAccount: { en: "Don't have an account?", hi: 'खाता नहीं है?',          hinglish: 'Account nahi hai?' } as Str,
    signupLink:{ en: 'Sign up free',           hi: 'मुफ़्त में साइन अप करें', hinglish: 'Sign up karo free' } as Str,
    name:      { en: 'Your name',              hi: 'आपका नाम',              hinglish: 'Aapka naam' } as Str,
    create:    { en: 'Create Account 🚀',     hi: 'खाता बनाएं 🚀',          hinglish: 'Account Banao 🚀' } as Str,
    creating:  { en: 'Creating...',            hi: 'बन रहा है...',           hinglish: 'Ban raha hai...' } as Str,
    hasAccount:{ en: 'Already have an account?', hi: 'पहले से खाता है?',   hinglish: 'Already account hai?' } as Str,
    loginLink: { en: 'Sign in',                hi: 'लॉग इन करें',           hinglish: 'Sign in karo' } as Str,
  },

} as const
