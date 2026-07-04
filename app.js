const STORAGE_KEY = "haobuhao-state-v1";

const seedWorks = [
  {
    id: "20260703-U1001-001",
    title: "清风入怀",
    year: "2026",
    category: "行",
    intro: "取米芾笔意，重在气息连贯。",
    image: "assets/work-1.png",
    images: ["assets/work-1.png", "assets/work-2.png", "assets/work-3.png"],
    author: "松砚",
    authorLevel: "书友",
    authorBio: "临池十年，偏爱行书",
    createdAt: "2026-07-03",
    goodWeight: 6.8,
    badWeight: 2.2,
    goodCount: 7,
    badCount: 2,
  },
  {
    id: "20260702-U1002-001",
    title: "雨后临池",
    year: "2025",
    category: "草",
    intro: "线条速度较快，墨色层次明显。",
    image: "assets/work-2.png",
    images: ["assets/work-2.png", "assets/work-1.png"],
    author: "青竹",
    authorLevel: "资深书友",
    authorBio: "草书见性，墨气为先",
    createdAt: "2026-07-02",
    goodWeight: 72.4,
    badWeight: 26.8,
    goodCount: 73,
    badCount: 26,
  },
  {
    id: "20260630-U1003-001",
    title: "印痕小辑",
    year: "2024",
    category: "篆刻",
    intro: "印面布局疏密相间，边款清爽。",
    image: "assets/work-3.png",
    images: ["assets/work-3.png", "assets/work-1.png", "assets/work-2.png"],
    author: "闻石",
    authorLevel: "书法家",
    authorBio: "治印写字，取法秦汉",
    createdAt: "2026-06-30",
    goodWeight: 1845.6,
    badWeight: 154.2,
    goodCount: 1846,
    badCount: 154,
  },
];

const defaultState = {
  user: {
    weight: 1,
    reward: 0,
    votes: {},
    history: [],
    uploaded: [],
    feedOpenCount: 0,
    nickname: "未名书友",
    avatarText: "墨",
    avatarImage: "",
    bio: "一眼看作品，好孬见真章",
    email: "",
    passwordSet: false,
    isAuthenticated: false,
  },
  works: seedWorks,
  messages: [],
  accounts: [],
};

let state = loadState();
state.user.feedOpenCount = (state.user.feedOpenCount || 0) + 1;
normalizeWorks(state.works);
saveState();
let activeFilter = "all";
let activeDetailWork = null;

const views = {
  feed: document.querySelector("#feedView"),
  upload: document.querySelector("#uploadView"),
  profile: document.querySelector("#profileView"),
  rules: document.querySelector("#rulesView"),
};

const workList = document.querySelector("#workList");
const template = document.querySelector("#workCardTemplate");
const toast = document.querySelector("#toast");
const authorModal = document.querySelector("#authorModal");
const profileModal = document.querySelector("#profileModal");
const messageModal = document.querySelector("#messageModal");
const authModal = document.querySelector("#authModal");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneDefaultState();

  try {
    const parsed = JSON.parse(saved);
    const byId = new Map(parsed.works?.map((work) => [work.id, work]) || []);
    const works = seedWorks.map((work) => ({ ...work, ...(byId.get(work.id) || {}) }));
    const uploaded = (parsed.works || []).filter((work) => !seedWorks.some((seed) => seed.id === work.id));
    const loadedState = {
      user: { ...defaultState.user, ...parsed.user },
      works: [...works, ...uploaded],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
    };
    normalizeWorks(loadedState.works);
    return loadedState;
  } catch {
    return cloneDefaultState();
  }
}

function cloneDefaultState() {
  const cloned = JSON.parse(JSON.stringify(defaultState));
  normalizeWorks(cloned.works);
  return cloned;
}

