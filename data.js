/* ============================================================
   BANANA MUSIC — MOCK DATA LAYER
   Structured as resource collections so this file is a drop-in
   swap for real API calls later (see api.js for the seam).
   ============================================================ */

const COVER_PALETTE = ["#F4C430", "#E4572E", "#5B8266", "#2E4C3A", "#C9A227", "#8C5E3C", "#3E6259", "#D97A3D"];

function coverFor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COVER_PALETTE[h % COVER_PALETTE.length];
}

const ARTISTS = [
  { id: "ar1", name: "Tame Impala", bio: "Psychedelic solo project of Kevin Parker.", followers: 812000 },
  { id: "ar2", name: "Arctic Monkeys", bio: "Sheffield rock band, four albums deep into reinvention.", followers: 1240000 },
  { id: "ar3", name: "Frank Ocean", bio: "R&B auteur, notoriously unhurried.", followers: 980000 },
  { id: "ar4", name: "The Weeknd", bio: "Toronto's king of nocturnal pop.", followers: 1510000 },
  { id: "ar5", name: "Radiohead", bio: "Oxford five-piece, permanent state of reinvention.", followers: 1330000 },
];

const ALBUMS = [
  { id: "al1", title: "Currents", artistId: "ar1", year: 2015, genre: "Psychedelic Pop", rating: 4.8,
    description: "A breakup record disguised as a dance record — synths where guitars used to be.",
    tracks: [
      { title: "Let It Happen", duration: 465 }, { title: "Nangs", duration: 82 },
      { title: "The Moment", duration: 205 }, { title: "Yes I'm Changing", duration: 245 },
      { title: "Eventually", duration: 315 }, { title: "The Less I Know The Better", duration: 219 },
      { title: "New Person, Same Old Mistakes", duration: 335 },
    ]},
  { id: "al2", title: "The Slow Rush", artistId: "ar1", year: 2020, genre: "Psychedelic Pop", rating: 4.3,
    description: "Time-obsessed and groove-heavy, Parker's most maximalist record.",
    tracks: [ { title: "One More Year", duration: 267 }, { title: "Instant Destiny", duration: 217 }, { title: "Borderline", duration: 275 } ]},
  { id: "al3", title: "AM", artistId: "ar2", year: 2013, genre: "Rock", rating: 4.9,
    description: "Late-night riffs and falsetto hooks — the album that took the band arena-sized.",
    tracks: [ { title: "Do I Wanna Know?", duration: 272 }, { title: "R U Mine?", duration: 201 }, { title: "Arabella", duration: 207 }, { title: "505", duration: 253 } ]},
  { id: "al4", title: "Tranquility Base Hotel & Casino", artistId: "ar2", year: 2018, genre: "Lounge Rock", rating: 3.9,
    description: "A lounge-piano concept record about a hotel on the moon.", tracks: [ { title: "Four Out of Five", duration: 296 }, { title: "Star Treatment", duration: 226 } ]},
  { id: "al5", title: "Blonde", artistId: "ar3", year: 2016, genre: "R&B", rating: 4.9,
    description: "Diffuse, elliptical, and endlessly rewarding — a record that feels like a memory.",
    tracks: [ { title: "Nikes", duration: 314 }, { title: "Ivy", duration: 249 }, { title: "Pink + White", duration: 183 }, { title: "Self Control", duration: 249 }, { title: "Nights", duration: 307 } ]},
  { id: "al6", title: "channel ORANGE", artistId: "ar3", year: 2012, genre: "R&B", rating: 4.7,
    description: "A concept record about wealth, boredom, and unrequited love.", tracks: [ { title: "Thinkin Bout You", duration: 200 }, { title: "Pyramids", duration: 599 } ]},
  { id: "al7", title: "After Hours", artistId: "ar4", year: 2020, genre: "Synth-Pop", rating: 4.6,
    description: "Neon-lit, 80s-indebted, and obsessed with its own downfall.",
    tracks: [ { title: "Blinding Lights", duration: 200 }, { title: "Save Your Tears", duration: 215 }, { title: "In Your Eyes", duration: 237 } ]},
  { id: "al8", title: "Dawn FM", artistId: "ar4", year: 2022, genre: "Synth-Pop", rating: 4.4,
    description: "A concept record framed as a radio station on the way to the afterlife.", tracks: [ { title: "Gasoline", duration: 191 }, { title: "Take My Breath", duration: 331 } ]},
  { id: "al9", title: "In Rainbows", artistId: "ar5", year: 2007, genre: "Alternative", rating: 4.9,
    description: "Warm, textured, and famously pay-what-you-want on release.",
    tracks: [ { title: "15 Step", duration: 237 }, { title: "Bodysnatchers", duration: 242 }, { title: "Nude", duration: 254 }, { title: "Weird Fishes/Arpeggi", duration: 318 } ]},
  { id: "al10", title: "OK Computer", artistId: "ar5", year: 1997, genre: "Alternative", rating: 5.0,
    description: "The paranoid, prophetic record that rewrote what a rock album could sound like.", tracks: [ { title: "Airbag", duration: 284 }, { title: "Paranoid Android", duration: 383 }, { title: "Karma Police", duration: 261 } ]},
];

