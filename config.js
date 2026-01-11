// リアクティブグリッド設定ファイル
// すべてのマジックナンバーとカスタマイズ可能な設定値を一元管理

const CONFIG = {
    // グリッドサイズ
    GRID_SIZE: 5,

    // 色の範囲
    COLOR_RANGE: {
        MIN: 0.3,
        MAX: 2.2
    },

    // 重みの振幅（モーション強度）
    WEIGHT_AMPLITUDE: {
        STRONG: 0.6,      // 強い動き（Orthogonal, Polar, TB/LR Flow）
        GENTLE: 0.3,      // 穏やかな動き（AltTBFlow, AltLRFlow）
        PEAK: 4.0,        // ピーク強度（Circulation, Scan, Slash）
        INTENSE: 5.0      // 最大強度（Pulfunte）
    },

    // 位相乗数（アニメーション速度調整）
    PHASE_MULTIPLIER: {
        SLOW: 1.5,
        NORMAL: 2.0,
        FAST: 2.5
    },

    // ガウス減衰率
    GAUSSIAN_FALLOFF: {
        GENTLE: 0.4,      // Pulfunte
        NORMAL: 0.5,      // Circulation
        SHARP: 1.5        // Scan, Slash
    },

    // Circulation設定
    CIRCULATION: {
        RADIUS: 2.5,
        CENTER_X: 2.0,
        CENTER_Y: 2.0,
        ORBIT_SPEED: 0.5
    },

    // Pulfunte設定
    PULFUNTE: {
        STEP_DURATION: 1.0,
        RANDOM_SEED_1: 123.456,
        RANDOM_SEED_2: 789.012
    },

    // 対角線モーション設定（Scan, Slash）
    DIAGONAL: {
        CYCLE_LENGTH: 6,
        PHASE_SPEED: 1.5,
        PHASE_OFFSET: 0.5
    },

    // Noise設定
    NOISE: {
        TIME_SPEED: 0.5,
        SPATIAL_OFFSET: 10,
        WEIGHT_MIN: 0.4,
        WEIGHT_MAX: 2.0
    },

    // 色の正規化範囲（モーション別）
    COLOR_NORMALIZATION: {
        'Circulation': { min: 1.0, max: 10.0 },
        'Scan': { min: 1.0, max: 20.0 },
        'Slash': { min: 1.0, max: 20.0 },
        'Pulfunte': { min: 1.0, max: 30.0 }
    },

    // デフォルトパラメータ
    DEFAULT_PARAMS: {
        scheme: 'Viridis',
        speed: 0.05
    },

    // 利用可能なカラースキーム
    COLOR_SCHEMES: {
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
        'Reds': 'Reds'
    }
};
