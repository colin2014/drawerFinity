/**
 * Drawfinity Vector Geometry & SVG Generator
 * Calculates precision interlocking box joints, kerf compensation, cabinet runners, and handle mounts.
 */

class BoxGenerator {
    constructor(params) {
        this.params = params; // { gridX, gridY, clearanceH, cabCols, cabRows, thickness, tabSize, kerf, handleStyle, genCabinet }
    }

    /**
     * Generates all panels for the configured drawers and outer cabinet.
     */
    generateAllParts() {
        const p = this.params;
        const drTh = parseFloat(p.drThickness || p.thickness || 3.0);
        const cabTh = parseFloat(p.cabThickness || p.thickness || 6.0);
        const kerf = parseFloat(p.kerf) || 0;
        const tol = 1.25; // 1.25mm sliding clearance around each drawer

        // Base bounding box dimensions (internal drawer capacity)
        const intW = p.gridX * 42;
        const intD = p.gridY * 42;
        const intH = p.clearanceH;

        // Drawer external bounding dimensions (for cabinet compartment calculation)
        const drW = intW + drTh * 2;
        const drD = intD + drTh * 2;
        const drH = intH + drTh;

        const parts = [];

        // --- 1. GENERATE DRAWER PANELS (Single deduplicated set with multiplier) ---
        const totalDrawers = p.cabCols * p.cabRows;

        // 1A. Drawer Bottom
        parts.push({
            id: 'dr_bottom',
            name: 'Drawer Bottom Panel',
            code: 'DR-BOT',
            joint: 'top',
            th: drTh,
            tabSize: p.tabSize,
            tabPolarity: 1,
            type: 'drawer',
            count: totalDrawers,
            width: intW,
            height: intD,
            path: this.createBoxPanelPath(intW, intD, drTh, p.tabSize, kerf, [1, 1, 1, 1]),
            notes: `Quantity needed: ${totalDrawers}. Drops 3D printed baseplate inside.`
        });

        // 1B. Drawer Front
        parts.push({
            id: 'dr_front',
            name: 'Drawer Front Face',
            code: 'DR-FRT',
            joint: 'bot',
            th: drTh,
            tabSize: p.tabSize,
            tabPolarity: -1,
            type: 'drawer',
            count: totalDrawers,
            width: intW,
            height: intH,
            path: this.createDrawerFrontPath(intW, intH, drTh, p.tabSize, kerf, p.handleStyle),
            notes: `Quantity needed: ${totalDrawers}. Pull style: ${p.handleStyle}`
        });

        // 1C. Drawer Back
        parts.push({
            id: 'dr_back',
            name: 'Drawer Rear Wall',
            code: 'DR-BCK',
            joint: 'bot',
            th: drTh,
            tabSize: p.tabSize,
            tabPolarity: -1,
            type: 'drawer',
            count: totalDrawers,
            width: intW,
            height: intH,
            path: this.createBoxPanelPath(intW, intH, drTh, p.tabSize, kerf, [0, 1, -1, 1]),
            notes: `Quantity needed: ${totalDrawers}.`
        });

        // 1D. Drawer Side Left
        parts.push({
            id: 'dr_sideL',
            name: 'Drawer Side Left',
            code: 'DR-SDL',
            joint: 'bot',
            th: drTh,
            tabSize: p.tabSize,
            tabPolarity: -1,
            type: 'drawer',
            count: totalDrawers,
            width: intD,
            height: intH,
            path: this.createBoxPanelPath(intD, intH, drTh, p.tabSize, kerf, [0, -1, -1, -1]),
            notes: `Quantity needed: ${totalDrawers}.`
        });

        // 1E. Drawer Side Right
        parts.push({
            id: 'dr_sideR',
            name: 'Drawer Side Right',
            code: 'DR-SDR',
            joint: 'bot',
            th: drTh,
            tabSize: p.tabSize,
            tabPolarity: -1,
            type: 'drawer',
            count: totalDrawers,
            width: intD,
            height: intH,
            path: this.createBoxPanelPath(intD, intH, drTh, p.tabSize, kerf, [0, -1, -1, -1]),
            notes: `Quantity needed: ${totalDrawers}.`
        });

        // 1F. Drawer Pull Handle Piece (when rectangular prongs style selected)
        if (p.handleStyle === 'rects64' || p.handleStyle === 'rects32' || p.handleStyle === 'rects96') {
            let space = p.handleStyle === 'rects32' ? 32 : p.handleStyle === 'rects96' ? 96 : 64;
            const rw = p.handleStyle === 'rects32' ? 4 : 5;
            const rh = p.handleStyle === 'rects32' ? 8 : 10;
            if (intW < space + rw + 12) space = 32;
            if (intW < space + rw + 8) space = 0;

            if (space > 0) {
                const handleTh = cabTh * 2; // double cabinet material thickness
                const hw = space + rw + 20;
                const hh = 28;
                parts.push({
                    id: 'dr_handle',
                    name: 'Drawer Pull Handle Piece',
                    code: 'HDL-PUL',
                    joint: 'center',
                    th: handleTh,
                    tabSize: p.tabSize,
                    tabPolarity: 1,
                    type: 'drawer',
                    count: totalDrawers,
                    width: hw,
                    height: hh,
                    path: this.createHandlePath(hw, hh, space, rw, rh, drTh, handleTh),
                    notes: `Quantity needed: ${totalDrawers}. Uses double cabinet thickness (${handleTh}mm).`
                });
            }
        }

        // --- 2. GENERATE OUTER CABINET (If enabled) ---
        if (p.genCabinet) {
            const compW = drW + tol * 2;
            const compH = drH + tol * 2;
            const cabDepth = drD + 4; // 4mm overhang

            const totalIntW = p.cabCols * compW + (p.cabCols - 1) * cabTh;
            const totalIntH = p.cabRows * compH + (p.cabRows - 1) * cabTh;

            const cabW = totalIntW;
            const cabH = totalIntH;

            // Cabinet Top & Bottom
            parts.push({
                id: 'cab_top',
                name: 'Cabinet Outer Top',
                code: 'CAB-TOP',
                joint: 'top',
                th: cabTh,
                tabSize: p.tabSize,
                tabPolarity: 1,
                type: 'cabinet',
                count: 1,
                width: cabW,
                height: cabDepth,
                path: this.createBoxPanelPath(cabW, cabDepth, cabTh, p.tabSize, kerf, [1, 1, 0, 1])
            });
            parts.push({
                id: 'cab_bottom',
                name: 'Cabinet Outer Bottom',
                code: 'CAB-BOT',
                joint: 'top',
                th: cabTh,
                tabSize: p.tabSize,
                tabPolarity: 1,
                type: 'cabinet',
                count: 1,
                width: cabW,
                height: cabDepth,
                path: this.createBoxPanelPath(cabW, cabDepth, cabTh, p.tabSize, kerf, [1, 1, 0, 1])
            });

            // Cabinet Sides
            parts.push({
                id: 'cab_sideL',
                name: 'Cabinet Outer Side Left',
                code: 'CAB-SDL',
                joint: 'top',
                th: cabTh,
                tabSize: p.tabSize,
                tabPolarity: -1,
                type: 'cabinet',
                count: 1,
                width: cabDepth,
                height: cabH,
                path: this.createCabinetSidePath(cabDepth, cabH, cabTh, p.tabSize, kerf, [-1, 0, -1, 1], p.cabRows, compH)
            });
            parts.push({
                id: 'cab_sideR',
                name: 'Cabinet Outer Side Right',
                code: 'CAB-SDR',
                joint: 'top',
                th: cabTh,
                tabSize: p.tabSize,
                tabPolarity: -1,
                type: 'cabinet',
                count: 1,
                width: cabDepth,
                height: cabH,
                path: this.createCabinetSidePath(cabDepth, cabH, cabTh, p.tabSize, kerf, [-1, 0, -1, 1], p.cabRows, compH)
            });

            // Cabinet Back
            parts.push({
                id: 'cab_back',
                name: 'Cabinet Rear Wall',
                code: 'CAB-BCK',
                joint: 'top',
                th: cabTh,
                tabSize: p.tabSize,
                tabPolarity: -1,
                type: 'cabinet',
                count: 1,
                width: cabW,
                height: cabH,
                path: this.createBoxPanelPath(cabW, cabH, cabTh, p.tabSize, kerf, [-1, -1, -1, -1])
            });

            // Shelf Dividers
            if (p.cabRows > 1) {
                for (let sr = 1; sr < p.cabRows; sr++) {
                    parts.push({
                        id: `cab_shelf_${sr}`,
                        name: `Cabinet Shelf Divider ${sr}`,
                        code: `SHF-${sr}`,
                        joint: 'center',
                        th: cabTh,
                        type: 'divider',
                        count: 1,
                        width: cabW,
                        height: cabDepth - cabTh,
                        path: this.createBoxPanelPath(cabW, cabDepth - cabTh, cabTh, p.tabSize, kerf, [0, 1, 0, 1])
                    });
                }
            }
        }

        this.parts = parts;
        return parts;
    }

