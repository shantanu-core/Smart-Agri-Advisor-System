const API_BASE = window.location.origin;

// Convert markdown to plain readable text for table cells
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,3}\s/gm, '')
    .replace(/^[\-\*]\s/gm, '• ')
    .trim();
}

async function saveToHistory(entry) {
  try {
    await fetch(`${API_BASE}/api/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.error("Failed to save history:", err);
  }
}

async function loadHistory() {
  const historyBody = document.getElementById("historyBody");

  // reset select all checkbox
  const selectAllCb = document.getElementById("selectAllHistory");
  if (selectAllCb) selectAllCb.checked = false;
  toggleDeleteBtnVisibility();

  historyBody.innerHTML =
    '<tr><td colspan="12" style="text-align:center;color:#999;">Loading...</td></tr>';

  let entries = [];
  try {
    const res = await fetch(`${API_BASE}/api/history`);
    entries = await res.json();
  } catch (err) {
    historyBody.innerHTML =
      '<tr><td colspan="12" style="text-align:center;color:#d9534f;">⚠️ Could not connect to backend server.</td></tr>';
    console.error("Failed to load history:", err);
    return;
  }

  historyBody.innerHTML = "";

  if (entries.length === 0) {
    historyBody.innerHTML =
      '<tr><td colspan="12" style="text-align:center;color:#999;">No history yet.</td></tr>';
    return;
  }

  const isEditing =
    document.getElementById("toggleDeleteModeBtn").innerText === "Cancel";

  entries.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="delete-col" style="${isEditing ? "" : "display:none;"}"><input type="checkbox" class="history-checkbox" data-id="${item._id}" onchange="toggleDeleteBtnVisibility()"></td>
      <td>${index + 1}</td>
      <td>${item.temperature}</td>
      <td>${item.humidity}</td>
      <td>${item.nitrogen}</td>
      <td>${item.phosphorous}</td>
      <td>${item.potassium}</td>
      <td>${item.ph}</td>
      <td>${item.sunlight}</td>
      <td>${item.moisture || "N/A"}</td>
      <td class="time-col">${item.timestamp || "N/A"}</td>
      <td class="prediction-col" style="white-space:pre-wrap;">${stripMarkdown(item.prediction)}</td>
    `;
    historyBody.appendChild(tr);
  });
}

function toggleDeleteMode() {
  const isEditing = document.getElementById("toggleDeleteModeBtn").innerText === "Cancel";

  // Toggle columns
  const deleteCols = document.querySelectorAll('.delete-col');
  deleteCols.forEach(col => {
    col.style.display = isEditing ? "none" : "table-cell";
  });

  // Update buttons
  const toggleBtn = document.getElementById("toggleDeleteModeBtn");
  const clearAllBtn = document.getElementById("clearHistoryBtn");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const selectAllCb = document.getElementById('selectAllHistory');

  if (isEditing) {
    toggleBtn.innerText = "Select to Delete";
    toggleBtn.classList.remove("active-mode");
    clearAllBtn.style.display = "inline-block";
    deleteSelectedBtn.style.display = "none";
    if (selectAllCb) selectAllCb.checked = false;
    document.querySelectorAll('.history-checkbox').forEach(cb => cb.checked = false);
  } else {
    toggleBtn.innerText = "Cancel";
    toggleBtn.classList.add("active-mode");
    clearAllBtn.style.display = "none";
    deleteSelectedBtn.style.display = "none"; // only show if items checked
  }
}

async function clearHistory() {
  if (confirm("Are you sure you want to delete all prediction history?")) {
    try {
      await fetch(`${API_BASE}/api/history`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
    loadHistory();
  }
}

function toggleAllHistory() {
  const selectAll = document.getElementById('selectAllHistory').checked;
  const checkboxes = document.querySelectorAll('.history-checkbox');
  checkboxes.forEach(cb => cb.checked = selectAll);
  toggleDeleteBtnVisibility();
}

function toggleDeleteBtnVisibility() {
  const checkedBoxes = document.querySelectorAll('.history-checkbox:checked');
  const deleteBtn = document.getElementById('deleteSelectedBtn');
  if (deleteBtn) {
    deleteBtn.style.display = checkedBoxes.length > 0 ? "inline-block" : "none";
  }
}

async function deleteSelectedHistory() {
  const checkedBoxes = document.querySelectorAll('.history-checkbox:checked');
  if (checkedBoxes.length === 0) return;

  if (confirm(`Are you sure you want to delete ${checkedBoxes.length} selected record(s)?`)) {
    const ids = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-id'));

    try {
      await Promise.all(
        ids.map(id =>
          fetch(`${API_BASE}/api/history/${id}`, { method: "DELETE" })
        )
      );
    } catch (err) {
      console.error("Failed to delete selected entries:", err);
    }

    loadHistory();
  }
}
