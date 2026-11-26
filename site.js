const profile = window.profile;
const select = (selector) => document.querySelector(selector);
const name = profile.name.trim();
const phone = profile.phone.trim();
const email = profile.email.trim();

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content) node.textContent = content;
  return node;
}

function publicUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, document.baseURI);
    return ["http:", "https:", "file:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

const heading = [name, profile.role].filter(Boolean).join(" · ");
if (heading) document.title = heading;
if (name) {
  select("[data-name]").textContent = name;
  document.querySelectorAll("[data-brand]").forEach((node) => { node.textContent = name; });
}
if (profile.role) select("#role").textContent = profile.role;
const personalDetails = [profile.gender, profile.age && `${profile.age}岁`].filter(Boolean).join(" · ");
select("#personal-meta").textContent = personalDetails;
select("#personal-meta").hidden = !personalDetails;
if (profile.intro) select("#intro").textContent = profile.intro;
select("#bio").textContent = profile.bio || profile.intro || "个人介绍待补充。";

const projectDialog = select("#project-dialog");
const hasProjects = profile.projects.length > 0;
const cards = hasProjects ? profile.projects : [
  { title: "跨境产品开发", summary: "预留用于展示选品、产品方案或开发过程。" },
  { title: "跨境运营", summary: "预留用于展示运营策略、优化过程和复盘。" },
];
if (hasProjects) select("#project-caption").textContent = "点击项目查看详情";

cards.forEach((project) => {
  const card = element(hasProjects ? "button" : "article", "project-card");
  const art = element("span", "project-art");
  art.setAttribute("aria-hidden", "true");
  const copy = element("span", "project-copy");
  const title = element("strong", "project-title", project.title);
  copy.append(element("span", "project-label", hasProjects ? "查看详情 ↗" : "待补充"), title, element("span", "project-summary", project.summary));
  card.append(art, copy);
  if (hasProjects) {
    card.type = "button";
    card.addEventListener("click", () => {
      select("#project-title").textContent = project.title;
      select("#project-detail").textContent = project.detail || project.summary;
      const link = select("#project-link");
      const url = publicUrl(project.url);
      link.hidden = !url;
      if (url) link.href = url;
      else link.removeAttribute("href");
      projectDialog.showModal();
    });
  }
  select("#project-grid").append(card);
});

const experience = select("#experience");
if (!profile.experience.length) experience.append(element("p", "", "经历与履历待补充。"));
profile.experience.forEach((item) => {
  const row = element("div", "experience-item");
  row.append(element("strong", "", [item.period, item.title].filter(Boolean).join(" · ")), element("p", "", item.summary));
  experience.append(row);
});

const profileLinks = select("#profile-links");
const contactLinks = [
  [phone && `tel:${phone}`, `致电 ${phone}`],
  [email && `mailto:${email}`, `邮件 ${email}`],
  [publicUrl(profile.resumeUrl), "查看简历 ↗"],
];
for (const [url, label] of contactLinks) {
  if (!url) continue;
  const link = element("a", "text-link", label);
  link.href = url;
  if (label.startsWith("查看简历")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  profileLinks.append(link);
}
profileLinks.hidden = !profileLinks.childElementCount;

const chat = select("#chat");
const chatLog = select("#chat-log");
const questionInput = select("#question");

function answerFor(question) {
  if (/年龄|几岁|性别|多大|男生|女生|\bage\b|\bgender\b/i.test(question)) {
    return [name, profile.gender, profile.age && `${profile.age}岁`].filter(Boolean).join("，") + "。";
  }
  if (/联络|联系|电话|手机|邮箱|邮件|号码|合作|contact|email|phone/i.test(question)) {
    return [phone && `电话 ${phone}`, email && `邮箱 ${email}`].filter(Boolean).join("\n") || "联系方式待补充。";
  }
  if (/项目|作品|案例|做过|portfolio|project/i.test(question)) {
    return hasProjects ? profile.projects.map((item) => `${item.title} · ${item.summary}`).join("\n") : "项目案例待补充。本站已经预留了跨境产品开发与跨境运营的展示位置。";
  }
  if (/经历|实习|简历|履历|工作过|公司|resume|experience/i.test(question)) {
    return profile.experience.map((item) => [item.period, item.title, item.summary].filter(Boolean).join(" · ")).join("\n") || "工作经历和简历待补充。";
  }
  if (/介绍|名字|姓名|是谁|你好|做什么|方向|职业|负责|跨境|开发|运营|about|name|hello/i.test(question)) {
    return profile.bio || profile.intro || "个人介绍待补充。";
  }
  return "本站资料暂时没有覆盖这个问题。你可以试试询问我的个人介绍、项目、经历或联系方式。";
}

function ask(raw) {
  const question = raw.trim();
  if (!question) return;
  chatLog.append(element("p", "bubble question", question), element("p", "bubble answer", answerFor(question)));
  chatLog.scrollTop = chatLog.scrollHeight;
}

document.querySelectorAll("[data-chat]").forEach((button) => button.addEventListener("click", () => {
  chat.showModal();
  chatLog.scrollTop = chatLog.scrollHeight;
}));
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll(".suggestions button").forEach((button) => button.addEventListener("click", () => ask(button.textContent)));
select("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  ask(questionInput.value);
  questionInput.value = "";
});

const sections = [...document.querySelectorAll("main > section")];
const navLinks = [...document.querySelectorAll("nav a")];
function updateNav() {
  const bottom = Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight;
  const section = bottom && scrollY > 0 ? sections.at(-1) : sections.findLast((item) => item.getBoundingClientRect().top <= 135) || sections[0];
  navLinks.forEach((link) => {
    const active = link.hash === `#${section.id}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
addEventListener("scroll", updateNav, { passive: true });
addEventListener("resize", updateNav);
updateNav();

const canvas = select("#orb-canvas");
const context = canvas.getContext("2d");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
let frame;
let previous = -Infinity;

function drawOrb(time) {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 2;
  const spin = time * .00024;
  context.clearRect(0, 0, size, size);
  for (let ribbon = 1; ribbon < 57; ribbon += 1) {
    const latitude = Math.PI * ribbon / 57;
    let drawing = false;
    context.beginPath();
    for (let point = 0; point <= 144; point += 1) {
      const angle = point * Math.PI / 72;
      const wave = Math.sin(angle * 3 + latitude * 4 + spin) * .14 + Math.cos(angle * 5 - latitude * 3 + spin * 2) * .065;
      const y = Math.cos(latitude + wave * Math.sin(latitude));
      const longitudeRadius = Math.sqrt(1 - y * y);
      const z = longitudeRadius * Math.cos(angle);
      const x = longitudeRadius * Math.sin(angle);
      const depth = z * .91 - y * .414;
      if (depth < 0) {
        drawing = false;
        continue;
      }
      const px = center + radius * x;
      const py = center + radius * (y * .91 + z * .414);
      if (drawing) context.lineTo(px, py);
      else context.moveTo(px, py);
      drawing = true;
    }
    const light = .26 + .27 * Math.sin(latitude) ** 2;
    context.strokeStyle = ribbon % 4 === 0 ? `rgba(255,177,145,${light})` : `rgba(255,113,116,${light * .6})`;
    context.lineWidth = ribbon % 4 === 0 ? 1.3 : .75;
    context.stroke();
  }
  const reflection = context.createRadialGradient(133, 96, 0, 155, 125, 190);
  reflection.addColorStop(0, "#fff1d76b");
  reflection.addColorStop(.48, "#ee945f23");
  reflection.addColorStop(1, "#e58d7500");
  context.fillStyle = reflection;
  context.fillRect(0, 0, size, size);
}

function animate(time) {
  if (time - previous >= 32) {
    drawOrb(time);
    previous = time;
  }
  frame = requestAnimationFrame(animate);
}

function updateMotion() {
  cancelAnimationFrame(frame);
  if (document.hidden || motion.matches) drawOrb(0);
  else frame = requestAnimationFrame(animate);
}

if (context) {
  updateMotion();
  motion.addEventListener("change", updateMotion);
  document.addEventListener("visibilitychange", updateMotion);
}