    /**
     * Algorithmic placement of hidden engraving text inside covered flat corner gaps along joint edges
     */
    static calculateHiddenCoords(part, fallbackTabSize = 15) {
        const th = part.th || 3;
        const w = part.width;
        const h = part.height;

        if (part.id === 'dr_handle') {
            return { tx: w / 2, ty: 5 };
        }

        if (part.joint === 'center' || !part.joint) {
            return { tx: w / 2, ty: h / 2 };
        }

        const tabSize = part.tabSize || fallbackTabSize;
        let numTabs = Math.max(3, 1 + 2 * Math.round((w / tabSize - 1) / 2));
        if (numTabs % 2 === 0) numTabs++;
        const tabLen = w / numTabs;

        let tx;
        let ty;

        if (part.joint === 'top' && part.tabPolarity === 1) {
            // Protruding wooden finger index 1 along top edge (x from tabLen to 2*tabLen, y from -th to 0)
            tx = 1.5 * tabLen;
            ty = -th / 2;
        } else if (part.joint === 'top') {
            // Corner baseline wooden finger index 0 along top edge (x from 0 to tabLen, y from 0 to th)
            tx = (tabLen + th) / 2;
            ty = th / 2;
        } else {
            // Corner baseline wooden finger index numTabs-1 along bottom edge (x from 0 to tabLen, y from h-th to h)
            tx = (tabLen + th) / 2;
            ty = h - (th / 2);
        }

        return { tx, ty };
    }

