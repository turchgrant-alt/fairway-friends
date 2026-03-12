export interface Course {
  id: string;
  name: string;
  location: string;
  city: string;
  state: string;
  type: 'public' | 'resort' | 'private' | 'municipal' | 'semi-private';
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  overallRating: number;
  reviewCount: number;
  playedCount: number;
  savedCount: number;
  imageUrl: string;
  tags: string[];
  par: number;
  yardage: number;
  designer: string;
  yearBuilt: number;
  description: string;
  ratings: CourseRatings;
}

export interface CourseRatings {
  layout: number;
  conditioning: number;
  greens: number;
  scenery: number;
  difficulty: number;
  paceOfPlay: number;
  value: number;
  replayability: number;
  practiceFacilities: number;
  clubhouse: number;
  foodDrinks: number;
  overallVibe: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  homeCity: string;
  handicapRange: string;
  preferredTypes: string[];
  playedCount: number;
  savedCount: number;
  followersCount: number;
  followingCount: number;
  topCourses: string[];
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  headline: string;
  body: string;
  pros: string[];
  cons: string[];
  bestForTags: string[];
  worthThePrice: boolean;
  wouldPlayAgain: boolean;
  overallRating: number;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export interface CourseList {
  id: string;
  userId: string;
  title: string;
  description: string;
  courseIds: string[];
  isPublic: boolean;
  createdAt: string;
}

// Sample images - using Unsplash golf course photos
const courseImages = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
  'https://images.unsplash.com/photo-1593111774240-004412c0d235?w=800&q=80',
  'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80',
  'https://images.unsplash.com/photo-1600007370700-545eb0525a87?w=800&q=80',
  'https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800&q=80',
  'https://images.unsplash.com/photo-1632932693498-58789a4746d4?w=800&q=80',
  'https://images.unsplash.com/photo-1622397815765-53a970a096c2?w=800&q=80',
  'https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?w=800&q=80',
  'https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?w=800&q=80',
  'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80',
  'https://images.unsplash.com/photo-1504541655002-1f4cd5c78634?w=800&q=80',
  'https://images.unsplash.com/photo-1495556650867-99590cea3657?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
  'https://images.unsplash.com/photo-1605996579188-8e24b27fea13?w=800&q=80',
];

const avatars = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
];

