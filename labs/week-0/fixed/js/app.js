const list = document.querySelector("#list");
const status = document.querySelector("#status");
let projects = [];

async function load() {
  status.textContent = "Loading…";
  try {
    const res = await fetch("data/projects.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    projects = await res.json();
    status.textContent = projects.length ? "" : "No projects yet.";
    render();
  } catch (e) {
    status.replaceChildren();
    status.append(`Could not load projects (${e.message}). `);
    const retry = document.createElement("button");
    retry.type = "button";
    retry.id = "retry";
    retry.textContent = "Retry";
    retry.addEventListener("click", load);
    status.append(retry);
  }
}

function render() {
  list.replaceChildren();
  for (const p of projects) {
    const li = document.createElement("li");
    li.textContent = p.name;
    list.append(li);
  }
}

// attached once, outside render()
document.querySelector("#add").addEventListener("click", () => {
  projects = [...projects, { name: "New project " + (projects.length + 1) }];
  render();
});

load();