    /**
     * Generates path for Drawer Front with finger joints + handle cutout
     */
    createDrawerFrontPath(w, h, th, tabSize, kerf, handleStyle) {
        let d = '';
        const k = kerf / 2;

        d += `M ${0} ${0} `;
        
        // Top edge (flat or finger notch)
        if (handleStyle === 'notch') {
            const nw = Math.min(60, w / 2);
            const nh = 16;
            const cx = w / 2;
            d += `L ${cx - nw/2} ${0} `;
            d += `A ${nw/2} ${nh} 0 0 0 ${cx + nw/2} ${0} `;
            d += `L ${w} ${0} `;
        } else {
            d += `L ${w} ${0} `;
        }

        // Right edge (tabs outward)
        d += this.edgeTabs(w, 0, w, h, th, tabSize, kerf, 1);

        // Bottom edge (slots inward to interlock with drawer bottom tabs)
        d += this.edgeTabs(w, h, 0, h, th, tabSize, kerf, -1);

        // Left edge (tabs outward)
        d += this.edgeTabs(0, h, 0, 0, th, tabSize, kerf, 1);

        d += 'Z';

        // Internal hardware cutouts
        if (handleStyle === 'rects64' || handleStyle === 'rects32' || handleStyle === 'rects96') {
            let space = handleStyle === 'rects32' ? 32 : handleStyle === 'rects96' ? 96 : 64;
            const rw = handleStyle === 'rects32' ? 4 : 5;
            const rh = handleStyle === 'rects32' ? 8 : 10;

            // Auto fallback spacing if drawer is narrow
            if (w < space + rw + 12) {
                space = 32;
            }
            if (w < space + rw + 8) {
                space = 0; // single central rect
            }

            const sy = Math.max(10, Math.min(26, (h - rh) / 2));

            if (space === 0) {
                const sx = (w - rw) / 2;
                d += ` M ${sx} ${sy} h ${rw} v ${rh} h ${-rw} Z`;
            } else {
                const cx1 = (w - space) / 2;
                const cx2 = cx1 + space;
                d += ` M ${cx1 - rw/2} ${sy} h ${rw} v ${rh} h ${-rw} Z`;
                d += ` M ${cx2 - rw/2} ${sy} h ${rw} v ${rh} h ${-rw} Z`;
            }
        } else if (handleStyle === 'slot') {
            const sw = Math.min(60, w - 20);
            const sh = 10;
            const sx = (w - sw) / 2;
            const sy = Math.max(10, Math.min(22, (h - sh) / 2));
            d += ` M ${sx} ${sy} h ${sw} v ${sh} h ${-sw} Z`;
        } else if (handleStyle === 'screws64') {
            const space = 64;
            if (w > space + 12) {
                const r = 1.7; // 3.4mm bolt hole
                const cy = Math.max(12, Math.min(25, h / 2));
                const cx1 = (w - space) / 2;
                const cx2 = cx1 + space;

                d += ` M ${cx1 - r} ${cy} a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 ${-r*2} 0`;
                d += ` M ${cx2 - r} ${cy} a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 ${-r*2} 0`;
            }
        }

        return d;
    }

