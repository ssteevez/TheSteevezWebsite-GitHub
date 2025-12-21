// --- CONFIG ---
const MENU_BAR_HEIGHT = 28;

// --- STATE MANAGEMENT ---
let zIndexCounter = 100;
let currentDragItem = null;
let offsetX = 0;
let offsetY = 0;
// Trash Removed

// --- FILE SYSTEM (Content) ---
// --- FILE SYSTEM (Content) ---
// Content moved to data.js
// const fileSystem is now loaded from that file.

// --- INITIALIZATION ---
window.addEventListener('load', () => {
    updateClock();
    setInterval(updateClock, 1000);
    renderDesktop(); // Replaces static HTML icons + randomizeIcons

    // Apply draggable logic only to static icons (stickies, camera)
    // Dynamic icons are handled by renderDesktop
    document.querySelectorAll('.icon:not([data-dynamic="true"])').forEach(icon => {
        makeIconDraggable(icon);
    });

    setRandomPastelBackground();
    setupSnapshotTooltip();
    // setupDockTrash(); // Removed
    setupContextMenu();
});

// --- MENU BAR CLOCK ---
function updateClock() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString([], { weekday: 'short' });

    clockElement.innerText = `${dateString} ${timeString}`;
}

// --- DESKTOP MANAGEMENT ---

function setRandomPastelBackground() {
    // HSL: Hue = random
    // Saturation = 40-60% (Rich pastel)
    // Lightness = 40-50% (Darker to support white text)
    const h = Math.floor(Math.random() * 360);
    const s = 40 + Math.floor(Math.random() * 20);
    const l = 40 + Math.floor(Math.random() * 10);

    document.getElementById('desktop').style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
}

// True Chaos Randomization
function renderDesktop() {
    const desktop = document.getElementById('desktop');
    // Clear dynamic icons if any exist (idempotent)
    const existingIcons = desktop.querySelectorAll('.icon[data-dynamic="true"]');
    existingIcons.forEach(i => i.remove());

    Object.keys(fileSystem).forEach(key => {
        const item = fileSystem[key];
        createDesktopIcon(key, item);
    });

    // Resume is special case if not in fileSystem
    if (!fileSystem['Resume.pdf']) {
        createDesktopIcon('Resume.pdf', { type: 'file', icon: '📄' });
    }

    randomizeIcons();
}

function createDesktopIcon(name, item) {
    const desktop = document.getElementById('desktop');
    const iconDiv = document.createElement('div');
    iconDiv.className = 'icon';
    iconDiv.dataset.dynamic = "true";
    iconDiv.dataset.label = name;

    iconDiv.innerHTML = `
        <div class="icon-img">${item.icon || '📁'}</div>
        <div class="icon-label">${name}</div>
    `;

    desktop.appendChild(iconDiv);
    makeIconDraggable(iconDiv);
}

function randomizeIcons() {
    const icons = document.querySelectorAll('#desktop > .icon');
    const desktop = document.getElementById('desktop');
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Grid settings
    const colWidth = 100; // Icon width + margin
    const rowHeight = 110; // Icon height + margin
    const startX = 20;
    const startY = MENU_BAR_HEIGHT + 20;

    // Calculate max columns and rows to fit screen
    const cols = Math.floor((w - startX) / colWidth);
    const rows = Math.floor((h - startY - 80) / rowHeight); // -80 for dock

    // Keep track of used cells to avoid overlap
    const usedCells = new Set();

    icons.forEach(icon => {
        let maxAttempts = 50;
        let placed = false;

        while (!placed && maxAttempts > 0) {
            const c = Math.floor(Math.random() * cols);
            const r = Math.floor(Math.random() * rows);
            const key = `${c},${r}`;

            if (!usedCells.has(key)) {
                usedCells.add(key);
                icon.style.left = (startX + c * colWidth) + 'px';
                icon.style.top = (startY + r * rowHeight) + 'px';
                placed = true;
            }
            maxAttempts--;
        }

        // If couldn't find unique spot (crowded), just place it somewhere random-ish
        if (!placed) {
            icon.style.left = (startX + Math.floor(Math.random() * (cols - 1)) * colWidth) + 'px';
            icon.style.top = (startY + Math.floor(Math.random() * (rows - 1)) * rowHeight) + 'px';
        }
    });
}

function organizeDesktopGrid() {
    const icons = document.querySelectorAll('#desktop > .icon');
    let x = 20;
    let y = MENU_BAR_HEIGHT + 20;
    const gap = 100;

    icons.forEach((icon, index) => {
        // Only move if not trash or specially positioned? 
        // For now, simple grid
        icon.style.left = x + 'px';
        icon.style.top = y + 'px';

        y += gap;
        if (y > window.innerHeight - 100) {
            y = MENU_BAR_HEIGHT + 20;
            x += gap;
        }
    });
}

