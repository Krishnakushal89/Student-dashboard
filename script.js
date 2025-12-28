/************* FIREBASE CONFIG *************/
const firebaseConfig = {
  apiKey: "AIzaSyAeY1qM4jux_6_8ZOmc_2dJ7Lc5rU9SeGc",
  authDomain: "student-dashboard-ba42d.firebaseapp.com",
  projectId: "student-dashboard-ba42d",
  storageBucket: "student-dashboard-ba42d.firebasestorage.app",
  messagingSenderId: "142660458170",
  appId: "1:142660458170:web:26028e833eb1ded8a85483"
};

/************* INITIALIZE FIREBASE (COMPAT) *************/
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/************* GLOBAL STATE *************/
let students = [];
let isEditing = false;
let editingId = null;

/************* GRADE SYSTEM *************/
const GRADE_POINTS = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  F: 0
};

/************* LOAD DATA *************/
document.addEventListener("DOMContentLoaded", () => {
  db.collection("students").onSnapshot(snapshot => {
    students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderTable();
    updateStats();
  });
});

/************* MODAL *************/
function openModal(edit = false, id = null) {
  document.getElementById("studentModal").style.display = "flex";
  document.getElementById("subjects-container").innerHTML = "";

  if (edit) {
    isEditing = true;
    editingId = id;
    document.getElementById("modalTitle").innerText = "Edit Student";

    const s = students.find(st => st.id === id);
    document.getElementById("name").value = s.name;
    document.getElementById("email").value = s.email;
    document.getElementById("classVal").value = s.classVal;

    s.subjects.forEach(sub =>
      addSubjectField(sub.subName, sub.grade)
    );
    calculateGPA();
  } else {
    isEditing = false;
    editingId = null;
    document.getElementById("modalTitle").innerText = "Add Student";
    document.getElementById("studentForm").reset();
    addSubjectField();
    document.getElementById("gpa-calc").innerText = "0.0";
  }
}

function closeModal() {
  document.getElementById("studentModal").style.display = "none";
}

window.onclick = function (e) {
  if (e.target === document.getElementById("studentModal")) {
    closeModal();
  }
};

/************* SUBJECTS *************/
function addSubjectField(name = "", grade = "S") {
  const div = document.createElement("div");
  div.className = "subject-row";

  div.innerHTML = `
    <input type="text" class="sub-name" placeholder="Subject Name" value="${name}" required>
    <select class="sub-grade" onchange="calculateGPA()">
      <option value="S" ${grade === "S" ? "selected" : ""}>S (10)</option>
      <option value="A" ${grade === "A" ? "selected" : ""}>A (9)</option>
      <option value="B" ${grade === "B" ? "selected" : ""}>B (8)</option>
      <option value="C" ${grade === "C" ? "selected" : ""}>C (7)</option>
      <option value="D" ${grade === "D" ? "selected" : ""}>D (6)</option>
      <option value="F" ${grade === "F" ? "selected" : ""}>F (0)</option>
    </select>
    <button type="button" class="remove-btn" onclick="removeSubject(this)">×</button>
  `;

  document.getElementById("subjects-container").appendChild(div);
  calculateGPA();
}

function removeSubject(btn) {
  btn.parentElement.remove();
  calculateGPA();
}

/************* GPA *************/
function calculateGPA() {
  let total = 0;
  let count = 0;

  document.querySelectorAll(".sub-grade").forEach(sel => {
    total += GRADE_POINTS[sel.value];
    count++;
  });

  const gpa = count === 0 ? "0.0" : (total / count).toFixed(2);
  document.getElementById("gpa-calc").innerText = gpa;
  return gpa;
}

/************* SAVE (FIXED) *************/
function saveStudent() {
  const nameVal = document.getElementById("name").value.trim();
  const emailVal = document.getElementById("email").value.trim();
  const classValVal = document.getElementById("classVal").value.trim();

  if (!nameVal || !emailVal || !classValVal) {
    alert("Please fill all fields");
    return;
  }

  const subjects = [];
  document.querySelectorAll(".subject-row").forEach(row => {
    const subName = row.querySelector(".sub-name").value;
    const grade = row.querySelector(".sub-grade").value;
    if (subName) subjects.push({ subName, grade });
  });

  const studentData = {
    name: nameVal,
    email: emailVal,
    classVal: classValVal,
    subjects,
    gpa: calculateGPA()
  };

  if (isEditing) {
    db.collection("students").doc(editingId).update(studentData);
    showToast("Student updated");
  } else {
    db.collection("students").add(studentData);
    showToast("Student added");
  }

  closeModal();
}

/************* DELETE *************/
function deleteStudent(id) {
  if (confirm("Delete this student?")) {
    db.collection("students").doc(id).delete();
    showToast("Student deleted");
  }
}

/************* TABLE *************/
function renderTable(list = students) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  if (list.length === 0) {
    document.getElementById("empty-state").style.display = "block";
    return;
  }
  document.getElementById("empty-state").style.display = "none";

  list.forEach((s, i) => {
    const subjectText = s.subjects
      .map(sub => `${sub.subName}: ${sub.grade}`)
      .join(", ");

    tbody.innerHTML += `
      <tr>
        <td>#${i + 1}</td>
        <td><strong>${s.name}</strong><br><small>${s.email}</small></td>
        <td>${s.classVal}</td>
        <td>${subjectText}</td>
        <td>${s.gpa}</td>
        <td>
          <button onclick="openModal(true,'${s.id}')">✏️</button>
          <button onclick="deleteStudent('${s.id}')">🗑️</button>
        </td>
      </tr>
    `;
  });
}

/************* STATS *************/
function updateStats() {
  document.getElementById("total-students").innerText = students.length;

  if (students.length === 0) {
    document.getElementById("avg-gpa").innerText = "0.0";
    document.getElementById("top-student").innerText = "-";
    return;
  }

  let total = 0;
  let top = students[0];

  students.forEach(s => {
    total += parseFloat(s.gpa);
    if (parseFloat(s.gpa) > parseFloat(top.gpa)) top = s;
  });

  document.getElementById("avg-gpa").innerText =
    (total / students.length).toFixed(2);
  document.getElementById("top-student").innerText = top.name;
}

/************* SEARCH *************/
function handleSearch() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  renderTable(students.filter(s => s.name.toLowerCase().includes(q)));
}

/************* TOAST *************/
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.className = "toast show";
  setTimeout(() => (t.className = "toast"), 3000);
}