function normalizeWorks(works) {
  works.forEach((work) => {
    const images = Array.isArray(work.images) && work.images.length ? work.images : [work.image].filter(Boolean);
    work.images = images.slice(0, 4);
    work.image = work.images[0] || "assets/work-1.png";
    if (!work.authorBio) work.authorBio = "暂未填写自我介绍";
    if (!("authorAvatar" in work)) work.authorAvatar = "";
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTotal(work) {
  return work.goodCount + work.badCount;
}

function getGoodRate(work) {
  const total = getTotal(work);
  return total ? work.goodCount / total : 0;
}

function getConsensus(work) {
  return work.goodWeight >= work.badWeight ? "good" : "bad";
}

function getHeat(work) {
  const total = getTotal(work);
  if (total <= 9) return "新发布";
  if (total <= 99) return "少评作品";
  if (total <= 999) return "多评作品";
  return "热评作品";
}

function getDegree(work) {
  const total = getTotal(work);
  const rate = getGoodRate(work);
  if (total > 999 && rate > 0.9) return "精品作品";
  if (total > 99 && rate > 0.7) return "优秀作品";
  if (total > 9 && rate > 0.5) return "好评作品";
  return "";
}

function getStageReward(work) {
  const total = getTotal(work);
  if (total < 1999) return total >= 999 ? 0.01 : 0.005;
  return 0.01;
}

function formatWeight(value) {
  return Number(value).toFixed(3);
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setAvatar(element, text, image) {
  element.textContent = "";
  element.style.backgroundImage = "";
  element.classList.toggle("has-image", Boolean(image));
  if (image) {
    element.style.backgroundImage = `url("${image}")`;
  } else {
    element.textContent = text || "墨";
  }
}

function render() {
  renderFeed();
  renderProfile();
  document.querySelector("#userWeight").textContent = formatWeight(state.user.weight);
  document.querySelector("#logoutBtn").hidden = !state.user.isAuthenticated;
}

function requireAuth(message = "请先注册或登录") {
  if (state.user.isAuthenticated) return true;
  showToast(message);
  openAuthModal("register");
  return false;
}

function openAuthModal(tab = "register") {
  switchAuthTab(tab);
  authModal.hidden = false;
}

function closeAuthModal() {
  if (state.user.isAuthenticated) authModal.hidden = true;
}

function switchAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.authTab === tab);
  });
  document.querySelector("#registerForm").classList.toggle("is-active", tab === "register");
  document.querySelector("#loginForm").classList.toggle("is-active", tab === "login");
}

function registerAccount(form) {
  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;
  const nickname = form.nickname.value.trim() || "未名书友";

  if (state.accounts.some((account) => account.email === email)) {
    showToast("这个邮箱已经注册过");
    switchAuthTab("login");
    return;
  }

  const account = {
    email,
    password,
    nickname,
    avatarText: nickname.slice(0, 1),
    avatarImage: "",
    bio: "一眼看作品，好孬见真章",
  };
  state.accounts.push(account);
  applyAccount(account);
  showToast("注册成功");
}

function loginAccount(form) {
  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;
  const account = state.accounts.find((item) => item.email === email && item.password === password);

  if (!account) {
    showToast("邮箱或密码不正确");
    return;
  }

  applyAccount(account);
  showToast("登录成功");
}

function applyAccount(account) {
  state.user.isAuthenticated = true;
  state.user.email = account.email;
  state.user.nickname = account.nickname;
  state.user.avatarText = account.avatarText;
  state.user.avatarImage = account.avatarImage || "";
  state.user.bio = account.bio;
  state.user.passwordSet = true;
  saveState();
  render();
  closeAuthModal();
}

function persistCurrentAccount(oldEmail, password) {
  const account = state.accounts.find((item) => item.email === oldEmail || item.email === state.user.email);
  if (!account) return;
  account.email = state.user.email;
  account.nickname = state.user.nickname;
  account.avatarText = state.user.avatarText;
  account.avatarImage = state.user.avatarImage || "";
  account.bio = state.user.bio;
  if (password) account.password = password;
}

function logout() {
  state.user.isAuthenticated = false;
  saveState();
  render();
  openAuthModal("login");
  showToast("已退出登录");
}

