window.cropData = [];

fetch("Dataset/Crop_recommendation_dataset.csv")
  .then(res => res.text())
  .then(csv => {
    const rows = csv.trim().split("\n");
    const headers = rows[0].split(",");

    // TABLE HEADERS
    const headRow = document.getElementById("tableHead");
    headers.forEach(h => {
      const th = document.createElement("th");
      th.innerText = h;
      headRow.appendChild(th);
    });

    // TABLE BODY + DATA STORAGE
    rows.slice(1).forEach(row => {
      if (!row) return;
      const values = row.split(",");

      let obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = values[i].trim();
      });
      window.cropData.push(obj);

      const tr = document.createElement("tr");
      values.forEach(v => {
        const td = document.createElement("td");
        td.innerText = v;
        tr.appendChild(td);
      });
      document.getElementById("tableBody").appendChild(tr);
    });

    console.log("Dataset loaded:", window.cropData.length);
  })
  .catch(err => console.error("Dataset error:", err));

  