/* ============================================================
   BANANA MUSIC — APP LOGIC
   Vanilla JS, no framework. State lives in `state`; every mock
   collection from data.js stands in for a future API resource.
   ============================================================ */

const state = {
  authed: false,
  page: "home",              // home | search | library | profile | album | user | playlist
  viewingUserId: "u0",
  viewingAlbumId: null,
  viewingPlaylistId: null,
  searchQuery: "",
  searchTab: "all",
  libraryTab: "playlists",
  profileTab: "posts",
  player: {
    queue: [],
    index: 0,
    playing: false,
    elapsed: 0,
    volume: 70,
    expanded: false,
    showLyrics: false,
  },
  composerOpen: false,
  composerAttachment: null,
  notifOpen: false,
};

let playerTick = null;

/* ---------------- helpers ---------------- */
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return [...root.querySelectorAll(sel)]; }
function fmtTime(s) { s = Math.max(0, Math.round(s)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; }
function fmtNum(n) { return n >= 1000 ? `${(n/1000).toFixed(1).replace(/\.0$/,"")}K` : String(n); }
function initials(name) { return name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase(); }
function esc(str) { const d = document.createElement("div"); d.textContent = str; return d.innerHTML; }

function avatarEl(user, size = 36) {
  const bg = coverFor(user.username);
  return `<span class="avatar" style="--sz:${size}px;background:${bg}">${initials(user.name)}</span>`;
}
function artEl(seed, size, iconSize = "1.4rem") {
  const sz = typeof size === "number" ? `${size}px` : size;
  const aspect = typeof size !== "number" ? "aspect-ratio:1;" : "";
  return `<span class="art" style="--sz:${sz};${aspect}background:${coverFor(seed)}"><svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg></span>`;
}

function toast(msg) {
  const host = $("#toast-host");
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  host.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 250); }, 2400);
}

/* ---------------- auth ---------------- */
function showAuthScreen(name) {
  $all(".auth-screen").forEach(s => s.classList.remove("active"));
  $(`#screen-${name}`).classList.add("active");
}

function doLogin(e) {
  e.preventDefault();
  const email = $("#login-email").value.trim();
  const pass = $("#login-password").value;
  const errEl = $("#login-error");
  if (!email || !pass) {
    errEl.textContent = "Enter your email and password to continue.";
    errEl.classList.add("show");
    return;
  }
  if (pass.length < 4) {
    errEl.textContent = "That password doesn't look right. Try demo@banana.fm / demo1234.";
    errEl.classList.add("show");
    return;
  }
  errEl.classList.remove("show");
  enterApp();
}

function doSignup(e) {
  e.preventDefault();
  const username = $("#signup-username").value.trim();
  const email = $("#signup-email").value.trim();
  const pass = $("#signup-password").value;
  const confirm = $("#signup-confirm").value;
  const errEl = $("#signup-error");
  if (!username || !email || !pass) { errEl.textContent = "Fill in every field to create your account."; errEl.classList.add("show"); return; }
  if (pass !== confirm) { errEl.textContent = "Passwords don't match."; errEl.classList.add("show"); return; }
  errEl.classList.remove("show");
  USERS[0].username = username.toLowerCase().replace(/\s+/g, "");
  USERS[0].name = username;
  enterApp();
  toast(`Welcome to Banana Music, ${username}!`);
}

function enterApp() {
  state.authed = true;
  $("#auth-root").classList.remove("active");
  $("#app-root").classList.add("active");
  navigate("home");
  renderNotifBell();
}

function logout() {
  state.authed = false;
  $("#app-root").classList.remove("active");
  $("#auth-root").classList.add("active");
  showAuthScreen("start");
}