export const courses: Course[] = [
  {
    id: '1', name: 'TPC Scottsdale (Stadium)', location: 'Scottsdale, AZ', city: 'Scottsdale', state: 'AZ',
    type: 'resort', priceRange: '$$$$', overallRating: 9.2, reviewCount: 342, playedCount: 1205, savedCount: 890,
    imageUrl: courseImages[0], tags: ['bucket-list', 'tournament-host', 'desert'], par: 71, yardage: 7261,
    designer: 'Tom Weiskopf & Jay Morrish', yearBuilt: 1986,
    description: 'Home of the "Greatest Show on Grass," TPC Scottsdale\'s Stadium Course is one of the most iconic courses in golf.',
    ratings: { layout: 9.4, conditioning: 9.5, greens: 9.3, scenery: 9.6, difficulty: 8.8, paceOfPlay: 7.5, value: 7.2, replayability: 9.5, practiceFacilities: 9.0, clubhouse: 9.2, foodDrinks: 8.8, overallVibe: 9.5 }
  },
  {
    id: '2', name: 'Torrey Pines (South)', location: 'La Jolla, CA', city: 'La Jolla', state: 'CA',
    type: 'public', priceRange: '$$$', overallRating: 9.0, reviewCount: 489, playedCount: 2100, savedCount: 1450,
    imageUrl: courseImages[1], tags: ['ocean-views', 'bucket-list', 'championship'], par: 72, yardage: 7698,
    designer: 'William F. Bell / Rees Jones', yearBuilt: 1957,
    description: 'Perched on the cliffs above the Pacific Ocean, Torrey Pines South is one of the most breathtaking public courses in America.',
    ratings: { layout: 9.2, conditioning: 8.8, greens: 8.9, scenery: 9.8, difficulty: 9.2, paceOfPlay: 6.5, value: 7.8, replayability: 9.3, practiceFacilities: 8.5, clubhouse: 7.8, foodDrinks: 7.2, overallVibe: 9.4 }
  },
  {
    id: '3', name: 'Pinehurst No. 2', location: 'Pinehurst, NC', city: 'Pinehurst', state: 'NC',
    type: 'resort', priceRange: '$$$$', overallRating: 9.5, reviewCount: 278, playedCount: 890, savedCount: 1200,
    imageUrl: courseImages[2], tags: ['bucket-list', 'historic', 'championship'], par: 72, yardage: 7588,
    designer: 'Donald Ross', yearBuilt: 1907,
    description: 'The crown jewel of American golf, Pinehurst No. 2 is a masterpiece of strategic design by Donald Ross.',
    ratings: { layout: 9.8, conditioning: 9.6, greens: 9.7, scenery: 8.5, difficulty: 9.4, paceOfPlay: 8.0, value: 7.5, replayability: 9.8, practiceFacilities: 9.5, clubhouse: 9.4, foodDrinks: 9.0, overallVibe: 9.7 }
  },
  {
    id: '4', name: 'Streamsong Black', location: 'Streamsong, FL', city: 'Bowling Green', state: 'FL',
    type: 'resort', priceRange: '$$$$', overallRating: 9.3, reviewCount: 198, playedCount: 650, savedCount: 780,
    imageUrl: courseImages[3], tags: ['hidden-gem', 'links-style', 'destination'], par: 73, yardage: 7329,
    designer: 'Gil Hanse', yearBuilt: 2017,
    description: 'Built on reclaimed phosphate mining land, Streamsong Black offers a links-style experience unlike anything in Florida.',
    ratings: { layout: 9.6, conditioning: 9.2, greens: 9.4, scenery: 9.0, difficulty: 9.0, paceOfPlay: 8.5, value: 8.0, replayability: 9.5, practiceFacilities: 8.8, clubhouse: 9.0, foodDrinks: 8.5, overallVibe: 9.3 }
  },
  {
    id: '5', name: 'Bandon Dunes', location: 'Bandon, OR', city: 'Bandon', state: 'OR',
    type: 'resort', priceRange: '$$$$', overallRating: 9.6, reviewCount: 412, playedCount: 780, savedCount: 1650,
    imageUrl: courseImages[4], tags: ['bucket-list', 'links-style', 'ocean-views', 'destination'], par: 72, yardage: 6732,
    designer: 'David McLay Kidd', yearBuilt: 1999,
    description: 'The course that started it all at Bandon. Pure links golf on the rugged Oregon coast.',
    ratings: { layout: 9.5, conditioning: 9.0, greens: 9.2, scenery: 9.9, difficulty: 8.8, paceOfPlay: 8.5, value: 8.2, replayability: 9.8, practiceFacilities: 8.0, clubhouse: 8.5, foodDrinks: 8.0, overallVibe: 9.8 }
  },
  {
    id: '6', name: 'Bethpage Black', location: 'Farmingdale, NY', city: 'Farmingdale', state: 'NY',
    type: 'public', priceRange: '$$', overallRating: 8.8, reviewCount: 567, playedCount: 3200, savedCount: 1100,
    imageUrl: courseImages[5], tags: ['championship', 'challenging', 'value'], par: 71, yardage: 7468,
    designer: 'A.W. Tillinghast', yearBuilt: 1936,
    description: 'The famous "Warning" sign at the first tee says it all. Bethpage Black is a beast and a bargain.',
    ratings: { layout: 9.0, conditioning: 8.2, greens: 8.5, scenery: 7.8, difficulty: 9.5, paceOfPlay: 5.5, value: 9.2, replayability: 8.8, practiceFacilities: 7.0, clubhouse: 6.5, foodDrinks: 6.0, overallVibe: 8.5 }
  },
  {
    id: '7', name: 'Pebble Beach Golf Links', location: 'Pebble Beach, CA', city: 'Pebble Beach', state: 'CA',
    type: 'resort', priceRange: '$$$$', overallRating: 9.4, reviewCount: 623, playedCount: 1500, savedCount: 2100,
    imageUrl: courseImages[6], tags: ['bucket-list', 'ocean-views', 'iconic'], par: 72, yardage: 6828,
    designer: 'Jack Neville & Douglas Grant', yearBuilt: 1919,
    description: 'Simply the most famous golf course in America. Every golfer\'s bucket list starts here.',
    ratings: { layout: 9.3, conditioning: 9.0, greens: 8.8, scenery: 10.0, difficulty: 8.5, paceOfPlay: 7.0, value: 5.5, replayability: 9.5, practiceFacilities: 8.5, clubhouse: 9.0, foodDrinks: 9.0, overallVibe: 9.8 }
  },
  {
    id: '8', name: 'We-Ko-Pa (Saguaro)', location: 'Fort McDowell, AZ', city: 'Fort McDowell', state: 'AZ',
    type: 'public', priceRange: '$$', overallRating: 8.9, reviewCount: 234, playedCount: 980, savedCount: 560,
    imageUrl: courseImages[7], tags: ['desert', 'scenic', 'value', 'hidden-gem'], par: 72, yardage: 6966,
    designer: 'Bill Coore & Ben Crenshaw', yearBuilt: 2006,
    description: 'A Coore & Crenshaw desert masterpiece that perfectly frames the McDowell Mountains.',
    ratings: { layout: 9.2, conditioning: 9.0, greens: 9.1, scenery: 9.5, difficulty: 8.2, paceOfPlay: 8.5, value: 9.0, replayability: 9.2, practiceFacilities: 7.5, clubhouse: 7.0, foodDrinks: 7.0, overallVibe: 9.0 }
  },
  {
    id: '9', name: 'Cabot Cliffs', location: 'Inverness, NS', city: 'Inverness', state: 'NS',
    type: 'resort', priceRange: '$$$$', overallRating: 9.7, reviewCount: 189, playedCount: 420, savedCount: 1800,
    imageUrl: courseImages[8], tags: ['bucket-list', 'ocean-views', 'world-class', 'destination'], par: 72, yardage: 6764,
    designer: 'Bill Coore & Ben Crenshaw', yearBuilt: 2015,
    description: 'Widely regarded as one of the most visually stunning courses on the planet.',
    ratings: { layout: 9.8, conditioning: 9.5, greens: 9.6, scenery: 10.0, difficulty: 8.5, paceOfPlay: 9.0, value: 8.0, replayability: 9.9, practiceFacilities: 8.0, clubhouse: 8.5, foodDrinks: 8.5, overallVibe: 9.9 }
  },
  {
    id: '10', name: 'Sand Valley', location: 'Nekoosa, WI', city: 'Nekoosa', state: 'WI',
    type: 'resort', priceRange: '$$$', overallRating: 9.1, reviewCount: 156, playedCount: 540, savedCount: 680,
    imageUrl: courseImages[9], tags: ['links-style', 'destination', 'buddy-trip'], par: 72, yardage: 6913,
    designer: 'Bill Coore & Ben Crenshaw', yearBuilt: 2017,
    description: 'Links golf in the Wisconsin sand barrens. A pure, minimalist golf experience.',
    ratings: { layout: 9.3, conditioning: 8.8, greens: 9.0, scenery: 8.8, difficulty: 8.0, paceOfPlay: 9.0, value: 8.5, replayability: 9.2, practiceFacilities: 7.5, clubhouse: 8.0, foodDrinks: 8.0, overallVibe: 9.2 }
  },
  {
    id: '11', name: 'Pacific Dunes', location: 'Bandon, OR', city: 'Bandon', state: 'OR',
    type: 'resort', priceRange: '$$$$', overallRating: 9.7, reviewCount: 398, playedCount: 720, savedCount: 1550,
    imageUrl: courseImages[10], tags: ['bucket-list', 'links-style', 'ocean-views'], par: 71, yardage: 6633,
    designer: 'Tom Doak', yearBuilt: 2001,
    description: 'Many consider Pacific Dunes the best course at Bandon and one of the top public courses in the world.',
    ratings: { layout: 9.7, conditioning: 9.2, greens: 9.5, scenery: 9.9, difficulty: 8.5, paceOfPlay: 8.8, value: 8.0, replayability: 9.9, practiceFacilities: 8.0, clubhouse: 8.5, foodDrinks: 8.0, overallVibe: 9.8 }
  },
  {
    id: '12', name: 'Rustic Canyon', location: 'Moorpark, CA', city: 'Moorpark', state: 'CA',
    type: 'public', priceRange: '$', overallRating: 8.5, reviewCount: 312, playedCount: 4500, savedCount: 890,
    imageUrl: courseImages[11], tags: ['value', 'links-style', 'hidden-gem', 'walkable'], par: 72, yardage: 6900,
    designer: 'Gil Hanse', yearBuilt: 2002,
    description: 'The best value in American golf. A Gil Hanse design for under $50.',
    ratings: { layout: 9.0, conditioning: 7.5, greens: 7.8, scenery: 7.5, difficulty: 7.8, paceOfPlay: 7.0, value: 9.8, replayability: 9.0, practiceFacilities: 6.5, clubhouse: 5.5, foodDrinks: 5.0, overallVibe: 8.5 }
  },
  {
    id: '13', name: 'Whistling Straits (Straits)', location: 'Kohler, WI', city: 'Kohler', state: 'WI',
    type: 'resort', priceRange: '$$$$', overallRating: 9.2, reviewCount: 287, playedCount: 680, savedCount: 920,
    imageUrl: courseImages[12], tags: ['bucket-list', 'championship', 'links-style'], par: 72, yardage: 7790,
    designer: 'Pete Dye', yearBuilt: 1998,
    description: 'Pete Dye\'s links-style masterpiece on the shores of Lake Michigan. Host of the 2021 Ryder Cup.',
    ratings: { layout: 9.4, conditioning: 9.3, greens: 9.0, scenery: 9.2, difficulty: 9.3, paceOfPlay: 7.5, value: 7.0, replayability: 9.0, practiceFacilities: 9.0, clubhouse: 9.2, foodDrinks: 8.8, overallVibe: 9.2 }
  },
  {
    id: '14', name: 'Chambers Bay', location: 'University Place, WA', city: 'University Place', state: 'WA',
    type: 'public', priceRange: '$$$', overallRating: 8.6, reviewCount: 345, playedCount: 1100, savedCount: 750,
    imageUrl: courseImages[13], tags: ['links-style', 'championship', 'scenic'], par: 72, yardage: 7585,
    designer: 'Robert Trent Jones Jr.', yearBuilt: 2007,
    description: 'A dramatic links-style course carved from a former gravel mine on Puget Sound.',
    ratings: { layout: 8.8, conditioning: 7.5, greens: 7.0, scenery: 9.2, difficulty: 9.0, paceOfPlay: 7.5, value: 8.0, replayability: 8.5, practiceFacilities: 7.0, clubhouse: 7.0, foodDrinks: 6.5, overallVibe: 8.5 }
  },
  {
    id: '15', name: 'Arcadia Bluffs', location: 'Arcadia, MI', city: 'Arcadia', state: 'MI',
    type: 'resort', priceRange: '$$$', overallRating: 9.0, reviewCount: 198, playedCount: 560, savedCount: 720,
    imageUrl: courseImages[14], tags: ['scenic', 'links-style', 'hidden-gem', 'destination'], par: 72, yardage: 7300,
    designer: 'Warren Henderson & Rick Smith', yearBuilt: 1999,
    description: 'Stunning blufftop golf overlooking Lake Michigan. One of Michigan\'s finest.',
    ratings: { layout: 9.0, conditioning: 8.8, greens: 8.9, scenery: 9.5, difficulty: 8.5, paceOfPlay: 8.0, value: 8.0, replayability: 9.0, practiceFacilities: 7.5, clubhouse: 8.5, foodDrinks: 8.0, overallVibe: 9.0 }
  },
];

