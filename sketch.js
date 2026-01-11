let grids = [];

// Tweakpaneで制御されるグローバルパラメータ
const PARAMS = {
    scheme: 'Viridis',
    speed: 0.05
};

// グリッド設定 - ラベルとモーションタイプのみを定義
// 'orientation'プロパティでグリッドレイアウト（列優先 or 行優先）を指定
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

// モーション計算関数 - 各関数は { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight } を返す
const MotionCalculators = {
    Orthogonal: (t) => {
        const globalRowWeights = [];
        const globalColWeights = [];
        let totalGlobalRowWeight = 0;
        let totalGlobalColWeight = 0;

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

        return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
    },

    Polar: (t) => {
        const globalRowWeights = [];
        const globalColWeights = [];
        let totalGlobalRowWeight = 0;
        let totalGlobalColWeight = 0;

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

        return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
    },

    'TB Flow': (t) => {
        const globalRowWeights = [];
        const globalColWeights = [];
        let totalGlobalRowWeight = 0;
        let totalGlobalColWeight = 0;

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

        return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
    },

    'LR Flow': (t) => {
        const globalRowWeights = [];
        const globalColWeights = [];
        let totalGlobalRowWeight = 0;
        let totalGlobalColWeight = 0;

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

        return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
    },

    AltTBFlow: (t) => {
        const globalRowWeights = [];
        const globalColWeights = [];
        let totalGlobalRowWeight = 1; // Dummy
        let totalGlobalColWeight = 0;

        // 列幅は均一/呼吸
        for (let c = 0; c < 5; c++) {
            let w = 1.0 + 0.3 * sin(t * 1.5 + c * 0.2);
            globalColWeights.push(w);
            totalGlobalColWeight += w;
        }

        return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
    },

    Circulation: (t) => {
        const globalRowWeights = [];
        const globalColWeights = [];
        let totalGlobalRowWeight = 0;
        let totalGlobalColWeight = 0;

        // フォーカスポイントが滑らかに軌道を描く
        let radius = 2.5;
        let centerX = 2.0;
        let centerY = 2.0;
        let orbitSpeed = t * 0.5;
        let angle = orbitSpeed - Math.PI * 0.75;

        let focusC = centerX + radius * Math.cos(angle);
        let focusR = centerY + radius * Math.sin(angle);

        // ガウス重み
        for (let r = 0; r < 5; r++) {
            let dist = r - focusR;
            let w = gaussianWeight(dist, 4.0, 0.5);
            globalRowWeights.push(w);
            totalGlobalRowWeight += w;
        }
        for (let c = 0; c < 5; c++) {
            let dist = c - focusC;
            let w = gaussianWeight(dist, 4.0, 0.5);
            globalColWeights.push(w);
            totalGlobalColWeight += w;
        }

        return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
    },

    Pulfunte: (t, instance) => {
        const globalRowWeights = [];
        const globalColWeights = [];
        let totalGlobalRowWeight = 0;
        let totalGlobalColWeight = 0;

        let stepDuration = 1.0;
        let step = Math.floor(t * stepDuration);
        let stepProgress = (t * stepDuration) - step;

        let rnd = (seed) => {
            let x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        // Current and next focus cells
        let focusR1 = Math.floor(rnd(step * 123.456) * 5);
        let focusC1 = Math.floor(rnd(step * 789.012) * 5);
        let focusR2 = Math.floor(rnd((step + 1) * 123.456) * 5);
        let focusC2 = Math.floor(rnd((step + 1) * 789.012) * 5);

        // Smoothstep interpolation
        let ease = stepProgress * stepProgress * (3 - 2 * stepProgress);
        let focusR = focusR1 + (focusR2 - focusR1) * ease;
        let focusC = focusC1 + (focusC2 - focusC1) * ease;

        // 2D放射状重み
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                let dr = r - focusR;
                let dc = c - focusC;
                let dist = Math.sqrt(dr * dr + dc * dc);
                let weight = gaussianWeight(dist, 5.0, 0.4);

                if (!instance.pulfunteWeights) instance.pulfunteWeights = [];
                if (!instance.pulfunteWeights[r]) instance.pulfunteWeights[r] = [];
                instance.pulfunteWeights[r][c] = weight;
            }
        }

        // Extract row and col weights
        for (let r = 0; r < 5; r++) {
            let maxW = Math.max(...instance.pulfunteWeights[r]);
            globalRowWeights.push(maxW);
            totalGlobalRowWeight += maxW;
        }
        for (let c = 0; c < 5; c++) {
            let maxW = Math.max(...instance.pulfunteWeights.map(row => row[c]));
            globalColWeights.push(maxW);
            totalGlobalColWeight += maxW;
        }

        return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
    },

    Noise: (t) => {
        const globalRowWeights = [];
        const globalColWeights = [];
        let totalGlobalRowWeight = 0;
        let totalGlobalColWeight = 0;

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

        return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
    }
};

// ScanとSlashで共有ヘルパーを使用
MotionCalculators.Scan = (t) => calculateDiagonalMotion(t, 1);
MotionCalculators.Slash = (t) => calculateDiagonalMotion(t, -1);


class ReactiveGrid {
    constructor(container, config) {
        this.container = container;
        this.config = config;
        this.cols = []; // 列優先構造
        this.rows = []; // 行優先構造 (orientation === 'row'の場合)
        this.time = 0;

        // インスタンスラッパー
        this.instanceDiv = document.createElement('div');
        this.instanceDiv.className = 'grid-instance';
        this.container.appendChild(this.instanceDiv);

        // グリッドラッパー
        this.gridWrapper = document.createElement('div');
        this.gridWrapper.className = 'grid-wrapper';
        this.instanceDiv.appendChild(this.gridWrapper);

        // グリッド生成
        if (this.config.orientation === 'row') {
            // --- 行優先生成（行を垂直に積み重ね） ---
            this.gridWrapper.style.flexDirection = 'column'; // 行を垂直に積み重ね

            for (let r = 0; r < 5; r++) {
                let rowDiv = document.createElement('div');
                rowDiv.className = 'grid-row';
                // 行コンテナのインラインスタイル
                rowDiv.style.display = 'flex';
                rowDiv.style.flexDirection = 'row'; // ブロックを横並び
                rowDiv.style.width = '100%';
                rowDiv.style.height = '0'; // 動的
                rowDiv.style.flexGrow = '0';

                this.gridWrapper.appendChild(rowDiv);

                let rowBlocks = [];

                for (let c = 0; c < 5; c++) {
                    let div = document.createElement('div');
                    div.className = 'char-block';
                    // row-major用にchar-blockのデフォルトを上書き
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
            // --- 列優先生成（デフォルト: 列を水平に積み重ね） ---
            // grid-wrapperのデフォルトはflex-direction: row（CSSまたはデフォルトから）

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
        // Use MotionCalculators to get weights
        const calculator = MotionCalculators[motion] || MotionCalculators.Orthogonal;
        const { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight } =
            calculator(t, this);

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

                // Normalize border
                block.div.style.border = '1px solid #000';

                // Apply color normalization based on motion type
                const range = getColorNormalizationRange(motion);
                if (range.min !== 0.3 || range.max !== 2.2) {
                    // Motion needs special scaling
                    relativeArea = map(relativeArea, range.min, range.max, 0.3, 2.2);
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