// flatten songs from albums, tagging each with album + artist + a stable id
const SONGS = [];
ALBUMS.forEach(al => {
  al.tracks.forEach((t, i) => {
    SONGS.push({
      id: `${al.id}-t${i}`, title: t.title, duration: t.duration,
      albumId: al.id, artistId: al.artistId, trackNumber: i + 1,
    });
  });
});
function songArtist(s) { return ARTISTS.find(a => a.id === s.artistId); }
function songAlbum(s) { return ALBUMS.find(a => a.id === s.albumId); }

const USERS = [
  { id: "u0", username: "you", name: "Alex Rivera", bio: "Collecting basslines and rainy-day playlists.", followers: 214, following: 88, isFollowing: false, isSelf: true },
  { id: "u1", username: "alexmusic", name: "Alex Chen", bio: "Vinyl only. Fighting the algorithm one crate at a time.", followers: 3402, following: 190, isFollowing: true },
  { id: "u2", username: "jessica", name: "Jessica Ward", bio: "Music writer. Currently obsessed with everything from 2016.", followers: 9120, following: 340, isFollowing: true },
  { id: "u3", username: "josh", name: "Josh Kim", bio: "Bass player. Bad taste in everything except music.", followers: 512, following: 220, isFollowing: false },
  { id: "u4", username: "musiclover23", name: "Priya N.", bio: "Making a playlist for every mood I've ever had.", followers: 1204, following: 402, isFollowing: false },
  { id: "u5", username: "vinyladdict", name: "Sam Torres", bio: "If it's not on wax I probably haven't heard it.", followers: 2870, following: 156, isFollowing: true },
  { id: "u6", username: "psychedelicpop", name: "Nina Osei", bio: "Tame Impala apologist. Send me your favorite deep cuts.", followers: 640, following: 310, isFollowing: false },
  { id: "u7", username: "lowkeydj", name: "Marcus Bell", bio: "DJ on weekends, spreadsheet person on weekdays.", followers: 4110, following: 90, isFollowing: false },
  { id: "u8", username: "reverbqueen", name: "Elena Petrova", bio: "Shoegaze survivor. My ears ring for a living.", followers: 780, following: 145, isFollowing: true },
  { id: "u9", username: "midnightradio", name: "Theo Brandt", bio: "Late-night listening notes, posted too often.", followers: 1998, following: 267, isFollowing: false },
];
function userBy(id) { return USERS.find(u => u.id === id); }

const PLAYLISTS = [
  { id: "pl1", name: "Late Night Drives", emoji: "🎧", description: "For empty highways and full tanks.", ownerId: "u0", isPublic: true,  songIds: ["al1-t0","al7-t0","al9-t2","al5-t4"] },
  { id: "pl2", name: "Rainy Day", emoji: "🌧", description: "Grey skies, soft synths.", ownerId: "u0", isPublic: true,  songIds: ["al5-t0","al9-t1","al6-t0"] },
  { id: "pl3", name: "Favorite Albums", emoji: "💚", description: "The ones I never skip.", ownerId: "u0", isPublic: false, songIds: ["al10-t1","al3-t0","al5-t1"] },
  { id: "pl4", name: "Gym", emoji: "🏋️", description: "Loud enough to drown out the treadmill.", ownerId: "u0", isPublic: true,  songIds: ["al3-t1","al7-t1","al2-t0"] },
  { id: "pl5", name: "Songs That Hurt", emoji: "💔", description: "Handle with care.", ownerId: "u0", isPublic: false, songIds: ["al5-t2","al1-t4","al9-t3"] },
  { id: "pl6", name: "New Music Friday", emoji: "🆕", description: "Curated weekly by the Banana Music team.", ownerId: "u2", isPublic: true,  songIds: ["al8-t0","al4-t0","al2-t1"] },
];