export const users: UserProfile[] = [
  {
    id: 'u1', name: 'Jake Morrison', username: 'jakemgolf', avatar: avatars[0],
    bio: 'Architecture nerd. 15 handicap chasing single digits. Always planning the next trip.',
    homeCity: 'Scottsdale, AZ', handicapRange: '12-18', preferredTypes: ['public', 'resort'],
    playedCount: 87, savedCount: 45, followersCount: 234, followingCount: 189, topCourses: ['5', '9', '3']
  },
  {
    id: 'u2', name: 'Sarah Chen', username: 'sarahplays18', avatar: avatars[1],
    bio: 'Golf travel addict. Coore & Crenshaw fanatic. Sunset golf or nothing.',
    homeCity: 'San Diego, CA', handicapRange: '8-12', preferredTypes: ['resort', 'public'],
    playedCount: 124, savedCount: 67, followersCount: 456, followingCount: 312, topCourses: ['9', '11', '5']
  },
  {
    id: 'u3', name: 'Marcus Williams', username: 'marcusonthegreen', avatar: avatars[2],
    bio: 'Weekend warrior. Public golf champion. Best courses don\'t need a membership.',
    homeCity: 'Los Angeles, CA', handicapRange: '18-25', preferredTypes: ['public', 'municipal'],
    playedCount: 52, savedCount: 28, followersCount: 167, followingCount: 145, topCourses: ['12', '2', '6']
  },
  {
    id: 'u4', name: 'Emily Park', username: 'emilyparks', avatar: avatars[3],
    bio: 'Golf course photographer. Chasing the most scenic rounds in America.',
    homeCity: 'Portland, OR', handicapRange: '15-20', preferredTypes: ['resort', 'public'],
    playedCount: 98, savedCount: 52, followersCount: 892, followingCount: 234, topCourses: ['9', '5', '11']
  },
  {
    id: 'u5', name: 'Tom Bradley', username: 'tombradleygolf', avatar: avatars[4],
    bio: 'Former D1 golfer. Now I just enjoy the walk. Pinehurst is home.',
    homeCity: 'Raleigh, NC', handicapRange: '0-5', preferredTypes: ['resort', 'private'],
    playedCount: 215, savedCount: 34, followersCount: 567, followingCount: 198, topCourses: ['3', '7', '9']
  },
];