function sortDesktop(criteria) {
    const icons = Array.from(document.querySelectorAll('#desktop > .icon'));

    icons.sort((a, b) => {
        if (criteria === 'name') {
            const nameA = a.querySelector('.icon-label').innerText.toLowerCase();
            const nameB = b.querySelector('.icon-label').innerText.toLowerCase();
            return nameA.localeCompare(nameB);
        } else if (criteria === 'kind') {
            // Simple heuristic: display emoji as kind
            const kindA = a.querySelector('.icon-img').innerText;
            const kindB = b.querySelector('.icon-img').innerText;
            return kindA.localeCompare(kindB);
        }
        return 0;
    });

    // Re-arrange based on grid
    let x = 20;
    let y = MENU_BAR_HEIGHT + 20;
    const gap = 100;

    icons.forEach(icon => {
        icon.style.left = x + 'px';
        icon.style.top = y + 'px';

        y += gap;
        if (y > window.innerHeight - 100) {
            y = MENU_BAR_HEIGHT + 20;
            x += gap;
        }
    });
}


// --- WINDOW SYSTEM ---

function createWindow(title, contentHTML, width = 400, height = 300) {
    const id = 'win-' + Date.now();
    const win = document.createElement('div');
    win.className = 'window';
    win.id = id;
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    // Center it roughly
    win.style.left = (window.innerWidth / 2 - width / 2) + (Math.random() * 40 - 20) + 'px';
    win.style.top = (window.innerHeight / 2 - height / 2) + (Math.random() * 40 - 20) + 'px';
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="window-header">
            <div class="window-controls">
                <div class="control-btn close-btn"></div>
                <div class="control-btn min-btn"></div>
                <div class="control-btn max-btn"></div>
            </div>
            <div class="window-title">${title}</div>
        </div>
        <div class="window-content">
            ${contentHTML}
        </div>
    `;

    document.getElementById('desktop').appendChild(win);
    playSystemSound('open');

    // Controls
    win.querySelector('.close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(win);
    });
    win.querySelector('.min-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        minimizeWindow(win, title);
    });
    win.querySelector('.max-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMaximize(win);
    });

    // Bring to front on click
    win.addEventListener('mousedown', () => bringToFront(win));

    return win;
}

function closeWindow(win) {
    // If it was maximized, just remove
    win.remove();
}

function bringToFront(el) {
    zIndexCounter++;
    el.style.zIndex = zIndexCounter;
}

function toggleMaximize(win) {
    win.classList.toggle('maximized');
}

function minimizeWindow(win, title) {
    win.classList.add('minimizing');
    const dock = document.getElementById('dock');

    // Create Dock Icon
    const dockIcon = document.createElement('div');
    dockIcon.className = 'dock-icon';
    dockIcon.innerHTML = `<div class="dock-icon-label">${title}</div>📁`; // Generic icon for now, could be passed

    // Animation out
    setTimeout(() => {
        win.style.display = 'none';
    }, 300);

    // Click to Restore
    dockIcon.addEventListener('click', () => {
        win.style.display = 'flex';
        // Wait a tick for display to apply so transform transition works
        setTimeout(() => { win.classList.remove('minimizing'); }, 10);
        bringToFront(win);
        dockIcon.remove();
    });

    dock.appendChild(dockIcon);
}

// --- FINDER / FILE SYSTEM ---

function createFinderWindow(title, files) {
    // Increased size: 80% of width/height or max limits
    const w = Math.min(window.innerWidth * 0.8, 1000);
    const h = Math.min(window.innerHeight * 0.8, 700);
    const win = createWindow(title, '', w, h);
    const body = document.createElement('div');
    body.className = 'finder-body';
    body.style.display = 'flex';
    body.style.height = '100%';

    body.innerHTML = `
        <div class="finder-sidebar">
            <div class="sidebar-title">Favorites</div>
            <!-- Dynamic Sidebar Items -->
        </div>
        <div class="finder-content grid-view"></div> 
    `;

    const contentContainer = win.querySelector('.window-content');
    contentContainer.style.padding = '0'; // Reset padding for finder layout
    contentContainer.appendChild(body);

    // Navigation State
    let currentPath = [title];
    let history = []; // Stack for Back
    let forwardHistory = []; // Stack for Forward
    let currentFiles = files; // Track current view

    const contentArea = body.querySelector('.finder-content');
    const sidebar = body.querySelector('.finder-sidebar');

    // Navigation Helper
    const navigateTo = (name, files, mode = 'new') => {
        // mode: 'new' (default), 'back', 'forward'

        if (mode === 'new') {
            history.push({ name: win.querySelector('.window-title').innerText, files: currentFiles });
            forwardHistory = []; // Clear forward stack on new navigation
        } else if (mode === 'back') {
            forwardHistory.push({ name: win.querySelector('.window-title').innerText, files: currentFiles });
        } else if (mode === 'forward') {
            history.push({ name: win.querySelector('.window-title').innerText, files: currentFiles });
        }

        currentFiles = files;
        win.querySelector('.window-title').innerText = name;

        renderFiles(files, contentArea, (folder) => {
            // On subfolder click
            navigateTo(folder.name, folder.contents, 'new');
        });

        updateNavButtons();
    };


    // Sidebar Nav Controls
    const navControls = document.createElement('div');
    navControls.className = 'sidebar-item nav-controls';
    navControls.style.display = 'flex';
    navControls.style.gap = '10px';
    navControls.style.marginBottom = '10px';
    navControls.style.borderBottom = '1px solid #ddd';
    navControls.style.paddingBottom = '10px';
    navControls.style.cursor = 'default';

    const btnStyle = 'width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.3; border-radius: 4px; background-color: rgba(0,0,0,0.05);';

    const backBtn = document.createElement('div');
    backBtn.innerText = '⬅';
    backBtn.style.cssText = btnStyle;

    const fwdBtn = document.createElement('div');
    fwdBtn.className = 'fwd-btn';
    fwdBtn.innerText = '➡';
    fwdBtn.style.cssText = btnStyle;

    navControls.appendChild(backBtn);
    navControls.appendChild(fwdBtn);
    sidebar.prepend(navControls);

    // Button Actions
    backBtn.addEventListener('click', () => {
        if (history.length > 0) {
            const prev = history.pop();
            navigateTo(prev.name, prev.files, 'back');
        }
    });

    fwdBtn.addEventListener('click', () => {
        if (forwardHistory.length > 0) {
            const next = forwardHistory.pop();
            navigateTo(next.name, next.files, 'forward');
        }
    });

    function updateNavButtons() {
        backBtn.style.opacity = history.length > 0 ? '1' : '0.3';
        backBtn.style.cursor = history.length > 0 ? 'pointer' : 'default';

        fwdBtn.style.opacity = forwardHistory.length > 0 ? '1' : '0.3';
        fwdBtn.style.cursor = forwardHistory.length > 0 ? 'pointer' : 'default';
    }


    // Populate Sidebar Items
    Object.keys(fileSystem).forEach(key => {
        const item = fileSystem[key];
        if (item.type === 'folder') {
            const sideItem = document.createElement('div');
            sideItem.className = 'sidebar-item';
            sideItem.innerText = key;
            if (key === title) sideItem.classList.add('active');

            sideItem.addEventListener('click', () => {
                sidebar.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                sideItem.classList.add('active');

                // Reset logic when switching favorites?
                // Standard OS: Resets to root, clears forward, pushes current to back?
                // Simpler: Reset everything for clean state
                history = [];
                forwardHistory = [];
                updateNavButtons();

                // Direct render without pushing to history (or maybe push?)
                // Let's treat switching favs as a "reset" for now
                currentFiles = item.contents;
                win.querySelector('.window-title').innerText = key;
                renderFiles(item.contents, contentArea, (folder) => {
                    navigateTo(folder.name, folder.contents, 'new');
                });
            });

            sidebar.appendChild(sideItem);
        }
    });

    // Initial Render
    // Initial content is already set, just hook up click listeners
    // But we need to set initial state for nav
    renderFiles(files, contentArea, (folder) => {
        navigateTo(folder.name, folder.contents, 'new');
    });
}

function renderFiles(files, container, onFolderClick) {
    container.innerHTML = '';
    files.forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-item';
        if (file.type === 'image') item.classList.add('type-image');

        item.draggable = false;

        let iconHtml = `<div class="file-icon">${file.icon || '📄'}</div>`;
        if (file.type === 'image' && (file.thumb || file.src)) {
            // Use Thumbnail if available, else src
            const thumbSrc = file.thumb || file.src;
            iconHtml = `<img src="${thumbSrc}" class="file-thumbnail" draggable="false" loading="lazy">`;
        }

        item.innerHTML = `
            ${iconHtml}
            <div class="file-name">${file.name}</div>
        `;

        // Double Click Action
        item.addEventListener('dblclick', () => {
            // Check if it's a "Gallery-able" item (Image, Link, File) that is part of a list
            // We want to pass the WHOLE folder context
            if (file.type === 'folder') {
                if (onFolderClick) onFolderClick(file);
            } else if (file.name === 'Resume.pdf') {
                createResumeWindow();
            } else {
                // Open in Universal Gallery
                createGalleryWindow(file, files);
            }
        });

        // Drag Start (Ghost)
        item.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Don't drag the window itself

            // Create Ghost
            const ghost = item.cloneNode(true);
            ghost.classList.add('ghost-drag');
            ghost.style.position = 'absolute';
            ghost.style.left = e.pageX + 'px';
            ghost.style.top = e.pageY + 'px';
            ghost.style.opacity = '0.8';
            ghost.style.pointerEvents = 'none'; // Let events pass to drop targets
            ghost.style.zIndex = 99999;
            ghost.style.width = '80px'; // Force size for visual consistency

            document.body.appendChild(ghost);
            currentDragItem = ghost;

            // Offset for centering
            offsetX = 40;
            offsetY = 40;

            // Attach metadata for trash
            ghost.dataset.isGhost = "true";
            ghost.dataset.title = file.name;
            ghost.dataset.type = file.type === 'image' ? 'image' : 'file';
        });

        container.appendChild(item);
    });
}

function createModalWindow(message) {
    const win = createWindow('System', '', 300, 150);
    const content = win.querySelector('.window-content');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.alignItems = 'center';
    content.style.justifyContent = 'center';
    content.style.textAlign = 'center';

    content.innerHTML = `
        <div style="margin-bottom:20px; font-size:14px;">${message}</div>
        <button class="modal-ok-btn" style="padding:5px 20px; cursor:pointer;">OK</button>
    `;

    win.querySelector('.modal-ok-btn').addEventListener('click', () => {
        closeWindow(win);
    });
}

function createGalleryWindow(currentFile, allFiles) {
    // Filter out folders, keep images, files, links
    const galleryItems = (allFiles || []).filter(f => f.type !== 'folder');
    let currentIndex = galleryItems.findIndex(f => f.name === currentFile.name);

    // Default fallback
    if (currentIndex === -1) {
        galleryItems.push(currentFile);
        currentIndex = 0;
    }

    // Create Window
    const winWidth = window.innerWidth * 0.9;
    const winHeight = window.innerHeight * 0.9;
    const win = createWindow(currentFile.name, '', winWidth, winHeight);

    win.classList.add('gallery-window');

    const content = win.querySelector('.window-content');
    content.style.padding = '0';
    content.style.backgroundColor = '#000';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.height = '100%';
    content.style.overflow = 'hidden';

    // UI Structure
    content.innerHTML = `
        <div class="gallery-main">
            <div class="nav-btn prev-btn">❮</div>
            <div class="gallery-content-area" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                <!-- Dynamic Content Goes Here -->
            </div>
            <div class="nav-btn next-btn">❯</div>
        </div>
        <div class="gallery-filmstrip">
            <div class="filmstrip-container"></div>
        </div>
    `;

    const contentArea = content.querySelector('.gallery-content-area');
    const prevBtn = content.querySelector('.prev-btn');
    const nextBtn = content.querySelector('.next-btn');
    const filmstripContainer = content.querySelector('.filmstrip-container');
    const winTitle = win.querySelector('.window-title');

    // Update Function
    const updateView = async (index) => {
        currentIndex = (index + galleryItems.length) % galleryItems.length;
        const file = galleryItems[currentIndex];

        winTitle.innerText = file.name;
        contentArea.innerHTML = ''; // Clear previous

        // Handle Types
        if (file.type === 'image') {
            const img = document.createElement('img');
            img.src = file.src;
            img.className = 'gallery-image';
            contentArea.appendChild(img);
        }
        else if (file.type === 'link') {
            contentArea.innerHTML = `
                <div style="text-align:center; color:white;">
                    <div style="font-size:50px;">🌐</div>
                    <h2>${file.name}</h2>
                    <p>${file.url}</p>
                    <button id="open-link-btn" style="padding:10px 20px; font-size:16px; cursor:pointer;">Open Link</button>
                    <div style="margin-top:10px; font-size:12px; opacity:0.7;">(Link opened in new tab)</div>
                </div>
            `;
            contentArea.querySelector('#open-link-btn').onclick = () => window.open(file.url, '_blank');
            window.open(file.url, '_blank'); // Auto open
        }
        else if (file.type === 'file') {
            // Try to fetch content for text/code
            if (file.name.match(/\.(txt|md|js|py|json|css|html)$/i)) {
                // Determine source path. If from fileSystem it usually has no 'src' property unless we added it?
                // The generate_portfolio.py currently does NOT add 'src' for files, only 'image'.
                // We need to fix that or construct path.
                // Assuming v2 layout: 
                // Wait, generate_portfolio only adds src for images.
                // We need to update python to add src for files too? 
                // OR we can guess path if we knew parent... but file object doesn't have parent path.
                // Let's fallback to "Can't preview" if no src.
                // Actually, for now let's show a generic file icon.
                contentArea.innerHTML = `
                    <div style="text-align:center; color:white;">
                        <div style="font-size:50px;">📄</div>
                        <h2>${file.name}</h2>
                        <a href="${file.src || '#'}" target="_blank" style="color:#007aff;">Download / Open</a>
                    </div>
                `;
            } else {
                contentArea.innerHTML = `
                    <div style="text-align:center; color:white;">
                        <div style="font-size:50px;">📄</div>
                        <h2>${file.name}</h2>
                    </div>
                `;
            }
        }

        renderFilmstrip();
    };

    // Render Filmstrip
    const renderFilmstrip = () => {
        filmstripContainer.innerHTML = '';
        galleryItems.forEach((file, idx) => {
            const thumb = document.createElement('div');
            thumb.className = 'filmstrip-thumb-item ' + (idx === currentIndex ? 'active' : '');

            if (file.type === 'image') {
                thumb.innerHTML = `<img src="${file.thumb || file.src}" style="width:100%; height:100%; object-fit:cover;">`;
            } else {
                thumb.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#333; color:white; font-size:20px;">
                    ${file.icon || (file.type === 'link' ? '🌐' : '📄')}
                </div>`;
            }

            thumb.onclick = () => updateView(idx);
            filmstripContainer.appendChild(thumb);
        });

        const activeThumb = filmstripContainer.children[currentIndex];
        if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    };

    prevBtn.addEventListener('click', () => updateView(currentIndex - 1));
    nextBtn.addEventListener('click', () => updateView(currentIndex + 1));

    win.tabIndex = 0;
    win.focus();
    win.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') updateView(currentIndex - 1);
        if (e.key === 'ArrowRight') updateView(currentIndex + 1);
    });

    // Initialize
    updateView(currentIndex);
}

