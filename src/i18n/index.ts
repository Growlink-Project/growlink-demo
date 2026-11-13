import { useApp } from '@/store/useApp';
import type { Lang } from '@/mocks/types';

const en = {
  'tab.home': 'Home', 'tab.bookings': 'Bookings', 'tab.messages': 'Chat', 'tab.profile': 'Profile',
  'tab.desk': 'My Desk', 'tab.clients': 'Clients', 'tab.finance': 'Finance',
  'welcome.tagline': 'Explore. Connect. Grow.', 'welcome.h1': 'Your city.', 'welcome.h2': 'Your people.', 'welcome.h3a': 'Your ', 'welcome.h3b': 'opportunities.',
  'welcome.body': 'Find the right teachers, services and freelancers around you.', 'welcome.cta': 'Get Started', 'welcome.signin': 'I already have an account',
  'lang.title': 'Choose your language', 'lang.sub': 'You can change this later in Settings.', 'common.continue': 'Continue', 'common.save': 'Save', 'common.cancel': 'Cancel',
  'common.back': 'Back', 'common.seeAll': 'See all', 'common.retry': 'Retry', 'common.done': 'Done', 'common.apply': 'Apply', 'common.clear': 'Clear', 'common.delete': 'Delete', 'common.edit': 'Edit',
  'auth.signin': 'Sign In', 'auth.email': 'Email', 'auth.password': 'Password', 'auth.forgot': 'Forgot password?', 'auth.create': 'Create Account', 'auth.noAccount': 'New to Growlink?',
  'auth.demo': 'Use demo account', 'auth.google': 'Continue with Google', 'auth.apple': 'Continue with Apple',
  'home.search': 'Search teachers, services, skills...', 'home.all': 'All', 'home.online': 'Online', 'home.nearby': 'Nearby for you', 'home.explore': 'Explore by category',
  'home.searchArea': 'Search this area', 'home.upcoming': 'Upcoming Booking', 'home.exploreNearby': 'Explore nearby', 'home.showMap': 'Show map', 'home.results': '{n} providers nearby',
  'home.viewProfile': 'View Profile', 'home.checkIn': 'Check In', 'home.more': 'More',
  'book.lesson': 'Book a Lesson', 'book.service': 'Book Service', 'book.inquiry': 'Booking Inquiry', 'book.message': 'Message', 'book.review': 'Review booking',
  'book.pay': 'Proceed to Pay', 'book.trial': 'Request Free Trial', 'book.selectDate': 'Select Date', 'book.selectTime': 'Select Time', 'book.mode': 'Lesson Mode', 'book.fee': 'Fee Breakdown', 'book.total': 'Total',
  'bookings.title': 'My Bookings', 'bookings.upcoming': 'Upcoming', 'bookings.past': 'Past', 'bookings.cancelled': 'Cancelled',
  'msg.title': 'Messages', 'msg.search': 'Search conversations', 'notif.title': 'Activity', 'notif.all': 'All', 'notif.bookings': 'Bookings', 'notif.messages': 'Messages', 'notif.updates': 'Updates',
  'profile.learners': 'Learner Profiles', 'profile.saved': 'Saved & Following', 'profile.addresses': 'Saved Addresses', 'profile.payment': 'Payment Methods', 'profile.settings': 'Settings',
  'profile.help': 'Help & Support', 'profile.switchTeacher': 'Switch to Teacher', 'profile.switchStudent': 'Switch to Student', 'profile.logout': 'Log out',
  'teacher.greeting': 'Good morning', 'teacher.next': 'Next Session', 'teacher.action': 'Action Required', 'teacher.today': "Today's Schedule", 'teacher.shortcuts': 'Shortcuts',
  'finance.pending': 'Pending', 'finance.available': 'Available', 'finance.withdrawn': 'Withdrawn', 'finance.request': 'Request Payout',
  'status.awaiting_payment': 'Awaiting payment', 'status.payment_failed': 'Payment failed', 'status.pending_confirmation': 'Awaiting confirmation', 'status.confirmed': 'Confirmed',
  'status.in_progress': 'In progress', 'status.completed': 'Completed', 'status.cancelled': 'Cancelled', 'status.refunded': 'Refunded', 'status.disputed': 'Disputed', 'status.no_show_review': 'Under review', 'status.declined': 'Declined',
  'mode.online': 'Online', 'mode.provider': "At provider's location", 'mode.student': 'At your location',
};
type Key = keyof typeof en;
const ms: Partial<Record<Key, string>> = {
  'tab.home': 'Utama', 'tab.bookings': 'Tempahan', 'tab.messages': 'Sembang', 'tab.profile': 'Profil', 'tab.desk': 'Meja Saya', 'tab.clients': 'Klien', 'tab.finance': 'Kewangan',
  'welcome.tagline': 'Teroka. Hubung. Berkembang.', 'welcome.h1': 'Bandar anda.', 'welcome.h2': 'Komuniti anda.', 'welcome.h3a': 'Peluang ', 'welcome.h3b': 'anda.',
  'welcome.body': 'Cari guru, perkhidmatan dan pekerja bebas yang sesuai di sekitar anda.', 'welcome.cta': 'Mula Sekarang', 'welcome.signin': 'Saya sudah mempunyai akaun',
  'lang.title': 'Pilih bahasa anda', 'lang.sub': 'Anda boleh menukarnya kemudian dalam Tetapan.', 'common.continue': 'Teruskan', 'common.save': 'Simpan', 'common.cancel': 'Batal', 'common.back': 'Kembali',
  'common.seeAll': 'Lihat semua', 'common.retry': 'Cuba lagi', 'common.done': 'Selesai', 'common.apply': 'Guna', 'common.clear': 'Kosongkan', 'common.delete': 'Padam', 'common.edit': 'Sunting',
  'auth.signin': 'Log Masuk', 'auth.email': 'E-mel', 'auth.password': 'Kata laluan', 'auth.forgot': 'Lupa kata laluan?', 'auth.create': 'Cipta Akaun', 'auth.noAccount': 'Baru di Growlink?',
  'auth.demo': 'Guna akaun demo', 'auth.google': 'Teruskan dengan Google', 'auth.apple': 'Teruskan dengan Apple',
  'home.search': 'Cari guru, perkhidmatan, kemahiran...', 'home.all': 'Semua', 'home.online': 'Dalam talian', 'home.nearby': 'Berdekatan anda', 'home.explore': 'Teroka mengikut kategori',
  'home.searchArea': 'Cari kawasan ini', 'home.upcoming': 'Tempahan Akan Datang', 'home.exploreNearby': 'Teroka berdekatan', 'home.showMap': 'Tunjuk peta', 'home.results': '{n} penyedia berdekatan',
  'home.viewProfile': 'Lihat Profil', 'home.checkIn': 'Daftar Masuk', 'home.more': 'Lagi',
  'book.lesson': 'Tempah Kelas', 'book.service': 'Tempah Perkhidmatan', 'book.inquiry': 'Pertanyaan Tempahan', 'book.message': 'Mesej', 'book.review': 'Semak tempahan',
  'book.pay': 'Teruskan Bayar', 'book.trial': 'Mohon Percubaan Percuma', 'book.selectDate': 'Pilih Tarikh', 'book.selectTime': 'Pilih Masa', 'book.mode': 'Mod Kelas', 'book.fee': 'Pecahan Bayaran', 'book.total': 'Jumlah',
  'bookings.title': 'Tempahan Saya', 'bookings.upcoming': 'Akan Datang', 'bookings.past': 'Lepas', 'bookings.cancelled': 'Dibatalkan',
  'msg.title': 'Mesej', 'msg.search': 'Cari perbualan', 'notif.title': 'Aktiviti', 'notif.all': 'Semua', 'notif.bookings': 'Tempahan', 'notif.messages': 'Mesej', 'notif.updates': 'Kemas kini',
  'profile.learners': 'Profil Pelajar', 'profile.saved': 'Disimpan & Diikuti', 'profile.addresses': 'Alamat Disimpan', 'profile.payment': 'Kaedah Pembayaran', 'profile.settings': 'Tetapan',
  'profile.help': 'Bantuan & Sokongan', 'profile.switchTeacher': 'Tukar ke Guru', 'profile.switchStudent': 'Tukar ke Pelajar', 'profile.logout': 'Log keluar',
  'teacher.greeting': 'Selamat pagi', 'teacher.next': 'Sesi Seterusnya', 'teacher.action': 'Tindakan Diperlukan', 'teacher.today': 'Jadual Hari Ini', 'teacher.shortcuts': 'Pintasan',
  'finance.pending': 'Belum selesai', 'finance.available': 'Tersedia', 'finance.withdrawn': 'Dikeluarkan', 'finance.request': 'Mohon Pembayaran',
  'status.awaiting_payment': 'Menunggu bayaran', 'status.payment_failed': 'Bayaran gagal', 'status.pending_confirmation': 'Menunggu pengesahan', 'status.confirmed': 'Disahkan', 'status.in_progress': 'Sedang berjalan',
  'status.completed': 'Selesai', 'status.cancelled': 'Dibatalkan', 'status.refunded': 'Dipulangkan', 'status.disputed': 'Dipertikai', 'status.no_show_review': 'Dalam semakan', 'status.declined': 'Ditolak',
  'mode.online': 'Dalam talian', 'mode.provider': 'Di lokasi penyedia', 'mode.student': 'Di lokasi anda',
};
const zh: Partial<Record<Key, string>> = {
  'tab.home': '首页', 'tab.bookings': '预约', 'tab.messages': '聊天', 'tab.profile': '我的', 'tab.desk': '工作台', 'tab.clients': '学员', 'tab.finance': '财务',
  'welcome.tagline': '探索。连接。成长。', 'welcome.h1': '你的城市。', 'welcome.h2': '你的人脉。', 'welcome.h3a': '你的', 'welcome.h3b': '机会。',
  'welcome.body': '在你身边找到合适的老师、服务与自由职业者。', 'welcome.cta': '立即开始', 'welcome.signin': '我已有账户',
  'lang.title': '选择语言', 'lang.sub': '之后可在设置中更改。', 'common.continue': '继续', 'common.save': '保存', 'common.cancel': '取消', 'common.back': '返回', 'common.seeAll': '查看全部',
  'common.retry': '重试', 'common.done': '完成', 'common.apply': '应用', 'common.clear': '清除', 'common.delete': '删除', 'common.edit': '编辑',
  'auth.signin': '登录', 'auth.email': '电子邮件', 'auth.password': '密码', 'auth.forgot': '忘记密码？', 'auth.create': '创建账户', 'auth.noAccount': '第一次使用 Growlink？',
  'auth.demo': '使用演示账户', 'auth.google': '使用 Google 继续', 'auth.apple': '使用 Apple 继续',
  'home.search': '搜索老师、服务、技能…', 'home.all': '全部', 'home.online': '线上', 'home.nearby': '附近推荐', 'home.explore': '按类别探索', 'home.searchArea': '搜索此区域',
  'home.upcoming': '即将进行的预约', 'home.exploreNearby': '探索附近', 'home.showMap': '显示地图', 'home.results': '附近 {n} 位服务者', 'home.viewProfile': '查看资料', 'home.checkIn': '签到', 'home.more': '更多',
  'book.lesson': '预约课程', 'book.service': '预约服务', 'book.inquiry': '预约咨询', 'book.message': '留言', 'book.review': '确认预约', 'book.pay': '前往付款', 'book.trial': '申请免费试课',
  'book.selectDate': '选择日期', 'book.selectTime': '选择时间', 'book.mode': '上课方式', 'book.fee': '费用明细', 'book.total': '总计',
  'bookings.title': '我的预约', 'bookings.upcoming': '即将进行', 'bookings.past': '已完成', 'bookings.cancelled': '已取消',
  'msg.title': '消息', 'msg.search': '搜索对话', 'notif.title': '动态', 'notif.all': '全部', 'notif.bookings': '预约', 'notif.messages': '消息', 'notif.updates': '更新',
  'profile.learners': '学员档案', 'profile.saved': '收藏与关注', 'profile.addresses': '已存地址', 'profile.payment': '付款方式', 'profile.settings': '设置', 'profile.help': '帮助与支持',
  'profile.switchTeacher': '切换为老师', 'profile.switchStudent': '切换为学员', 'profile.logout': '退出登录',
  'teacher.greeting': '早上好', 'teacher.next': '下一节课', 'teacher.action': '待处理', 'teacher.today': '今日日程', 'teacher.shortcuts': '快捷入口',
  'finance.pending': '待结算', 'finance.available': '可提现', 'finance.withdrawn': '已提现', 'finance.request': '申请提现',
  'status.awaiting_payment': '待付款', 'status.payment_failed': '付款失败', 'status.pending_confirmation': '待老师确认', 'status.confirmed': '已确认', 'status.in_progress': '进行中', 'status.completed': '已完成',
  'status.cancelled': '已取消', 'status.refunded': '已退款', 'status.disputed': '争议中', 'status.no_show_review': '审核中', 'status.declined': '已拒绝',
  'mode.online': '线上', 'mode.provider': '在老师处', 'mode.student': '在你的地点',
};
const dict: Record<Lang, Partial<Record<Key, string>>> = { en, ms, zh };
export type TKey = Key;
export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>) {
  let s = dict[lang][key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
export function useT() {
  const lang = useApp((s) => s.lang);
  return (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
export const LANGS: { id: Lang; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' }, { id: 'ms', label: 'Bahasa Malaysia', native: 'Bahasa Malaysia' }, { id: 'zh', label: 'Mandarin', native: '中文 (简体)' },
];