function timeAgo(mins) {
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
  return `${Math.floor(mins/1440)}d ago`;
}

const POSTS = [
  { id: "p1", userId: "u1", minsAgo: 118, content: "This album somehow gets better every time I listen to it.", attachment: { type: "album", id: "al1" }, likes: 142, comments: [{userId:"u2", text:"Track 4 is unreal."}], liked: false, saved: false, sponsored: false },
  { id: "p2", userId: "u2", minsAgo: 40, content: "I finally listened to Blonde. Where has this been my whole life.", attachment: { type: "album", id: "al5" }, likes: 289, comments: [], liked: true, saved: true, sponsored: false },
  { id: "p3", userId: "u3", minsAgo: 12, content: "Currently listening — The Less I Know The Better never misses.", attachment: { type: "song", id: "al1-t5" }, likes: 34, comments: [], liked: false, saved: false, sponsored: false },
  { id: "sp1", userId: "u9", minsAgo: 90, content: "Discover your next favorite sound.", attachment: { type: "album", id: "al8" }, likes: 12, comments: [], liked: false, saved: false, sponsored: true },
  { id: "p4", userId: "u4", minsAgo: 200, content: "What's everybody listening to today? Need something new.", attachment: null, likes: 21, comments: [{userId:"u5", text:"In Rainbows, always."}], liked: false, saved: false, sponsored: false },
  { id: "p5", userId: "u5", minsAgo: 300, content: "This song has been stuck in my head for three days and I'm not mad about it.", attachment: { type: "song", id: "al3-t3" }, likes: 88, comments: [], liked: false, saved: false, sponsored: false },
  { id: "p6", userId: "u6", minsAgo: 520, content: "Rate my top 5 albums, be honest.", attachment: { type: "playlist", id: "pl3" }, likes: 56, comments: [{userId:"u7", text:"No Radiohead? We need to talk."}], liked: false, saved: false, sponsored: false },
  { id: "p7", userId: "u7", minsAgo: 650, content: "This album is criminally underrated. Fight me.", attachment: { type: "album", id: "al4" }, likes: 19, comments: [], liked: false, saved: false, sponsored: false },
  { id: "p8", userId: "u8", minsAgo: 800, content: "Made a playlist for the drive home. Sharing it below.", attachment: { type: "playlist", id: "pl1" }, likes: 41, comments: [], liked: false, saved: false, sponsored: false },
  { id: "p9", userId: "u9", minsAgo: 960, content: "The production on this record still doesn't sound like anything else from that year.", attachment: { type: "album", id: "al10" }, likes: 176, comments: [], liked: false, saved: false, sponsored: false },
  { id: "p10", userId: "u1", minsAgo: 1200, content: "Currents at 3am hits different, that's just facts.", attachment: { type: "album", id: "al1" }, likes: 63, comments: [], liked: false, saved: false, sponsored: false },
  { id: "p11", userId: "u2", minsAgo: 1400, content: "New review is up — full breakdown of channel ORANGE.", attachment: { type: "album", id: "al6" }, likes: 97, comments: [], liked: false, saved: false, sponsored: false },
  { id: "sp2", userId: "u1", minsAgo: 1500, content: "Your next favorite artist is one search away.", attachment: { type: "artist", id: "ar4" }, likes: 8, comments: [], liked: false, saved: false, sponsored: true },
  { id: "p12", userId: "u5", minsAgo: 1600, content: "Anyone else think Tranquility Base is aging better than people expected?", attachment: { type: "album", id: "al4" }, likes: 30, comments: [], liked: false, saved: false, sponsored: false },
  { id: "p13", userId: "u6", minsAgo: 1800, content: "505 came on shuffle and now I have to hear the whole album.", attachment: { type: "song", id: "al3-t3" }, likes: 45, comments: [], liked: false, saved: false, sponsored: false },
  { id: "p14", userId: "u8", minsAgo: 2000, content: "Cold take: Dawn FM is a better front-to-back listen than After Hours.", attachment: { type: "album", id: "al8" }, likes: 27, comments: [{userId:"u9", text:"Unpopular but I respect it."}], liked: false, saved: false, sponsored: false },
  { id: "p15", userId: "u9", minsAgo: 2200, content: "In Rainbows was pay-what-you-want and I still think about that pricing model.", attachment: { type: "album", id: "al9" }, likes: 112, comments: [], liked: false, saved: false, sponsored: false },
];