    /**
     * Generates laser-cut U-shaped Pull Handle path matching drawer front holes
     */
    createHandlePath(w, h, space, rw, rh, drTh, handleTh) {
        const cx1 = (w - space) / 2;
        const cx2 = cx1 + space;
        const gripH = h - drTh - 2;

        let d = `M 0 0 `;
        d += `L ${w} 0 `;
        d += `L ${w} ${gripH} `;
        d += `L ${cx2 + rw/2} ${gripH} `;
        d += `L ${cx2 + rw/2} ${h} `;
        d += `L ${cx2 - rw/2} ${h} `;
        d += `L ${cx2 - rw/2} ${gripH} `;
        d += `L ${cx1 + rw/2} ${gripH} `;
        d += `L ${cx1 + rw/2} ${h} `;
        d += `L ${cx1 - rw/2} ${h} `;
        d += `L ${cx1 - rw/2} ${gripH} `;
        d += `L 0 ${gripH} Z`;

        if (space > 20 && gripH > 10) {
            const ix1 = cx1 + rw/2 + 4;
            const ix2 = cx2 - rw/2 - 4;
            const iy1 = 6;
            const iy2 = gripH - 6;
            if (ix2 > ix1 && iy2 > iy1) {
                d += ` M ${ix1} ${iy1} L ${ix2} ${iy1} L ${ix2} ${iy2} L ${ix1} ${iy2} Z`;
            }
        }
        return d;
    }

    /**
     * Generates a closed box panel path with customizable edge polarities.
     * polarities: [top, right, bottom, left]. 0 = flat edge, 1 = tabs outward, -1 = slots inward.
     */
    createBoxPanelPath(w, h, th, tabSize, kerf, polarities) {
        let d = `M 0 0 `;
        d += polarities[0] === 0 ? `L ${w} 0 ` : this.edgeTabs(0, 0, w, 0, th, tabSize, kerf, polarities[0]);
        d += polarities[1] === 0 ? `L ${w} ${h} ` : this.edgeTabs(w, 0, w, h, th, tabSize, kerf, polarities[1]);
        d += polarities[2] === 0 ? `L 0 ${h} ` : this.edgeTabs(w, h, 0, h, th, tabSize, kerf, polarities[2]);
        d += polarities[3] === 0 ? `L 0 0 ` : this.edgeTabs(0, h, 0, 0, th, tabSize, kerf, polarities[3]);
        return d + 'Z';
    }

    /**
     * Generates Cabinet Side Panel path with outer joints + internal mortise holes for shelf dividers
     */
    createCabinetSidePath(w, h, th, tabSize, kerf, polarities, cabRows, drH) {
        let d = this.createBoxPanelPath(w, h, th, tabSize, kerf, polarities);

        if (cabRows > 1) {
            const shelfLen = w - th; // length of shelf divider along depth
            if (shelfLen > 1e-3) {
                let numTabs = Math.max(3, 1 + 2 * Math.round((shelfLen / tabSize - 1) / 2));
                if (numTabs % 2 === 0) numTabs++;
                const tabLen = shelfLen / numTabs;

                for (let r = 1; r < cabRows; r++) {
                    const shelfY = th + r * (drH + 3);

                    for (let i = 1; i < numTabs; i += 2) {
                        const sx = th + i * tabLen;
                        const sy = shelfY;
                        d += ` M ${sx} ${sy} h ${tabLen} v ${th} h ${-tabLen} Z`;
                    }
                }
            }
        }
        return d;
    }