function renderFeed() {
  const query = document.querySelector("#searchInput").value.trim().toLowerCase();
  const sort = document.querySelector("#sortSelect").value;
  let works = [...state.works];

  if (activeFilter === "fresh") works = works.filter((work) => getHeat(work) === "新发布");
  if (activeFilter === "popular") works = works.filter((work) => getHeat(work) === "热评作品");
  if (activeFilter === "elite") works = works.filter((work) => getDegree(work) === "精品作品");

  if (query) {
    works = works.filter((work) =>
      [work.title, work.category, work.year, work.intro].some((value) =>
        String(value).toLowerCase().includes(query),
      ),
    );
  }

  works.sort((a, b) => {
    const aVoted = Boolean(state.user.votes[a.id]);
    const bVoted = Boolean(state.user.votes[b.id]);
    if (aVoted !== bVoted) return aVoted ? 1 : -1;
    if (!aVoted && !bVoted && sort === "latest") return getRotatedOrder(a) - getRotatedOrder(b);
    if (sort === "good") return b.goodCount - a.goodCount;
    if (sort === "smart") return b.goodWeight - b.badWeight - (a.goodWeight - a.badWeight);
    return b.createdAt.localeCompare(a.createdAt);
  });

  workList.innerHTML = "";
  if (!works.length) {
    workList.innerHTML = '<div class="empty">没有匹配的作品</div>';
    return;
  }

  for (const work of works) {
    const node = template.content.firstElementChild.cloneNode(true);
    const voted = state.user.votes[work.id];
    const degree = getDegree(work);
    const images = getWorkImages(work);

    const media = node.querySelector(".work-media");
    media.src = images[0];
    media.alt = work.title;
    const heat = getHeat(work);
    const heatBadge = node.querySelector(".heat-badge");
    heatBadge.textContent = heat;
    heatBadge.classList.add(getHeatClass(heat));
    node.querySelector(".degree-badge").textContent = degree;
    node.querySelector(".degree-badge").classList.add(getDegreeClass(degree));
    node.querySelector(".degree-badge").hidden = !degree || !voted;
    node.querySelector("h2").textContent = work.title;
    node.querySelector(".meta").textContent = `${work.category} · ${work.year}`;
    node.querySelector(".intro").textContent = work.intro || "暂无简介";

    const resultPanel = node.querySelector(".result-panel");
    const voteButtons = node.querySelectorAll(".vote-btn");
    renderThumbs(node, images, work.title);

    if (voted) {
      resultPanel.hidden = false;
      const consensus = getConsensus(work);
      resultPanel.innerHTML = `
        <div><span>好孬</span><strong class="consensus-${consensus}">${consensus === "good" ? "好" : "孬"}</strong></div>
        <div><span>好评值</span><strong>${work.goodWeight.toFixed(1)}</strong></div>
        <div><span>好评率</span><strong>${formatPercent(getGoodRate(work))}</strong></div>
        <div><span>评价数</span><strong>${getTotal(work)}</strong></div>
      `;
      voteButtons.forEach((button) => {
        button.disabled = true;
        if (button.dataset.vote === voted.vote) button.textContent = `${button.textContent} ✓`;
      });
      node.querySelector(".meta").textContent = `${work.category} · ${work.year} · ${work.author} · ${work.authorLevel}`;
    } else {
      voteButtons.forEach((button) => {
        button.addEventListener("click", () => vote(work.id, button.dataset.vote));
      });
    }

    node.querySelector(".detail-btn").addEventListener("click", () => showDetail(work, Boolean(voted)));
    workList.appendChild(node);
  }
}

function vote(workId, voteValue) {
  if (!requireAuth("登录后才能评价作品")) return;
  if (state.user.votes[workId]) return;
  const work = state.works.find((item) => item.id === workId);
  if (!work) return;

  const weight = state.user.weight;
  if (voteValue === "good") {
    work.goodCount += 1;
    work.goodWeight += weight;
  } else {
    work.badCount += 1;
    work.badWeight += weight;
  }

  const matched = voteValue === getConsensus(work);
  const reward = matched ? Math.min(getStageReward(work), 2.5 - state.user.weight) : 0;
  state.user.weight = Math.min(2.5, state.user.weight + reward);
  state.user.reward += reward;
  state.user.votes[workId] = {
    vote: voteValue,
    reward,
    weightSnapshot: weight,
    at: new Date().toISOString(),
  };
  state.user.history.unshift({
    workId,
    title: work.title,
    vote: voteValue,
    reward,
    at: new Date().toISOString(),
  });

  saveState();
  render();
  showToast(reward ? `已评价，获得权重 +${reward.toFixed(3)}` : "已评价，本阶段无权重奖励");
}

function showDetail(work, voted) {
  if (!voted) {
    showToast("评价后可查看发布者信息");
    return;
  }
  openAuthorModal(work);
}

