// リアクティブグリッド用ユーティリティ関数

// ガウス重み計算
// Circulation、Pulfunte、対角線モーション（Scan/Slash）で使用
const gaussianWeight = (distance, amplitude, falloff, baseline = 1.0) => {
    return baseline + amplitude * Math.exp(-distance * distance * falloff);
};

// 色の正規化 - 各モーションタイプの{min, max}範囲を返す
// ピーク重みが高いモーションは、完全な色グラデーションを表示するためにスケーリングが必要
const getColorNormalizationRange = (motion) => {
    // 特別なスケーリングが不要なモーションのデフォルト範囲
    return CONFIG.COLOR_NORMALIZATION[motion] || { min: CONFIG.COLOR_RANGE.MIN, max: CONFIG.COLOR_RANGE.MAX };
};

// 対角線モーション用ヘルパー関数（ScanとSlash）
// direction: 1 = 左上→右下（Scan）、-1 = 右上→左下（Slash）
const calculateDiagonalMotion = (t, direction) => {
    const globalRowWeights = [];
    const globalColWeights = [];
    let totalGlobalRowWeight = 0;
    let totalGlobalColWeight = 0;

    let cycleLen = CONFIG.DIAGONAL.CYCLE_LENGTH;
    let phase = (t * CONFIG.DIAGONAL.PHASE_SPEED) % cycleLen - CONFIG.DIAGONAL.PHASE_OFFSET;

    for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
        let dist = r - phase;
        let w = gaussianWeight(dist, CONFIG.WEIGHT_AMPLITUDE.PEAK, CONFIG.GAUSSIAN_FALLOFF.SHARP);
        globalRowWeights.push(w);
        totalGlobalRowWeight += w;
    }

    for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
        // direction = 1: 同じ位相（左上→右下）、direction = -1: 反転位相（右上→左下）
        let colPhase = direction === 1 ? phase : (cycleLen - CONFIG.DIAGONAL.PHASE_OFFSET - phase);
        let dist = c - colPhase;
        let w = gaussianWeight(dist, CONFIG.WEIGHT_AMPLITUDE.PEAK, CONFIG.GAUSSIAN_FALLOFF.SHARP);
        globalColWeights.push(w);
        totalGlobalColWeight += w;
    }

    return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
};