/* ---------------- navigation ---------------- */
function navigate(page, opts = {}) {
  state.page = page;
  if (opts.userId) state.viewingUserId = opts.userId;
  if (opts.albumId) state.viewingAlbumId = opts.albumId;
  if (opts.playlistId) state.viewingPlaylistId = opts.playlistId;
  closeComposer();
  render();
  $("#main-scroll").scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/* ---------------- render root ---------------- */
function render() {
  $all(".nav-item[data-page]").forEach(el => el.classList.toggle("active", el.dataset.page === state.page));
  const main = $("#main-scroll");
  const pages = { home: renderHome, search: renderSearch, library: renderLibrary, profile: renderProfile, album: renderAlbum, user: renderUserProfile, playlist: renderPlaylist };
  main.innerHTML = (pages[state.page] || renderHome)();
  renderPlayerBar();
  renderSidebarPlaylists();
}

function renderSidebarPlaylists() {
  const host = $("#sidebar-playlists");
  if (!host) return;
  const mine = PLAYLISTS.filter(p => p.ownerId === "u0").slice(0, 5);
  host.innerHTML = mine.map(pl => `<button class="sidebar-playlist-item" data-goto-playlist="${pl.id}"><span class="ico">${icon(playlistIconFor(pl))}</span>${esc(pl.name)}</button>`).join("");
}

/* ---------------- HOME ---------------- */
function recentlyPlayedRow() {
  const items = LISTENING_HISTORY.map(h => SONGS.find(s => s.id === h.songId)).filter(Boolean);
  return musicRow("Recently Played", items.map(songCard));
}
function madeForYouRow() {
  const picks = [SONGS.find(s=>s.id==="al2-t2"), SONGS.find(s=>s.id==="al6-t0"), SONGS.find(s=>s.id==="al9-t0"), SONGS.find(s=>s.id==="al4-t1")].filter(Boolean);
  return musicRow("Made For You", picks.map(songCard));
}
function trendingRow() {
  const picks = [SONGS.find(s=>s.id==="al7-t0"), SONGS.find(s=>s.id==="al3-t3"), SONGS.find(s=>s.id==="al8-t0"), SONGS.find(s=>s.id==="al1-t5")].filter(Boolean);
  return musicRow("Trending Now", picks.map(songCard));
}
function musicRow(title, cardsHtml) {
  return `<section class="row">
    <h2 class="row-title">${title}</h2>
    <div class="row-scroll">${cardsHtml.join("")}</div>
  </section>`;
}
function songCard(song) {
  const artist = songArtist(song);
  return `<div class="mcard" data-play-song="${song.id}">
    <div class="mcard-art">${artEl(song.albumId, 148)}
      <button class="mcard-play" data-play-song="${song.id}" aria-label="Play ${esc(song.title)}">${icon("play")}</button>
    </div>
    <div class="mcard-title">${esc(song.title)}</div>
    <div class="mcard-sub">${esc(artist.name)}</div>
  </div>`;
}
function friendActivityRow() {
  const items = FRIEND_ACTIVITY.map(f => {
    const u = userBy(f.userId), s = SONGS.find(x=>x.id===f.songId), ar = songArtist(s);
    return `<div class="friend-listen" data-goto-user="${u.id}">
      ${avatarEl(u, 40)}
      <div class="friend-listen-text"><strong>@${u.username}</strong> is listening to<br><span class="dim">${esc(s.title)} — ${esc(ar.name)}</span></div>
      <span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>
    </div>`;
  }).join("");
  return `<section class="row"><h2 class="row-title">People You Follow Are Listening To</h2><div class="friend-list">${items}</div></section>`;
}

function composerCard() {
  const attach = state.composerAttachment;
  const attachPreview = attach ? attachmentPreview(attach, true) : "";
  return `<section class="composer ${state.composerOpen ? "open" : ""}">
    ${!state.composerOpen ? `
      <button class="composer-collapsed" id="composer-open-btn">
        ${avatarEl(userBy("u0"), 38)}
        <span>Share your taste in music…</span>
      </button>` : `
      <div class="composer-open">
        <div class="composer-head">${avatarEl(userBy("u0"), 38)}<strong>${esc(userBy("u0").name)}</strong></div>
        <textarea id="composer-text" placeholder="I've been listening to this album nonstop lately…" rows="3"></textarea>
        ${attachPreview}
        <div class="composer-actions">
          <div class="composer-attach">
            <button data-attach="song"><span class="ico">${icon("lyrics")}</span> Song</button>
            <button data-attach="album"><span class="ico">${icon("disc")}</span> Album</button>
            <button data-attach="artist"><span class="ico">${icon("mic")}</span> Artist</button>
            <button data-attach="playlist"><span class="ico">${icon("library")}</span> Playlist</button>
          </div>
          <div class="composer-submit">
            <button class="btn-ghost" id="composer-cancel">Cancel</button>
            <button class="btn-yellow" id="composer-post">Post</button>
          </div>
        </div>
      </div>`}
  </section>`;
}

function attachmentPreview(attach, removable) {
  let html = "";
  if (attach.type === "album") { const al = ALBUMS.find(a=>a.id===attach.id); html = albumChip(al); }
  if (attach.type === "song") { const s = SONGS.find(x=>x.id===attach.id); html = songChip(s); }
  if (attach.type === "artist") { const ar = ARTISTS.find(a=>a.id===attach.id); html = artistChip(ar); }
  if (attach.type === "playlist") { const pl = PLAYLISTS.find(p=>p.id===attach.id); html = playlistChip(pl); }
  return `<div class="attach-preview">${html}${removable ? `<button id="composer-remove-attach" aria-label="Remove attachment">${icon("x")}</button>` : ""}</div>`;
}
function albumChip(al) { const ar = ARTISTS.find(a=>a.id===al.artistId); return `<div class="chip" data-goto-album="${al.id}">${artEl(al.id,44)}<div><strong>${esc(al.title)}</strong><span class="dim">${esc(ar.name)}</span></div></div>`; }
function songChip(s) { const ar = songArtist(s); return `<div class="chip" data-play-song="${s.id}">${artEl(s.albumId,44)}<div><strong>${esc(s.title)}</strong><span class="dim">${esc(ar.name)}</span></div></div>`; }
function artistChip(ar) { return `<div class="chip">${artEl(ar.id,44)}<div><strong>${esc(ar.name)}</strong><span class="dim">Artist</span></div></div>`; }
function playlistChip(pl) { return `<div class="chip" data-goto-playlist="${pl.id}"><span class="art" style="--sz:44px;background:${coverFor(pl.id)};">${icon(playlistIconFor(pl))}</span><div><strong>${esc(pl.name)}</strong><span class="dim">Playlist</span></div></div>`; }

function postCard(post) {
  const user = userBy(post.userId);
  let attachHtml = "";
  if (post.attachment) attachHtml = attachmentPreview(post.attachment, false);
  return `<article class="post ${post.sponsored ? "sponsored" : ""}" data-post="${post.id}">
    <div class="post-head">
      ${avatarEl(user, 40)}
      <div class="post-head-text">
        <div class="post-name"><span data-goto-user="${user.id}">${esc(user.name)}</span> ${post.sponsored ? '<span class="badge">Sponsored</span>' : ""}</div>
        <div class="post-meta">${post.sponsored ? "Promoted" : `@${user.username} · ${timeAgo(post.minsAgo)}`}</div>
      </div>
    </div>
    <p class="post-content">${esc(post.content)}</p>
    ${attachHtml}
    ${post.sponsored ? `<button class="btn-yellow full" data-play-attach="${post.attachment.type}:${post.attachment.id}">Listen Now</button>` : `
    <div class="post-actions">
      <button class="pa ${post.liked ? "active" : ""}" data-like="${post.id}">${icon("heart")} <span>${fmtNum(post.likes)}</span></button>
      <button class="pa" data-comment="${post.id}">${icon("comment")} <span>${post.comments.length}</span></button>
      <button class="pa" data-share="${post.id}">${icon("share")} <span>Share</span></button>
      <button class="pa ${post.saved ? "active" : ""}" data-save="${post.id}">${icon("bookmark")}</button>
    </div>
    <div class="post-comments" id="comments-${post.id}" hidden>
      ${post.comments.map(c => `<div class="comment">${avatarEl(userBy(c.userId),28)}<span><strong>@${userBy(c.userId).username}</strong> ${esc(c.text)}</span></div>`).join("")}
      <div class="comment-input"><input type="text" placeholder="Add a comment…" data-comment-input="${post.id}"><button data-comment-submit="${post.id}">Post</button></div>
    </div>`}
  </article>`;
}

function renderHome() {
  const me = userBy("u0");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const feedPosts = POSTS.map(postCard).join("");
  return `
    <div class="page page-home">
      <h1 class="greeting">${greeting}, ${esc(me.name.split(" ")[0])}.</h1>
      <p class="greeting-sub">What are you listening to?</p>
      ${recentlyPlayedRow()}
      ${madeForYouRow()}
      ${trendingRow()}
      ${friendActivityRow()}
      ${composerCard()}
      <div class="feed">${feedPosts}</div>
    </div>`;
}

/* ---------------- SEARCH ---------------- */
function renderSearch() {
  const q = state.searchQuery.trim().toLowerCase();
  const tabs = ["all","songs","albums","artists","users","playlists"];
  let results = { songs: [], albums: [], artists: [], users: [], playlists: [] };
  if (q) {
    results.songs = SONGS.filter(s => s.title.toLowerCase().includes(q)).slice(0,6);
    results.albums = ALBUMS.filter(a => a.title.toLowerCase().includes(q) || songArtist({artistId:a.artistId}).name.toLowerCase().includes(q)).slice(0,6);
    results.artists = ARTISTS.filter(a => a.name.toLowerCase().includes(q)).slice(0,6);
    results.users = USERS.filter(u => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)).slice(0,6);
    results.playlists = PLAYLISTS.filter(p => p.name.toLowerCase().includes(q)).slice(0,6);
  }
  const showSection = (key) => state.searchTab === "all" || state.searchTab === key;
  const noResults = q && Object.values(results).every(r => r.length === 0);

  return `
  <div class="page page-search">
    <h1 class="page-title">Search</h1>
    <div class="search-bar">
      ${icon("search")}
      <input id="search-input" type="text" placeholder="What do you want to listen to?" value="${esc(state.searchQuery)}" autofocus>
    </div>
    <div class="tabs">${tabs.map(t => `<button class="tab ${state.searchTab===t?"active":""}" data-search-tab="${t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join("")}</div>
    ${!q ? emptyState("banana", "Find something new.", "Search songs, albums, artists, or people to follow.") : ""}
    ${q && noResults ? emptyState("search", "No matches yet.", `Nothing turned up for “${esc(state.searchQuery)}.” Try a different spelling or artist name.`) : ""}
    ${q && !noResults ? `
      ${results.artists.length && showSection("artists") ? section("Artists", `<div class="grid-people">${results.artists.map(artistCard).join("")}</div>`) : ""}
      ${results.albums.length && showSection("albums") ? section("Albums", `<div class="row-scroll">${results.albums.map(albumCard).join("")}</div>`) : ""}
      ${results.songs.length && showSection("songs") ? section("Songs", `<div class="song-list">${results.songs.map((s,i)=>songRow(s,i+1)).join("")}</div>`) : ""}
      ${results.users.length && showSection("users") ? section("People", `<div class="grid-people">${results.users.map(userCard).join("")}</div>`) : ""}
      ${results.playlists.length && showSection("playlists") ? section("Playlists", `<div class="row-scroll">${results.playlists.map(playlistCard).join("")}</div>`) : ""}
    ` : ""}
  </div>`;
}
function section(title, html) { return `<section class="row"><h2 class="row-title">${title}</h2>${html}</section>`; }
function albumCard(al) {
  const ar = ARTISTS.find(a=>a.id===al.artistId);
  return `<div class="mcard" data-goto-album="${al.id}">
    <div class="mcard-art">${artEl(al.id,148)}<button class="mcard-play" data-play-attach="album:${al.id}" aria-label="Play ${esc(al.title)}">${icon("play")}</button></div>
    <div class="mcard-title">${esc(al.title)}</div><div class="mcard-sub">${esc(ar.name)}</div>
  </div>`;
}
function playlistCard(pl) {
  return `<div class="mcard" data-goto-playlist="${pl.id}">
    <div class="mcard-art"><span class="art" style="--sz:148px;background:${coverFor(pl.id)};">${icon(playlistIconFor(pl))}</span><button class="mcard-play" data-play-attach="playlist:${pl.id}" aria-label="Play ${esc(pl.name)}">${icon("play")}</button></div>
    <div class="mcard-title">${esc(pl.name)}</div><div class="mcard-sub">${pl.songIds.length} songs</div>
  </div>`;
}
function artistCard(ar) {
  return `<div class="person-card" data-goto-artist="${ar.id}">
    <span class="avatar round" style="--sz:88px;background:${coverFor(ar.id)}">${initials(ar.name)}</span>
    <strong>${esc(ar.name)}</strong><span class="dim">${fmtNum(ar.followers)} followers</span>
    <button class="btn-outline sm follow-btn" data-follow-artist="${ar.id}">Follow</button>
  </div>`;
}
function userCard(u) {
  return `<div class="person-card" data-goto-user="${u.id}">
    ${avatarEl(u, 88)}<strong>${esc(u.name)}</strong><span class="dim">@${u.username} · ${fmtNum(u.followers)} followers</span>
    <p class="person-bio">${esc(u.bio)}</p>
    <button class="btn-outline sm follow-btn ${u.isFollowing?"following":""}" data-follow-user="${u.id}">${u.isFollowing?"Following":"Follow"}</button>
  </div>`;
}
function songRow(s, num) {
  const ar = songArtist(s), al = songAlbum(s);
  return `<div class="song-row" data-play-song="${s.id}">
    <span class="song-num">${num}</span>
    ${artEl(s.albumId, 40)}
    <div class="song-row-title"><strong>${esc(s.title)}</strong><span class="dim">${esc(ar.name)}</span></div>
    <span class="dim song-row-album">${esc(al.title)}</span>
    <span class="dim">${fmtTime(s.duration)}</span>
    <button class="icon-btn" data-more="${s.id}">${icon("more")}</button>
  </div>`;
}

/* ---------------- LIBRARY ---------------- */
function renderLibrary() {
  const tabs = ["playlists","albums","songs","saved","recent"];
  const labels = { playlists:"Playlists", albums:"Albums", songs:"Songs", saved:"Saved", recent:"Recently Played" };
  let body = "";
  if (state.libraryTab === "playlists") {
    const mine = PLAYLISTS.filter(p => p.ownerId === "u0");
    body = mine.length ? `<div class="grid-cards">${mine.map(playlistTile).join("")}</div>` : emptyState("disc","No playlists yet.","Create one to start collecting your favorite songs.","+ New Playlist","open-playlist-modal-empty");
  } else if (state.libraryTab === "albums") {
    body = `<div class="grid-cards">${ALBUMS.slice(0,6).map(al => albumTile(al)).join("")}</div>`;
  } else if (state.libraryTab === "songs") {
    body = `<div class="song-list">${SONGS.slice(0,12).map((s,i)=>songRow(s,i+1)).join("")}</div>`;
  } else if (state.libraryTab === "saved") {
    const saved = POSTS.filter(p => p.saved);
    body = saved.length ? `<div class="feed">${saved.map(postCard).join("")}</div>` : emptyState("bookmark","Nothing saved yet.","Tap the save icon on a post to keep it here.");
  } else if (state.libraryTab === "recent") {
    body = `<div class="song-list">${LISTENING_HISTORY.map((h,i) => songRow(SONGS.find(s=>s.id===h.songId), i+1)).join("")}</div>`;
  }
  return `
  <div class="page page-library">
    <div class="page-title-row"><h1 class="page-title">Your Library</h1><button class="btn-yellow" id="open-playlist-modal">+ New Playlist</button></div>
    <div class="tabs">${tabs.map(t => `<button class="tab ${state.libraryTab===t?"active":""}" data-library-tab="${t}">${labels[t]}</button>`).join("")}</div>
    ${body}
  </div>`;
}
function playlistTile(pl) {
  return `<div class="tile" data-goto-playlist="${pl.id}">
    <span class="art" style="--sz:100%;aspect-ratio:1;background:${coverFor(pl.id)};">${icon(playlistIconFor(pl))}</span>
    <strong>${esc(pl.name)}</strong><span class="dim">${pl.isPublic ? "Public" : "Private"} · ${pl.songIds.length} songs</span>
  </div>`;
}
function albumTile(al) {
  const ar = ARTISTS.find(a=>a.id===al.artistId);
  return `<div class="tile" data-goto-album="${al.id}">${artEl(al.id, "100%")}<strong>${esc(al.title)}</strong><span class="dim">${esc(ar.name)}</span></div>`;
}

/* ---------------- PROFILE ---------------- */
function statBlock(label, value) { return `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`; }
function renderProfileFor(user, isSelf) {
  const tabs = ["posts","reviews","playlists","activity"];
  let body = "";
  if (state.profileTab === "posts") {
    const posts = POSTS.filter(p => p.userId === user.id);
    body = posts.length ? `<div class="feed">${posts.map(postCard).join("")}</div>` : emptyState("comment","No posts yet.","Posts about music will show up here.");
  } else if (state.profileTab === "reviews") {
    const reviews = REVIEWS.filter(r => r.userId === user.id);
    body = reviews.length ? reviews.map(reviewCard).join("") : emptyState("star","No reviews yet.","Album reviews will show up here.");
  } else if (state.profileTab === "playlists") {
    const pls = PLAYLISTS.filter(p => p.ownerId === user.id && (isSelf || p.isPublic));
    body = pls.length ? `<div class="grid-cards">${pls.map(playlistTile).join("")}</div>` : emptyState("disc","No playlists yet.","");
  } else if (state.profileTab === "activity") {
    body = isSelf ? `<div class="activity-list">${ACTIVITY_LOG.map(a => `<div class="activity-row">${icon("dot")}<span>${esc(a.text)}</span><span class="dim">${timeAgo(a.minsAgo)}</span></div>`).join("")}</div>` : emptyState("barChart","Activity is private.","");
  }
  return `
  <div class="page page-profile">
    <div class="profile-head">
      ${avatarEl(user, 96)}
      <div class="profile-head-info">
        <h1>${esc(user.name)}</h1><span class="dim">@${user.username}</span>
        <p class="person-bio">${esc(user.bio)}</p>
        <div class="profile-follow-counts">
          <span><strong>${fmtNum(user.followers)}</strong> Followers</span>
          <span><strong>${fmtNum(user.following)}</strong> Following</span>
        </div>
      </div>
      ${isSelf ? `<button class="btn-outline" id="open-settings">Settings</button>` : `<button class="btn-outline follow-btn ${user.isFollowing?"following":""}" data-follow-user="${user.id}">${user.isFollowing?"Following":"Follow"}</button>`}
    </div>
    ${isSelf ? `
    <section class="stats-card">
      <h2 class="row-title">Your Music Activity</h2>
      <div class="stats-grid">
        ${statBlock("hours this month","127")}
        ${statBlock("songs played","1,204")}
        ${statBlock("albums played","86")}
        ${statBlock("artists played","54")}
      </div>
    </section>
    <section class="row">
      <h2 class="row-title">Most Played</h2>
      <div class="most-played">
        <div>
          <h3 class="sub-title">Top Artists</h3>
          <ol class="rank-list">${ARTISTS.map((a,i)=>`<li data-goto-artist="${a.id}"><span>${i+1}</span>${avatarEl({username:a.id,name:a.name},32)}<span>${esc(a.name)}</span></li>`).join("")}</ol>
        </div>
        <div>
          <h3 class="sub-title">Top Songs</h3>
          <ol class="rank-list">${SONGS.slice(0,5).map((s,i)=>`<li data-play-song="${s.id}"><span>${i+1}</span>${artEl(s.albumId,32)}<span>${esc(s.title)}</span></li>`).join("")}</ol>
        </div>
      </div>
    </section>
    <section class="row">
      <h2 class="row-title">Artists You Follow</h2>
      <div class="row-scroll">${ARTISTS.slice(0,4).map(artistCard).join("")}</div>
    </section>
    <section class="row">
      <h2 class="row-title">People You Follow</h2>
      <div class="row-scroll">${USERS.filter(u=>u.isFollowing).map(userCard).join("")}</div>
    </section>` : ""}
    <div class="tabs">${tabs.map(t => `<button class="tab ${state.profileTab===t?"active":""}" data-profile-tab="${t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join("")}</div>
    ${body}
  </div>`;
}
function renderProfile() { return renderProfileFor(userBy("u0"), true); }
function renderUserProfile() { return renderProfileFor(userBy(state.viewingUserId), state.viewingUserId === "u0"); }

function reviewCard(rv) {
  const user = userBy(rv.userId), al = ALBUMS.find(a=>a.id===rv.albumId), ar = ARTISTS.find(a=>a.id===al.artistId);
  return `<article class="review-card">
    <div class="post-head">${avatarEl(user,36)}<div class="post-head-text"><div class="post-name">${esc(user.name)}</div><span class="dim">reviewed <span data-goto-album="${al.id}" class="link">${esc(al.title)}</span></span></div></div>
    <div class="review-rating">${starRating(rv.rating)} <strong>${rv.rating.toFixed(1)}/10</strong></div>
    <p class="post-content">${esc(rv.text)}</p>
    <div class="post-actions"><button class="pa ${rv.liked?"active":""}" data-like-review="${rv.id}">${icon("heart")} <span>${fmtNum(rv.likes)}</span></button></div>
  </article>`;
}

/* ---------------- ALBUM PAGE ---------------- */
function renderAlbum() {
  const al = ALBUMS.find(a => a.id === state.viewingAlbumId) || ALBUMS[0];
  const ar = ARTISTS.find(a => a.id === al.artistId);
  const tracks = SONGS.filter(s => s.albumId === al.id);
  const reviews = REVIEWS.filter(r => r.albumId === al.id);
  return `
  <div class="page page-album">
    <div class="album-hero">
      ${artEl(al.id, 200, "3rem")}
      <div class="album-hero-info">
        <span class="eyebrow">Album</span>
        <h1>${esc(al.title)}</h1>
        <p class="dim"><span class="link" data-goto-artist="${ar.id}">${esc(ar.name)}</span> · ${al.year} · ${esc(al.genre)}</p>
        <p class="album-desc">${esc(al.description)}</p>
        <div class="album-rating"><span class="ico sm">${icon("starFill")}</span> ${al.rating.toFixed(1)} <span class="dim">Banana Music rating</span></div>
        <div class="album-actions">
          <button class="btn-yellow" data-play-attach="album:${al.id}">${icon("play")} Play</button>
          <button class="icon-btn lg" data-like-album="${al.id}">${icon("heart")}</button>
          <button class="icon-btn lg" data-save-album="${al.id}">${icon("bookmark")}</button>
          <button class="icon-btn lg" data-share-album="${al.id}">${icon("share")}</button>
        </div>
      </div>
    </div>
    <section class="row">
      <h2 class="row-title">Tracklist</h2>
      <div class="song-list">${tracks.map((s,i)=>songRow(s,i+1)).join("")}</div>
    </section>
    <section class="row">
      <h2 class="row-title">Album Reviews</h2>
      ${reviews.length ? reviews.map(reviewCard).join("") : emptyState("star","No reviews yet.","Be the first to review this album.")}
    </section>
  </div>`;
}

/* ---------------- PLAYLIST PAGE ---------------- */
function renderPlaylist() {
  const pl = PLAYLISTS.find(p => p.id === state.viewingPlaylistId) || PLAYLISTS[0];
  const owner = userBy(pl.ownerId);
  const songs = pl.songIds.map(id => SONGS.find(s => s.id === id)).filter(Boolean);
  return `
  <div class="page page-album">
    <div class="album-hero">
      <span class="art" style="--sz:200px;background:${coverFor(pl.id)};">${icon(playlistIconFor(pl))}</span>
      <div class="album-hero-info">
        <span class="eyebrow">${pl.isPublic ? "Public Playlist" : "Private Playlist"}</span>
        <h1>${esc(pl.name)}</h1>
        <p class="dim">By <span class="link" data-goto-user="${owner.id}">${esc(owner.name)}</span> · ${songs.length} songs</p>
        <p class="album-desc">${esc(pl.description)}</p>
        <div class="album-actions">
          <button class="btn-yellow" data-play-attach="playlist:${pl.id}">${icon("play")} Play</button>
          <button class="btn-outline" id="share-playlist-btn" data-share-playlist="${pl.id}">Share Playlist</button>
        </div>
      </div>
    </div>
    <section class="row">
      <h2 class="row-title">Songs</h2>
      ${songs.length ? `<div class="song-list">${songs.map((s,i)=>songRow(s,i+1)).join("")}</div>` : emptyState("library","This playlist is empty.","Add songs from any album page.")}
    </section>
  </div>`;
}

/* ---------------- shared bits ---------------- */
function emptyState(iconName, title, sub, ctaLabel, ctaAction) {
  return `<div class="empty-state">
    <div class="empty-emoji"><span class="ico xl">${icon(iconName)}</span></div>
    <h3>${title}</h3><p>${sub}</p>
    ${ctaLabel ? `<button class="btn-yellow" id="${ctaAction}">${ctaLabel}</button>` : ""}
  </div>`;
}

const ICONS = {
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14l-11-7z"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 5h-2v14h2zM4 5v14l11-7z"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.9-10-9.4C.4 8.1 2 4.6 5.6 4a5 5 0 0 1 6.4 2A5 5 0 0 1 18.4 4C22 4.6 23.6 8.1 22 11.6 19.5 16.1 12 21 12 21z"/></svg>`,
  comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-1 4.5A7.9 7.9 0 0 1 21 12z"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 12l10-7v4c6 1 8 6 8 11-2-3-4-4.5-8-4.5V20z"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`,
  more: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
  lyrics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l11-2v13M9 9l11-2"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>`,
  queue: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h13M4 12h13M4 18h9"/><path d="M19 15v6M22 18h-6"/></svg>`,
  volume: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 8a5 5 0 0 1 0 8"/></svg>`,
  dot: `<svg viewBox="0 0 24 24" width="8" height="8" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11.5L12 4l8 7.5"/><path d="M6 10v10h12V10"/></svg>`,
  library: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="17" y="10" width="4" height="10" rx="1"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
  headphones: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 13.5v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13.5" width="4.5" height="6" rx="1.5"/><rect x="16.5" y="13.5" width="4.5" height="6" rx="1.5"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3L3 9.5l6.4-.6z"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-1 4.5A7.9 7.9 0 0 1 21 12z"/><circle cx="8.5" cy="12" r=".6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".6" fill="currentColor" stroke="none"/><circle cx="15.5" cy="12" r=".6" fill="currentColor" stroke="none"/></svg>`,
  compass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 2 2-6z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>`,
  banana: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 20c6.5 1 12-3 13.5-9.5"/><path d="M19.5 10.5c.8-.3 1.6 0 2 .7-.9 2-2.7 3.4-4.8 3.6"/><path d="M6 20c-1.2-1.6-1.6-3.4-1-5"/></svg>`,
  disc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.5 14.5l5-5"/><path d="M13 6l1.5-1.5a3.5 3.5 0 0 1 5 5L18 11"/><path d="M11 18l-1.5 1.5a3.5 3.5 0 0 1-5-5L6 13"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 8.2a3 3 0 1 1 .3 6"/><path d="M21.5 20c0-3-2-5.2-4.8-5.8"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.7-1A4.5 4.5 0 0 0 7 18z"/><path d="M8 21l-1 2M12 21l-1 2M16 21l-1 2"/></svg>`,
  dumbbell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><rect x="5" y="7" width="2.4" height="10" rx="1"/><rect x="16.6" y="7" width="2.4" height="10" rx="1"/><path d="M7.4 12h9.2"/></svg>`,
  heartBreak: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.9-10-9.4C.4 8.1 2 4.6 5.6 4a5 5 0 0 1 6.4 2A5 5 0 0 1 18.4 4C22 4.6 23.6 8.1 22 11.6 19.5 16.1 12 21 12 21z"/><path d="M12.5 6l-2 4 2.5 2.5-2 4"/></svg>`,
  barChart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>`,
  starFill: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3L3 9.5l6.4-.6z"/></svg>`,
};
function icon(name) { return ICONS[name] || ""; }
function iconBtn(name, cls, label) { return `<span class="ico ${cls||""}" aria-hidden="true">${icon(name)}</span>`; }
function starRating(score10) {
  const filled = Math.round(score10 / 2);
  let out = "";
  for (let i = 0; i < 5; i++) out += `<span class="star-ico ${i < filled ? "on" : ""}">${icon(i < filled ? "starFill" : "star")}</span>`;
  return `<span class="star-row">${out}</span>`;
}
const PLAYLIST_ICONS = { pl1: "headphones", pl2: "cloud", pl3: "heart", pl4: "dumbbell", pl5: "heartBreak", pl6: "star" };
function playlistIconFor(pl) { return PLAYLIST_ICONS[pl.id] || pl.icon || "library"; }

/* ---------------- player ---------------- */
function currentSong() { return state.player.queue[state.player.index] || null; }

function playQueue(songs, startIndex = 0) {
  if (!songs.length) return;
  state.player.queue = songs;
  state.player.index = startIndex;
  state.player.elapsed = 0;
  state.player.playing = true;
  startTick();
  renderPlayerBar();
  if (state.player.expanded) renderExpandedPlayer();
}
function playSongById(id) {
  const s = SONGS.find(x => x.id === id);
  if (!s) return;
  const albumSongs = SONGS.filter(x => x.albumId === s.albumId);
  playQueue(albumSongs, albumSongs.findIndex(x => x.id === id));
}
function playAttachment(type, id) {
  if (type === "song") return playSongById(id);
  if (type === "album") { const songs = SONGS.filter(s => s.albumId === id); return playQueue(songs, 0); }
  if (type === "playlist") { const pl = PLAYLISTS.find(p => p.id === id); const songs = pl.songIds.map(sid => SONGS.find(s => s.id === sid)).filter(Boolean); return playQueue(songs, 0); }
  if (type === "artist") { const songs = SONGS.filter(s => s.artistId === id); return playQueue(songs, 0); }
}
function togglePlay() {
  if (!currentSong()) return;
  state.player.playing = !state.player.playing;
  if (state.player.playing) startTick(); else clearInterval(playerTick);
  renderPlayerBar();
  if (state.player.expanded) renderExpandedPlayer();
}
function nextSong() {
  if (!state.player.queue.length) return;
  state.player.index = (state.player.index + 1) % state.player.queue.length;
  state.player.elapsed = 0;
  renderPlayerBar();
  if (state.player.expanded) renderExpandedPlayer();
}
function prevSong() {
  if (!state.player.queue.length) return;
  if (state.player.elapsed > 4) { state.player.elapsed = 0; }
  else state.player.index = (state.player.index - 1 + state.player.queue.length) % state.player.queue.length;
  renderPlayerBar();
  if (state.player.expanded) renderExpandedPlayer();
}
function startTick() {
  clearInterval(playerTick);
  playerTick = setInterval(() => {
    const s = currentSong();
    if (!s || !state.player.playing) return;
    state.player.elapsed += 1;
    if (state.player.elapsed >= s.duration) { nextSong(); return; }
    updateProgressUI();
  }, 1000);
}
function updateProgressUI() {
  const s = currentSong();
  if (!s) return;
  const pct = (state.player.elapsed / s.duration) * 100;
  $all(".progress-fill").forEach(el => el.style.width = pct + "%");
  $all(".time-elapsed").forEach(el => el.textContent = fmtTime(state.player.elapsed));
  if (state.player.expanded && state.player.showLyrics) highlightLyric();
}

function renderPlayerBar() {
  const bar = $("#player-bar");
  const s = currentSong();
  if (!s) { bar.innerHTML = ""; bar.classList.remove("active"); document.body.classList.remove("has-player"); return; }
  bar.classList.add("active");
  document.body.classList.add("has-player");
  const ar = songArtist(s);
  bar.innerHTML = `
    <div class="player-bar-inner">
      <div class="player-now" id="player-open-expanded">
        ${artEl(s.albumId, 48)}
        <div class="player-now-text"><strong>${esc(s.title)}</strong><span class="dim">${esc(ar.name)}</span></div>
      </div>
      <div class="player-controls">
        <div class="player-buttons">
          <button class="icon-btn" id="player-prev" aria-label="Previous">${icon("prev")}</button>
          <button class="icon-btn play-btn" id="player-toggle" aria-label="Play or pause">${icon(state.player.playing ? "pause" : "play")}</button>
          <button class="icon-btn" id="player-next" aria-label="Next">${icon("next")}</button>
        </div>
        <div class="player-progress">
          <span class="time-elapsed dim">${fmtTime(state.player.elapsed)}</span>
          <div class="progress-track"><div class="progress-fill" style="width:${(state.player.elapsed/s.duration)*100}%"></div></div>
          <span class="dim">${fmtTime(s.duration)}</span>
        </div>
      </div>
      <div class="player-extra">
        <button class="icon-btn" id="player-lyrics-btn" aria-label="Lyrics">${icon("lyrics")}</button>
        <button class="icon-btn" id="player-queue-btn" aria-label="Queue">${icon("queue")}</button>
        <div class="volume-wrap">${icon("volume")}<input type="range" min="0" max="100" value="${state.player.volume}" id="player-volume"></div>
      </div>
    </div>`;
}

function openExpandedPlayer() {
  if (!currentSong()) return;
  state.player.expanded = true;
  $("#expanded-player").classList.add("active");
  renderExpandedPlayer();
}
function closeExpandedPlayer() {
  state.player.expanded = false;
  $("#expanded-player").classList.remove("active");
}
function renderExpandedPlayer() {
  const s = currentSong();
  if (!s) return;
  const ar = songArtist(s), al = songAlbum(s);
  const host = $("#expanded-player");
  host.innerHTML = `
    <div class="expanded-inner">
      <div class="expanded-topbar">
        <button class="icon-btn" id="expanded-close">${icon("chevronDown")}</button>
        <span class="dim">Now Playing</span>
        <button class="icon-btn" id="expanded-lyrics-toggle">${icon("lyrics")}</button>
      </div>
      ${!state.player.showLyrics ? `
      <div class="expanded-art">${artEl(s.albumId, 280, "4rem")}</div>
      <div class="expanded-meta">
        <h2>${esc(s.title)}</h2>
        <p class="dim link" data-goto-album="${al.id}">${esc(ar.name)} · ${esc(al.title)}</p>
      </div>
      <div class="expanded-progress">
        <div class="progress-track"><div class="progress-fill" style="width:${(state.player.elapsed/s.duration)*100}%"></div></div>
        <div class="progress-labels"><span class="time-elapsed dim">${fmtTime(state.player.elapsed)}</span><span class="dim">${fmtTime(s.duration)}</span></div>
      </div>
      <div class="expanded-controls">
        <button class="icon-btn" id="player-prev">${icon("prev")}</button>
        <button class="icon-btn play-btn lg" id="player-toggle">${icon(state.player.playing ? "pause" : "play")}</button>
        <button class="icon-btn" id="player-next">${icon("next")}</button>
      </div>
      <button class="btn-outline full" id="share-listening-btn">Share what I'm listening to</button>
      <section class="about-song">
        <h3 class="sub-title">About the Song</h3>
        <dl>
          <div><dt>Artist</dt><dd>${esc(ar.name)}</dd></div>
          <div><dt>Album</dt><dd>${esc(al.title)}</dd></div>
          <div><dt>Release date</dt><dd>${al.year}</dd></div>
          <div><dt>Genre</dt><dd>${esc(al.genre)}</dd></div>
          <div><dt>Duration</dt><dd>${fmtTime(s.duration)}</dd></div>
        </dl>
        <h3 class="sub-title">Credits</h3>
        <dl>
          <div><dt>Artist</dt><dd>${esc(ar.name)}</dd></div>
          <div><dt>Producer</dt><dd>${esc(ar.name)} Studio</dd></div>
          <div><dt>Writer</dt><dd>${esc(ar.name)}</dd></div>
          <div><dt>Album</dt><dd>${esc(al.title)}</dd></div>
        </dl>
      </section>` : `
      <div class="lyrics-panel">
        <h3>Lyrics</h3>
        <div class="lyrics-scroll" id="lyrics-scroll">
          ${MOCK_LYRICS.map((line,i) => `<p class="lyric-line" data-line="${i}">${esc(line)}</p>`).join("")}
        </div>
        <p class="dim lyrics-note">Mock lyrics shown for preview purposes.</p>
      </div>`}
    </div>`;
  if (state.player.showLyrics) highlightLyric();
}
function highlightLyric() {
  const s = currentSong();
  if (!s) return;
  const idx = Math.min(MOCK_LYRICS.length - 1, Math.floor((state.player.elapsed / s.duration) * MOCK_LYRICS.length));
  $all(".lyric-line").forEach(el => el.classList.toggle("active", Number(el.dataset.line) === idx));
  const active = $(".lyric-line.active");
  if (active) active.scrollIntoView({ block: "center", behavior: "smooth" });
}

/* ---------------- notifications ---------------- */
function renderNotifBell() {
  $("#notif-count").textContent = NOTIFICATIONS.length;
  $("#notif-count").hidden = NOTIFICATIONS.length === 0;
}
document.addEventListener("click", (e) => {
  if (!state.notifOpen) return;
  if (e.target.closest("#notif-panel") || e.target.closest("#notif-bell")) return;
  state.notifOpen = false;
  $("#notif-panel").classList.remove("active");
}, true);

function toggleNotifPanel() {
  state.notifOpen = !state.notifOpen;
  const panel = $("#notif-panel");
  panel.classList.toggle("active", state.notifOpen);
  if (state.notifOpen) {
    panel.innerHTML = NOTIFICATIONS.map(n => `<div class="notif-row">${notifIcon(n.type)}<div><p>${esc(n.text)}</p><span class="dim">${timeAgo(n.minsAgo)}</span></div></div>`).join("")
      || `<div class="notif-empty">You're all caught up.</div>`;
  }
}
function notifIcon(type) {
  const map = { like: "heart", comment: "comment", follow: "user", listen: "headphones" };
  return `<span class="notif-emoji"><span class="ico">${icon(map[type] || "bell")}</span></span>`;
}

/* ---------------- modals ---------------- */
function openModal(id) { $(`#${id}`).classList.add("active"); $("#modal-backdrop").classList.add("active"); }
function closeModals() { $all(".modal").forEach(m => m.classList.remove("active")); $("#modal-backdrop").classList.remove("active"); }

function submitCreatePlaylist(e) {
  e.preventDefault();
  const name = $("#pl-name").value.trim() || "Untitled Playlist";
  const desc = $("#pl-desc").value.trim();
  const isPublic = $("#pl-public").checked;
  const pl = { id: "pl" + (PLAYLISTS.length + 1), name, icon: "library", description: desc || "A new Banana Music playlist.", ownerId: "u0", isPublic, songIds: [] };
  PLAYLISTS.push(pl);
  closeModals();
  toast(`Created “${name}.”`);
  navigate("library");
}

function openShareModal(label) {
  $("#share-modal-title").textContent = `Share ${label}`;
  openModal("modal-share");
}

/* ---------------- composer ---------------- */
function closeComposer() { state.composerOpen = false; state.composerAttachment = null; }

/* ---------------- delegated events ---------------- */
document.addEventListener("click", (e) => {
  const t = e.target;

  // nav
  const navBtn = t.closest("[data-page]");
  if (navBtn) { navigate(navBtn.dataset.page); return; }

  const gotoUser = t.closest("[data-goto-user]");
  if (gotoUser) { navigate("user", { userId: gotoUser.dataset.gotoUser }); return; }
  const gotoArtist = t.closest("[data-goto-artist]");
  if (gotoArtist) { toast("Artist pages use the same layout as albums — try an album for now."); return; }
  const gotoAlbum = t.closest("[data-goto-album]");
  if (gotoAlbum) { navigate("album", { albumId: gotoAlbum.dataset.gotoAlbum }); return; }
  const gotoPlaylist = t.closest("[data-goto-playlist]");
  if (gotoPlaylist) { navigate("playlist", { playlistId: gotoPlaylist.dataset.gotoPlaylist }); return; }

  const playSong = t.closest("[data-play-song]");
  if (playSong) { playSongById(playSong.dataset.playSong); return; }
  const playAttach = t.closest("[data-play-attach]");
  if (playAttach) { const [type, id] = playAttach.dataset.playAttach.split(":"); playAttachment(type, id); return; }

  const followUser = t.closest("[data-follow-user]");
  if (followUser) {
    const u = userBy(followUser.dataset.followUser);
    u.isFollowing = !u.isFollowing;
    u.followers += u.isFollowing ? 1 : -1;
    render();
    return;
  }
  const followArtist = t.closest("[data-follow-artist]");
  if (followArtist) { followArtist.textContent = followArtist.textContent === "Follow" ? "Following" : "Follow"; followArtist.classList.toggle("following"); return; }

  const likeBtn = t.closest("[data-like]");
  if (likeBtn) {
    const post = POSTS.find(p => p.id === likeBtn.dataset.like);
    post.liked = !post.liked; post.likes += post.liked ? 1 : -1;
    render();
    return;
  }
  const likeReview = t.closest("[data-like-review]");
  if (likeReview) {
    const rv = REVIEWS.find(r => r.id === likeReview.dataset.likeReview);
    rv.liked = !rv.liked; rv.likes += rv.liked ? 1 : -1;
    render();
    return;
  }
  const saveBtn = t.closest("[data-save]");
  if (saveBtn) {
    const post = POSTS.find(p => p.id === saveBtn.dataset.save);
    post.saved = !post.saved;
    toast(post.saved ? "Saved to your library." : "Removed from saved.");
    render();
    return;
  }
  const commentBtn = t.closest("[data-comment]");
  if (commentBtn) {
    const box = $(`#comments-${commentBtn.dataset.comment}`);
    box.hidden = !box.hidden;
    return;
  }
  const commentSubmit = t.closest("[data-comment-submit]");
  if (commentSubmit) {
    const id = commentSubmit.dataset.commentSubmit;
    const input = $(`[data-comment-input="${id}"]`);
    if (input.value.trim()) {
      POSTS.find(p => p.id === id).comments.push({ userId: "u0", text: input.value.trim() });
      render();
      $(`#comments-${id}`).hidden = false;
    }
    return;
  }
  const shareBtn = t.closest("[data-share]");
  if (shareBtn) { openShareModal("Post"); return; }
  const shareAlbum = t.closest("[data-share-album]");
  if (shareAlbum) { openShareModal("Album"); return; }
  const sharePlaylist = t.closest("[data-share-playlist]");
  if (sharePlaylist) { openShareModal("Playlist"); return; }
  const shareListening = t.closest("#share-listening-btn");
  if (shareListening) {
    const s = currentSong(); const ar = songArtist(s);
    POSTS.unshift({ id: "p" + Date.now(), userId: "u0", minsAgo: 0, content: `Currently listening to ${s.title} — ${ar.name}`, attachment: { type: "song", id: s.id }, likes: 0, comments: [], liked: false, saved: false, sponsored: false });
    toast("Shared what you're listening to.");
    return;
  }
  const likeAlbum = t.closest("[data-like-album]");
  if (likeAlbum) { likeAlbum.classList.toggle("active"); toast(likeAlbum.classList.contains("active") ? "Liked." : "Removed like."); return; }
  const saveAlbum = t.closest("[data-save-album]");
  if (saveAlbum) { saveAlbum.classList.toggle("active"); toast(saveAlbum.classList.contains("active") ? "Saved." : "Removed from saved."); return; }
  const moreBtn = t.closest("[data-more]");
  if (moreBtn) { openMoreMenu(moreBtn); return; }

  // composer
  if (t.closest("#composer-open-btn")) { state.composerOpen = true; render(); return; }
  if (t.closest("#composer-cancel")) { closeComposer(); render(); return; }
  if (t.closest("#composer-remove-attach")) { state.composerAttachment = null; render(); return; }
  const attachBtn = t.closest("[data-attach]");
  if (attachBtn) {
    const type = attachBtn.dataset.attach;
    const map = { song: SONGS[0].id, album: ALBUMS[0].id, artist: ARTISTS[0].id, playlist: PLAYLISTS[0].id };
    state.composerAttachment = { type, id: map[type] };
    render();
    return;
  }
  if (t.closest("#composer-post")) {
    const text = $("#composer-text").value.trim();
    if (!text) { toast("Write something before you post."); return; }
    POSTS.unshift({ id: "p" + Date.now(), userId: "u0", minsAgo: 0, content: text, attachment: state.composerAttachment, likes: 0, comments: [], liked: false, saved: false, sponsored: false });
    closeComposer();
    render();
    toast("Posted to your feed.");
    return;
  }

  // player
  if (t.closest("#player-toggle")) { togglePlay(); return; }
  if (t.closest("#player-next")) { nextSong(); return; }
  if (t.closest("#player-prev")) { prevSong(); return; }
  if (t.closest("#player-open-expanded")) { openExpandedPlayer(); return; }
  if (t.closest("#expanded-close")) { closeExpandedPlayer(); return; }
  if (t.closest("#player-lyrics-btn") || t.closest("#expanded-lyrics-toggle")) {
    state.player.showLyrics = !state.player.showLyrics;
    if (!state.player.expanded) openExpandedPlayer(); else renderExpandedPlayer();
    return;
  }
  if (t.closest("#player-queue-btn")) { openQueuePanel(); return; }

  // search tabs
  const searchTab = t.closest("[data-search-tab]");
  if (searchTab) { state.searchTab = searchTab.dataset.searchTab; render(); return; }
  const libTab = t.closest("[data-library-tab]");
  if (libTab) { state.libraryTab = libTab.dataset.libraryTab; render(); return; }
  const profTab = t.closest("[data-profile-tab]");
  if (profTab) { state.profileTab = profTab.dataset.profileTab; render(); return; }

  // modals
  if (t.closest("#open-playlist-modal") || t.closest("#open-playlist-modal-empty")) { openModal("modal-playlist"); return; }
  if (t.closest("#open-settings")) { openModal("modal-settings"); return; }
  if (t.closest("[data-close-modal]")) { closeModals(); return; }
  if (t.closest("#modal-backdrop")) { closeModals(); closeQueuePanel(); return; }
  if (t.closest("#copy-link-btn")) { toast("Link copied to clipboard."); return; }

  // notifications
  if (t.closest("#notif-bell")) { toggleNotifPanel(); return; }

  // logout
  if (t.closest("[data-logout]")) { closeModals(); logout(); return; }

  // retry (error state demo)
  if (t.closest("[data-retry]")) { toast("Reloaded."); render(); return; }
});

function openMoreMenu(btn) {
  const existing = $(".more-menu"); if (existing) existing.remove();
  const menu = document.createElement("div");
  menu.className = "more-menu";
  menu.innerHTML = ["Add to Playlist","Like","Save","Share","Go to Album","Hide","Report"].map(o => `<button>${o}</button>`).join("");
  document.body.appendChild(menu);
  const r = btn.getBoundingClientRect();
  menu.style.top = `${r.bottom + 6}px`;
  menu.style.left = `${Math.max(8, r.left - 140)}px`;
  const dismiss = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener("click", dismiss, true); } };
  setTimeout(() => document.addEventListener("click", dismiss, true), 0);
  menu.addEventListener("click", () => { menu.remove(); toast("Done."); });
}

