const list = document.querySelector("#list");
const status = document.querySelector("#status");
let projects = [];

async function load() {
  try {
    const res = await fetch("data/projects.json");
    projects = await res.json();
    render();
  } catch (e) {}
}

function render() {
  list.replaceChildren();
  for (const p of projects) {
    const li = document.createElement("li");
    li.textContent = p.name;
    list.append(li);
  }
  document.querySelector("#add").addEventListener("click", () => {
    projects = [...projects, { name: "New project " + (projects.length + 1) }];
    render();
  });
}

load();