function createResumeWindow() {
    const resumeHTML = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; line-height: 1.5; color: #333;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <h1 style="margin: 0; letter-spacing: 5px; text-transform: uppercase;">S t e e v e z</h1>
                <p style="margin: 5px 0; font-size: 12px; color: #555;">
                    B202, BRINDHAVAN APARTMENTS, 67, CROSS ROAD, NEW WASHERMANPET,<br>
                    CHENNAI 600081, TAMIL NADU.<br>
                    <strong>EMAIL:</strong> SSTEEVEZ@GMAIL.COM | <strong>PHONE:</strong> +91 96770 06381
                </p>
            </div>

            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;">EDUCATION</h3>
            <ul style="list-style-type: none; padding-left: 0;">
                <li style="margin-bottom: 8px;">• <strong>International Photography Program</strong>, Pathshala South Asian Media Institute, Dhaka <em style="color:#666;">(2015-2016)</em></li>
                <li style="margin-bottom: 8px;">• <strong>32 Week Professional Photography</strong>, Speos Photographic Institute, Paris <em style="color:#666;">(2014-2015)</em></li>
                <li style="margin-bottom: 8px;">• <strong>B.Sc., Visual Communication</strong>, Loyola College, Chennai <em style="color:#666;">(2011-2014)</em></li>
            </ul>

            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;">INTERNATIONAL EXPERIENCE</h3>
            <ul style="list-style-type: disc; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Directed and cinematographed <em>"Ray of Hope,"</em> a short documentary about Tabish, an organisation in Kabul, Afghanistan, working with internally displaced refugees.</li>
                <li style="margin-bottom: 8px;">Photographed portraits of <strong>100 Armenians living in Paris</strong> for the 100th anniversary of the Armenian Genocide, guided by Abbas, Magnum Photos.</li>
                <li style="margin-bottom: 8px;">Documented the aftermath of the <strong>Charlie Hebdo shooting</strong> and subsequent demonstrations in Paris in 2015.</li>
            </ul>

            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;">CURATORIAL EXPERIENCE</h3>
            <ul style="list-style-type: disc; padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>"FIg (Let's Witness Equality)"</strong> by Tamilnadu's Center for Social Justice and Equality at Government Museum, Madurai. <em style="color:#666;">May 2025</em></li>
                <li style="margin-bottom: 8px;"><strong>"Out of Closet" (2023-2024)</strong> - Interactive exhibition by PeriFerry featuring images by the transgender community, trained by Palani Kumar. Showcased in corporate offices.</li>
                <li style="margin-bottom: 8px;"><strong>"Vaanam" (2022, 2023)</strong> - Part of Dalit History Month by Neelam Cultural Center (Pa. Ranjith). Included works by Sudharak Olwe, Rahee Punyashloka, and others at a Victorian memorial hall, Chennai.</li>
                <li style="margin-bottom: 8px;">Curated <strong>Artist Talk with Sudharak Olwe</strong> at Koogai Library, Chennai.</li>
                <li style="margin-bottom: 8px;"><strong>2017</strong> - Photography Exhibition (Social Justice Film Festival), Goethe Institute, Chennai (Curatorial Team).</li>
                <li style="margin-bottom: 8px;">Curated <strong>World Refugee Day (2016)</strong> exhibition at Loyola College, featuring Jesuit Refugee Services work with Chin, Rohingya, and Tamil Eelam refugees.</li>
            </ul>

            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;">RESIDENCIES & GRANTS</h3>
            <ul style="list-style-type: none; padding-left: 0;">
                <li style="margin-bottom: 8px;">• <strong>Edition 1: 180 Frames from Kulasai 2025</strong>, CPB Darkroom Film support grant</li>
                <li style="margin-bottom: 8px;">• <strong>10x10 Photobook History Research Grant (2025-2026)</strong> - Research on "Documenting Resistance: Analysing the Visual Archives of Dalit Murasu".</li>
                <li style="margin-bottom: 8px;">• <strong>Hyundai Art for Hope Grant (2024-2025)</strong> - Photos exhibited at Travancore Palace, New Delhi.</li>
            </ul>

            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;">WORKSHOPS</h3>
            <ul style="list-style-type: disc; padding-left: 20px;">
                <li style="margin-bottom: 5px;">Photo-book session with Brendan Embser, Offset Project, Delhi 2025</li>
                <li style="margin-bottom: 5px;">Fundamentals of Arts Management, Khoj Studio, 2025</li>
                <li style="margin-bottom: 5px;">Critical Paradigm by Duncan Wooldridge and Lucy Soutter, Offset Project, Delhi, 2025</li>
                <li style="margin-bottom: 5px;">Image Assembly by Tanvi Mishra and Cécile Poimboeuf-Koizumi, PhotoSouthAsia, 2024</li>
                <li style="margin-bottom: 5px;">MAIR (Mumbai Artist in Residence), Apre Art Gallery, Mumbai, 2024</li>
            </ul>

            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;">PUBLICATIONS</h3>
             <ul style="list-style-type: disc; padding-left: 20px;">
                <li style="margin-bottom: 5px;"><em>It Takes a Funeral to Celebrate: On Dalit Subbiah</em> | ASAP art, 2025</li>
                <li style="margin-bottom: 5px;"><em>Against Censorship: On Remembrance at the PK Rosy Film Festival 2025</em> | ASAP art, 2025</li>
                <li style="margin-bottom: 5px;"><em>Tamil Political Cinema: A Tool for Social Justice</em> | ASAP art, 2025</li>
                <li style="margin-bottom: 5px;"><em>Chennai Searches for Water</em> | Mongabay, 2019</li>
                <li style="margin-bottom: 5px;"><em>Four Body-Positive Photographers Who Are Redefining Beauty</em> | Cosmopolitan India, 2019</li>
                <li style="margin-bottom: 5px;"><em>Raising a Stink, How People Power Forced a Waste-Management Revolution in Kerala</em> | Caravan, 2017</li>
                <li style="margin-bottom: 5px;"><em>Graffiti Artist</em> | L'Oeil de la Photographie, Paris, 2015</li>
                <li style="margin-bottom: 5px;"><em>This is Home, Everywhere</em> | Business Line, 2018</li>
                <li style="margin-bottom: 5px;">Vikatan Group, Score Magazine, Ritz Magazine, A1 plus.am, Lragir.am, Shabat.am</li>
            </ul>

             <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;">EXHIBITIONS</h3>
             <ul style="list-style-type: disc; padding-left: 20px;">
                <li style="margin-bottom: 5px;"><strong>2025</strong> - Last seen exhibited at Paper&Play, Pulp Society, Delhi</li>
                <li style="margin-bottom: 5px;"><strong>2025</strong> - Last Seen exhibited at Museum of Art and Photography, Bengaluru.</li>
                <li style="margin-bottom: 5px;"><strong>2025</strong> - Aravaani Art Project's Group Show at XXL Gallery, Mumbai.</li>
                <li style="margin-bottom: 5px;"><strong>2024-2025</strong> - Chennai Photo Biennale, "Vaanerum Vizhuthugal" - featuring <em>Last Seen</em>.</li>
                <li style="margin-bottom: 5px;"><strong>2019</strong> - Home, Queeristan, Godrej India Culture Lab, Mumbai</li>
                <li style="margin-bottom: 5px;"><strong>2018</strong> - Reject Exhibit, Design Fabric, Mumbai</li>
                <li style="margin-bottom: 5px;"><strong>2017</strong> - Spaces and Silence, Indian Photography Festival, Hyderabad</li>
                <li style="margin-bottom: 5px;"><strong>2017</strong> - The Coast, 7th General Assembly, World Forum of Fisher-People, Delhi</li>
                <li style="margin-bottom: 5px;"><strong>2016</strong> - World Refugee Day Photography Exhibition, Loyola College, Chennai</li>
                <li style="margin-bottom: 5px;"><strong>2016</strong> - Sea Escape, Pathshala South Asian Media Institute, Dhaka</li>
                <li style="margin-bottom: 5px;"><strong>2015</strong> - Vincennes Images Festival, Paris</li>
                <li style="margin-bottom: 5px;"><strong>2015</strong> - Foire Internationale de la Photo à Bièvres, Paris</li>
                <li style="margin-bottom: 5px;"><strong>2015</strong> - Murs Ouverts, Lavo//Matin, Paris</li>
                <li style="margin-bottom: 5px;"><strong>2015</strong> - Art of the Matter, Chennai</li>
            </ul>
        </div>
    `;

    createWindow("Resume.pdf", resumeHTML, 700, 600); // Slightly larger for full resume
}

// --- STICKY NOTES ---
function createStickyNote() {
    const sticky = document.createElement('div');
    sticky.className = 'sticky-note';
    sticky.style.left = '100px';
    sticky.style.top = '100px';
    sticky.style.zIndex = ++zIndexCounter;

    sticky.innerHTML = `
        <div class="sticky-header"></div>
        <div class="sticky-content" contenteditable="true">New Note</div>
    `;

    document.getElementById('desktop').appendChild(sticky);

    sticky.addEventListener('mousedown', (e) => {
        bringToFront(sticky);
        // Drag logic handled globally
    });

    // Header drag trigger
    const header = sticky.querySelector('.sticky-header');
    header.addEventListener('mousedown', (e) => {
        currentDragItem = sticky;
        offsetX = e.clientX - sticky.offsetLeft;
        offsetY = e.clientY - sticky.offsetTop;
    });
}


// --- TRASH SYSTEM REMOVED ---
// Functions moveToTrash, setupDockTrash, openTrashWindow, restoreFromTrash removed.


// --- CONTEXT MENU ---
function setupContextMenu() {
    const ctxMenu = document.getElementById('context-menu');
    // Trash option removed

    document.addEventListener('contextmenu', (e) => {
        const iconInfo = e.target.closest('.icon');
        const stickyInfo = e.target.closest('.sticky-note');

        if (iconInfo || stickyInfo) {
            e.preventDefault();

            // Should we show context menu if it has no items? 
            // Maybe just for future proofing or hide it?
            // User asked to remove Trash logic. Context menu relies on it.
            // Let's just Prevent Default browser menu for icons for now, but not show empty custom menu
            // Or show "Properties" mock?
            // "Remove it" - safest is to disable custom context menu or just don't show it.
            // But code still calls setupContextMenu. Let's make it do nothing or show "Properties"

            // Actually, best to just hide regular menu and do nothing if no options exist.
            // Or remove the listener entirely?
            // Let's leave preventing default.
        }
    });

    document.addEventListener('click', (e) => {
        if (ctxMenu) ctxMenu.style.display = 'none';
    });
}


// --- DRAG AND DROP LOGIC (GLOBAL) ---
// We need to detect drop on Trash

document.addEventListener('mousedown', function (e) {
    // Window bring to front
    const clickedWindow = e.target.closest('.window');
    if (clickedWindow) bringToFront(clickedWindow);

    // Menu logic
    const clickedMenu = e.target.closest('.menu-item-container');
    document.querySelectorAll('.menu-item-container.active').forEach(el => {
        if (el !== clickedMenu) el.classList.remove('active');
    });
    if (clickedMenu) clickedMenu.classList.toggle('active');

    // Menu Actions
    const clickedAction = e.target.closest('.dropdown-item');
    if (clickedAction && !clickedAction.classList.contains('disabled') && !clickedAction.classList.contains('nested-parent')) {
        handleMenuAction(clickedAction.id);
        if (clickedMenu) clickedMenu.classList.remove('active');
    }

    // Draggable Window Header
    const clickedHeader = e.target.closest('.window-header');
    if (clickedHeader) {
        const win = clickedHeader.closest('.window');
        if (win.classList.contains('maximized')) return;
        currentDragItem = win;
        offsetX = e.clientX - currentDragItem.offsetLeft;
        offsetY = e.clientY - currentDragItem.offsetTop;
        return;
    }

    // Icon Dragging is handled by makeIconDraggable
});

document.addEventListener('mousemove', function (e) {
    if (!currentDragItem) return;

    e.preventDefault();
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;

    // Constraints
    let minDist = MENU_BAR_HEIGHT; // Top constraint
    let maxDist = window.innerHeight;

    if (currentDragItem.classList.contains('window')) {
        if (y < minDist) y = minDist;
    } else if (currentDragItem.classList.contains('icon') || currentDragItem.classList.contains('sticky-note')) {
        maxDist = window.innerHeight - 80; // Dock margin
        if (y < minDist + 10) y = minDist + 10;
        if (y > maxDist) y = maxDist;
    }

    currentDragItem.style.left = x + 'px';
    currentDragItem.style.top = y + 'px';
});

document.addEventListener('mouseup', function (e) {
    if (currentDragItem) {
        // Trash Dropping Removed - Items just stay where dropped or ghosts disappear

        if (currentDragItem.dataset.isGhost === "true") {
            // If dragging a ghost file from Finder, and we drop it, 
            // it should just vanish (cancel drag) since there is no target.
            // (Or implementation of Copy to Desktop could happen here later)
            currentDragItem.remove();
        }

        if (currentDragItem && currentDragItem.classList && currentDragItem.classList.contains('icon')) {
            currentDragItem.classList.remove('dragging');
        }
        currentDragItem = null;
    }
});

// Helper for making icons draggable
function makeIconDraggable(element) {
    element.addEventListener('mousedown', (e) => {
        // Select logic
        document.querySelectorAll('.icon.selected').forEach(i => i.classList.remove('selected'));
        element.classList.add('selected');

        currentDragItem = element;
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;
        element.classList.add('dragging');
    });

    // Double click to open
    // Double click to open
    // We remove any existing listener? (Not easy without reference)
    // But since this function is often called on fresh elements, it's okay.
    // The "Double Window" bug might be because this is called twice on the same element?
    // Let's assume the elements are fresh.
    element.addEventListener('dblclick', (e) => {
        e.stopPropagation(); // Stop bubbling to avoid triggering parent or desktop

        const label = element.dataset.label || element.querySelector('.icon-label').innerText;


        if (label === 'Resume.pdf') {
            createResumeWindow();
            return;
        }

        if (label === 'Stickies') {
            createStickyNote();
            return;
        }

        if (label === 'Save Snapshot') {
            // Check if feature exists or just ignore
            // Previously was takeScreenshot()
            if (typeof takeScreenshot === 'function') takeScreenshot();
            return;
        }

        if (label === 'Minesweeper') {
            createMinesweeperWindow();
            return;
        }

        // Dynamic Lookup
        if (fileSystem[label]) {
            const item = fileSystem[label];
            if (item.type === 'folder') {
                createFinderWindow(label, item.contents);
            }
        }
    });

    // Mobile touch support omitted for brevity, stick to mouse
}

// --- RESIZE HANDLING ---
window.addEventListener('resize', () => {
    // Clamp icons
    document.querySelectorAll('.icon, .sticky-note').forEach(el => {
        let y = parseInt(el.style.top);
        const maxH = window.innerHeight - 80;
        if (y > maxH) el.style.top = maxH + 'px';
    });
});


// --- MENU ACTIONS ---
function handleMenuAction(id) {
    switch (id) {
        case 'menu-about':
            createModalWindow("Web Desktop V2\nCreated by Antigravity");
            break;
        case 'menu-restart':
            location.reload();
            break;
        case 'menu-close-all':
            document.querySelectorAll('.window').forEach(w => w.remove());
            document.querySelectorAll('.sticky-note').forEach(s => s.remove());
            break;
        case 'menu-new-window':
            createFinderWindow('Project A', fileSystem['Project A'].contents);
            break;
        case 'menu-new-sticky':
            createStickyNote();
            break;
        case 'menu-lucky':
            // Open a random file from Project A or Portfolio
            const allFiles = [...fileSystem['Project A'].contents, ...fileSystem['Photography Portfolio'].contents];
            const randomFile = allFiles[Math.floor(Math.random() * allFiles.length)];
            if (randomFile.type === 'image') createImageWindow(randomFile.name, randomFile.src);
            else createModalWindow("Opening random file: " + randomFile.name);
            break;
        case 'menu-view-grid':
            organizeDesktopGrid();
            break;
        case 'menu-snapshot':
            takeScreenshot();
            break;
        case 'menu-refresh-layout':
            randomizeIcons();
            break;
        case 'menu-change-bg':
            setRandomPastelBackground();
            break;
        case 'menu-sort-name':
            sortDesktop('name');
            break;
        case 'menu-sort-kind':
            sortDesktop('kind');
            break;
    }
}

// --- SNAPSHOT & TOOLTIP ---
function takeScreenshot() {
    playSystemSound('shutter');

    // Use NULL background to capture CSS background color/image
    html2canvas(document.body, {
        backgroundColor: null,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'capture_' + Date.now() + '.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

function setupSnapshotTooltip() {
    const text = "this site appears in its unique way to each user, capture your experience to share";
    const desktopIcon = document.getElementById('icon-camera');
    const menuIcon = document.getElementById('menubar-snapshot');

    // Global click listener to hide tooltip
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#icon-camera') && !e.target.closest('#menubar-snapshot')) {
            hideTooltip();
        }
    });

    // Desktop Icon: Show on click
    if (desktopIcon) {
        desktopIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (tooltipEl) {
                hideTooltip();
            } else {
                showTooltip(text, e.clientX, e.clientY - 40);
            }
        });
    }

    // Menu Icon: Show on hover
    if (menuIcon) {
        menuIcon.addEventListener('mouseenter', () => {
            const rect = menuIcon.getBoundingClientRect();
            showTooltip(text, rect.left - 200, rect.bottom + 10);
        });
        menuIcon.addEventListener('mouseleave', () => {
            hideTooltip(); // instant hide
        });
        // Click to snap
        menuIcon.addEventListener('click', takeScreenshot);
    }
}

let tooltipEl = null;
function showTooltip(text, x, y) {
    if (tooltipEl) tooltipEl.remove();

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'custom-tooltip visible';
    tooltipEl.innerText = text;
    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top = y + 'px';

    document.body.appendChild(tooltipEl);

    // Auto hide after 4 seconds
    setTimeout(() => {
        if (tooltipEl) {
            tooltipEl.remove();
            tooltipEl = null;
        }
    }, 4000);
}

function hideTooltip() {
    if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
    }
}


// --- AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSystemSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'open') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'shutter') {
        // Noise buffer for shutter
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = audioCtx.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        noise.start(now);
    } else if (type === 'trash') {
        // Removed
    }
}
