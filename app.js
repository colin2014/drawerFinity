/**
 * Drawfinity Application Logic & UI Controller
 * Handles live 2D/3D visualizer rendering, unit conversions, and SVG downloads.
 */

document.addEventListener('DOMContentLoaded', () => {
    // App State
    const state = {
        mode: 'grid', // 'grid' | 'mm'
        gridX: 3,
        gridY: 3,
        gridZ: 6,
        mmWidth: 126,
        mmDepth: 126,
        mmHeight: 45,
        cabCols: 1,
        cabRows: 2,
        genCabinet: true,
        thickness: 3.0,
        tabSize: 15,
        kerf: 0.12,
        handleStyle: 'rects64',
        exploded: false,
        wireframe: false
    };

    let generatedParts = [];

    // Cache DOM elements
    const dom = {
        statGrid: document.getElementById('statGrid'),
        statHeight: document.getElementById('statHeight'),
        statCabSize: document.getElementById('statCabSize'),
        tabBtns: document.querySelectorAll('.tab-btn'),
        panelGridMode: document.getElementById('panelGridMode'),
        panelMmMode: document.getElementById('panelMmMode'),
        gridX: document.getElementById('gridX'),
        gridY: document.getElementById('gridY'),
        gridZ: document.getElementById('gridZ'),
        mmWidth: document.getElementById('mmWidth'),
        mmDepth: document.getElementById('mmDepth'),
        mmHeight: document.getElementById('mmHeight'),
        helpWidth: document.getElementById('helpWidth'),
        helpDepth: document.getElementById('helpDepth'),
        helpHeight: document.getElementById('helpHeight'),
        cabCols: document.getElementById('cabCols'),
        cabRows: document.getElementById('cabRows'),
        genCabinet: document.getElementById('genCabinet'),
        matThickness: document.getElementById('matThickness'),
        customThickGroup: document.getElementById('customThickGroup'),
        customThick: document.getElementById('customThick'),
        tabSize: document.getElementById('tabSize'),
        valTabSize: document.getElementById('valTabSize'),
        kerf: document.getElementById('kerf'),
        valKerf: document.getElementById('valKerf'),
        handleStyle: document.getElementById('handleStyle'),
        stageTabs: document.querySelectorAll('.stage-tab'),
        view3d: document.getElementById('view3d'),
        view2d: document.getElementById('view2d'),
        canvas3d: document.getElementById('canvas3d'),
        dimW: document.getElementById('dimW'),
        dimD: document.getElementById('dimD'),
        dimH: document.getElementById('dimH'),
        panelsGrid: document.getElementById('panelsGrid'),
        btnWireframe: document.getElementById('btnWireframe'),
        btnExplode: document.getElementById('btnExplode'),
        btnResetCamera: document.getElementById('btnResetCamera'),
        btnDownloadAll: document.getElementById('btnDownloadAll')
    };

    // --- 1. EVENT LISTENERS ---

    // Collapsible Accordion Sections
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('collapsed');
        });
    });

    // Segmented Mode Switch
    dom.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dom.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.mode = btn.dataset.mode;

            if (state.mode === 'grid') {
                dom.panelGridMode.classList.add('active');
                dom.panelMmMode.classList.remove('active');
            } else {
                dom.panelGridMode.classList.remove('active');
                dom.panelMmMode.classList.add('active');
            }
            updateAndRender();
        });
    });

    // Plus / Minus number steppers
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            let val = parseInt(target.value) || 1;
            val = btn.dataset.action === 'inc' ? val + 1 : Math.max(1, val - 1);
            target.value = val;
            state[btn.dataset.target] = val;
            syncDimensionsFromGrid();
            updateAndRender();
        });
    });

    // Inputs change handlers
    ['gridX', 'gridY', 'gridZ'].forEach(id => {
        dom[id].addEventListener('input', (e) => {
            state[id] = parseInt(e.target.value) || 1;
            syncDimensionsFromGrid();
            updateAndRender();
        });
    });

    ['mmWidth', 'mmDepth', 'mmHeight'].forEach(id => {
        dom[id].addEventListener('input', (e) => {
            state[id] = parseFloat(e.target.value) || 40;
            syncDimensionsFromMm();
            updateAndRender();
        });
    });

    ['cabCols', 'cabRows'].forEach(id => {
        dom[id].addEventListener('input', (e) => {
            state[id] = parseInt(e.target.value) || 1;
            updateAndRender();
        });
    });

    dom.genCabinet.addEventListener('change', (e) => {
        state.genCabinet = e.target.checked;
        updateAndRender();
    });

    dom.matThickness.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            dom.customThickGroup.classList.remove('hidden');
            state.thickness = parseFloat(dom.customThick.value) || 3.0;
        } else {
            dom.customThickGroup.classList.add('hidden');
            state.thickness = parseFloat(e.target.value);
        }
        updateAndRender();
    });

    dom.customThick.addEventListener('input', (e) => {
        state.thickness = parseFloat(e.target.value) || 3.0;
        updateAndRender();
    });

    dom.tabSize.addEventListener('input', (e) => {
        state.tabSize = parseInt(e.target.value);
        const labels = { 8: 'Fine (~8mm)', 15: 'Medium (~15mm)', 25: 'Chunky (~25mm)' };
        dom.valTabSize.textContent = state.tabSize <= 10 ? 'Fine' : state.tabSize >= 22 ? 'Chunky' : `~${state.tabSize}mm`;
        updateAndRender();
    });

    dom.kerf.addEventListener('input', (e) => {
        state.kerf = parseFloat(e.target.value);
        dom.valKerf.textContent = `${state.kerf.toFixed(2)} mm`;
        updateAndRender();
    });

    dom.handleStyle.addEventListener('change', (e) => {
        state.handleStyle = e.target.value;
        updateAndRender();
    });

    // Preview Stage Tabs (3D vs 2D)
    dom.stageTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dom.stageTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const view = tab.dataset.view;
            if (view === '3d') {
                dom.view3d.classList.add('active');
                dom.view2d.classList.remove('active');
            } else {
                dom.view3d.classList.remove('active');
                dom.view2d.classList.add('active');
            }
        });
    });

    dom.btnWireframe.addEventListener('click', () => {
        state.wireframe = !state.wireframe;
        dom.btnWireframe.classList.toggle('active', state.wireframe);
        update3DWireframe();
    });

    dom.btnExplode.addEventListener('click', () => {
        state.exploded = !state.exploded;
        dom.btnExplode.classList.toggle('btn-primary', state.exploded);
        dom.btnExplode.textContent = state.exploded ? '📦 Close Drawers' : '📂 Open Drawers';
        update3DExplode();
    });

    dom.btnResetCamera.addEventListener('click', () => {
        reset3DCamera();
    });

    dom.btnDownloadAll.addEventListener('click', () => {
        if (typeof JSZip === 'undefined') {
            alert("JSZip library is loading...");
            return;
        }
        const zip = new JSZip();
        const cabFolder = zip.folder("cabinet");
        const drFolder = zip.folder("drawers");

        // Master Cut Sheet in root
        const masterSvg = BoxGenerator.generateMasterCutSheet(generatedParts);
        zip.file("drawfinity_master_cutsheet.svg", masterSvg);

        // Individual parts categorized into folders
        generatedParts.forEach(part => {
            const standaloneSvg = BoxGenerator.partToSVG(part);
            const fileName = `${part.id}_qty${part.count}.svg`;
            if (part.type === 'drawer') {
                drFolder.file(fileName, standaloneSvg);
            } else {
                cabFolder.file(fileName, standaloneSvg);
            }
        });

        const origHtml = dom.btnDownloadAll.innerHTML;
        dom.btnDownloadAll.innerHTML = '⏳ <span>Creating Zip...</span>';
        dom.btnDownloadAll.disabled = true;

        zip.generateAsync({ type: "blob" }).then(blob => {
            const fileName = `Drawfinity_Laser_Cut_Files.zip`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            dom.btnDownloadAll.innerHTML = origHtml;
            dom.btnDownloadAll.disabled = false;
        });
    });

    // --- 2. DIMENSION SYNC & CALCULATION ---

    function syncDimensionsFromGrid() {
        state.mmWidth = state.gridX * 42;
        state.mmDepth = state.gridY * 42;
        state.mmHeight = state.gridZ * 7 + 3; // +3mm internal head clearance

        dom.mmWidth.value = state.mmWidth;
        dom.mmDepth.value = state.mmDepth;
        dom.mmHeight.value = state.mmHeight;

        updateMmHelpText();
    }

    function syncDimensionsFromMm() {
        state.gridX = Math.max(1, Math.floor(state.mmWidth / 42));
        state.gridY = Math.max(1, Math.floor(state.mmDepth / 42));
        state.gridZ = Math.max(2, Math.floor((state.mmHeight - 3) / 7));

        dom.gridX.value = state.gridX;
        dom.gridY.value = state.gridY;
        dom.gridZ.value = state.gridZ;

        updateMmHelpText();
    }

    function updateMmHelpText() {
        const fitX = (state.mmWidth / 42).toFixed(1);
        const fitY = (state.mmDepth / 42).toFixed(1);
        const fitZ = Math.floor((state.mmHeight - 3) / 7);

        dom.helpWidth.textContent = `Fits exactly ${state.gridX} Grid columns (${fitX}U space)`;
        dom.helpDepth.textContent = `Fits exactly ${state.gridY} Grid rows (${fitY}U space)`;
        dom.helpHeight.textContent = `Clearance fits ${fitZ}U Gridfinity items (${fitZ * 7}mm)`;
    }

    // --- 3. CORE GENERATE & RENDER ---

    function updateAndRender() {
        // Instantiate Generator
        const generator = new BoxGenerator({
            gridX: state.gridX,
            gridY: state.gridY,
            clearanceH: state.mmHeight,
            cabCols: state.cabCols,
            cabRows: state.cabRows,
            thickness: state.thickness,
            tabSize: state.tabSize,
            kerf: state.kerf,
            handleStyle: state.handleStyle,
            genCabinet: state.genCabinet
        });

        generatedParts = generator.generateAllParts();

        // Update Header Stats
        dom.statGrid.textContent = `${state.gridX} × ${state.gridY}`;
        dom.statHeight.textContent = `${state.gridZ}U (${state.gridZ * 7}mm)`;

        // Estimate Outer Cabinet Size
        const drW = state.gridX * 42 + state.thickness * 2;
        const drD = state.gridY * 42 + state.thickness * 2;
        const drH = state.mmHeight + state.thickness;

        if (state.genCabinet) {
            const cabW = Math.round(state.cabCols * (drW + 3) + state.thickness * 2);
            const cabD = Math.round(drD + 4);
            const cabH = Math.round(state.cabRows * (drH + 3) + state.thickness * 2);
            dom.statCabSize.textContent = `${cabW} × ${cabD} × ${cabH} mm`;
        } else {
            dom.statCabSize.textContent = `${Math.round(drW)} × ${Math.round(drD)} × ${Math.round(drH)} mm`;
        }

        render2DPanels();
        render3DStage();
    }

    // --- 4. 2D PANELS RENDERER ---

    function render2DPanels() {
        dom.panelsGrid.innerHTML = '';

        generatedParts.forEach(part => {
            const card = document.createElement('div');
            card.className = 'panel-card';
            
            const typeBadge = part.type === 'drawer' ? '#00e5ff' : part.type === 'cabinet' ? '#3b82f6' : '#14b8a6';

            card.innerHTML = `
                <div class="panel-card-header">
                    <span class="panel-title">${part.name}</span>
                    <span class="panel-dim" style="border-color: ${typeBadge}">${Math.round(part.width)} × ${Math.round(part.height)} mm ${part.count > 1 ? `| Qty: ${part.count}` : ''}</span>
                </div>
                <div class="panel-preview">
                    <svg viewBox="-5 -5 ${part.width + 10} ${part.height + 10}">
                        <path d="${part.path}" fill="rgba(0, 229, 255, 0.08)" stroke="${typeBadge}" stroke-width="2" stroke-linejoin="round"/>
                    </svg>
                </div>
                ${part.notes ? `<span class="help-text" style="color:#94a3b8">${part.notes}</span>` : ''}
                <div class="dl-overlay">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>Download Standalone SVG</span>
                </div>
            `;

            card.addEventListener('click', () => {
                const svgStr = BoxGenerator.partToSVG(part);
                const safeName = `${part.id}_qty${part.count}.svg`;
                triggerDownload(safeName, svgStr);
            });

            dom.panelsGrid.appendChild(card);
        });
    }

    // --- 5. THREE.JS WEBGL 3D VISUALIZER ENGINE ---

    let scene, camera, renderer, controls;
    let sceneInit = false;
    let cabinetMeshes = [];
    let drawerMeshes = [];

    function render3DStage() {
        if (!dom.canvas3d) return;

        const drW = state.gridX * 42 + state.thickness * 2;
        const drD = state.gridY * 42 + state.thickness * 2;
        const drH = state.mmHeight + state.thickness;
        const th = state.thickness;

        const cabW = state.genCabinet ? state.cabCols * (drW + 3) + state.thickness * 2 : drW;
        const cabD = state.genCabinet ? drD + 4 : drD;
        const cabH = state.genCabinet ? state.cabRows * (drH + 3) + state.thickness * 2 : drH;

        // Initialize Three.js Scene once
        if (!sceneInit) {
            const container = dom.canvas3d;
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 5000);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(renderer.domElement);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;

            const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambLight);

            const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
            dirLight1.position.set(300, 500, 400);
            scene.add(dirLight1);

            const dirLight2 = new THREE.DirectionalLight(0x00e5ff, 0.35);
            dirLight2.position.set(-300, -200, -300);
            scene.add(dirLight2);

            window.addEventListener('resize', () => {
                if (!dom.canvas3d || dom.canvas3d.clientWidth === 0) return;
                camera.aspect = dom.canvas3d.clientWidth / dom.canvas3d.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(dom.canvas3d.clientWidth, dom.canvas3d.clientHeight);
            });

            function animate() {
                requestAnimationFrame(animate);
                if (controls) controls.update();
                if (renderer && scene && camera) renderer.render(scene, camera);
                updateDimensionBadges(cabW, cabD, cabH);
            }
            animate();
            sceneInit = true;
        }

        // Clear existing 3D Meshes
        cabinetMeshes.forEach(m => scene.remove(m));
        drawerMeshes.forEach(m => scene.remove(m));
        cabinetMeshes = [];
        drawerMeshes = [];

        // Materials with Polygon Offset to prevent Z-Fighting with wireframe edges
        const polyOffset = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
        const matWood = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, wireframe: state.wireframe, ...polyOffset });
        const matWoodEdge = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, wireframe: state.wireframe, ...polyOffset });
        const matDrawer = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, wireframe: state.wireframe, ...polyOffset });
        const matDrawerSide = new THREE.MeshStandardMaterial({ color: 0x164e63, roughness: 0.5, wireframe: state.wireframe, ...polyOffset });
        const matDrawerFront = new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.3, metalness: 0.1, wireframe: state.wireframe, ...polyOffset });
        const matHandle = new THREE.MeshStandardMaterial({ color: 0xff2a2a, roughness: 0.2, wireframe: state.wireframe, ...polyOffset });

        function addBox(w, h, d, x, y, z, mat, isDrawer = false) {
            const geo = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x + w/2, y + h/2, z + d/2);
            
            if (!state.wireframe) {
                const edges = new THREE.EdgesGeometry(geo);
                mesh.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isDrawer ? 0x0088aa : 0x3b82f6 })));
            }

            scene.add(mesh);
            if (isDrawer) drawerMeshes.push(mesh);
            else cabinetMeshes.push(mesh);
            return mesh;
        }

        // --- BUILD OUTER CABINET SHELL ---
        if (state.genCabinet) {
            // Bottom Panel
            addBox(cabW, th, cabD, 0, 0, 0, matWood);
            // Top Panel
            addBox(cabW, th, cabD, 0, cabH - th, 0, matWood);
            // Left Side Panel
            addBox(th, cabH - 2*th, cabD, 0, th, 0, matWoodEdge);
            // Right Side Panel
            addBox(th, cabH - 2*th, cabD, cabW - th, th, 0, matWoodEdge);
            // Rear Wall Panel
            addBox(cabW - 2*th, cabH - 2*th, th, th, th, 0, matWood);

            // Shelf Dividers
            if (state.cabRows > 1) {
                for (let r = 1; r < state.cabRows; r++) {
                    const sy = r * (drH + 3) + th;
                    addBox(cabW - 2*th, th, cabD - th, th, sy, th, matWoodEdge);
                }
            }
        }

        // --- BUILD DRAWERS ---
        const slideZ = state.exploded ? Math.min(100, drD * 0.7) : 4; // slide forward

        for (let r = 0; r < state.cabRows; r++) {
            for (let c = 0; c < state.cabCols; c++) {
                const ox = state.genCabinet ? th + c * (drW + 3) + 1.5 : c * drW;
                const oy = state.genCabinet ? th + r * (drH + 3) + 1.5 : r * drH;
                const oz = state.genCabinet ? th + slideZ : slideZ;

                const drGroup = new THREE.Group();
                drGroup.position.set(ox, oy, oz);
                scene.add(drGroup);
                drawerMeshes.push(drGroup);

                function addDrPart(w, h, d, px, py, pz, mat) {
                    const g = new THREE.BoxGeometry(w, h, d);
                    const m = new THREE.Mesh(g, mat);
                    m.position.set(px + w/2, py + h/2, pz + d/2);
                    if (!state.wireframe) {
                        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x00bfff })));
                    }
                    drGroup.add(m);
                    return m;
                }

                // Drawer Bottom (ends right before front face)
                addDrPart(drW, th, drD - th, 0, 0, 0, matDrawer);
                // Drawer Left Side (ends right before front face)
                addDrPart(th, drH - th, drD - th, 0, th, 0, matDrawerSide);
                // Drawer Right Side (ends right before front face)
                addDrPart(th, drH - th, drD - th, drW - th, th, 0, matDrawerSide);
                // Drawer Rear Wall
                addDrPart(drW - 2*th, drH - th, th, th, th, 0, matDrawerSide);
                // Drawer Front Face (Glowing Vibrant Cyan!)
                addDrPart(drW, drH, th, 0, 0, drD - th, matDrawerFront);

                // Handle Cutout Prongs indicators
                if (state.handleStyle.startsWith('rects')) {
                    let space = state.handleStyle === 'rects32' ? 32 : state.handleStyle === 'rects96' ? 96 : 64;
                    const rw = state.handleStyle === 'rects32' ? 4 : 5;
                    const rh = state.handleStyle === 'rects32' ? 8 : 10;
                    if (drW < space + rw + 12) space = 32;
                    if (drW < space + rw + 8) space = 0;

                    const hy = Math.max(10, Math.min(26, (drH - rh) / 2));
                    if (space === 0) {
                        addDrPart(rw, rh, th + 2, (drW-rw)/2, hy, drD - th - 1, matHandle);
                    } else {
                        addDrPart(rw, rh, th + 2, drW/2 - space/2 - rw/2, hy, drD - th - 1, matHandle);
                        addDrPart(rw, rh, th + 2, drW/2 + space/2 - rw/2, hy, drD - th - 1, matHandle);
                    }
                }
            }
        }

        // Center camera target on initial build
        if (controls && !controls.hasOriented) {
            controls.target.set(cabW/2, cabH/2, cabD/2);
            camera.position.set(cabW * 1.6, cabH * 1.8, cabD * 2.4);
            controls.update();
            controls.hasOriented = true;
        }
    }

    // Floating 3D Dimension Badges Projection
    function updateDimensionBadges(cabW, cabD, cabH) {
        if (!camera || !dom.dimW || !dom.canvas3d) return;

        dom.dimW.textContent = `↔ Width: ${Math.round(cabW || 180)} mm`;
        dom.dimD.textContent = `↗ Depth: ${Math.round(cabD || 135)} mm`;
        dom.dimH.textContent = `↕ Height: ${Math.round(cabH || 150)} mm`;

        const w = dom.canvas3d.clientWidth;
        const h = dom.canvas3d.clientHeight;
        if (w === 0 || h === 0) return;

        function projectToScreen(vec3, el) {
            const v = vec3.clone();
            v.project(camera);
            const x = (v.x * .5 + .5) * w;
            const y = (-(v.y * .5) + .5) * h;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.opacity = (v.z > 0.99 || x < 0 || x > w || y < 0 || y > h) ? '0' : '1';
        }

        projectToScreen(new THREE.Vector3((cabW||180)/2, -20, cabD||135), dom.dimW);
        projectToScreen(new THREE.Vector3((cabW||180) + 20, -20, (cabD||135)/2), dom.dimD);
        projectToScreen(new THREE.Vector3(-20, (cabH||150)/2, cabD||135), dom.dimH);
    }

    function update3DWireframe() {
        render3DStage();
    }

    function update3DExplode() {
        render3DStage();
    }

    function reset3DCamera() {
        if (!controls || !camera) return;
        const drW = state.gridX * 42 + state.thickness * 2;
        const drD = state.gridY * 42 + state.thickness * 2;
        const drH = state.mmHeight + state.thickness;
        const cabW = state.genCabinet ? state.cabCols * (drW + 3) + state.thickness * 2 : drW;
        const cabD = state.genCabinet ? drD + 4 : drD;
        const cabH = state.genCabinet ? state.cabRows * (drH + 3) + state.thickness * 2 : drH;

        controls.target.set(cabW/2, cabH/2, cabD/2);
        camera.position.set(cabW * 1.6, cabH * 1.8, cabD * 2.4);
        controls.update();
    }

    // --- 6. DOWNLOAD TRIGGER ---

    function triggerDownload(filename, content) {
        const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Initialize
    syncDimensionsFromGrid();
    updateAndRender();
});