export const reviews: Review[] = [
  {
    id: 'r1', userId: 'u1', courseId: '1', headline: 'Lives up to the hype',
    body: 'The Stadium Course is everything you\'d expect. The par-3 16th is electric even without the crowds. Conditioning was immaculate.',
    pros: ['Incredible conditioning', 'Iconic holes', 'Great practice facilities'], cons: ['Expensive', 'Can be slow on weekends'],
    bestForTags: ['bucket-list', 'golf-trip'], worthThePrice: true, wouldPlayAgain: true,
    overallRating: 9.2, createdAt: '2024-03-15', likesCount: 45, commentsCount: 12
  },
  {
    id: 'r2', userId: 'u2', courseId: '5', headline: 'Pure golf magic',
    body: 'Bandon Dunes is why I play golf. The wind, the views, the simplicity. No carts, no pretension—just golf the way it should be.',
    pros: ['Stunning ocean views', 'Walking only', 'World-class links'], cons: ['Remote location', 'Weather can be brutal'],
    bestForTags: ['bucket-list', 'buddy-trip', 'links-lover'], worthThePrice: true, wouldPlayAgain: true,
    overallRating: 9.6, createdAt: '2024-02-28', likesCount: 89, commentsCount: 23
  },
  {
    id: 'r3', userId: 'u3', courseId: '12', headline: 'Best $45 in golf',
    body: 'Gil Hanse designed a course that rivals anything at 10x the price. Rustic Canyon is proof that great golf doesn\'t need to be expensive.',
    pros: ['Unbeatable value', 'Creative design', 'Walkable'], cons: ['Conditioning varies', 'Minimal clubhouse'],
    bestForTags: ['value', 'everyday-play', 'walking'], worthThePrice: true, wouldPlayAgain: true,
    overallRating: 8.5, createdAt: '2024-03-01', likesCount: 67, commentsCount: 18
  },
  {
    id: 'r4', userId: 'u4', courseId: '9', headline: 'The most beautiful course I\'ve ever seen',
    body: 'Cabot Cliffs is a photography dream. Every hole is a postcard. The par-3 16th might be the most stunning hole in golf.',
    pros: ['Jaw-dropping scenery', 'Perfect routing', 'Unforgettable experience'], cons: ['Hard to get a tee time', 'Travel logistics'],
    bestForTags: ['bucket-list', 'scenic', 'once-in-a-lifetime'], worthThePrice: true, wouldPlayAgain: true,
    overallRating: 9.7, createdAt: '2024-01-20', likesCount: 134, commentsCount: 31
  },
  {
    id: 'r5', userId: 'u5', courseId: '3', headline: 'Ross\'s masterpiece never gets old',
    body: 'I\'ve played No. 2 fifty times and find something new every round. The restored natural areas make it even better than before.',
    pros: ['Historic significance', 'Strategic depth', 'Outstanding greens'], cons: ['Price tag', 'Can be punishing'],
    bestForTags: ['bucket-list', 'architecture', 'historic'], worthThePrice: true, wouldPlayAgain: true,
    overallRating: 9.5, createdAt: '2024-03-10', likesCount: 78, commentsCount: 15
  },
  {
    id: 'r6', userId: 'u1', courseId: '8', headline: 'Desert golf perfection',
    body: 'We-Ko-Pa Saguaro is the best public course in Arizona for my money. The mountain backdrop is unreal and the routing is genius.',
    pros: ['Incredible scenery', 'Great value', 'C&C design'], cons: ['Summer heat', 'No walking encouraged'],
    bestForTags: ['desert', 'value', 'scenic'], worthThePrice: true, wouldPlayAgain: true,
    overallRating: 8.9, createdAt: '2024-02-15', likesCount: 34, commentsCount: 8
  },
  {
    id: 'r7', userId: 'u2', courseId: '11', headline: 'Doak\'s greatest creation',
    body: 'Pacific Dunes edges out Bandon Dunes for me. The ocean holes are transcendent and the green complexes are endlessly fascinating.',
    pros: ['Ocean holes', 'Strategic design', 'Walking pace'], cons: ['Wind can be extreme', 'Premium price'],
    bestForTags: ['bucket-list', 'links-lover', 'architecture'], worthThePrice: true, wouldPlayAgain: true,
    overallRating: 9.7, createdAt: '2024-03-05', likesCount: 92, commentsCount: 19
  },
  {
    id: 'r8', userId: 'u3', courseId: '6', headline: 'Warning: this course is hard',
    body: 'The sign at the first tee isn\'t kidding. But at $75 for a championship course, Bethpage Black is the best deal in serious golf.',
    pros: ['Incredible value', 'Championship layout', 'Bragging rights'], cons: ['6+ hour rounds', 'Rough rough', 'Basic amenities'],
    bestForTags: ['value', 'challenging', 'bucket-list'], worthThePrice: true, wouldPlayAgain: true,
    overallRating: 8.8, createdAt: '2024-02-20', likesCount: 56, commentsCount: 22
  },
];

