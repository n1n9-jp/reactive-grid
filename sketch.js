let grids = [];

// Global Parameters controlled by Tweakpane
const PARAMS = {
    scheme: 'Viridis',
    speed: 0.05
};

// Configs now only define label and motion type
// Added 'orientation' property for grid layout (col-major or row-major)
const GRID_CONFIGS = [
    { label: 'POLAR', motion: 'Polar' },
    { label: 'TB FLOW', motion: 'TB Flow' },
    { label: 'LR FLOW', motion: 'LR Flow' },
    { label: 'ALT TB FLOW', motion: 'AltTBFlow' },
    { label: 'ALT LR FLOW', motion: 'AltLRFlow', orientation: 'row' },
    { label: 'ORTHOGONAL', motion: 'Orthogonal' },
    { label: 'CIRCULATION', motion: 'Circulation' },
    { label: 'BACK SLASH', motion: 'Scan' },
    { label: 'SLASH', motion: 'Slash' },
    { label: 'PULFUNTE', motion: 'Pulfunte' }
];

class ReactiveGrid {
    constructor(container, config) {
        this.container = container;
        this.config = config;
        this.cols = []; // Column-Major Structure
        this.rows = []; // Row-Major Structure (if orientation === 'row')
        this.time = 0;

        // Instance wrapper
        this.instanceDiv = document.createElement('div');
        this.instanceDiv.className = 'grid-instance';
        this.container.appendChild(this.instanceDiv);

        // Grid wrapper
        this.gridWrapper = document.createElement('div');
        this.gridWrapper.className = 'grid-wrapper';
        this.instanceDiv.appendChild(this.gridWrapper);

        // Grid Generation
        if (this.config.orientation === 'row') {
            // --- Row-Major Generation (Rows stacked vertically) ---
            this.gridWrapper.style.flexDirection = 'column'; // Stack rows vertically

            for (let r = 0; r < 5; r++) {
                let rowDiv = document.createElement('div');
                rowDiv.className = 'grid-row';
                // Inline styles for Row container
                rowDiv.style.display = 'flex';
                rowDiv.style.flexDirection = 'row'; // Blocks side-by-side
                rowDiv.style.width = '100%';
                rowDiv.style.height = '0'; // Dynamic
                rowDiv.style.flexGrow = '0';

                this.gridWrapper.appendChild(rowDiv);

                let rowBlocks = [];

                for (let c = 0; c < 5; c++) {
                    let div = document.createElement('div');
                    div.className = 'char-block';
                    // Override char-block defaults for row-major
                    div.style.height = '100%';
                    div.style.width = '0'; // Dynamic
                    rowDiv.appendChild(div);

                    rowBlocks.push({
                        div: div,
                        r: r,
                        c: c
                    });
                }

                this.rows.push({
                    div: rowDiv,
                    blocks: rowBlocks
                });
            }

        } else {
            // --- Column-Major Generation (Default: Cols stacked horizontally) ---
            // grid-wrapper default is flex-direction: row (from CSS or default)

            for (let c = 0; c < 5; c++) {
                let colDiv = document.createElement('div');
                colDiv.className = 'grid-col';
                this.gridWrapper.appendChild(colDiv);

                let colBlocks = [];

                for (let r = 0; r < 5; r++) {
                    let div = document.createElement('div');
                    div.className = 'char-block';
                    colDiv.appendChild(div);

                    colBlocks.push({
                        div: div,
                        r: r,
                        c: c
                    });
                }

                this.cols.push({
                    div: colDiv,
                    blocks: colBlocks
                });
            }
        }

        // Label
        this.labelDiv = document.createElement('div');
        this.labelDiv.className = 'motion-label';
        this.labelDiv.innerText = this.config.label;
        this.instanceDiv.appendChild(this.labelDiv);
    }

    update() {
        // Use global speed
        this.time += PARAMS.speed;
        let t = this.time;
        let motion = this.config.motion;

        // Branch update logic based on orientation
        if (this.config.orientation === 'row') {
            this.updateRowMajor(t, motion);
        } else {
            this.updateColMajor(t, motion);
        }
    }