const REVIEWS = [
  { id: "rv1", userId: "u2", albumId: "al5", rating: 9.5, text: "This album feels like a memory. Every track has something different going on.", likes: 210, liked: false },
  { id: "rv2", userId: "u1", albumId: "al1", rating: 9.0, text: "The production on track 4 is insane. A total left turn that somehow works.", likes: 154, liked: false },
  { id: "rv3", userId: "u5", albumId: "al10", rating: 10.0, text: "Every listen finds something new. Still the reference point twenty-five years later.", likes: 301, liked: true },
  { id: "rv4", userId: "u6", albumId: "al3", rating: 9.2, text: "The riffs are simple but the swagger is not. A late-night classic.", likes: 88, liked: false },
  { id: "rv5", userId: "u9", albumId: "al9", rating: 9.4, text: "Warmer than anything else in their catalog. Nude alone is worth the price.", likes: 133, liked: false },
  { id: "rv6", userId: "u4", albumId: "al7", rating: 8.8, text: "Neon-soaked and relentless. A pop record with real teeth.", likes: 67, liked: false },
  { id: "rv7", userId: "u3", albumId: "al6", rating: 9.3, text: "Pyramids is ten minutes long and somehow still not long enough.", likes: 145, liked: false },
  { id: "rv8", userId: "u8", albumId: "al4", rating: 7.5, text: "Divisive on release, but the lounge-piano concept has aged into something charming.", likes: 39, liked: false },
  { id: "rv9", userId: "u7", albumId: "al2", rating: 8.0, text: "Sprawling and a little indulgent, but the grooves carry it.", likes: 52, liked: false },
  { id: "rv10", userId: "u1", albumId: "al8", rating: 8.6, text: "The radio-station framing gives the whole thing a shape most pop albums skip.", likes: 61, liked: false },
];

const NOTIFICATIONS = [
  { id: "n1", type: "like", text: "@alexmusic liked your post.", minsAgo: 5 },
  { id: "n2", type: "comment", text: "@jessica commented on your review.", minsAgo: 40 },
  { id: "n3", type: "follow", text: "@musiclover23 started following you.", minsAgo: 120 },
  { id: "n4", type: "listen", text: "@josh is listening to the same song as you.", minsAgo: 200 },
  { id: "n5", type: "like", text: "@vinyladdict liked your review of Blonde.", minsAgo: 400 },
];

const LISTENING_HISTORY = [
  { songId: "al1-t5", minsAgo: 30 }, { songId: "al5-t0", minsAgo: 95 }, { songId: "al3-t0", minsAgo: 200 },
  { songId: "al9-t2", minsAgo: 260 }, { songId: "al7-t0", minsAgo: 400 }, { songId: "al10-t1", minsAgo: 900 },
];

const FRIEND_ACTIVITY = [
  { userId: "u3", songId: "al3-t3" },
  { userId: "u1", songId: "al1-t0" },
  { userId: "u5", songId: "al9-t2" },
];

const MOCK_LYRICS = [
  "The city lights are low tonight",
  "and everything I meant to say",
  "keeps slipping out in shades of blue",
  "like static caught between the waves",
  "I used to think that I knew better",
  "now I'm not so sure at all",
  "but something in this melody",
  "still catches me before I fall",
  "so play it one more time for me",
  "before the room forgets the sound",
];

const ACTIVITY_LOG = [
  { text: "You listened to Currents", minsAgo: 30 },
  { text: "You followed @alexmusic", minsAgo: 1440 },
  { text: 'You created "Late Night Drives"', minsAgo: 2880 },
  { text: "You liked a post from @jessica", minsAgo: 40 },
  { text: "You reviewed Blonde", minsAgo: 5760 },
];

/* ============================================================
   IMAGE SYSTEM (centralized, currently empty)
   Real photographs of real people can't be attached to these
   fictional accounts, and copyrighted press/album art can't be
   reproduced here — so every `avatar` / `image` / `cover` field
   below is intentionally blank. The rendering layer (see
   avatarEl / artEl in app.js) always tries the URL first via
   <img onerror=...> and falls back to a generated CSS mark.
   Drop a licensed URL into any field below and it will render.
   ============================================================ */
USERS.forEach(u => { u.avatar = u.avatar || ""; });
ARTISTS.forEach(a => { a.image = a.image || ""; a.banner = a.banner || ""; });
ALBUMS.forEach(a => { a.cover = a.cover || ""; });

