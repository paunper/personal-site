"use strict";
history.scrollRestoration = "manual";
const profile = window.profile;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined && content !== null) node.textContent = content;
  return node;
}
$$("[data-name]").forEach(node => { node.textContent = profile.name; });
$$("[data-role]").forEach(node => { node.textContent = profile.role; });
$$("[data-personal-meta]").forEach(node => {
  node.textContent = [profile.gender, profile.age && profile.age + "岁"].filter(Boolean).join(" · ");
});
$("#intro").textContent = profile.intro;
$("#bio").textContent = profile.bio;
profile.skills.forEach(skill => $("#skills").append(el("span", "", skill)));
profile.metrics.forEach(item => {
  const metric = el("div", "metric");
  metric.append(el("p", "metric-value", item.value), el("p", "metric-label", item.label), el("p", "metric-note", item.note));
  $("#home-metrics").append(metric);
});

const projectDialog = $("#project-dialog");
function openProject(project) {
  $("#project-category").textContent = "实习实践 / " + project.category;
  $("#project-context").textContent = project.context;
  $("#project-title").textContent = project.title;
  $("#project-subtitle").textContent = project.subtitle;
  $("#project-tags").replaceChildren(...project.tags.map(tag => el("span", "", tag)));
  $("#project-detail").replaceChildren(...project.sections.map(item => {
    const section = el("section");
    section.append(el("h3", "", item.title), el("p", "", item.text));
    return section;
  }));
  projectDialog.showModal();
  projectDialog.scrollTop = 0;
}
function projectCard(project) {
  const card = el("button", "project-card");
  card.type = "button";
  card.setAttribute("aria-label", "查看实践详情：" + project.subtitle);
  card.dataset.category = project.category;
  const art = el("span", "card-art art-" + project.id);
  art.setAttribute("aria-hidden", "true");
  art.append(el("span", "card-number", project.metric), el("span", "card-art-label", project.metricLabel));
  const copy = el("span", "card-copy");
  const footer = el("span", "card-footer");
  footer.append(el("span", "", "华运国际物流 · 实习实践"), el("strong", "", "展开详情"));
  copy.append(el("span", "card-category", project.category), el("span", "card-title", project.title), el("span", "card-subtitle", project.subtitle), el("span", "card-summary", project.summary), footer);
  card.append(art, copy);
  card.addEventListener("click", () => openProject(project));
  return card;
}
profile.projects.forEach(project => {
  $("#home-projects").append(projectCard(project));
  $("#project-grid").append(projectCard(project));
});
function filterProjects(category) {
  let count = 0;
  $$("#project-grid .project-card").forEach(card => {
    const visible = category === "全部" || card.dataset.category === category;
    card.hidden = !visible;
    if (visible) count++;
  });
  $$("[data-filter]").forEach(button => {
    const selected = button.dataset.filter === category;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $("#filter-result").textContent = "显示 " + count + " 项实习实践" + (category === "全部" ? "" : " · " + category);
}
$$("[data-filter]").forEach(button => button.addEventListener("click", () => filterProjects(button.dataset.filter)));
filterProjects("全部");
$("[data-close]").addEventListener("click", () => projectDialog.close());
$("#project-experience-link").addEventListener("click", () => projectDialog.close());
projectDialog.addEventListener("click", event => {
  const rect = projectDialog.getBoundingClientRect();
  if (event.target === projectDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) projectDialog.close();
});

profile.experience.forEach(item => {
  const article = el("article", "experience-item");
  article.append(el("p", "experience-period", item.period), el("h3", "", item.company), el("p", "experience-role", item.role));
  const list = el("ul", "experience-highlights");
  item.highlights.forEach(highlight => {
    const row = el("li");
    row.append(el("h4", "", highlight.title), el("p", "", highlight.text));
    list.append(row);
  });
  article.append(list);
  $("#experience").append(article);
});

async function copyContact(value, label) {
  try {
    await navigator.clipboard.writeText(value);
    $("#copy-status").textContent = label + "已复制";
  } catch {
    $("#copy-status").textContent = "暂时无法自动复制，请直接选中" + label + "复制。";
  }
}
[
  {label:"电话", value:profile.phone, href:"tel:" + profile.phone},
  {label:"邮箱", value:profile.email, href:"mailto:" + profile.email}
].filter(item => item.value).forEach(item => {
  const row = el("div", "contact-row");
  const link = el("a");
  link.href = item.href;
  link.append(el("span", "", item.label), document.createTextNode(item.value));
  const copy = el("button", "copy-button", "复制");
  copy.type = "button";
  copy.setAttribute("aria-label", "复制" + item.label);
  copy.addEventListener("click", () => copyContact(item.value, item.label));
  row.append(link, copy);
  $("#profile-links").append(row);
});
function resumeText() {
  const lines = [profile.name + " · " + profile.role, [profile.gender, profile.age + "岁", profile.phone, profile.email].join(" · "), "", "个人介绍", profile.bio, "", "实习经历"];
  profile.experience.forEach(item => {
    lines.push(item.period + " | " + item.company + " | " + item.role);
    item.highlights.forEach(part => lines.push("• " + part.title + "：" + part.text));
    lines.push("");
  });
  lines.push("工具与方法", profile.skills.join(" · "));
  return lines.join("\n");
}
$("#download-resume").addEventListener("click", () => {
  const blob = new Blob(["\uFEFF" + resumeText()], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const anchor = el("a");
  anchor.href = url;
  anchor.download = profile.name + "-简历摘要.txt";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const chatLog = $("#chat-log");
const questionInput = $("#question");
function addMessage(role, text, sources = []) {
  const message = el("article", "message " + role);
  message.append(el("p", "message-label", role === "user" ? "你" : "HT · 资料问答"), el("p", "message-text", text));
  if (sources.length) {
    const links = el("div", "message-sources");
    [...new Set(sources)].forEach(source => {
      const link = el("a", "", "资料来源：" + (source === "about" ? "简历摘要" : "实习实践"));
      link.href = "#" + source;
      links.append(link);
    });
    message.append(links);
  }
  chatLog.append(message);
}
function resetChat() {
  const welcome = el("div", "chat-welcome");
  welcome.append(el("span", "welcome-symbol", "✳"), el("h2", "", "你好，我是" + profile.name + "。"), el("p", "", "你可以问我做过哪些工作、用过什么工具，或从一段实习经历开始了解我。"));
  chatLog.replaceChildren(welcome);
}
function experienceAnswer() {
  return profile.experience.map(item => [item.period + " · " + item.company + " · " + item.role, ...item.highlights.map(part => part.title + "：" + part.text)].join("\n\n")).join("\n\n");
}
function answerFor(question) {
  const answers = [];
  const sources = [];
  const text = question.toLowerCase();
  const include = (answer, source) => { answers.push(answer); sources.push(source); };
  if (/联系|联络|电话|手机|邮箱|邮件|号码|合作|contact|email|phone/.test(text)) {
    include("欢迎通过以下方式联系我：\n电话：" + profile.phone + "\n邮箱：" + profile.email, "about");
  }
  if (/年龄|几岁|多大|性别|\bage\b|\bgender\b/.test(text)) {
    include([profile.name, profile.gender, profile.age + "岁"].join("，") + "。", "about");
  }
  const categories = [];
  if (/listing|a\+|本地化|文案|sku|产品信息/.test(text)) categories.push("listing");
  if (/竞品|关键词|卖家精灵|asin|bsr/.test(text)) categories.push("research");
  if (/库存|fba|海外仓|erp|订单|发货|履约/.test(text)) categories.push("inventory");
  if (categories.length) {
    categories.forEach(id => {
      const project = profile.projects.find(item => item.id === id);
      include(project.subtitle + "\n\n" + project.sections.map(item => item.title + "：" + item.text).join("\n\n"), "projects");
    });
  } else if (/实习|经历|简历|履历|工作过|公司|experience|resume/.test(text)) {
    include(experienceAnswer(), "about");
  } else if (/实践|项目|作品|案例|做过|portfolio|project/.test(text)) {
    include("以下三项实践来自我在华运国际物流的同一段运营实习：\n\n" + profile.projects.map(item => item.subtitle + "\n" + item.summary).join("\n\n") + "\n\n可以在“实习与实践”页面展开每项工作的详情。", "projects");
  } else if (/技能|工具|擅长|能力|skill|tools/.test(text)) {
    include("我在实习中使用或接触的工具与方法包括：\n" + profile.skills.join("、") + "。\n\n具体工作覆盖内容优化、关键词与竞品监控，以及发货和库存管理。", "about");
  } else if (!answers.length && /介绍|你好|名字|姓名|是谁|做什么|方向|职业|负责|跨境|开发|运营|about|name|hello|hi\b/.test(text)) {
    include(profile.bio, "about");
  }
  return answers.length
    ? {text:answers.join("\n\n"), sources}
    : {text:"目前公开资料还没有覆盖这个问题。你可以问我个人介绍、实习经历、Listing 优化、竞品监控、库存管理或联系方式。", sources:[]};
}
function ask(raw) {
  const question = raw.trim().slice(0, 400);
  if (!question) return;
  const welcome = $(".chat-welcome");
  if (welcome) welcome.remove();
  addMessage("user", question);
  const answer = answerFor(question);
  addMessage("assistant", answer.text, answer.sources);
  chatLog.scrollTop = chatLog.scrollHeight;
}
$("#chat-form").addEventListener("submit", event => {
  event.preventDefault();
  ask(questionInput.value);
  questionInput.value = "";
  questionInput.focus({preventScroll:true});
});
questionInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    $("#chat-form").requestSubmit();
  }
});
$$(".suggestions button").forEach(button => button.addEventListener("click", () => ask(button.textContent)));
$("#reset-chat").addEventListener("click", resetChat);
resetChat();

const views = $$(".view");
const routes = {home:"首页",chat:"资料问答",projects:"实习与实践",about:"简历摘要"};
function showView(focusHeading = false) {
  const requested = location.hash.slice(1);
  if (requested === "main") return;
  const id = Object.hasOwn(routes, requested) ? requested : "home";
  if (projectDialog.open) projectDialog.close();
  views.forEach(view => { view.hidden = view.id !== id; });
  $$(".main-nav a").forEach(link => {
    const active = link.hash === "#" + id;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.title = profile.name + " · " + routes[id] + " · " + profile.role;
  window.scrollTo(0, 0);
  requestAnimationFrame(() => window.scrollTo(0, 0));
  if (focusHeading) {
    const title = $("#" + id + " h1");
    title.tabIndex = -1;
    title.focus({preventScroll:true});
  }
  updateMotion();
}
window.addEventListener("hashchange", () => showView(true));
window.addEventListener("popstate", () => showView(true));
document.addEventListener("click", event => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a[href^='#']");
  if (!link || !Object.hasOwn(routes, link.hash.slice(1))) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, "", link.hash);
  showView(true);
});
window.addEventListener("load", () => requestAnimationFrame(() => window.scrollTo(0, 0)));
$$("[data-contact-link]").forEach(link => link.addEventListener("click", () => {
  setTimeout(() => {
    const contact = $("#contact");
    contact.scrollIntoView({block:"center", behavior:motion.matches ? "auto" : "smooth"});
    const firstLink = contact.querySelector("a");
    if (firstLink) firstLink.focus({preventScroll:true});
  }, 60);
}));

const canvas = $("#orb-canvas");
const context = canvas.getContext("2d");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0;
let previous = -Infinity;
let orbInView = true;
function drawOrb(time) {
  if (!context) return;
  const size = canvas.width, center = size / 2, radius = center - 2, spin = time * .00017;
  context.clearRect(0, 0, size, size);
  for (let ribbon = 1; ribbon < 48; ribbon++) {
    const latitude = Math.PI * ribbon / 48;
    let drawing = false;
    context.beginPath();
    for (let point = 0; point <= 120; point++) {
      const angle = point * Math.PI / 60;
      const wave = Math.sin(angle * 3 + latitude * 4 + spin) * .14 + Math.cos(angle * 5 - latitude * 3 + spin * 2) * .065;
      const y = Math.cos(latitude + wave * Math.sin(latitude));
      const r = Math.sqrt(Math.max(0, 1 - y * y)), z = r * Math.cos(angle), x = r * Math.sin(angle);
      if (z * .91 - y * .414 < 0) { drawing = false; continue; }
      const px = center + radius * x, py = center + radius * (y * .91 + z * .414);
      if (drawing) context.lineTo(px, py); else context.moveTo(px, py);
      drawing = true;
    }
    context.strokeStyle = "rgba(220,241,203," + (.13 + .17 * Math.sin(latitude) ** 2) + ")";
    context.lineWidth = ribbon % 4 === 0 ? 1.3 : .8;
    context.stroke();
  }
}
function animate(time) {
  if (time - previous >= 48) { drawOrb(time); previous = time; }
  frame = requestAnimationFrame(animate);
}
function updateMotion() {
  cancelAnimationFrame(frame);
  if (!context) return;
  if (document.hidden || motion.matches || $("#home").hidden || !orbInView) drawOrb(0);
  else frame = requestAnimationFrame(animate);
}
motion.addEventListener("change", updateMotion);
document.addEventListener("visibilitychange", updateMotion);
if ("IntersectionObserver" in window) new IntersectionObserver(entries => {
  orbInView = entries[0].isIntersecting;
  updateMotion();
}).observe(canvas);
showView();