function openQueuePanel() {
  const panel = $("#queue-panel");
  panel.classList.add("active");
  $("#modal-backdrop").classList.add("active");
  panel.innerHTML = `<div class="queue-head"><h3>Queue</h3><button data-close-modal>${icon("x")}</button></div>` +
    (state.player.queue.length ? state.player.queue.map((s,i) => `<div class="queue-row ${i===state.player.index?"active":""}" data-play-song="${s.id}">${artEl(s.albumId,40)}<div><strong>${esc(s.title)}</strong><span class="dim">${esc(songArtist(s).name)}</span></div></div>`).join("") : `<p class="dim" style="padding:1rem">Queue is empty.</p>`);
}
function closeQueuePanel() { $("#queue-panel").classList.remove("active"); }

/* input events */
document.addEventListener("input", (e) => {
  if (e.target.id === "search-input") { state.searchQuery = e.target.value; render(); focusSearchInput(); }
  if (e.target.id === "player-volume") { state.player.volume = e.target.value; }
});
function focusSearchInput() { const el = $("#search-input"); if (el) { el.focus(); const v = el.value; el.value = ""; el.value = v; } }

document.addEventListener("submit", (e) => {
  if (e.target.id === "form-login") doLogin(e);
  if (e.target.id === "form-signup") doSignup(e);
  if (e.target.id === "form-playlist") submitCreatePlaylist(e);
});

/* mobile bottom-nav "Create" opens composer on home */
function mobileCreate() { navigate("home"); state.composerOpen = true; render(); $("#composer-text")?.focus(); }

/* init */
document.addEventListener("DOMContentLoaded", () => {
  showAuthScreen("start");
  renderNotifBell();
});