function openAuthorModal(work) {
  activeDetailWork = work;
  const authorWorks = state.works.filter((item) => item.author === work.author);
  const authorTotal = authorWorks.reduce((sum, item) => sum + getTotal(item), 0);
  const authorGood = authorWorks.reduce((sum, item) => sum + item.goodCount, 0);
  const authorBad = authorWorks.reduce((sum, item) => sum + item.badCount, 0);
  const authorRate = authorGood + authorBad ? authorGood / (authorGood + authorBad) : 0;
  const degree = getDegree(work);

  authorModal.querySelector("#authorModalTitle").textContent = work.author;
  authorModal.querySelector("#authorModalLevel").textContent = work.authorLevel;
  authorModal.querySelector("#authorModalBio").textContent = work.authorBio || "暂未填写自我介绍";
  setAvatar(authorModal.querySelector(".author-avatar"), work.author.slice(0, 1), work.authorAvatar);
  authorModal.querySelector("#authorStats").innerHTML = `
    <div><span>发布作品</span><strong>${authorWorks.length}</strong></div>
    <div><span>累计评价</span><strong>${authorTotal}</strong></div>
    <div><span>总好评</span><strong>${authorGood}</strong></div>
    <div><span>好评率</span><strong>${formatPercent(authorRate)}</strong></div>
  `;
  authorModal.querySelector("#authorWork").innerHTML = `
    <img src="${getWorkImages(work)[0]}" alt="${work.title}" />
    <div>
      <strong>${work.title}</strong>
      <span>${work.category} · ${work.year} · ${degree || getHeat(work)}</span>
    </div>
  `;
  authorModal.hidden = false;
}

function closeAuthorModal() {
  authorModal.hidden = true;
}

function openMessageModal() {
  if (!requireAuth("登录后才能给书友留言")) return;
  if (!activeDetailWork) return;
  const form = document.querySelector("#messageForm");
  form.elements.content.value = "";
  updateMessageCount();
  messageModal.querySelector("#messageTarget").textContent = `给 ${activeDetailWork.author} 留言 · ${activeDetailWork.title}`;
  messageModal.hidden = false;
}

function closeMessageModal() {
  messageModal.hidden = true;
}

function submitMessage(form) {
  if (!activeDetailWork) return;
  const content = form.elements.content.value.trim();
  if (!content) {
    showToast("请先填写留言内容");
    return;
  }

  state.messages.unshift({
    id: `MSG-${Date.now()}`,
    workId: activeDetailWork.id,
    workTitle: activeDetailWork.title,
    toAuthor: activeDetailWork.author,
    from: state.user.nickname,
    content: content.slice(0, 100),
    at: new Date().toISOString(),
  });

  saveState();
  renderProfile();
  closeMessageModal();
  closeAuthorModal();
  showToast("留言已提交，仅书友本人可见");
}

function updateMessageCount() {
  const content = document.querySelector("#messageForm").elements.content.value;
  document.querySelector("#messageCount").textContent = `${content.length}/100`;
}

function openProfileModal() {
  if (!requireAuth("登录后才能修改资料")) return;
  const form = document.querySelector("#profileForm");
  window.pendingAvatarImage = undefined;
  form.nickname.value = state.user.nickname;
  form.avatarText.value = state.user.avatarText;
  setAvatar(document.querySelector("#avatarPreview"), state.user.avatarText, state.user.avatarImage);
  form.bio.value = state.user.bio || "";
  form.email.value = state.user.email || "";
  form.password.value = "";
  profileModal.hidden = false;
}

function closeProfileModal() {
  profileModal.hidden = true;
}

function saveProfile(form) {
  const oldEmail = state.user.email;
  const nickname = form.nickname.value.trim() || "未名书友";
  const avatarText = form.avatarText.value.trim().slice(0, 2) || nickname.slice(0, 1);

  state.user.nickname = nickname;
  state.user.avatarText = avatarText;
  if (window.pendingAvatarImage !== undefined) state.user.avatarImage = window.pendingAvatarImage;
  state.user.bio = form.bio.value.trim().slice(0, 20);
  state.user.email = form.email.value.trim();
  if (form.password.value) state.user.passwordSet = true;

  state.works.forEach((work) => {
    if (state.user.uploaded.includes(work.id)) {
      work.author = nickname;
      work.authorBio = state.user.bio || "暂未填写自我介绍";
      work.authorAvatar = state.user.avatarImage || "";
    }
  });
  persistCurrentAccount(oldEmail, form.password.value);

  saveState();
  render();
  closeProfileModal();
  showToast("个人信息已保存");
}