/* ---------------- profile extras (location / website / privacy) ---------------- */
const USER_EXTRA = {
  u0: { location: "Austin, TX", website: "banana.fm/you", isPrivate: false },
  u1: { location: "Portland, OR", website: "alexspins.vinyl", isPrivate: false },
  u2: { location: "Brooklyn, NY", website: "jessicawrites.music", isPrivate: false },
  u3: { location: "Seattle, WA", website: "", isPrivate: false },
  u4: { location: "Chicago, IL", website: "", isPrivate: true },
  u5: { location: "Denver, CO", website: "vinyladdict.club", isPrivate: false },
  u6: { location: "Los Angeles, CA", website: "", isPrivate: false },
  u7: { location: "Miami, FL", website: "lowkeydj.mix", isPrivate: true },
  u8: { location: "Toronto, ON", website: "", isPrivate: false },
  u9: { location: "London, UK", website: "midnightradio.fm", isPrivate: false },
};
USERS.forEach(u => Object.assign(u, USER_EXTRA[u.id]));

/* ---------------- follow graph (drives followers/following lists) ---------------- */
const FOLLOW_EDGES = [
  ["u0","u1"], ["u0","u2"], ["u0","u5"], ["u0","u8"],
  ["u3","u0"], ["u5","u0"], ["u8","u0"], ["u9","u0"],
  ["u1","u2"], ["u1","u3"], ["u1","u6"],
  ["u2","u1"], ["u2","u4"], ["u2","u7"],
  ["u3","u1"], ["u3","u5"],
  ["u4","u2"], ["u4","u8"],
  ["u5","u6"], ["u5","u9"],
  ["u6","u2"], ["u6","u3"],
  ["u7","u1"], ["u7","u9"],
  ["u8","u4"],
  ["u9","u5"], ["u9","u7"],
];
function isFollowingUser(targetId) { return FOLLOW_EDGES.some(([f,t]) => f === "u0" && t === targetId); }
function followersOf(userId) { return FOLLOW_EDGES.filter(([,t]) => t === userId).map(([f]) => userBy(f)).filter(Boolean); }
function followingOf(userId) { return FOLLOW_EDGES.filter(([f]) => f === userId).map(([,t]) => userBy(t)).filter(Boolean); }
function toggleFollowUser(targetId) {
  const idx = FOLLOW_EDGES.findIndex(([f,t]) => f === "u0" && t === targetId);
  const target = userBy(targetId), me = userBy("u0");
  if (idx >= 0) { FOLLOW_EDGES.splice(idx, 1); target.followers -= 1; me.following -= 1; return false; }
  FOLLOW_EDGES.push(["u0", targetId]); target.followers += 1; me.following += 1; return true;
}

/* ---------------- settings (frontend-only mock state) ---------------- */
const SETTINGS = {
  theme: "dark",
  showListeningActivity: true,
  privateProfile: false,
  showPlaylists: true,
  notifLikes: true,
  notifComments: true,
  notifFollowers: true,
  notifRecommendations: false,
  autoplay: true,
  audioQuality: "high",
};

/* ---------------- feed post types ---------------- */
const POST_TYPE_META = {
  text: { label: "" },
  listening: { label: "Currently Listening" },
  review: { label: "Album Review" },
  playlist: { label: "New Playlist" },
  question: { label: "Music Question" },
  recommendation: { label: "Recommendation" },
};
POSTS.forEach(p => { if (!p.type) p.type = p.sponsored ? "text" : "text"; });
// tag a few existing posts with richer types
(() => { const byId = id => POSTS.find(p => p.id === id);
  if (byId("p3")) byId("p3").type = "listening";
  if (byId("p6")) byId("p6").type = "question";
  if (byId("p11")) byId("p11").type = "review";
  if (byId("p4")) byId("p4").type = "question";
})();
// add a couple of fresh posts to round out the type variety
POSTS.push(
  { id: "p16", userId: "u8", minsAgo: 6, content: 'created a new playlist.', attachment: { type: "playlist", id: "pl1" }, likes: 14, comments: [], liked: false, saved: false, sponsored: false, type: "playlist" },
  { id: "p17", userId: "u9", minsAgo: 22, content: "If you like Arctic Monkeys, you should really sit with Tranquility Base front to back.", attachment: { type: "album", id: "al4" }, likes: 37, comments: [], liked: false, saved: false, sponsored: false, type: "recommendation" },
  { id: "p18", userId: "u1", minsAgo: 3, content: "reviewed Currents.", attachment: { type: "album", id: "al1" }, rating: 9.2, likes: 22, comments: [], liked: false, saved: false, sponsored: false, type: "review" },
);