    // --- Column Major Update (Original Logic) ---
    // Orthogonal, Polar, Flows, Noise, etc.
    updateColMajor(t, motion) {
        let globalRowWeights = [];
        let globalColWeights = [];
        let totalGlobalRowWeight = 0;
        let totalGlobalColWeight = 0;

        // 1. Calculate Standard Weights
        if (motion === 'Orthogonal') {
            for (let r = 0; r < 5; r++) {
                let w = 1.0 + 0.6 * sin(t * 1.5 + r * 0.8);
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let w = 1.0 + 0.6 * sin(t * 1.5 + c * 0.8);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
        } else if (motion === 'Polar') {
            for (let r = 0; r < 5; r++) {
                let dist = Math.abs(r - 2);
                let w = 1.0 + 0.6 * sin(t * 2.0 - dist * 1.0);
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let dist = Math.abs(c - 2);
                let w = 1.0 + 0.6 * sin(t * 2.0 - dist * 1.0);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
        } else if (motion === 'TB Flow') {
            for (let r = 0; r < 5; r++) {
                let w = 1.0 + 0.6 * sin(t * 2.0 - r * 0.8);
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let w = 1.0 + 0.3 * sin(t * 1.5 + c * 0.2);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
        } else if (motion === 'LR Flow') {
            for (let r = 0; r < 5; r++) {
                let w = 1.0 + 0.3 * sin(t * 1.5 + r * 0.2);
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let w = 1.0 + 0.6 * sin(t * 2.0 - c * 0.8);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
        } else if (motion === 'AltTBFlow') {
            // Col widths are uniform/breathing
            for (let c = 0; c < 5; c++) {
                let w = 1.0 + 0.3 * sin(t * 1.5 + c * 0.2);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
            totalGlobalRowWeight = 1; // Dummy
        } else if (motion === 'Circulation') {
            // Circulation: Focus point orbits smoothly, avoiding sharp corners
            // Center (2, 2), Radius ~2.5 to sweep corners
            let radius = 2.5;
            let centerX = 2.0;
            let centerY = 2.0;
            let orbitSpeed = t * 0.5; // Adjust speed as needed

            // Orbit logic:
            // Calculate focus point on a circle/ellipse
            // Offset phase by -PI/4 to start near Top-Left if needed, but continuous motion doesn't strictly matter start.
            // Clockwise: 
            // focusC (x): sin(t)
            // focusR (y): -cos(t) -> starts top, goes right(if x is sin) ? 
            // Let's rely on sin/cos standard circle. 
            // To go TL -> TR -> BR -> BL:
            // Top (y min), Left(x min) -> Top(y min), Right(x max) 
            // This is top-edge movement.
            // Circular: 
            // Angle -PI/2 (top) -> 0 (right) -> PI/2 (bottom) -> PI (left) -> ...
            // Y needs to be center + r * sin(angle). (sin(-PI/2) = -1 -> Top)
            // X needs to be center + r * cos(angle). (cos(-PI/2) = 0 -> Center)

            // We want clockwise starting TL (-x, -y).
            // angel -3PI/4.
            // x = cos, y = sin.

            let angle = orbitSpeed - Math.PI * 0.75;

            let focusC = centerX + radius * Math.cos(angle);
            let focusR = centerY + radius * Math.sin(angle);

            // Apply weights based on distance to Focus Point
            // Use Gaussian (bell curve) for smooth ease-in/ease-out at the peak
            // exp(-dist^2) has 0 derivative at peak, avoiding the sharp 'bounce' of exp(-abs(dist))
            for (let r = 0; r < 5; r++) {
                let dist = r - focusR; // Signed distance
                let w = 1.0 + 4.0 * Math.exp(-dist * dist * 0.5); // Gaussian
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let dist = c - focusC;
                let w = 1.0 + 4.0 * Math.exp(-dist * dist * 0.5);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
        } else if (motion === 'Pulfunte') {
            // Pulfunte: Random focus cell that changes at regular intervals with smooth transitions

            let stepDuration = 1.0; // Steps per unit time (reduced for gentler transitions)
            let step = Math.floor(t * stepDuration);
            let stepProgress = (t * stepDuration) - step; // 0.0 to 1.0 within each step

            // Deterministic random function based on step
            let rnd = (seed) => {
                let x = Math.sin(seed) * 10000;
                return x - Math.floor(x);
            };

            // Current focus cell
            let focusR1 = Math.floor(rnd(step * 123.456) * 5);
            let focusC1 = Math.floor(rnd(step * 789.012) * 5);

            // Next focus cell (for interpolation)
            let focusR2 = Math.floor(rnd((step + 1) * 123.456) * 5);
            let focusC2 = Math.floor(rnd((step + 1) * 789.012) * 5);

            // Interpolate between current and next focus using easing
            // Use smoothstep for ease-in-out effect
            let ease = stepProgress * stepProgress * (3 - 2 * stepProgress); // smoothstep
            let focusR = focusR1 + (focusR2 - focusR1) * ease;
            let focusC = focusC1 + (focusC2 - focusC1) * ease;

            // Apply radial weights based on 2D distance from focus
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    // Calculate 2D Euclidean distance
                    let dr = r - focusR;
                    let dc = c - focusC;
                    let dist = Math.sqrt(dr * dr + dc * dc);

                    // Gaussian falloff from focus
                    let weight = 1.0 + 5.0 * Math.exp(-dist * dist * 0.4);

                    // Store in a temporary 2D array
                    if (!this.pulfunteWeights) this.pulfunteWeights = [];
                    if (!this.pulfunteWeights[r]) this.pulfunteWeights[r] = [];
                    this.pulfunteWeights[r][c] = weight;
                }
            }

            // Extract row and col weights from 2D array
            for (let r = 0; r < 5; r++) {
                let maxW = Math.max(...this.pulfunteWeights[r]);
                globalRowWeights.push(maxW);
                totalGlobalRowWeight += maxW;
            }
            for (let c = 0; c < 5; c++) {
                let maxW = Math.max(...this.pulfunteWeights.map(row => row[c]));
                globalColWeights.push(maxW);
                totalGlobalColWeight += maxW;
            }
        } else if (motion === 'Noise') {
            for (let r = 0; r < 5; r++) {
                let w = map(noise(t * 0.5, r * 10), 0, 1, 0.4, 2.0);
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let w = map(noise(t * 0.5, c * 10 + 100), 0, 1, 0.4, 2.0);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
        } else if (motion === 'Scan') {
            // Scan / Beam: Diagonal wave from Top-Left to Bottom-Right
            // Synchronize Row and Col phases so the 'intersection' (high weight) moves diagonally (0,0) -> (4,4)

            // Cycle roughly -1 to 5 to allow fully entering and fully leaving
            let cycleLen = 6;
            let phase = (t * 1.5) % cycleLen - 0.5;

            for (let r = 0; r < 5; r++) {
                let dist = r - phase;
                // Gaussian peak near the phase
                let w = 1.0 + 4.0 * Math.exp(-dist * dist * 1.5);
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
            // Same phase for Cols = Diagonal movement
            for (let c = 0; c < 5; c++) {
                let dist = c - phase;
                let w = 1.0 + 4.0 * Math.exp(-dist * dist * 1.5);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
        } else if (motion === 'Slash') {
            // Slash: Diagonal wave from Top-Right to Bottom-Left (reverse of Scan)
            // Row phase moves forward (0->4), Col phase moves backward (4->0)

            let cycleLen = 6;
            let phase = (t * 1.5) % cycleLen - 0.5;

            for (let r = 0; r < 5; r++) {
                let dist = r - phase;
                let w = 1.0 + 4.0 * Math.exp(-dist * dist * 1.5);
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
            // Inverted phase for Cols = Opposite diagonal (TR->BL)
            for (let c = 0; c < 5; c++) {
                let dist = c - (cycleLen - 0.5 - phase); // Reverse direction
                let w = 1.0 + 4.0 * Math.exp(-dist * dist * 1.5);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
        } else {
            // Fallback
            for (let r = 0; r < 5; r++) {
                let w = 1.0 + 0.6 * sin(t * 0.7 + r * 1.2);
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let w = 1.0 + 0.6 * sin(t * 1.1 + c * 0.8);
                globalColWeights.push(w);
                totalGlobalColWeight += w;
            }
        }

        // 2. Apply
        for (let c = 0; c < 5; c++) {
            // Apply Col Width
            let colWPercent = (globalColWeights[c] / totalGlobalColWeight) * 100;
            this.cols[c].div.style.width = `${colWPercent}%`;

            // Determine Row Weights
            let localRowWeights = [];
            let localTotalRowWeight = 0;

            if (motion === 'AltTBFlow') {
                let isOddCol = (c % 2 === 0);
                for (let r = 0; r < 5; r++) {
                    let w;
                    if (isOddCol) { // Top to Bottom
                        w = 1.0 + 0.6 * sin(t * 2.0 - r * 0.8);
                    } else { // Bottom to Top
                        w = 1.0 + 0.6 * sin(t * 2.0 + r * 0.8);
                    }
                    localRowWeights.push(w);
                    localTotalRowWeight += w;
                }
            } else {
                localRowWeights = globalRowWeights;
                localTotalRowWeight = totalGlobalRowWeight;
            }

            for (let r = 0; r < 5; r++) {
                let block = this.cols[c].blocks[r];
                let rowHPercent = (localRowWeights[r] / localTotalRowWeight) * 100;
                block.div.style.height = `${rowHPercent}%`;

                // Color
                let relativeArea = localRowWeights[r] * globalColWeights[c];

                // Circulation specific: Revert to standard colors (remove Mondrian override if any remains)
                // Normalize border
                block.div.style.border = '1px solid #000';

                // Adjust relativeArea for Circulation, Scan, Slash, and Pulfunte to fit color map
                // These motions have very high peak weights, so we scale them down to standard range to see gradient.
                if (motion === 'Circulation') {
                    relativeArea = map(relativeArea, 1.0, 10.0, 0.3, 2.2);
                } else if (motion === 'Scan' || motion === 'Slash') {
                    // Scan and Slash can reach ~25 at peak, map to full color range
                    relativeArea = map(relativeArea, 1.0, 20.0, 0.3, 2.2);
                } else if (motion === 'Pulfunte') {
                    // Pulfunte can reach ~36 at peak (6*6), map to full color range
                    relativeArea = map(relativeArea, 1.0, 30.0, 0.3, 2.2);
                }

                // Standard D3 Scheme Color
                let tColor = map(relativeArea, 0.3, 2.2, 0, 1, true);
                let colorFunc = d3[`interpolate${PARAMS.scheme}`];
                if (colorFunc) {
                    block.div.style.backgroundColor = colorFunc(tColor);
                }
            }
        }
    }

    // --- Row Major Update (New Logic for AltLRFlow) ---
    // Specifically designed for AltLRFlow (90 deg rotated version of AltTBFlow)
    updateRowMajor(t, motion) {
        let globalRowWeights = [];
        let totalGlobalRowWeight = 0;

        // 1. Calculate Global Row Weights (Heights)
        // For AltLRFlow, User requested NO vertical breathing (Fixed visual row height)
        if (motion === 'AltLRFlow') {
            for (let r = 0; r < 5; r++) {
                let w = 1.0; // Static height
                globalRowWeights.push(w);
                totalGlobalRowWeight += w;
            }
        } else {
            // Default uniform if other Row-Majors added later
            for (let r = 0; r < 5; r++) totalGlobalRowWeight += 1, globalRowWeights.push(1);
        }

        // 2. Apply
        for (let r = 0; r < 5; r++) {
            // Apply Row Height
            let rowHPercent = (globalRowWeights[r] / totalGlobalRowWeight) * 100;
            this.rows[r].div.style.height = `${rowHPercent}%`;

            // Determine Col Weights (Widths) for this specific row
            let localColWeights = [];
            let localTotalColWeight = 0;

            if (motion === 'AltLRFlow') {
                let isEvenRow = (r % 2 === 0);
                for (let c = 0; c < 5; c++) {
                    let w;
                    if (isEvenRow) { // Left to Right
                        w = 1.0 + 0.6 * sin(t * 2.0 - c * 0.8);
                    } else { // Right to Left
                        w = 1.0 + 0.6 * sin(t * 2.0 + c * 0.8);
                    }
                    localColWeights.push(w);
                    localTotalColWeight += w;
                }
            } else {
                // Fallback
                for (let c = 0; c < 5; c++) localTotalColWeight += 1, localColWeights.push(1);
            }

            for (let c = 0; c < 5; c++) {
                let block = this.rows[r].blocks[c];
                let colWPercent = (localColWeights[c] / localTotalColWeight) * 100;
                block.div.style.width = `${colWPercent}%`;

                // Color
                let relativeArea = localColWeights[c] * globalRowWeights[r];
                let tColor = map(relativeArea, 0.3, 2.2, 0, 1, true);
                let colorFunc = d3[`interpolate${PARAMS.scheme}`];
                if (colorFunc) {
                    block.div.style.backgroundColor = colorFunc(tColor);
                }
            }
        }
    }
}

let pane;

function setup() {
    // p5 canvas setup - still needed for draw loop and noise/sin functions
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    clear();
    // Frame rate
    frameRate(60);

    const container = document.getElementById('overlay-container');
    container.innerHTML = '';

    // Title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'page-title';
    titleDiv.innerText = 'reactive grid';
    container.appendChild(titleDiv);

    // Create wrapper for the collection of grids to allow centering
    const gridCollection = document.createElement('div');
    gridCollection.id = 'grid-collection';
    container.appendChild(gridCollection);

    // Initialize all grids
    GRID_CONFIGS.forEach(conf => {
        let g = new ReactiveGrid(gridCollection, conf);
        grids.push(g);
    });

    // --- Tweakpane Setup ---
    pane = new Tweakpane.Pane({
        title: 'Global Settings',
    });

    pane.addInput(PARAMS, 'scheme', {
        options: {
            'Greys': 'Greys',
            'Viridis': 'Viridis',
            'Magma': 'Magma',
            'Inferno': 'Inferno',
            'Plasma': 'Plasma',
            'Cividis': 'Cividis',
            'Turbo': 'Turbo',
            'Cool': 'Cool',
            'Warm': 'Warm',
            'Blues': 'Blues',
            'Greens': 'Greens',
            'Oranges': 'Oranges',
            'Purples': 'Purples',
            'Reds': 'Reds',
        }
    });

    pane.addInput(PARAMS, 'speed', { min: 0, max: 0.1 });
}

function draw() {
    clear();
    // Update all grids
    grids.forEach(g => g.update());
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
