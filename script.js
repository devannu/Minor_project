// ---------------- LOGIN ----------------
const users = {
    admin: { username: "admin", password: "admin123" },
    security: { username: "sec", password: "sec123" },
    staff: { username: "staff", password: "staff123" },
    visitor: { username: "visitor", password: "visitor123" },
    registrar: { username: "reg", password: "reg123" },
};

function login() {
    const role = document.getElementById("role").value;
    const uname = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    if (!role || !uname || !pass) {
        msg.innerHTML = "Please enter all details!";
        msg.style.color = "red";
        return;
    }

    if (users[role].username === uname && users[role].password === pass) {
        localStorage.setItem("role", role);
        window.location.href = `${role}.html`;
    } else {
        msg.innerHTML = "Invalid login details!";
        msg.style.color = "red";
    }
}

// Logout Section
function logout() {
    localStorage.removeItem("role");
    window.location.href = "index.html";   // login page ka naam
}



// ---------------- ADD VISITOR (Manual Entry) + Duplicate Check ----------------

function handleAddVisitor() {
    let name = vname.value.trim();
    let phone = vphone.value.trim();
    let meet = vmeet.value.trim();
    let purpose = vpurpose.value.trim();
    let date = vdate.value;
    let timeIn = vtimein.value;

    // --- 1. Empty Validation ---
    if (!name || !phone || !meet || !purpose || !date || !timeIn) {
        alert("⚠ Please fill all fields!");
        return;
    }

    // --- 2. Create Visitor Record (Entry not saved now) ---
    let record = {
        id: Date.now(),
        name: name,
        phone: phone,
        meet: meet,
        purpose: purpose,
        date: date,
        timeIn: "",   // Entry will be recorded only after scan
        timeOut: "",
        status: "Pending"
    };

    // --- 3. Generate QR Code ---
    new QRious({
        element: document.getElementById("qrCanvas"),
        size: 220,
        value: JSON.stringify(record)
    });

    // --- 4. Auto Download QR ---
    setTimeout(() => {
        let link = document.createElement("a");
        link.download = `${name}_visitor_qr.png`;
        link.href = document.getElementById("qrCanvas").toDataURL("image/png");
        link.click();
    }, 300);

    // --- 5. Hide form after QR generated ---
    document.getElementById("visitorForm").style.display = "none";

    // --- 6. Show Success Message ---
    document.getElementById("msg").innerHTML = "✔ QR Generated! Please show it to the security guard.";
    document.getElementById("msg").style.color = "green";

}
// ---------------- QR GENERATE ----------------
function generateQR(visitor) {
    new QRious({
        element: document.getElementById("qrCanvas"),
        size: 200,
        value: JSON.stringify(visitor) // Store full details including ID
    });
}

function downloadQR() {
    const canvas = document.getElementById("qrCanvas");
    const link = document.createElement("a");
    link.download = "visitor_qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}


// ---------------- TABLE RENDER ----------------
function renderVisitorsTable(bodyId) {
    let data = JSON.parse(localStorage.getItem("visitors")) || [];
    let tbody = document.getElementById(bodyId);
    tbody.innerHTML = "";

    data.forEach((v, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${v.name}</td>
                <td>${v.phone}</td>
                <td>${v.purpose}</td>
                <td>${v.meet}</td>
                <td>${v.date}</td>
                <td>${v.timeIn}</td>
                <td>${v.timeOut || "-"}</td>
                <td>${v.status}</td>
            </tr>
        `;
    });
}


// ---------------- SCAN QR (ENTRY + EXIT) ----------------
function startScanner() {
    const qr = new Html5Qrcode("reader");

    qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decoded) => {
            qr.stop();
            let visitor = JSON.parse(decoded);

            updateVisitorFromQR(visitor);
        },
        () => {}
    );
}


// ---------------- ENTRY/EXIT UPDATE ----------------
function updateVisitorFromQR(visitor) {
    let data = JSON.parse(localStorage.getItem("visitors")) || [];

    // Check if visitor already exists
    let index = data.findIndex(v => v.id == visitor.id);

    if (index === -1) {
        // FIRST SCAN → ENTRY
        visitor.timeIn = new Date().toLocaleTimeString();
        visitor.timeOut = "";
        visitor.status = "In";

        data.push(visitor);

        alert(`✔ Entry Marked!\nVisitor: ${visitor.name}`);
    } else {
        // ENTRY ALREADY EXISTS → CHECK EXIT
        if (data[index].timeOut === "" || data[index].timeOut === null) {

            // SECOND SCAN → EXIT
            data[index].timeOut = new Date().toLocaleTimeString();
            data[index].status = "Out";

            alert(`✔ Exit Marked!\nVisitor: ${data[index].name}`);

        } else {
            // THIRD SCAN → BLOCK
            alert("⚠ Visitor already exited. Scan blocked.");
            return;
        }
    }

    // Save Updated Records
    localStorage.setItem("visitors", JSON.stringify(data));

    // Refresh Table (if exists)
    if (document.getElementById("visitor-table-body")) {
        renderVisitorsTable("visitor-table-body");
    }
}
// ---------------- CLEAR DATA ----------------
function clearVisitors() {
    if (confirm("Are you sure? This will delete all visitor records!")) {
        localStorage.removeItem("visitors");
        renderVisitorsTable("visitor-table-body");
    }
}