function renderProfile() {
  const uploadedWorks = state.works.filter((work) => state.user.uploaded.includes(work.id));
  const history = state.user.history;

  document.querySelector("#profileName").textContent = state.user.nickname;
  setAvatar(document.querySelector("#profileAvatar"), state.user.avatarText, state.user.avatarImage);
  document.querySelector("#profileBio").textContent = state.user.bio || "暂未填写自我介绍";
  document.querySelector("#profileWeight").textContent = formatWeight(state.user.weight);
  document.querySelector("#profileVotes").textContent = history.length;
  document.querySelector("#profileWorks").textContent = uploadedWorks.length;
  document.querySelector("#profileReward").textContent = formatWeight(state.user.reward);
  document.querySelector("#profileLevel").textContent = `${getPublisherLevel(uploadedWorks)} · ${getReviewerLevel()}`;

  const historyList = document.querySelector("#historyList");
  historyList.innerHTML = "";
  if (!history.length) {
    historyList.innerHTML = '<div class="empty">还没有评价记录</div>';
  } else {
    for (const item of history.slice(0, 12)) {
      const row = document.createElement("div");
      row.className = "history-item";
      row.innerHTML = `
        <div><strong>${item.title}</strong><span>${item.vote === "good" ? "好" : "孬"}</span></div>
        <strong>+${formatWeight(item.reward)}</strong>
      `;
      historyList.appendChild(row);
    }
  }

  renderMessages(uploadedWorks);

  const myWorks = document.querySelector("#myWorks");
  myWorks.innerHTML = "";
  if (!uploadedWorks.length) {
    myWorks.innerHTML = '<div class="empty">还没有发布作品</div>';
  } else {
    for (const work of uploadedWorks) {
      const row = document.createElement("div");
      row.className = "mini-work";
      row.innerHTML = `
        <img src="${getWorkImages(work)[0]}" alt="${work.title}" />
        <div><strong>${work.title}</strong><span>${getTotal(work)}评 · ${formatPercent(getGoodRate(work))}好评</span></div>
        <strong>${getDegree(work) || getHeat(work)}</strong>
      `;
      myWorks.appendChild(row);
    }
  }
}