    /**
     * Generates stepping tab path along a straight edge from (x1,y1) to (x2,y2).
     * polarity: 1 = tabs point outward (add material), -1 = slots cut inward (remove material).
     */
    edgeTabs(x1, y1, x2, y2, th, reqTabSize, kerf, polarity) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);

        if (len < 1e-3) return '';

        const ux = dx / len;
        const uy = dy / len;

        // Outward normal vector in SVG coordinate space (+y down)
        const nx = uy * polarity;
        const ny = -ux * polarity;

        let numTabs = Math.max(3, 1 + 2 * Math.round((len / reqTabSize - 1) / 2));
        if (numTabs % 2 === 0) numTabs++;

        const tabLen = len / numTabs;
        const k = (kerf / 2) * polarity;

        let pathStr = '';
        let currX = x1;
        let currY = y1;

        for (let i = 0; i < numTabs; i++) {
            const isTab = i % 2 === 1;
            const nextX = x1 + ux * tabLen * (i + 1);
            const nextY = y1 + uy * tabLen * (i + 1);

            if (isTab) {
                // Step outward along normal, with kerf adjustment along tangent
                pathStr += `L ${currX + nx * th - ux * k} ${currY + ny * th - uy * k} `;
                pathStr += `L ${nextX + nx * th + ux * k} ${nextY + ny * th + uy * k} `;
                pathStr += `L ${nextX} ${nextY} `;
            } else {
                pathStr += `L ${nextX} ${nextY} `;
            }

            currX = nextX;
            currY = nextY;
        }

        return pathStr;
    }

    /**
     * Converts a generated part object into a standalone valid SVG file string
     */
    static partToSVG(part) {
        const margin = 15;
        const vbW = part.width + margin * 2;
        const vbH = part.height + margin * 2;
        const codeText = part.code || part.name;
        const { tx, ty } = this.calculateHiddenCoords(part, 15);

        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Generated by Drawfinity | Gridfinity Cabinet & Drawer Generator -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-margin} ${-margin} ${vbW} ${vbH}" width="${vbW}mm" height="${vbH}mm">
    <style>
        .cut-path { fill: none; stroke: #ff0000; stroke-width: 0.15mm; stroke-linecap: round; stroke-linejoin: round; }
        .engrave-text { font-family: Arial, sans-serif; font-size: 20px; fill: #0000ff; stroke: none; }
    </style>
    <g>
        <path class="cut-path" d="${part.path}" />
        <g transform="translate(${tx}, ${ty}) scale(0.06)">
            <text class="engrave-text" x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="20" fill="#0000ff">${codeText}</text>
        </g>
    </g>
</svg>`;
    }

    /**
     * Generates combined master cut sheet SVG containing all parts laid out
     */
    static generateMasterCutSheet(parts) {
        const margin = 20;
        const spacing = 20;
        let currentX = margin;
        let currentY = margin;
        let rowHeight = 0;
        const maxSheetWidth = 600;

        let pathsContent = '';

        parts.forEach(part => {
            const count = part.count || 1;
            const codeText = part.code || part.name;
            const { tx, ty } = this.calculateHiddenCoords(part, 15);

            for (let i = 0; i < count; i++) {
                if (currentX + part.width > maxSheetWidth && currentX > margin) {
                    currentX = margin;
                    currentY += rowHeight + spacing;
                    rowHeight = 0;
                }

                const suffix = count > 1 ? ` #${i+1}` : '';
                pathsContent += `<g transform="translate(${currentX}, ${currentY})">
                    <path class="cut-path" d="${part.path}" />
                    <g transform="translate(${tx}, ${ty}) scale(0.06)">
                        <text class="engrave-text" x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="20" fill="#0000ff">${codeText}${suffix}</text>
                    </g>
                </g>\n`;

                rowHeight = Math.max(rowHeight, part.height);
                currentX += part.width + spacing;
            }
        });

        const totalW = Math.max(maxSheetWidth, currentX + margin);
        const totalH = currentY + rowHeight + margin * 2;

        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Master Cut Sheet - Drawfinity Generator -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}mm" height="${totalH}mm">
    <style>
        .cut-path { fill: none; stroke: #ff0000; stroke-width: 0.15mm; stroke-linecap: round; stroke-linejoin: round; }
        .engrave-text { font-family: Arial, sans-serif; font-size: 20px; fill: #0000ff; stroke: none; }
    </style>
    <rect width="100%" height="100%" fill="#0b0f19" opacity="0.05"/>
    ${pathsContent}
</svg>`;
    }
}
