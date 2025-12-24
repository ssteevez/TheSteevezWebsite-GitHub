let allEmails = [];
let currentFolder = 'Inbox';
let currentPage = 1;
const ITEMS_PER_PAGE = 50;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEmails();
});

async function loadEmails() {
    try {
        if (window.EMAIL_DATA) {
            allEmails = window.EMAIL_DATA;
            console.log("Loaded " + allEmails.length + " emails from data.js");
            updateCounts();
            renderEmailList();
        } else {
            throw new Error("window.EMAIL_DATA is not defined");
        }
    } catch (e) {
        console.error(e);
        document.getElementById('email-list-container').innerText = "Error loading data. Make sure data/data.js exists.";
    }
}

function updateCounts() {
    const inboxCount = allEmails.filter(e => e.folder === 'Inbox').length;
    const el = document.getElementById('count-inbox');
    if (el) el.innerText = inboxCount > 0 ? inboxCount : '';
}

function selectFolder(folderName) {
    currentFolder = folderName;
    currentPage = 1; // Reset page

    // UI Active State
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (folderName === 'Inbox') document.getElementById('nav-inbox').classList.add('active');
    if (folderName === 'Starred') document.getElementById('nav-starred').classList.add('active');
    if (folderName === 'Sent') document.getElementById('nav-sent').classList.add('active');

    showList(); // Always go back to list on folder change
    renderEmailList();
}

function showList() {
    document.getElementById('email-list-pane').style.display = 'flex';
    document.getElementById('reading-pane').style.display = 'none';
}

function nextPage() {
    const emailsInFolder = getFilteredEmails();
    const maxPage = Math.ceil(emailsInFolder.length / ITEMS_PER_PAGE);
    if (currentPage < maxPage) {
        currentPage++;
        renderEmailList();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderEmailList();
    }
}

function getFilteredEmails() {
    let emails = allEmails.filter(e => e.folder === currentFolder);
    // Sort Newest
    emails.sort((a, b) => new Date(b.date) - new Date(a.date));
    return emails;
}

function renderEmailList() {
    const container = document.getElementById('email-list-container');
    container.innerHTML = '';

    const emailsInFolder = getFilteredEmails();

    // Pagination Logic
    const totalItems = emailsInFolder.length;
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, totalItems);
    const displayedEmails = emailsInFolder.slice(startIdx, endIdx);

    // Update Text
    updatePaginationUI(startIdx + 1, endIdx, totalItems);

    if (displayedEmails.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#777">No emails here.</div>';
        return;
    }

    displayedEmails.forEach(email => {
        const el = document.createElement('div');
        el.className = 'email-item unread';

        const displayDate = formatDate(email.date);
        const fromName = extractName(email.from);
        const snippet = escapeHtml(email.snippet || '').substring(0, 100);

        let labelHtml = '';

        el.innerHTML = `
            <div class="row-check"><span class="material-icons" style="font-size:18px">check_box_outline_blank</span></div>
            <div class="row-star"><span class="material-icons">star_border</span></div>
            <div class="row-sender">${escapeHtml(fromName)}</div>
            <div class="row-content">
                ${labelHtml}
                <span class="row-subject-text">${escapeHtml(email.subject || '(No Subject)')}</span>
                <span class="row-snippet">${snippet}</span>
            </div>
            <div class="row-date">${displayDate}</div>
        `;

        el.addEventListener('click', () => {
            openEmail(email);
        });
        container.appendChild(el);
    });
}

function updatePaginationUI(start, end, total) {
    const text = total === 0 ? '0-0 of 0' : `${start}-${end} of ${total}`;
    const el = document.getElementById('page-info-top');
    if (el) el.innerText = text;
}

function openEmail(email) {
    // Switch View
    document.getElementById('email-list-pane').style.display = 'none';
    document.getElementById('reading-pane').style.display = 'flex';

    // Populate Data
    document.getElementById('email-subject').innerText = email.subject || '(No Subject)';
    document.getElementById('email-from-name').innerText = extractName(email.from);
    document.getElementById('email-from-address').innerText = extractEmail(email.from);
    document.getElementById('email-date').innerText = formatFullDate(email.date);
    document.getElementById('email-body').innerHTML = applyRedaction(email.body);

    const name = extractName(email.from);
    document.getElementById('sender-avatar').innerText = name.charAt(0).toUpperCase();
}

function applyRedaction(text) {
    if (!text) return "";

    // 1. Escape HTML first to prevent injection
    const safeText = escapeHtml(text);

    // 2. Tokenize (split by whitespace but keep delimiters to preserve formatting)
    // We split by spaces, tabs, newlines
    const tokens = safeText.split(/(\s+)/);

    // 3. Determine redaction dictionary for this render
    // User wants 30-50% redaction
    const redactionRate = 0.3 + Math.random() * 0.2; // 0.3 to 0.5

    const processedTokens = tokens.map(token => {
        // If it's whitespace, return as is
        if (/^\s+$/.test(token)) return token;

        // Random decision to redact
        if (Math.random() < redactionRate) {
            // SECURE REDACTION: Replace characters with garbage so copy-paste reveals nothing
            const garbage = generateGarbage(token.length);
            return `<span class="redacted">${garbage}</span>`;
        }
        return token;
    });

    return processedTokens.join('');
}

function generateGarbage(length) {
    const chars = "AXEHMK89"; // bulky characters to fill space
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


// --- UTILS ---
function extractName(fromStr) {
    if (!fromStr) return 'Unknown';
    if (fromStr.includes('<')) return fromStr.split('<')[0].trim().replace(/"/g, '');
    return fromStr;
}

function extractEmail(fromStr) {
    if (!fromStr) return '';
    if (fromStr.includes('<')) return '<' + fromStr.split('<')[1].trim();
    return '<' + fromStr + '>';
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Unknown Date";
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (d.getFullYear() === now.getFullYear()) {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
}

function formatFullDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
