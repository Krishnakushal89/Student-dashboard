// Global State
let students = JSON.parse(localStorage.getItem('students')) || [];
let isEditing = false;
let editingIndex = null;

// Grade Mapping System
const GRADE_POINTS = {
    'S': 10,
    'A': 9,
    'B': 8,
    'C': 7,
    'D': 6,
    'F': 0
};

document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    updateStats();
});

// --- Modal Functions ---
function openModal(editMode = false, index = null) {
    const modal = document.getElementById('studentModal');
    const container = document.getElementById('subjects-container');
    const form = document.getElementById('studentForm');

    modal.style.display = 'flex';
    container.innerHTML = ''; // Clear previous subjects

    if (editMode && index !== null) {
        isEditing = true;
        editingIndex = index;
        document.getElementById('modalTitle').innerText = "Edit Student";
        
        const student = students[index];
        document.getElementById('name').value = student.name;
        document.getElementById('email').value = student.email;
        document.getElementById('classVal').value = student.classVal;
        
        // Load existing subjects
        if (student.subjects && student.subjects.length > 0) {
            student.subjects.forEach(sub => addSubjectField(sub.subName, sub.grade));
        } else {
            addSubjectField(); // Add one empty if none exist
        }
        calculateGPA(); // Show current GPA
    } else {
        isEditing = false;
        editingIndex = null;
        document.getElementById('modalTitle').innerText = "Add Student";
        form.reset();
        addSubjectField(); // Add one empty row by default
        document.getElementById('gpa-calc').innerText = "0.0";
    }
}

function closeModal() {
    document.getElementById('studentModal').style.display = 'none';
}

window.onclick = function(e) {
    if (e.target == document.getElementById('studentModal')) closeModal();
}

// --- Dynamic Subject Logic ---
function addSubjectField(nameVal = '', gradeVal = 'S') {
    const container = document.getElementById('subjects-container');
    const div = document.createElement('div');
    div.classList.add('subject-row');
    
    div.innerHTML = `
        <input type="text" placeholder="Subject Name" class="sub-name" value="${nameVal}" required>
        <select class="sub-grade" onchange="calculateGPA()">
            <option value="S" ${gradeVal === 'S' ? 'selected' : ''}>S (10)</option>
            <option value="A" ${gradeVal === 'A' ? 'selected' : ''}>A (9)</option>
            <option value="B" ${gradeVal === 'B' ? 'selected' : ''}>B (8)</option>
            <option value="C" ${gradeVal === 'C' ? 'selected' : ''}>C (7)</option>
            <option value="D" ${gradeVal === 'D' ? 'selected' : ''}>D (6)</option>
            <option value="F" ${gradeVal === 'F' ? 'selected' : ''}>F (0)</option>
        </select>
        <button type="button" class="remove-btn" onclick="removeSubject(this)"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(div);
    calculateGPA();
}

function removeSubject(btn) {
    btn.parentElement.remove();
    calculateGPA();
}

// --- Business Logic: GPA Calculation ---
function calculateGPA() {
    const grades = document.querySelectorAll('.sub-grade');
    let totalPoints = 0;
    let count = 0;

    grades.forEach(select => {
        totalPoints += GRADE_POINTS[select.value];
        count++;
    });

    const gpa = count === 0 ? 0 : (totalPoints / count).toFixed(2);
    document.getElementById('gpa-calc').innerText = gpa;
    return gpa;
}

function saveStudent() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const classVal = document.getElementById('classVal').value;
    
    // Gather Subject Data
    const subjectRows = document.querySelectorAll('.subject-row');
    const subjects = [];
    
    subjectRows.forEach(row => {
        const subName = row.querySelector('.sub-name').value;
        const grade = row.querySelector('.sub-grade').value;
        if(subName) subjects.push({ subName, grade });
    });

    const gpa = calculateGPA(); // Get final GPA

    const studentData = { name, email, classVal, subjects, gpa };

    if (isEditing) {
        students[editingIndex] = studentData;
        showToast("Student updated successfully");
    } else {
        students.push(studentData);
        showToast("Student added successfully");
    }

    localStorage.setItem('students', JSON.stringify(students));
    closeModal();
    renderTable();
    updateStats();
}

function deleteStudent(index) {
    if(confirm('Delete this student?')) {
        students.splice(index, 1);
        localStorage.setItem('students', JSON.stringify(students));
        renderTable();
        updateStats();
        showToast("Student deleted");
    }
}

// --- Render & UI ---
function renderTable(data = students) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        document.getElementById('empty-state').style.display = 'block';
        return;
    }
    document.getElementById('empty-state').style.display = 'none';

    data.forEach((student, index) => {
        // Create subject summary (e.g., "Math: A, Science: S")
        const subSummary = student.subjects.map(s => `${s.subName}: ${s.grade}`).join(', ');
        
        // Determine badge color
        let badgeClass = 'badge-success';
        if (student.gpa < 6) badgeClass = 'badge-danger';
        else if (student.gpa < 8) badgeClass = 'badge-warning';

        const row = `
            <tr>
                <td>#${index + 1}</td>
                <td><strong>${student.name}</strong><br><small style="color:#888">${student.email}</small></td>
                <td>${student.classVal}</td>
                <td style="max-width: 200px; font-size: 0.85rem; color: #555;">${subSummary}</td>
                <td><span class="badge ${badgeClass}">${student.gpa}</span></td>
                <td>
                    <button class="btn btn-secondary" onclick="openModal(true, ${index})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-secondary" style="color:red" onclick="deleteStudent(${index})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function updateStats() {
    const total = students.length;
    
    let totalGPA = 0;
    let topStudentName = '-';
    let maxGPA = -1;

    students.forEach(s => {
        const currentGPA = parseFloat(s.gpa);
        totalGPA += currentGPA;
        if (currentGPA > maxGPA) {
            maxGPA = currentGPA;
            topStudentName = s.name;
        }
    });

    const avgGPA = total > 0 ? (totalGPA / total).toFixed(2) : 0;

    document.getElementById('total-students').innerText = total;
    document.getElementById('avg-gpa').innerText = avgGPA;
    document.getElementById('top-student').innerText = topStudentName;
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = students.filter(s => s.name.toLowerCase().includes(query));
    renderTable(filtered);
}

function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.className = "toast show";
    setTimeout(() => t.className = t.className.replace("show", ""), 3000);
}