function renderMessages(uploadedWorks) {
  const messageList = document.querySelector("#messageList");
  const uploadedIds = new Set(uploadedWorks.map((work) => work.id));
  const receivedMessages = state.messages.filter(
    (message) => message.toAuthor === state.user.nickname || uploadedIds.has(message.workId),
  );

  messageList.innerHTML = "";
  if (!receivedMessages.length) {
    messageList.innerHTML = '<div class="empty">还没有书友留言</div>';
    return;
  }

  for (const message of receivedMessages.slice(0, 20)) {
    const row = document.createElement("div");
    row.className = "message-item";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(message.workTitle)}</strong>
        <p>${escapeHtml(message.content)}</p>
        <span>${escapeHtml(message.from)} · ${formatDate(message.at)}</span>
      </div>
    `;
    messageList.appendChild(row);
  }
}

function getPublisherLevel(works) {
  if (works.some((work) => getDegree(work) === "精品作品")) return "书法家";
  if (works.some((work) => getDegree(work) === "优秀作品")) return "资深书友";
  if (works.some((work) => getDegree(work) === "好评作品")) return "书友";
  if (works.some((work) => getTotal(work) >= 9)) return "爱好者";
  if (works.length) return "爱好者";
  return "普通观众";
}

function getReviewerLevel() {
  if (state.user.weight >= 2) return "专家用户";
  if (state.user.weight >= 1.5) return "进阶用户";
  return "普通用户";
}

function switchView(name) {
  if ((name === "upload" || name === "profile") && !requireAuth("请先注册或登录")) return;
  Object.entries(views).forEach(([viewName, view]) => {
    view.classList.toggle("is-active", viewName === name);
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === name);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      item.classList.toggle("is-selected", item === button);
    });
    renderFeed();
  });
});

document.querySelector("#searchInput").addEventListener("input", renderFeed);
document.querySelector("#sortSelect").addEventListener("change", renderFeed);

document.querySelector("#shareBtn").addEventListener("click", async () => {
  const shareData = {
    title: "作品好不好",
    text: "人民群众喜闻乐见的就是好作品",
    url: location.href,
  };
  if (navigator.share) {
    await navigator.share(shareData).catch(() => {});
  } else {
    await navigator.clipboard?.writeText(location.href).catch(() => {});
    showToast("链接已复制");
  }
});

document.querySelectorAll("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
});

document.querySelector("#registerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  registerAccount(event.currentTarget);
});

document.querySelector("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  loginAccount(event.currentTarget);
});

document.querySelector("#logoutBtn").addEventListener("click", logout);

authorModal.querySelector(".modal-backdrop").addEventListener("click", closeAuthorModal);
authorModal.querySelector(".sheet-close").addEventListener("click", closeAuthorModal);
document.querySelector("#messageAuthorBtn").addEventListener("click", openMessageModal);
messageModal.querySelector(".modal-backdrop").addEventListener("click", closeMessageModal);
messageModal.querySelector(".sheet-close").addEventListener("click", closeMessageModal);
document.querySelector("#messageForm").elements.content.addEventListener("input", updateMessageCount);
document.querySelector("#messageForm").addEventListener("submit", (event) => {
  event.preventDefault();
  submitMessage(event.currentTarget);
});
document.querySelector("#editProfileBtn").addEventListener("click", openProfileModal);
profileModal.querySelector(".modal-backdrop").addEventListener("click", closeProfileModal);
profileModal.querySelector(".sheet-close").addEventListener("click", closeProfileModal);
document.querySelector("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  saveProfile(event.currentTarget);
});
document.querySelector("input[name='avatarImage']").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  window.pendingAvatarImage = await readImageFile(file);
  setAvatar(document.querySelector("#avatarPreview"), state.user.avatarText, window.pendingAvatarImage);
});

document.querySelector("input[name='image']").addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []).slice(0, 4);
  const preview = document.querySelector("#uploadPreview");
  preview.innerHTML = "";
  preview.hidden = !files.length;
  window.pendingUploadImages = [];

  for (const file of files) {
    const src = await readImageFile(file);
    window.pendingUploadImages.push(src);
    const img = document.createElement("img");
    img.src = src;
    img.alt = file.name;
    preview.appendChild(img);
  }
});

document.querySelector("#uploadForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!requireAuth("登录后才能发布作品")) return;
  const data = new FormData(event.currentTarget);
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const id = `${datePart}-UDEMO-${String(state.user.uploaded.length + 1).padStart(3, "0")}`;
  const images = window.pendingUploadImages?.length ? window.pendingUploadImages.slice(0, 4) : ["assets/work-1.png"];

  const work = {
    id,
    title: data.get("title").trim(),
    year: data.get("year").trim(),
    category: data.get("category"),
    intro: data.get("intro").trim(),
    image: images[0],
    images,
    author: state.user.nickname,
    authorLevel: "爱好者",
    authorBio: state.user.bio || "暂未填写自我介绍",
    authorAvatar: state.user.avatarImage || "",
    createdAt: today.toISOString().slice(0, 10),
    goodWeight: 0,
    badWeight: 0,
    goodCount: 0,
    badCount: 0,
  };

  state.works.unshift(work);
  state.user.uploaded.unshift(work.id);
  saveState();
  event.currentTarget.reset();
  window.pendingUploadImages = [];
  document.querySelector("#uploadPreview").innerHTML = "";
  document.querySelector("#uploadPreview").hidden = true;
  showToast("作品已发布");
  switchView("feed");
  render();
});

render();
if (!state.user.isAuthenticated) {
  openAuthModal(state.accounts.length ? "login" : "register");
}

function getWorkImages(work) {
  return Array.isArray(work.images) && work.images.length ? work.images : [work.image || "assets/work-1.png"];
}

function renderThumbs(card, images, title) {
  const strip = card.querySelector(".thumb-strip");
  const media = card.querySelector(".work-media");
  if (images.length <= 1) {
    strip.hidden = true;
    return;
  }

  strip.hidden = false;
  images.forEach((src, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === 0 ? "thumb is-active" : "thumb";
    button.setAttribute("aria-label", `${title} 第${index + 1}张`);
    button.innerHTML = `<img src="${src}" alt="" />`;
    button.addEventListener("click", () => {
      media.src = src;
      strip.querySelectorAll(".thumb").forEach((thumb) => thumb.classList.toggle("is-active", thumb === button));
    });
    strip.appendChild(button);
  });
}

function getRotatedOrder(work) {
  const unvoted = state.works.filter((item) => !state.user.votes[item.id]);
  if (!unvoted.length) return 0;
  const sorted = [...unvoted].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const offset = state.user.feedOpenCount % sorted.length;
  const rotated = [...sorted.slice(offset), ...sorted.slice(0, offset)];
  const index = rotated.findIndex((item) => item.id === work.id);
  return index === -1 ? sorted.length : index;
}

function getDegreeClass(degree) {
  if (degree === "精品作品") return "degree-master";
  if (degree === "优秀作品") return "degree-strong";
  return "degree-good";
}

function getHeatClass(heat) {
  if (heat === "新发布") return "heat-new";
  if (heat === "少评作品") return "heat-light";
  if (heat === "多评作品") return "heat-growing";
  return "heat-hot";
}

function readImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}
