let grids = [];

// Global Parameters controlled by Tweakpane
const PARAMS = {
    scheme: 'Viridis',
    speed: 0.05
};

// Configs now only define label and motion type
const GRID_CONFIGS = [
    { label: 'WAVE', motion: 'Wave' },
    { label: 'BREATH', motion: 'Breath' },
    { label: 'NOISE', motion: 'Noise' },
    { label: 'SCAN', motion: 'Scan' },
    { label: 'RIPPLE', motion: 'Wave' },
    { label: 'PULSE', motion: 'Breath' },
    { label: 'CHAOS', motion: 'Noise' },
    { label: 'BEAM', motion: 'Scan' },
    { label: 'GLITCH', motion: 'Noise' },
    { label: 'SPIRAL', motion: 'Wave' }
];

let pane;

class ReactiveGrid {
    constructor(container, config) {
        this.container = container;
        this.config = config;
        this.rows = [];
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
        for (let r = 0; r < 5; r++) {
            let rowDiv = document.createElement('div');
            rowDiv.className = 'grid-row';
            this.gridWrapper.appendChild(rowDiv);

            let rowBlocks = [];

            for (let c = 0; c < 5; c++) {
                let div = document.createElement('div');
                div.className = 'char-block';
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

        let rowWeights = [];
        let colWeights = [];
        let totalRowWeight = 0;
        let totalColWeight = 0;
        let motion = this.config.motion;

        // --- Calculate Weights ---
        if (motion === 'Wave') {
            for (let r = 0; r < 5; r++) {
                let w = 1.0 + 0.6 * sin(t * 0.7 + r * 1.2);
                rowWeights.push(w);
                totalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let w = 1.0 + 0.6 * sin(t * 1.1 + c * 0.8);
                colWeights.push(w);
                totalColWeight += w;
            }
        } else if (motion === 'Breath') {
            for (let r = 0; r < 5; r++) {
                let w = 1.0 + 0.5 * sin(t);
                rowWeights.push(w);
                totalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let w = 1.0 + 0.5 * sin(t * 0.9);
                colWeights.push(w);
                totalColWeight += w;
            }
        } else if (motion === 'Noise') {
            for (let r = 0; r < 5; r++) {
                let w = map(noise(t * 0.5, r * 10), 0, 1, 0.4, 2.0);
                rowWeights.push(w);
                totalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let w = map(noise(t * 0.5, c * 10 + 100), 0, 1, 0.4, 2.0);
                colWeights.push(w);
                totalColWeight += w;
            }
        } else if (motion === 'Scan') {
            let phase = (t * 0.5) % 5;
            for (let r = 0; r < 5; r++) {
                let dist = abs(r - phase);
                let w = 1.0 + 2.0 * exp(-dist * dist * 2);
                rowWeights.push(w);
                totalRowWeight += w;
            }
            let catPhase = (t * 0.7 + 2.5) % 5;
            for (let c = 0; c < 5; c++) {
                let dist = abs(c - catPhase);
                let w = 1.0 + 2.0 * exp(-dist * dist * 2);
                colWeights.push(w);
                totalColWeight += w;
            }
        } else {
            // Fallback
            for (let r = 0; r < 5; r++) {
                let w = 1.0 + 0.6 * sin(t * 0.7 + r * 1.2);
                rowWeights.push(w);
                totalRowWeight += w;
            }
            for (let c = 0; c < 5; c++) {
                let w = 1.0 + 0.6 * sin(t * 1.1 + c * 0.8);
                colWeights.push(w);
                totalColWeight += w;
            }
        }

        // Apply Styles
        /* Use offsetWidth of the wrapper.
           In a real scenario cached values might be better for performance,
           but here we check every frame for simplicity. */
        /* Note: offsetWidth causes reflow, but on modern browsers it's acceptable for this number of elements */
        // const cW = this.gridWrapper.offsetWidth;
        // const cH = this.gridWrapper.offsetHeight;
        // Optimization: For this specific fixed layout, we assume wrapper size is handled by CSS,
        // and we only need proportional widths. Color mapping is independent of pixel size.
        // We only calculate width/height percentages.

        for (let r = 0; r < 5; r++) {
            let rowHPercent = (rowWeights[r] / totalRowWeight) * 100;
            this.rows[r].div.style.height = `${rowHPercent}%`;

            for (let c = 0; c < 5; c++) {
                let block = this.rows[r].blocks[c];
                let colWPercent = (colWeights[c] / totalColWeight) * 100;
                block.div.style.width = `${colWPercent}%`;

                // Color Mapping
                let relativeArea = rowWeights[r] * colWeights[c];
                let tColor = map(relativeArea, 0.3, 2.2, 0, 1, true);

                // Use global scheme
                let colorFunc = d3[`interpolate${PARAMS.scheme}`];
                if (colorFunc) {
                    block.div.style.backgroundColor = colorFunc(tColor);
                }
            }
        }
    }
}

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