export const sampleLists: CourseList[] = [
  { id: 'l1', userId: 'u1', title: 'Scottsdale Trip 2024', description: 'Must-plays for our March trip', courseIds: ['1', '8'], isPublic: true, createdAt: '2024-01-15' },
  { id: 'l2', userId: 'u2', title: 'Best Ocean Golf', description: 'Courses with the best ocean views', courseIds: ['2', '5', '7', '9', '11'], isPublic: true, createdAt: '2024-02-01' },
  { id: 'l3', userId: 'u3', title: 'Best Public Under $100', description: 'Top public courses that won\'t break the bank', courseIds: ['6', '8', '12', '14'], isPublic: true, createdAt: '2024-01-20' },
  { id: 'l4', userId: 'u4', title: 'Most Photogenic Courses', description: 'The most visually stunning courses in America', courseIds: ['9', '5', '7', '2', '15'], isPublic: true, createdAt: '2024-02-10' },
  { id: 'l5', userId: 'u5', title: 'Dream Buddy Trip', description: 'The ultimate multi-course trip itinerary', courseIds: ['5', '11', '10', '4'], isPublic: true, createdAt: '2024-03-01' },
];

export const collections = [
  { id: 'c1', title: 'Best Public Courses', subtitle: '15 courses', imageUrl: courseImages[5], courseIds: ['2', '6', '8', '12', '14'] },
  { id: 'c2', title: 'Hidden Gems', subtitle: '12 courses', imageUrl: courseImages[7], courseIds: ['4', '8', '12', '15'] },
  { id: 'c3', title: 'Bucket List Rounds', subtitle: '20 courses', imageUrl: courseImages[4], courseIds: ['3', '5', '7', '9', '11'] },
  { id: 'c4', title: 'Best Buddy Trips', subtitle: '10 destinations', imageUrl: courseImages[9], courseIds: ['4', '5', '10', '15'] },
  { id: 'c5', title: 'Scenic Stunners', subtitle: '18 courses', imageUrl: courseImages[10], courseIds: ['2', '5', '7', '9', '15'] },
];

export function calculateWeightedRating(ratings: CourseRatings): number {
  const weights = {
    layout: 0.15, conditioning: 0.12, greens: 0.12, scenery: 0.10,
    replayability: 0.12, value: 0.10, difficulty: 0.06, paceOfPlay: 0.06,
    practiceFacilities: 0.04, clubhouse: 0.04, foodDrinks: 0.03, overallVibe: 0.06,
  };
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (ratings[key as keyof CourseRatings] || 0) * weight;
  }
  return Math.round(total * 10) / 10;
}

export function getCourseById(id: string): Course | undefined {
  return courses.find(c => c.id === id);
}

export function getReviewsForCourse(courseId: string): Review[] {
  return reviews.filter(r => r.courseId === courseId);
}

export function getUserById(id: string): UserProfile | undefined {
  return users.find(u => u.id === id);
}

export function getReviewsByUser(userId: string): Review[] {
  return reviews.filter(r => r.userId === userId);
}

export function getListsByUser(userId: string): CourseList[] {
  return sampleLists.filter(l => l.userId === userId);
}
