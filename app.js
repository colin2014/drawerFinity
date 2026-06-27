/**
 * Drawfinity Application Logic & UI Controller
 * Handles live 2D/3D visualizer rendering, unit conversions, and SVG downloads.
 */

document.addEventListener('DOMContentLoaded', () => {
    // App State
    const state = {
        drFabMethod: '3dprint', // 'laser' | '3dprint'
        cabFabMethod: '3dprint',  // 'laser' | '3dprint'
        wizardMode: true,
        wizardStep: 1,
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
        drThickness: 3.0,
        cabThickness: 6.0,
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
        tabBtns: document.querySelectorAll('[data-mode]'),
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
        drThickness: document.getElementById('drThickness'),
        customDrThickGroup: document.getElementById('customDrThickGroup'),
        customDrThick: document.getElementById('customDrThick'),
        cabThickness: document.getElementById('cabThickness'),
        customCabThickGroup: document.getElementById('customCabThickGroup'),
        customCabThick: document.getElementById('customCabThick'),
        tabSize: document.getElementById('tabSize'),
        valTabSize: document.getElementById('valTabSize'),
        kerf: document.getElementById('kerf'),
        valKerf: document.getElementById('valKerf'),
        handleStyle: document.getElementById('handleStyle'),
        drFabBtns: document.querySelectorAll('#drFabTabs .tab-btn'),
        cabFabBtns: document.querySelectorAll('#cabFabTabs .tab-btn'),
        stageTabs: document.querySelectorAll('.stage-tab'),
        view3d: document.getElementById('view3d'),
        view2d: document.getElementById('view2d'),
        canvas3d: document.getElementById('canvas3d'),
        dimW: document.getElementById('dimW'),
        dimD: document.getElementById('dimD'),
        dimH: document.getElementById('dimH'),
        panelsGrid: document.getElementById('panelsGrid'),
        stageControls: document.getElementById('stageControls'),
        btnWireframe: document.getElementById('btnWireframe'),
        btnExplode: document.getElementById('btnExplode'),
        btnResetCamera: document.getElementById('btnResetCamera'),
        btnDownloadAll: document.getElementById('btnDownloadAll'),
        btnModeWizard: document.getElementById('btnModeWizard'),
        btnModeAdvanced: document.getElementById('btnModeAdvanced'),
        wizardBanner: document.getElementById('wizardBanner'),
        wizardStepTitle: document.getElementById('wizardStepTitle'),
        wizardStepCount: document.getElementById('wizardStepCount'),
        wizardStepDesc: document.getElementById('wizardStepDesc'),
        wizardNav: document.getElementById('wizardNav'),
        btnWizardPrev: document.getElementById('btnWizardPrev'),
        btnWizardNext: document.getElementById('btnWizardNext'),
        secStep1: document.getElementById('secStep1'),
        secStep2: document.getElementById('secStep2'),
        secStep3: document.getElementById('secStep3'),
        secStep4: document.getElementById('secStep4'),
        secStep5: document.getElementById('secStep5'),
        btnStep5Download: document.getElementById('btnStep5Download'),
        btnMobileQuickPreview: document.getElementById('btnMobileQuickPreview'),
        mobilePreviewHeader: document.getElementById('mobilePreviewHeader'),
        btnMobileBackToSteps: document.getElementById('btnMobileBackToSteps')
    };

    // --- 1. EVENT LISTENERS ---

    // Settings Panel: open/close gear dropdown
    const btnSettings = document.getElementById('btnSettings');
    const settingsDropdown = document.getElementById('settingsDropdown');
    if (btnSettings && settingsDropdown) {
        btnSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = settingsDropdown.style.display !== 'none';
            if (!isOpen) {
                const rect = btnSettings.getBoundingClientRect();
                settingsDropdown.style.top = (rect.bottom + 8) + 'px';
                settingsDropdown.style.right = (window.innerWidth - rect.right) + 'px';
                settingsDropdown.style.left = 'auto';
            }
            settingsDropdown.style.display = isOpen ? 'none' : 'block';
        });
        document.addEventListener('click', (e) => {
            if (e.target !== btnSettings && !btnSettings.contains(e.target) && !settingsDropdown.contains(e.target)) {
                settingsDropdown.style.display = 'none';
            }
        });
    }

    // Light Mode Toggle — persisted in localStorage
    const toggleLightMode = document.getElementById('toggleLightMode');

    function setLightMode(on) {
        document.body.classList.toggle('light-mode', on);
        if (toggleLightMode) toggleLightMode.checked = on;
        localStorage.setItem('df_lightMode', on ? '1' : '0');
    }

    // Restore saved preference on load
    if (localStorage.getItem('df_lightMode') === '1') setLightMode(true);

    if (toggleLightMode) {
        toggleLightMode.addEventListener('change', () => setLightMode(toggleLightMode.checked));
    }

    // Mobile Simulator Toggle
    const toggleMobileView = document.getElementById('toggleMobileView');
    const btnExitMobileSim = document.getElementById('btnExitMobileSim');

    function setMobileSim(on) {
        document.body.classList.toggle('mobile-sim', on);
        if (toggleMobileView) toggleMobileView.checked = on;
        setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
    }

    if (toggleMobileView) {
        toggleMobileView.addEventListener('change', () => setMobileSim(toggleMobileView.checked));
    }
    if (btnExitMobileSim) {
        btnExitMobileSim.addEventListener('click', () => setMobileSim(false));
    }

    // Collapsible Accordion Sections
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('collapsed');
        });
    });

    function updateWizardUI() {
        if (!dom.btnModeWizard) return;
        dom.btnModeWizard.classList.toggle('active', state.wizardMode);
        dom.btnModeAdvanced.classList.toggle('active', !state.wizardMode);
        dom.btnModeWizard.style.background = '';
        dom.btnModeWizard.style.color = '';
        dom.btnModeAdvanced.style.background = '';
        dom.btnModeAdvanced.style.color = '';

        if (!state.wizardMode) {
            if (dom.wizardBanner) dom.wizardBanner.style.display = 'none';
            if (dom.wizardNav) dom.wizardNav.style.display = 'none';
            [dom.secStep1, dom.secStep2, dom.secStep3, dom.secStep4, dom.secStep5].forEach(sec => {
                if (sec) sec.style.display = 'block';
            });
            return;
        }

        if (dom.wizardBanner) dom.wizardBanner.style.display = 'block';
        if (dom.wizardNav) dom.wizardNav.style.display = 'flex';

        [dom.secStep1, dom.secStep2, dom.secStep3, dom.secStep4, dom.secStep5].forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        const activeSec = [dom.secStep1, dom.secStep2, dom.secStep3, dom.secStep4, dom.secStep5][state.wizardStep - 1];
        if (activeSec) {
            activeSec.style.display = 'block';
            activeSec.classList.remove('collapsed');
        }

        if (dom.wizardStepCount) dom.wizardStepCount.textContent = `${state.wizardStep} of 5`;
        if (dom.btnWizardPrev) dom.btnWizardPrev.style.display = state.wizardStep > 1 ? 'block' : 'none';

        if (state.wizardStep === 1) {
            if (dom.wizardStepTitle) dom.wizardStepTitle.textContent = "Step 1: Footprint & Dimensions";
            if (dom.wizardStepDesc) dom.wizardStepDesc.textContent = "How many Gridfinity units wide and deep should your storage box occupy on your workbench?";
            if (dom.btnWizardNext) { dom.btnWizardNext.style.display = 'block'; dom.btnWizardNext.textContent = "Next: Cabinet Layout ➡️"; }
        } else if (state.wizardStep === 2) {
            if (dom.wizardStepTitle) dom.wizardStepTitle.textContent = "Step 2: Multi-Drawer Layout";
            if (dom.wizardStepDesc) dom.wizardStepDesc.textContent = "Do you want a single open storage box, or a multi-drawer cabinet divided into rows and columns?";
            if (dom.btnWizardNext) { dom.btnWizardNext.style.display = 'block'; dom.btnWizardNext.textContent = "Next: Materials & Joints ➡️"; }
        } else if (state.wizardStep === 3) {
            if (dom.wizardStepTitle) dom.wizardStepTitle.textContent = "Step 3: Materials & Joints";
            if (dom.wizardStepDesc) dom.wizardStepDesc.textContent = "Select the material thickness you plan to use for laser cutting or your 3D printer shell specifications.";
            if (dom.btnWizardNext) { dom.btnWizardNext.style.display = 'block'; dom.btnWizardNext.textContent = "Next: Handles & Hardware ➡️"; }
        } else if (state.wizardStep === 4) {
            if (dom.wizardStepTitle) dom.wizardStepTitle.textContent = "Step 4: Pull Handle & Hardware";
            if (dom.wizardStepDesc) dom.wizardStepDesc.textContent = "Choose how you want to pull open your drawer. For 3D printing, snap-fit alignment pegs automatically match your selection!";
            if (dom.btnWizardNext) { dom.btnWizardNext.style.display = 'block'; dom.btnWizardNext.textContent = "Next: Preview & Export ➡️"; }
        } else if (state.wizardStep === 5) {
            if (dom.wizardStepTitle) dom.wizardStepTitle.textContent = "Step 5: Preview & Export";
            if (dom.wizardStepDesc) dom.wizardStepDesc.textContent = "Your design is ready! Download your production files below.";
            if (dom.btnWizardNext) { dom.btnWizardNext.style.display = 'none'; }
        }
    }

    if (dom.btnModeWizard) {
        dom.btnModeWizard.addEventListener('click', () => { state.wizardMode = true; updateWizardUI(); });
        dom.btnModeAdvanced.addEventListener('click', () => { state.wizardMode = false; updateWizardUI(); });
        if (dom.btnWizardPrev) dom.btnWizardPrev.addEventListener('click', () => { if (state.wizardStep > 1) { state.wizardStep--; updateWizardUI(); } });
        if (dom.btnWizardNext) dom.btnWizardNext.addEventListener('click', () => { if (state.wizardStep < 5) { state.wizardStep++; updateWizardUI(); } });
        if (dom.btnStep5Download) dom.btnStep5Download.addEventListener('click', () => { if (dom.btnDownloadAll) dom.btnDownloadAll.click(); });
    }

    function updateFabMethodUI() {
        if (dom.btnDownloadAll) {
            const span = dom.btnDownloadAll.querySelector('span');
            const only3D = state.drFabMethod === '3dprint' && (!state.genCabinet || state.cabFabMethod === '3dprint');
            const onlyLaser = state.drFabMethod === 'laser' && (!state.genCabinet || state.cabFabMethod === 'laser');

            if (only3D) {
                if (span) span.textContent = 'Download 3D Print STLs (ZIP)';
                dom.btnDownloadAll.style.background = 'linear-gradient(135deg, #a855f7, #10b981)';
            } else if (onlyLaser) {
                if (span) span.textContent = 'Download Laser Cut SVGs (ZIP)';
                dom.btnDownloadAll.style.background = 'linear-gradient(135deg, #06b6d4, #3b82f6)';
            } else {
                if (span) span.textContent = 'Download Hybrid STLs & SVGs (ZIP)';
                dom.btnDownloadAll.style.background = 'linear-gradient(135deg, #3b82f6, #10b981)';
            }
        }
    }

    if (dom.drFabBtns) {
        dom.drFabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dom.drFabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.drFabMethod = btn.dataset.fab;
                updateFabMethodUI();
                updateAndRender();
            });
        });
    }

    if (dom.cabFabBtns) {
        dom.cabFabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dom.cabFabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.cabFabMethod = btn.dataset.fab;
                updateFabMethodUI();
                updateAndRender();
            });
        });
    }

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
        updateFabMethodUI();
        updateAndRender();
    });

    dom.drThickness.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            dom.customDrThickGroup.classList.remove('hidden');
            state.drThickness = parseFloat(dom.customDrThick.value) || 3.0;
        } else {
            dom.customDrThickGroup.classList.add('hidden');
            state.drThickness = parseFloat(e.target.value);
        }
        updateAndRender();
    });

    dom.customDrThick.addEventListener('input', (e) => {
        state.drThickness = parseFloat(e.target.value) || 3.0;
        updateAndRender();
    });

    dom.cabThickness.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            dom.customCabThickGroup.classList.remove('hidden');
            state.cabThickness = parseFloat(dom.customCabThick.value) || 6.0;
        } else {
            dom.customCabThickGroup.classList.add('hidden');
            state.cabThickness = parseFloat(e.target.value);
        }
        updateAndRender();
    });

    dom.customCabThick.addEventListener('input', (e) => {
        state.cabThickness = parseFloat(e.target.value) || 6.0;
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
                if (dom.stageControls) dom.stageControls.style.display = 'flex';
            } else {
                dom.view3d.classList.remove('active');
                dom.view2d.classList.add('active');
                if (dom.stageControls) dom.stageControls.style.display = 'none';
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
        const drW = state.gridX * 42 + state.drThickness * 2;
        const drD = state.gridY * 42 + state.drThickness * 2;
        const drH = state.mmHeight + state.drThickness;
        const printTh = 1.6;

        const origHtml = dom.btnDownloadAll.innerHTML;
        dom.btnDownloadAll.innerHTML = '⏳ <span>Creating Files...</span>';
        dom.btnDownloadAll.disabled = true;

        // 1. 3D PRINT STLs (if applicable)
        if (state.drFabMethod === '3dprint' || (state.cabFabMethod === '3dprint' && state.genCabinet)) {
            if (typeof THREE.STLExporter === 'undefined') {
                alert("STL Exporter library is loading...");
                dom.btnDownloadAll.innerHTML = origHtml;
                dom.btnDownloadAll.disabled = false;
                return;
            }
            const exporter = new THREE.STLExporter();
            const mat = new THREE.MeshBasicMaterial();
            const stlFolder = zip.folder("3D_Print_STLs");

            if (state.drFabMethod === '3dprint') {
                const binGroup = new THREE.Group();
                function addBinPart(w, h, d, px, py, pz) {
                    const g = new THREE.BoxGeometry(w, h, d);
                    g.translate(px + w/2, py + h/2, pz + d/2);
                    binGroup.add(new THREE.Mesh(g, mat));
                }
                addBinPart(drW, printTh, drD, 0, 0, 0);
                addBinPart(printTh, drH - printTh, drD, 0, printTh, 0);
                addBinPart(printTh, drH - printTh, drD, drW - printTh, printTh, 0);
                addBinPart(drW - 2*printTh, drH - printTh, printTh, printTh, printTh, 0);

                if (state.handleStyle === 'none') {
                    addBinPart(drW - 2*printTh, drH - printTh, printTh, printTh, printTh, drD - printTh);
                } else {
                    let spacing = state.handleStyle === 'rects32' ? 32 : state.handleStyle === 'rects96' ? 96 : 64;
                    if (drW < spacing + 30) spacing = Math.max(16, drW * 0.4);
                    const pegW = 6, pegH = 10;
                    const fwX = printTh, fwW = drW - 2 * printTh, fwY = printTh, fwH = drH - printTh;
                    const hy = Math.max(fwY + 4, Math.min(fwY + fwH - pegH - 4, (drH - pegH) / 2));
                    const cx1 = drW / 2 - spacing / 2, cx2 = drW / 2 + spacing / 2;

                    addBinPart(cx1 - pegW/2 - fwX, fwH, printTh, fwX, fwY, drD - printTh);
                    addBinPart(pegW, hy - fwY, printTh, cx1 - pegW/2, fwY, drD - printTh);
                    addBinPart(pegW, (fwY + fwH) - (hy + pegH), printTh, cx1 - pegW/2, hy + pegH, drD - printTh);
                    addBinPart((cx2 - pegW/2) - (cx1 + pegW/2), fwH, printTh, cx1 + pegW/2, fwY, drD - printTh);
                    addBinPart(pegW, hy - fwY, printTh, cx2 - pegW/2, fwY, drD - printTh);
                    addBinPart(pegW, (fwY + fwH) - (hy + pegH), printTh, cx2 - pegW/2, hy + pegH, drD - printTh);
                    addBinPart((fwX + fwW) - (cx2 + pegW/2), fwH, printTh, cx2 + pegW/2, fwY, drD - printTh);
                }

                binGroup.updateMatrixWorld(true);
                const binData = exporter.parse(binGroup, { binary: true });
                stlFolder.file(`Drawer_Bin_${state.gridX}x${state.gridY}_${drH}mmH.stl`, new Blob([binData], { type: 'application/octet-stream' }));

                if (state.handleStyle !== 'none') {
                    const handleGroup = new THREE.Group();
                    function addHandlePart(w, h, d, px, py, pz) {
                        const g = new THREE.BoxGeometry(w, h, d);
                        g.translate(px + w/2, py + h/2, pz + d/2);
                        handleGroup.add(new THREE.Mesh(g, mat));
                    }
                    let spacing = state.handleStyle === 'rects32' ? 32 : state.handleStyle === 'rects96' ? 96 : 64;
                    if (drW < spacing + 30) spacing = Math.max(16, drW * 0.4);
                    const hw = Math.max(spacing + 24, Math.min(drW * 0.6, 90));
                    const hh = 16, hd = state.cabThickness * 2;
                    addHandlePart(hw, hh, hd, 0, 0, 0);
                    addHandlePart(hw, hh * 0.4, hd * 0.5, 0, hh, 0);
                    const pegW = 5.6, pegH = 9.6;
                    const px1 = hw / 2 - spacing / 2 - pegW / 2, px2 = hw / 2 + spacing / 2 - pegW / 2;
                    const py = (hh - pegH) / 2;
                    addHandlePart(pegW, pegH, printTh, px1, py, hd);
                    addHandlePart(pegW, pegH, printTh, px2, py, hd);

                    handleGroup.updateMatrixWorld(true);
                    const handleData = exporter.parse(handleGroup, { binary: true });
                    stlFolder.file(`Drawer_Handle_Separate_${hw}mm.stl`, new Blob([handleData], { type: 'application/octet-stream' }));
                }
            }

            if (state.cabFabMethod === '3dprint' && state.genCabinet) {
                const cabGroup = new THREE.Group();
                function addCabPart(w, h, d, px, py, pz) {
                    const g = new THREE.BoxGeometry(w, h, d);
                    g.translate(px + w/2, py + h/2, pz + d/2);
                    cabGroup.add(new THREE.Mesh(g, mat));
                }
                const cabW = state.cabCols * (drW + 2.5) + state.cabThickness * 2;
                const cabD = drD + 4;
                const cabH = state.cabRows * (drH + 2.5) + state.cabThickness * 2;
                const cTh = Math.max(2.0, state.cabThickness * 0.6);

                addCabPart(cabW, cabH, cTh, 0, 0, 0);
                addCabPart(cabW, cTh, cabD - cTh, 0, 0, cTh);
                addCabPart(cabW, cTh, cabD - cTh, 0, cabH - cTh, cTh);
                addCabPart(cTh, cabH - 2*cTh, cabD - cTh, 0, cTh, cTh);
                addCabPart(cTh, cabH - 2*cTh, cabD - cTh, cabW - cTh, cTh, cTh);

                if (state.cabRows > 1) {
                    for (let r = 1; r < state.cabRows; r++) {
                        const sy = r * (drH + 2.5) + state.cabThickness;
                        addCabPart(cabW - 2*cTh, cTh, cabD - cTh, cTh, sy, cTh);
                    }
                }

                cabGroup.updateMatrixWorld(true);
                const cabData = exporter.parse(cabGroup, { binary: true });
                stlFolder.file(`Cabinet_Outer_Shell_${state.cabCols}cols_${state.cabRows}tiers.stl`, new Blob([cabData], { type: 'application/octet-stream' }));
            }
        }

        // 2. LASER CUT SVGs (if applicable)
        const laserParts = generatedParts.filter(part => {
            if (part.type === 'drawer' && state.drFabMethod === 'laser') return true;
            if (part.type === 'cabinet' && state.cabFabMethod === 'laser') return true;
            return false;
        });

        if (laserParts.length > 0) {
            const svgFolder = zip.folder("Laser_Cut_SVGs");
            const masterSvg = BoxGenerator.generateMasterCutSheet(laserParts);
            svgFolder.file("master_cutsheet.svg", masterSvg);

            laserParts.forEach(part => {
                const standaloneSvg = BoxGenerator.partToSVG(part);
                const fileName = `${part.id}_qty${part.count}.svg`;
                svgFolder.file(fileName, standaloneSvg);
            });
        }

        zip.generateAsync({ type: "blob" }).then(blob => {
            const only3D = state.drFabMethod === '3dprint' && (!state.genCabinet || state.cabFabMethod === '3dprint');
            const onlyLaser = state.drFabMethod === 'laser' && (!state.genCabinet || state.cabFabMethod === 'laser');
            const typeTag = only3D ? '3D_STLs' : onlyLaser ? 'Laser_SVGs' : 'Hybrid_STLs_and_SVGs';
            const fileName = `Drawfinity_${typeTag}_${state.gridX}x${state.gridY}.zip`;
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
        }).catch(err => {
            console.error("Error generating zip:", err);
            alert("Failed to create download files.");
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
            drThickness: state.drThickness,
            cabThickness: state.cabThickness,
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
        const drW = state.gridX * 42 + state.drThickness * 2;
        const drD = state.gridY * 42 + state.drThickness * 2;
        const drH = state.mmHeight + state.drThickness;

        if (state.genCabinet) {
            const cabW = Math.round(state.cabCols * (drW + 2.5) + state.cabThickness * 2);
            const cabD = Math.round(drD + 4);
            const cabH = Math.round(state.cabRows * (drH + 2.5) + state.cabThickness * 2);
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

        const isLight = document.body.classList.contains('light-mode');

        generatedParts.forEach(part => {
            const card = document.createElement('div');
            card.className = 'panel-card';

            // Theme-aware colours
            let stroke, fillOpacity;
            if (isLight) {
                stroke = part.type === 'drawer' ? '#1e6fa8' : part.type === 'cabinet' ? '#1d4ed8' : '#0d6e5c';
                fillOpacity = 'rgba(30, 111, 168, 0.07)';
            } else {
                stroke = part.type === 'drawer' ? '#00e5ff' : part.type === 'cabinet' ? '#3b82f6' : '#14b8a6';
                fillOpacity = 'rgba(0, 229, 255, 0.08)';
            }

            card.innerHTML = `
                <div class="panel-card-header">
                    <span class="panel-title">${part.name}</span>
                    <span class="panel-dim" style="border-color: ${stroke}">${Math.round(part.width)} × ${Math.round(part.height)} mm ${part.count > 1 ? `| Qty: ${part.count}` : ''}</span>
                </div>
                <div class="panel-preview">
                    <svg viewBox="-5 -5 ${part.width + 10} ${part.height + 10}">
                        <path d="${part.path}" fill="${fillOpacity}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
                    </svg>
                </div>
                ${part.notes ? `<span class="help-text" style="color:var(--text-muted)">${part.notes}</span>` : ''}
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

        const drW = state.gridX * 42 + state.drThickness * 2;
        const drD = state.gridY * 42 + state.drThickness * 2;
        const drH = state.mmHeight + state.drThickness;
        const th = state.cabThickness;

        const cabW = state.genCabinet ? state.cabCols * (drW + 2.5) + state.cabThickness * 2 : drW;
        const cabD = state.genCabinet ? drD + 4 : drD;
        const cabH = state.genCabinet ? state.cabRows * (drH + 2.5) + state.cabThickness * 2 : drH;

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
        const matWoodJoint = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.6, wireframe: state.wireframe, ...polyOffset });
        const matDrawer = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, wireframe: state.wireframe, ...polyOffset });
        const matDrawerSide = new THREE.MeshStandardMaterial({ color: 0x164e63, roughness: 0.5, wireframe: state.wireframe, ...polyOffset });
        const matDrawerJoint = new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.4, wireframe: state.wireframe, ...polyOffset });
        const matDrawerFront = new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.3, metalness: 0.1, wireframe: state.wireframe, ...polyOffset });
        const matHandle = new THREE.MeshStandardMaterial({ color: 0xff2a2a, roughness: 0.2, wireframe: state.wireframe, ...polyOffset });

        function addBox(w, h, d, x, y, z, mat, isDrawer = false) {
            const geo = new THREE.BoxGeometry(Math.max(0.1, w - 0.04), Math.max(0.1, h - 0.04), Math.max(0.1, d - 0.04));
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

        function addFingerSeam(x, y, z, len, axis, thickness, tabSize, matA, matB, group = null, isDrawer = false) {
            if (len <= 0) return;
            let numTabs = Math.max(3, 1 + 2 * Math.round((len / tabSize - 1) / 2));
            if (numTabs % 2 === 0) numTabs++;
            const tabLen = len / numTabs;

            for (let i = 0; i < numTabs; i++) {
                const mat = (i % 2 === 0) ? matA : matB;
                const offset = (i % 2 === 0) ? 0.04 : -0.04;
                let bw = thickness + offset, bh = thickness + offset, bd = thickness + offset;
                let bx = x, by = y, bz = z;

                if (axis === 'x') { bw = Math.max(0.1, tabLen - 0.04); bx = x + i * tabLen + 0.02; }
                else if (axis === 'y') { bh = Math.max(0.1, tabLen - 0.04); by = y + i * tabLen + 0.02; }
                else if (axis === 'z') { bd = Math.max(0.1, tabLen - 0.04); bz = z + i * tabLen + 0.02; }

                const g = new THREE.BoxGeometry(bw, bh, bd);
                const m = new THREE.Mesh(g, mat);
                m.position.set(bx + bw/2, by + bh/2, bz + bd/2);
                if (!state.wireframe) {
                    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: isDrawer ? 0x00bfff : 0x3b82f6 })));
                }

                if (group) {
                    group.add(m);
                } else {
                    scene.add(m);
                    cabinetMeshes.push(m);
                }
            }
        }

        // --- BUILD OUTER CABINET SHELL ---
        if (state.genCabinet) {
            // 1. Central Face Plates (leaving corner seams open)
            addBox(cabW - 2*th, th, cabD - th, th, 0, th, matWood); // Bottom
            addBox(cabW - 2*th, th, cabD - th, th, cabH - th, th, matWood); // Top
            addBox(th, cabH - 2*th, cabD - th, 0, th, th, matWoodEdge); // Left Side
            addBox(th, cabH - 2*th, cabD - th, cabW - th, th, th, matWoodEdge); // Right Side
            addBox(cabW - 2*th, cabH - 2*th, th, th, th, 0, matWood); // Rear Wall

            // 2. Back Corner Blocks (th x th x th)
            addBox(th, th, th, 0, 0, 0, matWoodEdge);
            addBox(th, th, th, cabW - th, 0, 0, matWoodEdge);
            addBox(th, th, th, 0, cabH - th, 0, matWoodEdge);
            addBox(th, th, th, cabW - th, cabH - th, 0, matWoodEdge);

            // 3. Seams / Corner Joints
            // 3. Seams / Corner Joints
            if (state.cabFabMethod === '3dprint') {
                addBox(th, th, cabD - 2*th, 0, cabH - th, th, matWoodEdge);
                addBox(th, th, cabD - 2*th, cabW - th, cabH - th, th, matWoodEdge);
                addBox(th, th, cabD - 2*th, 0, 0, th, matWoodEdge);
                addBox(th, th, cabD - 2*th, cabW - th, 0, th, matWoodEdge);
                addBox(cabW - 2*th, th, th, th, cabH - th, 0, matWood);
                addBox(cabW - 2*th, th, th, th, 0, 0, matWood);
                addBox(th, cabH - 2*th, th, 0, th, 0, matWoodEdge);
                addBox(th, cabH - 2*th, th, cabW - th, th, 0, matWoodEdge);
            } else {
                addFingerSeam(0, cabH - th, th, cabD - th, 'z', th, state.tabSize, matWood, matWoodJoint); // Top-Left
                addFingerSeam(cabW - th, cabH - th, th, cabD - th, 'z', th, state.tabSize, matWood, matWoodJoint); // Top-Right
                addFingerSeam(0, 0, th, cabD - th, 'z', th, state.tabSize, matWood, matWoodJoint); // Bottom-Left
                addFingerSeam(cabW - th, 0, th, cabD - th, 'z', th, state.tabSize, matWood, matWoodJoint); // Bottom-Right

                addFingerSeam(th, cabH - th, 0, cabW - 2*th, 'x', th, state.tabSize, matWood, matWoodJoint); // Back-Top
                addFingerSeam(th, 0, 0, cabW - 2*th, 'x', th, state.tabSize, matWood, matWoodJoint); // Back-Bottom
                addFingerSeam(0, th, 0, cabH - 2*th, 'y', th, state.tabSize, matWoodEdge, matWoodJoint); // Back-Left
                addFingerSeam(cabW - th, th, 0, cabH - 2*th, 'y', th, state.tabSize, matWoodEdge, matWoodJoint); // Back-Right
            }

            // Shelf Dividers
            if (state.cabRows > 1) {
                for (let r = 1; r < state.cabRows; r++) {
                    const sy = r * (drH + 2.5) + th;
                    addBox(cabW - 2*th, th, cabD - th, th, sy, th, matWoodEdge);
                    if (state.cabFabMethod === 'laser') {
                        addFingerSeam(0, sy, th, cabD - th, 'z', th, state.tabSize, matWoodEdge, matWoodJoint);
                        addFingerSeam(cabW - th, sy, th, cabD - th, 'z', th, state.tabSize, matWoodEdge, matWoodJoint);
                    } else {
                        addBox(th, th, cabD - th, 0, sy, th, matWoodEdge);
                        addBox(th, th, cabD - th, cabW - th, sy, th, matWoodEdge);
                    }
                }
            }
        }

        // --- BUILD DRAWERS ---
        const dth = state.drThickness;
        const slideZ = state.exploded ? Math.min(100, drD * 0.7) : 4; // slide forward

        for (let r = 0; r < state.cabRows; r++) {
            for (let c = 0; c < state.cabCols; c++) {
                const ox = state.genCabinet ? th + c * (drW + 2.5) + 1.25 : c * drW;
                const oy = state.genCabinet ? th + r * (drH + 2.5) + 1.25 : r * drH;
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

                if (state.drFabMethod === '3dprint') {
                    const pTh = 1.6;
                    addDrPart(drW, pTh, drD, 0, 0, 0, matDrawer); // Bottom
                    addDrPart(pTh, drH - pTh, drD, 0, pTh, 0, matDrawerSide); // Left wall
                    addDrPart(pTh, drH - pTh, drD, drW - pTh, pTh, 0, matDrawerSide); // Right wall
                    addDrPart(drW - 2*pTh, drH - pTh, pTh, pTh, pTh, 0, matDrawerSide); // Rear wall

                    if (state.handleStyle === 'none') {
                        addDrPart(drW - 2*pTh, drH - pTh, pTh, pTh, pTh, drD - pTh, matDrawerFront);
                    } else {
                        let spacing = state.handleStyle === 'rects32' ? 32 : state.handleStyle === 'rects96' ? 96 : 64;
                        if (drW < spacing + 30) spacing = Math.max(16, drW * 0.4);
                        const pegW = 6, pegH = 10;
                        const fwX = pTh, fwW = drW - 2*pTh, fwY = pTh, fwH = drH - pTh;
                        const hy = Math.max(fwY + 4, Math.min(fwY + fwH - pegH - 4, (drH - pegH) / 2));
                        const cx1 = drW/2 - spacing/2, cx2 = drW/2 + spacing/2;

                        addDrPart(cx1 - pegW/2 - fwX, fwH, pTh, fwX, fwY, drD - pTh, matDrawerFront);
                        addDrPart(pegW, hy - fwY, pTh, cx1 - pegW/2, fwY, drD - pTh, matDrawerFront);
                        addDrPart(pegW, (fwY+fwH) - (hy+pegH), pTh, cx1 - pegW/2, hy + pegH, drD - pTh, matDrawerFront);
                        addDrPart((cx2 - pegW/2) - (cx1 + pegW/2), fwH, pTh, cx1 + pegW/2, fwY, drD - pTh, matDrawerFront);
                        addDrPart(pegW, hy - fwY, pTh, cx2 - pegW/2, fwY, drD - pTh, matDrawerFront);
                        addDrPart(pegW, (fwY+fwH) - (hy+pegH), pTh, cx2 - pegW/2, hy + pegH, drD - pTh, matDrawerFront);
                        addDrPart((fwX+fwW) - (cx2 + pegW/2), fwH, pTh, cx2 + pegW/2, fwY, drD - pTh, matDrawerFront);

                        // Render Handle hovering/snapped in front
                        const hw = Math.max(spacing + 24, Math.min(drW * 0.6, 90));
                        const hh = 16, hd = state.cabThickness * 2;
                        const hZ = state.exploded ? drD + 15 : drD;
                        addDrPart(hw, hh, hd, drW/2 - hw/2, hy - (hh-pegH)/2, hZ, matHandle);
                    }
                } else {
                    // 1. Central Face Plates
                    addDrPart(drW - 2*dth, dth, drD - 2*dth, dth, 0, dth, matDrawer); // Bottom
                    addDrPart(dth, drH - dth, drD - 2*dth, 0, dth, dth, matDrawerSide); // Left Side
                    addDrPart(dth, drH - dth, drD - 2*dth, drW - dth, dth, dth, matDrawerSide); // Right Side
                    addDrPart(drW - 2*dth, drH - dth, dth, dth, dth, 0, matDrawerSide); // Rear Wall
                    addDrPart(drW - 2*dth, drH - dth, dth, dth, dth, drD - dth, matDrawerFront); // Front Face

                    // 2. Corner Blocks (dth x dth x dth)
                    addDrPart(dth, dth, dth, 0, 0, 0, matDrawerSide);
                    addDrPart(dth, dth, dth, drW - dth, 0, 0, matDrawerSide);
                    addDrPart(dth, dth, dth, 0, 0, drD - dth, matDrawerFront);
                    addDrPart(dth, dth, dth, drW - dth, 0, drD - dth, matDrawerFront);

                    // 3. Interlocking Finger Seams
                    addFingerSeam(0, 0, dth, drD - 2*dth, 'z', dth, state.tabSize, matDrawer, matDrawerJoint, drGroup, true); // Bottom-Left
                    addFingerSeam(drW - dth, 0, dth, drD - 2*dth, 'z', dth, state.tabSize, matDrawer, matDrawerJoint, drGroup, true); // Bottom-Right
                    addFingerSeam(dth, 0, 0, drW - 2*dth, 'x', dth, state.tabSize, matDrawer, matDrawerJoint, drGroup, true); // Back-Bottom
                    addFingerSeam(dth, 0, drD - dth, drW - 2*dth, 'x', dth, state.tabSize, matDrawerFront, matDrawerJoint, drGroup, true); // Front-Bottom

                    addFingerSeam(0, dth, 0, drH - dth, 'y', dth, state.tabSize, matDrawerSide, matDrawerJoint, drGroup, true); // Back-Left
                    addFingerSeam(drW - dth, dth, 0, drH - dth, 'y', dth, state.tabSize, matDrawerSide, matDrawerJoint, drGroup, true); // Back-Right
                    addFingerSeam(0, dth, drD - dth, drH - dth, 'y', dth, state.tabSize, matDrawerFront, matDrawerJoint, drGroup, true); // Front-Left
                    addFingerSeam(drW - dth, dth, drD - dth, drH - dth, 'y', dth, state.tabSize, matDrawerFront, matDrawerJoint, drGroup, true); // Front-Right

                    // Handle Cutout Prongs indicators
                    if (state.handleStyle.startsWith('rects')) {
                        let space = state.handleStyle === 'rects32' ? 32 : state.handleStyle === 'rects96' ? 96 : 64;
                        const rw = state.handleStyle === 'rects32' ? 4 : 5;
                        const rh = state.handleStyle === 'rects32' ? 8 : 10;
                        if (drW < space + rw + 12) space = 32;
                        if (drW < space + rw + 8) space = 0;

                        const hy = Math.max(10, Math.min(26, (drH - rh) / 2));
                        if (space === 0) {
                            addDrPart(rw, rh, dth + 2, (drW-rw)/2, hy, drD - dth - 1, matHandle);
                        } else {
                            addDrPart(rw, rh, dth + 2, drW/2 - space/2 - rw/2, hy, drD - dth - 1, matHandle);
                            addDrPart(rw, rh, dth + 2, drW/2 + space/2 - rw/2, hy, drD - dth - 1, matHandle);
                        }
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
        const drW = state.gridX * 42 + state.drThickness * 2;
        const drD = state.gridY * 42 + state.drThickness * 2;
        const drH = state.mmHeight + state.drThickness;
        const cabW = state.genCabinet ? state.cabCols * (drW + 2.5) + state.cabThickness * 2 : drW;
        const cabD = state.genCabinet ? drD + 4 : drD;
        const cabH = state.genCabinet ? state.cabRows * (drH + 2.5) + state.cabThickness * 2 : drH;

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
    updateFabMethodUI();
    updateAndRender();
    updateWizardUI();
});
