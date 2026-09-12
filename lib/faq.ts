export type FaqItem = {
  question: string;
  answer: string;
  category: string;
  featured?: boolean;
};

export const faqCategories = [
  'Getting Started',
  'Reviews & Decisions',
  'Equipment & Setup',
  'Matches & Leagues',
  'Pricing & Storage',
];

export const faqItems: FaqItem[] = [
  {
    question: 'What is Turf DRS?',
    answer:
      'Turf DRS is a professional-style decision review system for local cricket, turf grounds, academies, and clubs. It lets you capture every delivery and settle close calls with slow-mo, ball tracking, and frame-by-frame replay.',
    category: 'Getting Started',
    featured: true,
  },
  {
    question: 'How does a Turf DRS review work?',
    answer:
      'Place a camera at the umpire end, and Turf DRS auto-captures every delivery. When the on-field umpire signals for a review, the third umpire plays back slow-mo and ball tracking footage and delivers a final decision — usually in under 30 seconds.',
    category: 'Getting Started',
    featured: true,
  },
  {
    question: 'What decisions can Turf DRS review?',
    answer:
      'Turf DRS supports LBW, run out, stumping, boundary, edge, and caught-behind reviews — the same types of decisions the third umpire handles in professional cricket.',
    category: 'Reviews & Decisions',
    featured: true,
  },
  {
    question: 'How accurate is ball tracking?',
    answer:
      'Ball tracking uses high-speed capture and 3D trajectory modelling to show where the ball was heading. Turf DRS is designed for local matches and is not affiliated with ICC, IPL, or Hawk-Eye — but the technology gives clubs and academies the same visual evidence they see on television.',
    category: 'Reviews & Decisions',
    featured: true,
  },
  {
    question: 'Who can request a review?',
    answer:
      'Any player, captain, or umpire can signal for a review. Turf DRS makes the process smooth and fast so the game keeps moving while the review runs.',
    category: 'Reviews & Decisions',
  },
  {
    question: 'Do I need special cameras or equipment?',
    answer:
      'No. Any phone or camera works. Set it up at the umpire end with a level view of the pitch and stumps, and Turf DRS handles auto-capture for every delivery.',
    category: 'Equipment & Setup',
    featured: true,
  },
  {
    question: 'What is the best camera position?',
    answer:
      'The umpire end is the primary position — wide, level, and showing both sets of stumps. Optional square-leg and behind-the-wicket angles can add extra evidence for edges and height decisions.',
    category: 'Equipment & Setup',
  },
  {
    question: 'Does Turf DRS work offline at the ground?',
    answer:
      'Auto-capture and live review work locally on your device. You can upload highlights and save match records once you have an internet connection.',
    category: 'Equipment & Setup',
  },
  {
    question: 'Can I use it for academy matches and nets sessions?',
    answer:
      'Yes. Turf DRS is designed for turf cricket, academies, and clubs — from match-day decisions to coaching review sessions.',
    category: 'Matches & Leagues',
  },
  {
    question: 'Can a league run automated reviews?',
    answer:
      'Yes. Turf DRS is built for local leagues, cup finals, and showcase matches — giving every ground the same review quality regardless of budget.',
    category: 'Matches & Leagues',
    featured: true,
  },
  {
    question: 'Where is match footage stored?',
    answer:
      'Review footage and highlights are saved to your match record in Turf DRS. You can revisit, download, or share key moments after the game.',
    category: 'Pricing & Storage',
  },
  {
    question: 'Is Turf DRS free?',
    answer:
      'Yes, Turf DRS is free to get started. Set up a camera, capture matches, and run reviews on your turf without a credit card.',
    category: 'Pricing & Storage',
    featured: true,
  },
  {
    question: 'Is Turf DRS affiliated with the ICC or Hawk-Eye?',
    answer:
      'No. Turf DRS is an original, independent product designed for local cricket. It brings the same kind of visual evidence to grassroots and academy matches without any affiliation to the ICC, IPL, or Hawk-Eye.',
    category: 'Getting Started',
    featured: true,
  },
];

export const featuredFaqItems = faqItems.filter((item) => item.featured);