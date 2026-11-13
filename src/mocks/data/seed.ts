import { myt, DAY, HOUR, MIN, startOfDay } from '@/lib/time';
import type {
  Account, Address, Area, Booking, Category, Dispute, LedgerEntry, Learner, Material, Notification, Package, PaymentMethod,
  Post, Provider, Report, Review, Service, Skill, Slot, Task, Thread,
} from '../types';

/** Demo clock starts at Sat 14 Nov 2026, 09:00 MYT. */
export const DEMO_START = myt(2026, 11, 14, 9, 0);

/** Configurable prototype taxonomy: Category → Skill (two levels only). */
export const CATEGORIES: Category[] = [
  { id: 'music', label: 'Music & Performance', short: 'Music', icon: 'music', tint: '#F0EAFB', fg: '#6B4BB8' },
  { id: 'academic', label: 'Academic & Languages', short: 'Academic', icon: 'academic', tint: '#E6F4EA', fg: '#1F8F5A' },
  { id: 'fitness', label: 'Sports & Fitness', short: 'Fitness', icon: 'fitness', tint: '#E3F4F3', fg: '#1E7F7A' },
  { id: 'creative', label: 'Creative & Design', short: 'Creative', icon: 'creative', tint: '#FBEDE9', fg: '#B5533C' },
  { id: 'home', label: 'Home & Living', short: 'Home', icon: 'sofa', tint: '#FBF3E2', fg: '#9A6A12' },
  { id: 'repair', label: 'Repair & Technical', short: 'Repair', icon: 'wrench', tint: '#E8EFF8', fg: '#3B629A' },
];
export const SKILLS: Skill[] = [
  ...['Violin', 'Piano', 'Guitar', 'Drums', 'Vocal Coaching'].map((l) => ({ id: slug(l), categoryId: 'music', label: l })),
  ...['Mathematics', 'Science', 'English', 'Bahasa Melayu', 'Mandarin'].map((l) => ({ id: slug(l), categoryId: 'academic', label: l })),
  ...['Yoga', 'Personal Training', 'Swimming', 'Badminton'].map((l) => ({ id: slug(l), categoryId: 'fitness', label: l })),
  ...['Drawing & Painting', 'Graphic Design', 'Photography'].map((l) => ({ id: slug(l), categoryId: 'creative', label: l })),
  ...['Home Organising', 'Cleaning', 'Cooking Lessons'].map((l) => ({ id: slug(l), categoryId: 'home', label: l })),
  ...['Plumbing', 'Electrical', 'Aircon Servicing', 'Phone & Laptop Repair'].map((l) => ({ id: slug(l), categoryId: 'repair', label: l })),
];
function slug(s: string) { return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-'); }

export const AREAS: Area[] = [
  { id: 'sungai-way', name: 'Sungai Way', city: 'Petaling Jaya', dx: 0, dy: 0 },
  { id: 'kelana-jaya', name: 'Kelana Jaya', city: 'Petaling Jaya', dx: -1500, dy: -1200 },
  { id: 'ss2', name: 'SS2', city: 'Petaling Jaya', dx: 2300, dy: -1900 },
  { id: 'subang-jaya', name: 'Subang Jaya', city: 'Selangor', dx: -2600, dy: 3100 },
  { id: 'bangsar', name: 'Bangsar', city: 'Kuala Lumpur', dx: 7600, dy: -5200 },
  { id: 'shah-alam', name: 'Shah Alam', city: 'Selangor', dx: -15000, dy: 2500 },
];

const polar = (m: number, deg: number) => ({ dx: Math.round(m * Math.cos((deg * Math.PI) / 180)), dy: Math.round(m * Math.sin((deg * Math.PI) / 180)) });

type PSeed = Partial<Provider> & Pick<Provider, 'id' | 'name' | 'headline' | 'skillIds' | 'categoryId' | 'rating' | 'reviewCount'> & { at: [number, number] };
const P: PSeed[] = [
  { id: 'p_meiling', name: 'Mei Ling Tan', headline: 'Violin Teacher', skillIds: ['violin'], categoryId: 'music', photo: 'meiling', hero: 'meilingHero', rating: 4.9, reviewCount: 128, at: [250, -120], years: 8, students: 320, responseRate: 98, reliability: 98, completedSessions: 612, tier: 'Explorer',
    about: 'Classical violinist with 8+ years of teaching experience. I teach all age groups and levels with a personalised approach, from first bow holds to ABRSM Grade 8.',
    languages: ['English', 'Mandarin', 'Bahasa Malaysia'], credentials: ['ABRSM Diploma (DipABRSM), Violin Performance', 'B.Mus, UCSI University'], tags: ['Classical', 'Beginner Friendly', 'All Age Groups', 'ABRSM Exams'], videoIntro: { durationSec: 48, moderated: true } },
  { id: 'p_weijie', name: 'Wei Jie Ong', headline: 'Maths Tutor', skillIds: ['mathematics', 'science'], categoryId: 'academic', photo: 'weijie', rating: 4.8, reviewCount: 96, at: [400, 30], years: 6, students: 180, responseRate: 95, reliability: 96, completedSessions: 410, tier: 'Loyalist',
    about: 'SPM and IGCSE Additional Mathematics specialist. I break problems into small, confident steps.', languages: ['English', 'Mandarin'], credentials: ['B.Sc. Mathematics, Universiti Malaya'], tags: ['SPM', 'IGCSE', 'Exam Prep'] },
  { id: 'p_farah', name: 'Farah Ahmad', headline: 'Yoga Instructor', skillIds: ['yoga'], categoryId: 'fitness', photo: 'farah', rating: 4.9, reviewCount: 74, at: [650, 140], years: 5, students: 150, responseRate: 97, reliability: 97, completedSessions: 288, tier: 'Loyalist',
    about: 'Hatha and vinyasa yoga for beginners, desk workers and prenatal clients. Calm, alignment-focused sessions.', languages: ['Bahasa Malaysia', 'English'], credentials: ['RYT-200, Yoga Alliance'], tags: ['Beginners', 'Prenatal', 'Mobility'] },
  { id: 'p_ravi', name: 'Ravi Kumar', headline: 'Art Instructor', skillIds: ['drawing-and-painting'], categoryId: 'creative', photo: 'ravi', rating: 4.8, reviewCount: 51, at: [800, 210], years: 10, students: 140, responseRate: 92, reliability: 94, completedSessions: 230, tier: 'Loyalist',
    about: 'Watercolour, acrylic and sketching for kids and adults. Portfolio guidance for art school applications.', languages: ['English', 'Tamil', 'Bahasa Malaysia'], credentials: ['Diploma in Fine Art, Malaysian Institute of Art'], tags: ['Kids', 'Watercolour', 'Portfolio'] },
  { id: 'p_sarah', name: 'Sarah Lim', headline: 'Piano Teacher', skillIds: ['piano'], categoryId: 'music', photo: 'sarah', rating: 4.7, reviewCount: 63, at: [1200, 300], years: 7, students: 160, responseRate: 93, reliability: 95, completedSessions: 340, tier: 'Loyalist',
    about: 'Piano for beginners to Grade 8 (ABRSM and Trinity), plus pop and worship accompaniment.', languages: ['English', 'Mandarin'], credentials: ['LTCL Piano Performance'], tags: ['ABRSM', 'Pop Piano', 'Adults Welcome'] },
  { id: 'p_daniel', name: 'Daniel Wong', headline: 'Home Repair & Aircon', skillIds: ['aircon-servicing', 'plumbing'], categoryId: 'repair', photo: 'daniel', rating: 4.6, reviewCount: 88, at: [1600, 250], years: 12, students: 0, responseRate: 90, reliability: 92, completedSessions: 520, tier: 'Explorer',
    about: 'Aircon servicing, minor plumbing and fixture installation around PJ. Transparent pricing, tidy work.', languages: ['English', 'Cantonese', 'Bahasa Malaysia'], credentials: ['Suruhanjaya Tenaga competency (Wireman PW2)'], tags: ['Aircon', 'Plumbing', 'Same-week'] },
  { id: 'p_nurul', name: 'Nurul Huda', headline: 'English & BM Tutor', skillIds: ['english', 'bahasa-melayu'], categoryId: 'academic', photo: 'nurul', rating: 4.9, reviewCount: 42, at: [950, 60], years: 4, students: 90, responseRate: 99, reliability: 99, completedSessions: 160, tier: 'Hatchling',
    about: 'Patient, structured English and Bahasa Melayu tuition for primary and lower-secondary students.', languages: ['Bahasa Malaysia', 'English'], credentials: ['B.Ed TESL, UPSI'], tags: ['Primary', 'UPSR prep', 'Online'] },
  { id: 'p_aiman', name: 'Aiman Rashid', headline: 'Guitar Coach', skillIds: ['guitar'], categoryId: 'music', photo: 'aiman', rating: 4.6, reviewCount: 29, at: [1900, 200], years: 5, students: 70, responseRate: 88, reliability: 90, completedSessions: 120, tier: 'Hatchling',
    about: 'Acoustic and electric guitar, chords to fingerstyle. Learn the songs you love.', languages: ['Bahasa Malaysia', 'English'], credentials: ['Rockschool Grade 8'], tags: ['Acoustic', 'Fingerstyle'] },
  { id: 'p_siti', name: 'Siti Mariam', headline: 'Vocal Coach', skillIds: ['vocal-coaching'], categoryId: 'music', photo: 'siti', rating: 4.8, reviewCount: 37, at: [2200, -60], years: 9, students: 110, responseRate: 94, reliability: 96, completedSessions: 210, tier: 'Loyalist',
    about: 'Breathing, pitch and performance coaching for singers of every level — online sessions only.', languages: ['Bahasa Malaysia', 'English'], credentials: ['Certified Estill Voice Practitioner'], tags: ['Online only', 'Performance'] },
  { id: 'p_priya', name: 'Priya Nair', headline: 'Home Organiser', skillIds: ['home-organising'], categoryId: 'home', initials: 'PN', rating: 4.7, reviewCount: 22, at: [1400, 110], years: 3, students: 0, responseRate: 91, reliability: 93, completedSessions: 80, tier: 'Hatchling',
    about: 'Decluttering and storage systems for homes, wardrobes and kitchens.', languages: ['English', 'Malayalam'], credentials: [], tags: ['Decluttering', 'Move-in'] },
  { id: 'p_kevin', name: 'Kevin Tan', headline: 'Swimming Coach', skillIds: ['swimming'], categoryId: 'fitness', initials: 'KT', rating: 4.8, reviewCount: 58, at: [1100, -40], years: 11, students: 200, responseRate: 90, reliability: 95, completedSessions: 450, tier: 'Explorer',
    about: 'Learn-to-swim for kids and adults. Fully booked until next month.', languages: ['English', 'Mandarin'], credentials: ['AUSTSWIM Teacher'], tags: ['Kids', 'Adults'] },
  { id: 'p_hakim', name: 'Hakim Zulkifli', headline: 'Personal Trainer', skillIds: ['personal-training'], categoryId: 'fitness', initials: 'HZ', rating: 0, reviewCount: 0, at: [700, -80], years: 2, students: 0, responseRate: 0, reliability: 0, completedSessions: 0, tier: 'Hatchling', approval: 'pending',
    about: 'Strength and conditioning for beginners.', languages: ['Bahasa Malaysia'], credentials: [], tags: [] },
  { id: 'p_jason', name: 'Jason Lee', headline: 'Graphic Designer', skillIds: ['graphic-design'], categoryId: 'creative', initials: 'JL', rating: 4.7, reviewCount: 31, at: [300, 200], years: 6, students: 40, responseRate: 89, reliability: 91, completedSessions: 95, tier: 'Hatchling',
    about: 'Logo, brand and social media design lessons and projects.', languages: ['English'], credentials: [], tags: ['Branding', 'Canva to Figma'], area: 'Bangsar' },
];

export function createSeed() {
  const providers: Provider[] = P.map((p) => {
    const { dx, dy } = polar(p.at[0], p.at[1]);
    const base = p.id === 'p_jason' ? { dx: AREAS[4].dx + dx, dy: AREAS[4].dy + dy } : { dx, dy };
    return {
      accountId: 'acc_' + p.id.slice(2), initials: p.name.split(' ').map((s) => s[0]).slice(0, 2).join(''),
      area: 'Sungai Way, Petaling Jaya', languages: [], years: 1, credentials: [], tags: [], about: '',
      approval: 'approved', active: true, suspended: false, bookable: true, reliability: 90, completedSessions: 0, responseRate: 90, students: 0,
      serviceRadiusKm: 10, tier: 'Hatchling', payoutOnboarding: 'complete',
      ...p, ...base,
    } as Provider;
  });
  const prov = (id: string) => providers.find((p) => p.id === id)!;

  const services: Service[] = [];
  const packages: Package[] = [];
  const svc = (providerId: string, skillId: string, title: string, description: string, modes: Service['modes'], offeringType: Service['offeringType'], pk: [string, string, number, number, boolean][]) => {
    const id = `s_${providerId.slice(2)}_${services.length}`;
    services.push({ id, providerId, skillId, title, description, modes, active: true, offeringType });
    pk.forEach(([label, description, durationMin, price, trial], i) => packages.push({ id: `${id}_k${i}`, serviceId: id, label, description, durationMin, price: trial ? 0 : price, currency: 'MYR', trial, active: true }));
  };
  svc('p_meiling', 'violin', 'Violin Lessons', 'One-to-one violin lessons for all ages, from beginner technique to ABRSM exam preparation.', ['provider', 'student', 'online'], 'skill', [
    ['Trial Lesson', 'Meet, assess your level and plan your learning path.', 30, 0, true],
    ['Regular 60-minute Lesson', 'Technique, repertoire and theory tailored to your goals.', 60, 120, false],
    ['ABRSM Exam Prep (90 min)', 'Scales, set pieces, sight-reading and aural practice.', 90, 170, false],
  ]);
  svc('p_weijie', 'mathematics', 'SPM & IGCSE Maths Tuition', 'Exam-focused tuition for Mathematics and Additional Mathematics.', ['online', 'provider'], 'skill', [
    ['Trial Session', 'Diagnostic session to find gaps.', 30, 0, true], ['Single Session (90 min)', 'Topic tuition with worked examples.', 90, 90, false]]);
  svc('p_farah', 'yoga', 'Private Yoga', 'Private hatha/vinyasa sessions at my studio or your home.', ['provider', 'student', 'online'], 'skill', [
    ['Private Session (60 min)', 'Personalised flow and alignment.', 60, 110, false], ['Trial Flow', 'A gentle 30-minute introduction.', 30, 0, true]]);
  svc('p_ravi', 'drawing-and-painting', 'Art Classes', 'Drawing, watercolour and acrylic painting.', ['provider', 'online'], 'skill', [
    ['Art Lesson (60 min)', 'Guided project with materials provided at studio.', 60, 85, false]]);
  svc('p_sarah', 'piano', 'Piano Lessons', 'Classical and contemporary piano for every level.', ['provider', 'student'], 'skill', [
    ['Trial Lesson', 'Short assessment and first piece.', 30, 0, true], ['Lesson (45 min)', 'Weekly-style lesson, booked one at a time.', 45, 95, false]]);
  svc('p_daniel', 'aircon-servicing', 'Aircon Servicing', 'Chemical and general aircon servicing for wall-mounted units.', ['student'], 'service', [
    ['General Service (1 unit)', 'Filter, coil and drain cleaning.', 60, 80, false], ['Chemical Wash (1 unit)', 'Deep clean incl. dismantle.', 120, 180, false]]);
  svc('p_nurul', 'english', 'English & BM Tuition', 'Reading, writing and grammar for primary students.', ['online', 'student'], 'skill', [
    ['Trial Session', 'Reading assessment.', 30, 0, true], ['Lesson (60 min)', 'Structured lesson with homework.', 60, 70, false]]);
  svc('p_aiman', 'guitar', 'Guitar Lessons', 'Acoustic and electric guitar.', ['provider', 'online'], 'skill', [['Lesson (60 min)', 'Chords, rhythm and songs.', 60, 80, false]]);
  svc('p_siti', 'vocal-coaching', 'Online Vocal Coaching', 'Live online coaching.', ['online'], 'skill', [['Coaching (45 min)', 'Warm-ups, technique, song work.', 45, 90, false]]);
  svc('p_priya', 'home-organising', 'Home Organising', 'Decluttering and storage set-up at your home.', ['student'], 'service', [['Half-day Session (3 h)', 'One room or wardrobe.', 180, 260, false]]);
  svc('p_kevin', 'swimming', 'Swimming Lessons', 'Learn-to-swim at my condo pool.', ['provider'], 'skill', [['Lesson (45 min)', 'Water confidence to strokes.', 45, 100, false]]);
  svc('p_hakim', 'personal-training', 'Personal Training', 'Beginner strength sessions.', ['provider', 'student'], 'skill', [['Session (60 min)', 'Full-body workout.', 60, 90, false]]);
  svc('p_jason', 'graphic-design', 'Design Lessons', 'Brand and social design.', ['online', 'provider'], 'skill', [['Lesson (60 min)', 'Hands-on project.', 60, 100, false]]);

  // Availability for the next 30 days (Malaysia local time)
  const slots: Slot[] = [];
  const pattern: Record<string, number[][]> = {
    p_meiling: [[9, 0], [10, 30], [12, 0], [16, 0], [17, 30], [19, 0]],
    p_weijie: [[15, 0], [16, 30], [20, 0]], p_farah: [[7, 30], [9, 0], [18, 30]], p_ravi: [[10, 0], [14, 0]],
    p_sarah: [[11, 0], [15, 30], [17, 0]], p_daniel: [[9, 0], [13, 0], [15, 0]], p_nurul: [[16, 0], [20, 30]],
    p_aiman: [[19, 0], [20, 30]], p_siti: [[20, 0]], p_priya: [[9, 0]], p_kevin: [[8, 0], [17, 0]], p_hakim: [[7, 0]], p_jason: [[14, 0]],
  };
  const day0 = startOfDay(DEMO_START);
  for (const [pid, times] of Object.entries(pattern)) {
    for (let d = 0; d < 31; d++) {
      const dayStart = day0 + d * DAY;
      const wd = new Date(dayStart + 8 * HOUR).getUTCDay();
      if (wd === 0 && pid !== 'p_daniel') continue; // most rest on Sundays
      for (const [h, m] of times) {
        const start = dayStart + h * HOUR + m * MIN;
        const dur = Math.max(...packages.filter((k) => services.find((s) => s.id === k.serviceId)?.providerId === pid).map((k) => k.durationMin), 60);
        slots.push({ id: `sl_${pid.slice(2)}_${start}`, providerId: pid, start, end: start + Math.min(dur, 120) * MIN, state: pid === 'p_kevin' ? 'booked' : 'open' });
      }
    }
  }
  const slotAt = (pid: string, start: number) => slots.find((s) => s.providerId === pid && s.start === start);
  const setSlot = (pid: string, start: number, state: Slot['state'], bookingId?: string) => {
    let s = slotAt(pid, start);
    if (!s) { s = { id: `sl_${pid.slice(2)}_${start}`, providerId: pid, start, end: start + HOUR, state }; slots.push(s); }
    s.state = state; s.bookingId = bookingId;
  };
  // Mei Ling: a held slot and a booked slot near the main demo date, one blocked day
  setSlot('p_meiling', myt(2026, 11, 18, 12, 0), 'booked', 'b_other');
  setSlot('p_meiling', myt(2026, 11, 18, 16, 0), 'held');
  for (const s of slots) if (s.providerId === 'p_meiling' && s.start >= myt(2026, 11, 21) && s.start < myt(2026, 11, 22)) s.state = 'blocked';

  const accounts: Account[] = [
    { id: 'acc_aisyah', name: 'Aisyah Rahman', email: 'aisyah.rahman@example.my', phone: '+60 12-345 6789', verified: true, studentEnabled: true },
    { id: 'acc_tan', name: 'Michelle Tan', email: 'michelle.tan@example.my', verified: true, studentEnabled: true },
    { id: 'acc_haziq', name: 'Haziq Iskandar', email: 'haziq@example.my', verified: true, studentEnabled: true },
    ...providers.map((p) => ({ id: p.accountId, name: p.name, email: p.name.toLowerCase().replace(/ /g, '.') + '@example.my', verified: true, providerId: p.id, studentEnabled: false })),
  ];
  const learners: Learner[] = [
    { id: 'l_aisyah', accountId: 'acc_aisyah', name: 'Aisyah Rahman', relation: 'self' },
    { id: 'l_amira', accountId: 'acc_aisyah', name: 'Amira', relation: 'child', dob: '2016-03-12', notes: 'Prefers visual explanations. Beginner violin interest.' },
    { id: 'l_ethan', accountId: 'acc_tan', name: 'Ethan Tan', relation: 'child', dob: '2014-08-02' },
    { id: 'l_tan', accountId: 'acc_tan', name: 'Michelle Tan', relation: 'self' },
    { id: 'l_haziq', accountId: 'acc_haziq', name: 'Haziq Iskandar', relation: 'self' },
  ];
  const addresses: Address[] = [
    { id: 'ad_home', accountId: 'acc_aisyah', label: 'Home', line1: '12, Jalan SS 9A/14', line2: 'Seri Setia', area: 'Sungai Way, Petaling Jaya', dx: 60, dy: 90, isDefault: true },
    { id: 'ad_work', accountId: 'acc_aisyah', label: 'Work', line1: 'Level 8, Menara Sunway', line2: 'Jalan Lagoon Timur', area: 'Bandar Sunway', dx: -1800, dy: 2300, isDefault: false },
  ];
  const paymentMethods: PaymentMethod[] = [
    { id: 'pm_visa', accountId: 'acc_aisyah', brand: 'Visa', last4: '4242', expiry: '08/28', isDefault: true },
  ];

  const pk = (svcProvider: string, idx: number) => packages.filter((k) => services.find((s) => s.id === k.serviceId)?.providerId === svcProvider)[idx];
  const mk = (o: Partial<Booking> & Pick<Booking, 'id' | 'studentAccountId' | 'learnerId' | 'providerId' | 'start' | 'status' | 'mode'> & { pkg: Package }): Booking => {
    const s = services.find((x) => x.id === o.pkg.serviceId)!;
    const slot = slotAt(o.providerId, o.start);
    if (slot) { slot.state = 'booked'; slot.bookingId = o.id; } else setSlot(o.providerId, o.start, 'booked', o.id);
    const { pkg, ...rest } = o;
    return {
      ref: 'GL-' + (2600 + parseInt(o.id.replace(/\D/g, '') || '1', 10) * 37), serviceId: s.id, packageId: pkg.id, slotId: `sl_${o.providerId.slice(2)}_${o.start}`, durationMin: pkg.durationMin,
      pricing: { base: pkg.price, transport: 0, serviceFee: 0, total: pkg.price, lines: [{ label: `${pkg.label}`, amount: pkg.price }] },
      history: [{ status: 'created', at: o.start - 5 * DAY }], payment: { status: pkg.price === 0 ? 'free' : 'succeeded', method: 'Visa •• 4242' },
      ...rest,
    } as Booking;
  };
  const bookings: Booking[] = [
    mk({ id: 'b1', studentAccountId: 'acc_aisyah', learnerId: 'l_amira', providerId: 'p_weijie', pkg: pk('p_weijie', 1), start: myt(2026, 11, 7, 15, 0), mode: 'online', status: 'completed', checkInStudent: myt(2026, 11, 7, 14, 58), checkInTeacher: myt(2026, 11, 7, 14, 55), checkOut: myt(2026, 11, 7, 16, 31), completedAt: myt(2026, 11, 7, 16, 31), reviewId: 'r_b1' }),
    mk({ id: 'b2', studentAccountId: 'acc_aisyah', learnerId: 'l_aisyah', providerId: 'p_farah', pkg: pk('p_farah', 0), start: myt(2026, 11, 10, 9, 0), mode: 'provider', status: 'refunded',
      cancellation: { by: 'student', reason: 'Schedule conflict', at: myt(2026, 11, 6, 20, 0), refundPct: 100, refundAmount: 110 }, refund: { amount: 110, status: 'completed', method: 'Visa •• 4242', at: myt(2026, 11, 8, 10, 0) }, payment: { status: 'refunded', method: 'Visa •• 4242' } }),
    mk({ id: 'b3', studentAccountId: 'acc_aisyah', learnerId: 'l_amira', providerId: 'p_weijie', pkg: pk('p_weijie', 1), start: myt(2026, 11, 16, 16, 30), mode: 'online', status: 'confirmed' }),
    mk({ id: 'b4', studentAccountId: 'acc_aisyah', learnerId: 'l_amira', providerId: 'p_ravi', pkg: pk('p_ravi', 0), start: myt(2026, 11, 12, 10, 0), mode: 'provider', status: 'completed', checkInStudent: myt(2026, 11, 12, 9, 57), checkInTeacher: myt(2026, 11, 12, 9, 55), checkOut: myt(2026, 11, 12, 11, 2), completedAt: myt(2026, 11, 12, 11, 2) }),
    mk({ id: 'b5', studentAccountId: 'acc_tan', learnerId: 'l_ethan', providerId: 'p_meiling', pkg: pk('p_meiling', 1), start: myt(2026, 11, 14, 16, 0), mode: 'provider', status: 'confirmed' }),
    mk({ id: 'b6', studentAccountId: 'acc_haziq', learnerId: 'l_haziq', providerId: 'p_meiling', pkg: pk('p_meiling', 1), start: myt(2026, 11, 19, 17, 30), mode: 'provider', status: 'pending_confirmation' }),
    mk({ id: 'b7', studentAccountId: 'acc_tan', learnerId: 'l_ethan', providerId: 'p_meiling', pkg: pk('p_meiling', 1), start: myt(2026, 11, 7, 16, 0), mode: 'provider', status: 'completed', checkInStudent: myt(2026, 11, 7, 15, 58), checkInTeacher: myt(2026, 11, 7, 15, 52), checkOut: myt(2026, 11, 7, 17, 1), completedAt: myt(2026, 11, 7, 17, 1) }),
    mk({ id: 'b8', studentAccountId: 'acc_tan', learnerId: 'l_ethan', providerId: 'p_meiling', pkg: pk('p_meiling', 1), start: myt(2026, 11, 12, 16, 0), mode: 'provider', status: 'completed', checkInStudent: myt(2026, 11, 12, 15, 59), checkInTeacher: myt(2026, 11, 12, 15, 54), checkOut: myt(2026, 11, 12, 17, 0), completedAt: myt(2026, 11, 12, 17, 0) }),
    mk({ id: 'b9', studentAccountId: 'acc_tan', learnerId: 'l_ethan', providerId: 'p_meiling', pkg: pk('p_meiling', 1), start: myt(2026, 10, 31, 16, 0), mode: 'provider', status: 'completed', checkInStudent: myt(2026, 10, 31, 15, 58), checkInTeacher: myt(2026, 10, 31, 15, 55), checkOut: myt(2026, 10, 31, 17, 0), completedAt: myt(2026, 10, 31, 17, 0) }),
  ];
  for (const b of bookings) {
    const created = Math.min(b.start - 5 * DAY, DEMO_START - 3 * HOUR);
    b.history = [{ status: 'created', at: created }];
    if (b.pricing.total > 0) b.history.push({ status: 'payment_succeeded', at: created + MIN });
    if (b.status !== 'pending_confirmation') b.history.push({ status: 'confirmed', at: Math.min(b.start - 4 * DAY, DEMO_START - 2 * HOUR) });
    if (b.status === 'completed') b.history.push({ status: 'in_progress', at: b.checkInTeacher! }, { status: 'completed', at: b.checkOut! });
    if (b.status === 'refunded') b.history = [{ status: 'created', at: b.start - 9 * DAY }, { status: 'confirmed', at: b.start - 8 * DAY }, { status: 'cancelled', at: b.cancellation!.at, note: 'Cancelled by student · 100% refund' }, { status: 'refunded', at: b.refund!.at }];
  }

  const reviews: Review[] = [
    { id: 'r1', providerId: 'p_meiling', author: 'Aisyah R.', rating: 5, tags: ['Patient', 'Clear explanations'], text: 'Mei Ling is patient and explains concepts so well. My daughter loves her classes!', at: DEMO_START - 14 * DAY },
    { id: 'r2', providerId: 'p_meiling', author: 'Michelle T.', rating: 5, tags: ['Punctual', 'Exam-ready'], text: 'Ethan passed Grade 5 with merit. Structured lessons and great communication.', at: DEMO_START - 30 * DAY },
    { id: 'r3', providerId: 'p_meiling', author: 'Daniel K.', rating: 4, tags: ['Friendly'], text: 'Lovely studio near Sungai Way. Booking slots fill fast so plan ahead.', at: DEMO_START - 45 * DAY },
    { id: 'r_b1', providerId: 'p_weijie', bookingId: 'b1', authorAccountId: 'acc_aisyah', author: 'Aisyah R.', rating: 5, tags: ['Clear explanations'], text: 'Amira finally gets quadratic equations. Thank you!', at: myt(2026, 11, 7, 20, 0), editableUntil: myt(2026, 11, 21, 16, 31) },
    { id: 'r5', providerId: 'p_farah', author: 'Lina S.', rating: 5, tags: ['Calming'], text: 'Perfect for a stiff back after work.', at: DEMO_START - 9 * DAY },
    { id: 'r6', providerId: 'p_ravi', author: 'Jeremy C.', rating: 5, tags: ['Great with kids'], text: 'My son looks forward to every class.', at: DEMO_START - 20 * DAY },
  ];
  const posts: Post[] = [
    { id: 'po1', providerId: 'p_meiling', text: 'Congratulations to all my students who sat for ABRSM this month — six distinctions! 🎻 New Saturday morning slots open for December.', at: DEMO_START - 2 * DAY, status: 'published', image: 'meilingHero' },
    { id: 'po2', providerId: 'p_meiling', text: 'Practice tip: 10 focused minutes on open strings beats 40 distracted minutes of pieces.', at: DEMO_START - 9 * DAY, status: 'published' },
    { id: 'po3', providerId: 'p_meiling', text: 'Draft: Year-end recital details…', at: DEMO_START - 1 * DAY, status: 'draft' },
    { id: 'po4', providerId: 'p_farah', text: 'Free 10-minute desk stretch routine — save this for your next long meeting.', at: DEMO_START - 3 * DAY, status: 'published' },
  ];
  const threads: Thread[] = [
    { id: 't_weijie', providerId: 'p_weijie', studentAccountId: 'acc_aisyah', bookingId: 'b3', origin: 'booking', unreadStudent: 1, unreadTeacher: 0, messages: [
      { id: 'm1', from: 'student', text: 'Hi Wei Jie, Amira would like to focus on simultaneous equations on Monday.', at: DEMO_START - 20 * HOUR },
      { id: 'm2', from: 'teacher', text: 'Sounds good! I\'ll prepare some past-year SPM questions. Please have her calculator ready 🙂', at: DEMO_START - 2 * HOUR } ] },
    { id: 't_ravi', providerId: 'p_ravi', studentAccountId: 'acc_aisyah', bookingId: 'b4', origin: 'booking', unreadStudent: 0, unreadTeacher: 0, messages: [
      { id: 'm3', from: 'teacher', text: 'Amira did a beautiful watercolour today. I\'ve added notes in her Lesson Space.', at: myt(2026, 11, 12, 11, 10) } ] },
    { id: 't_tan', providerId: 'p_meiling', studentAccountId: 'acc_tan', bookingId: 'b5', origin: 'booking', unreadStudent: 0, unreadTeacher: 1, messages: [
      { id: 'm4', from: 'student', text: 'Hi Mei Ling, Ethan will bring his new shoulder rest today.', at: DEMO_START - 40 * MIN } ] },
  ];
  const materials: Material[] = [
    { id: 'mt1', providerId: 'p_ravi', learnerId: 'l_amira', bookingId: 'b4', title: 'Wet-on-wet watercolour', body: 'Practise gradients on A5 paper. Try three sky studies before next class.', attachment: 'gradient-exercise.pdf', at: myt(2026, 11, 12, 11, 15), kind: 'material' },
    { id: 'mt2', providerId: 'p_ravi', learnerId: 'l_amira', bookingId: 'b4', title: 'Session note', body: 'Great brush control. Needs to let layers dry before adding detail.', at: myt(2026, 11, 12, 11, 12), kind: 'session_note' },
    { id: 'mt3', providerId: 'p_weijie', learnerId: 'l_amira', bookingId: 'b1', title: 'Quadratics worksheet', body: 'Complete Q1–Q12. Answers on the last page — check only after finishing!', attachment: 'quadratics-set-A.pdf', at: myt(2026, 11, 7, 16, 40), kind: 'material' },
    { id: 'mt4', providerId: 'p_weijie', learnerId: 'l_amira', title: 'Progress', body: 'Factorisation: confident. Completing the square: improving. Next: simultaneous equations.', at: myt(2026, 11, 7, 16, 45), kind: 'progress' },
    { id: 'mt5', providerId: 'p_meiling', learnerId: 'l_ethan', bookingId: 'b8', title: 'Grade 6 scales', body: 'A major 3 octaves, slurred. Metronome at 72.', attachment: 'grade6-scales.pdf', at: myt(2026, 11, 12, 17, 10), kind: 'material' },
    { id: 'mt6', providerId: 'p_meiling', learnerId: 'l_ethan', title: 'Progress', body: 'Vibrato developing well. Bow distribution needs attention in slow passages.', at: myt(2026, 11, 12, 17, 12), kind: 'progress' },
  ];

  const ledger: LedgerEntry[] = [
    { id: 'le1', providerId: 'p_meiling', bookingId: 'b9', type: 'earning', amount: 108, at: myt(2026, 10, 31, 17, 0), status: 'available', releaseAt: myt(2026, 11, 3, 17, 0) },
    { id: 'le2', providerId: 'p_meiling', bookingId: 'b7', type: 'earning', amount: 108, at: myt(2026, 11, 7, 17, 1), status: 'available', releaseAt: myt(2026, 11, 10, 17, 1) },
    { id: 'le3', providerId: 'p_meiling', bookingId: 'b8', type: 'earning', amount: 108, at: myt(2026, 11, 12, 17, 0), status: 'pending', releaseAt: myt(2026, 11, 15, 17, 0) },
    { id: 'le0', providerId: 'p_meiling', type: 'earning', amount: 540, at: myt(2026, 10, 20), status: 'available', note: 'October sessions (5)' },
    { id: 'lp1', providerId: 'p_meiling', type: 'payout', amount: 500, at: myt(2026, 10, 25, 10, 0), status: 'paid', note: 'Maybank •• 8812' },
    { id: 'le_w1', providerId: 'p_weijie', bookingId: 'b1', type: 'earning', amount: 81, at: myt(2026, 11, 7, 16, 31), status: 'available' },
    { id: 'le_r1', providerId: 'p_ravi', bookingId: 'b4', type: 'earning', amount: 76.5, at: myt(2026, 11, 12, 11, 2), status: 'pending', releaseAt: myt(2026, 11, 15, 11, 2) },
  ];
  const tasks: Task[] = [
    { id: 'tk1', providerId: 'p_meiling', title: 'Prepare Grade 6 sight-reading set for Ethan', due: myt(2026, 11, 14, 15, 0), done: false },
    { id: 'tk2', providerId: 'p_meiling', title: 'Book recital hall for 12 Dec', due: myt(2026, 11, 20, 12, 0), done: false },
    { id: 'tk3', providerId: 'p_meiling', title: 'Restring studio violin (E string)', due: myt(2026, 11, 11, 12, 0), done: true },
  ];
  const notifications: Notification[] = [
    { id: 'n1', accountId: 'acc_aisyah', role: 'student', group: 'messages', kind: 'message', title: 'Wei Jie Ong', body: 'I\'ll prepare some past-year SPM questions…', at: DEMO_START - 2 * HOUR, read: false, href: '/conversation/t_weijie' },
    { id: 'n2', accountId: 'acc_aisyah', role: 'student', group: 'bookings', kind: 'reminder', title: 'Session reminder', body: 'SPM Maths with Wei Jie on Mon, 16 Nov at 04:30 PM.', at: DEMO_START - 5 * HOUR, read: false, href: '/booking/b3' },
    { id: 'n3', accountId: 'acc_aisyah', role: 'student', group: 'updates', kind: 'materials', title: 'New class material', body: 'Ravi Kumar added "Wet-on-wet watercolour" for Amira.', at: myt(2026, 11, 12, 11, 15), read: true, href: '/lesson-space/p_ravi__l_amira' },
    { id: 'n4', accountId: 'acc_aisyah', role: 'student', group: 'updates', kind: 'review_request', title: 'How was Art Lesson?', body: 'Leave a review for Ravi Kumar.', at: myt(2026, 11, 12, 12, 0), read: true, href: '/booking/review/b4' },
    { id: 'n5', accountId: 'acc_aisyah', role: 'student', group: 'updates', kind: 'post', title: 'Mei Ling Tan posted', body: 'Congratulations to all my students who sat for ABRSM…', at: DEMO_START - 2 * DAY, read: true, href: '/posts/p_meiling' },
    { id: 'n6', accountId: 'acc_aisyah', role: 'student', group: 'bookings', kind: 'refund', title: 'Refund completed', body: 'RM 110.00 refunded to Visa •• 4242.', at: myt(2026, 11, 8, 10, 0), read: true, href: '/refund/b2' },
    { id: 'n7', accountId: 'acc_meiling', role: 'teacher', group: 'bookings', kind: 'request', title: 'New booking request', body: 'Haziq Iskandar · Thu, 19 Nov 05:30 PM · Paid RM 120', at: DEMO_START - 3 * HOUR, read: false, href: '/t/requests' },
    { id: 'n8', accountId: 'acc_meiling', role: 'teacher', group: 'messages', kind: 'message', title: 'Michelle Tan', body: 'Ethan will bring his new shoulder rest today.', at: DEMO_START - 40 * MIN, read: false, href: '/conversation/t_tan' },
  ];
  const disputes: Dispute[] = [];
  const reports: Report[] = [];
  return { providers, services, packages, slots, accounts, learners, addresses, paymentMethods, bookings, reviews, posts, threads, materials, ledger, tasks, notifications, disputes, reports };
}
export type DB = ReturnType<typeof createSeed>;
