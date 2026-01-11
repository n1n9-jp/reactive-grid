// リアクティブグリッド用ユーティリティ関数

// ガウス重み計算
// Circulation、Pulfunte、対角線モーション（Scan/Slash）で使用
const gaussianWeight = (distance, amplitude, falloff, baseline = 1.0) => {
    return baseline + amplitude * Math.exp(-distance * distance * falloff);
};

// 色の正規化 - 各モーションタイプの{min, max}範囲を返す
// ピーク重みが高いモーションは、完全な色グラデーションを表示するためにスケーリングが必要
const getColorNormalizationRange = (motion) => {
    const ranges = {
        'Circulation': { min: 1.0, max: 10.0 },
        'Scan': { min: 1.0, max: 20.0 },
        'Slash': { min: 1.0, max: 20.0 },
        'Pulfunte': { min: 1.0, max: 30.0 }
    };

    // 特別なスケーリングが不要なモーションのデフォルト範囲
    return ranges[motion] || { min: 0.3, max: 2.2 };
};

// 対角線モーション用ヘルパー関数（ScanとSlash）
// direction: 1 = 左上→右下（Scan）、-1 = 右上→左下（Slash）
const calculateDiagonalMotion = (t, direction) => {
    const globalRowWeights = [];
    const globalColWeights = [];
    let totalGlobalRowWeight = 0;
    let totalGlobalColWeight = 0;

    let cycleLen = 6;
    let phase = (t * 1.5) % cycleLen - 0.5;

    for (let r = 0; r < 5; r++) {
        let dist = r - phase;
        let w = gaussianWeight(dist, 4.0, 1.5);
        globalRowWeights.push(w);
        totalGlobalRowWeight += w;
    }

    for (let c = 0; c < 5; c++) {
        // direction = 1: 同じ位相（左上→右下）、direction = -1: 反転位相（右上→左下）
        let colPhase = direction === 1 ? phase : (cycleLen - 0.5 - phase);
        let dist = c - colPhase;
        let w = gaussianWeight(dist, 4.0, 1.5);
        globalColWeights.push(w);
        totalGlobalColWeight += w;
    }

    return { globalRowWeights, globalColWeights, totalGlobalRowWeight, totalGlobalColWeight };
};
