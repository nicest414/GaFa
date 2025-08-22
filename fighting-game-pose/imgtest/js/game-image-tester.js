/**
 * ゲーム内画像読み込みテスト
 * 実際のゲームクラスと同じ方法で画像をテストする
 */

// ゲームで使用される画像パス設定
const GAME_IMAGES = {
    // 背景画像
    background: '../img/background.png',
    shop: '../img/shop.png',
    
    // Kenjiキャラクター
    kenji: {
        idle: '../img/kenji/Idle.png',
        run: '../img/kenji/Run.png',
        jump: '../img/kenji/Jump.png',
        fall: '../img/kenji/Fall.png',
        attack1: '../img/kenji/Attack1.png',
        attack2: '../img/kenji/Attack2.png',
        takeHit: '../img/kenji/Take hit.png',
        death: '../img/kenji/Death.png'
    },
    
    // SamuraiMackキャラクター
    samuraiMack: {
        idle: '../img/samuraiMack/Idle.png',
        run: '../img/samuraiMack/Run.png',
        jump: '../img/samuraiMack/Jump.png',
        fall: '../img/samuraiMack/Fall.png',
        attack1: '../img/samuraiMack/Attack1.png',
        attack2: '../img/samuraiMack/Attack2.png',
        takeHit: '../img/samuraiMack/Take Hit.png',
        takeHitWhite: '../img/samuraiMack/Take Hit - white silhouette.png',
        death: '../img/samuraiMack/Death.png'
    }
};

class GameImageTester {
    constructor() {
        this.loadedImages = new Map();
        this.failedImages = new Map();
        this.testResults = {
            total: 0,
            loaded: 0,
            failed: 0,
            startTime: null,
            endTime: null
        };
    }

    /**
     * 画像プリロード（ゲームと同じ方式）
     * @param {string} src - 画像ソースパス
     * @param {string} key - 画像識別キー
     * @returns {Promise<HTMLImageElement>}
     */
    preloadImage(src, key) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.loadedImages.set(key, {
                    element: img,
                    src: src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    loadTime: Date.now() - this.testResults.startTime
                });
                
                this.testResults.loaded++;
                console.log(`✅ 読み込み成功: ${key} (${src})`);
                resolve(img);
            };
            
            img.onerror = (error) => {
                this.failedImages.set(key, {
                    src: src,
                    error: error,
                    loadTime: Date.now() - this.testResults.startTime
                });
                
                this.testResults.failed++;
                console.error(`❌ 読み込み失敗: ${key} (${src})`);
                reject(new Error(`Failed to load image: ${src}`));
            };
            
            this.testResults.total++;
            img.src = src;
        });
    }

    /**
     * 全ゲーム画像の読み込みテスト
     * @returns {Promise<Object>} テスト結果
     */
    async loadAllGameImages() {
        console.log('🎮 ゲーム画像読み込みテストを開始...');
        this.testResults.startTime = Date.now();
        
        const loadPromises = [];
        
        // 背景画像
        loadPromises.push(this.preloadImage(GAME_IMAGES.background, 'background'));
        loadPromises.push(this.preloadImage(GAME_IMAGES.shop, 'shop'));
        
        // Kenjiキャラクター画像
        Object.entries(GAME_IMAGES.kenji).forEach(([action, src]) => {
            loadPromises.push(this.preloadImage(src, `kenji_${action}`));
        });
        
        // SamuraiMackキャラクター画像
        Object.entries(GAME_IMAGES.samuraiMack).forEach(([action, src]) => {
            loadPromises.push(this.preloadImage(src, `samuraiMack_${action}`));
        });
        
        // すべての読み込みを実行（失敗も含む）
        const results = await Promise.allSettled(loadPromises);
        
        this.testResults.endTime = Date.now();
        const totalTime = this.testResults.endTime - this.testResults.startTime;
        
        console.log(`\n📊 読み込み完了！総時間: ${totalTime}ms`);
        
        return this.generateGameTestReport();
    }

    /**
     * ゲームテスト用レポート生成
     * @returns {Object} レポート
     */
    generateGameTestReport() {
        const successRate = (this.testResults.loaded / this.testResults.total) * 100;
        const totalTime = this.testResults.endTime - this.testResults.startTime;
        
        const report = {
            summary: {
                total: this.testResults.total,
                loaded: this.testResults.loaded,
                failed: this.testResults.failed,
                successRate: Math.round(successRate * 100) / 100,
                totalLoadTime: totalTime,
                averageLoadTime: Math.round((totalTime / this.testResults.total) * 100) / 100
            },
            loadedImages: Object.fromEntries(this.loadedImages),
            failedImages: Object.fromEntries(this.failedImages),
            gameReadiness: this.assessGameReadiness()
        };
        
        this.printGameReport(report);
        return report;
    }

    /**
     * ゲーム準備状況評価
     * @returns {Object} 準備状況
     */
    assessGameReadiness() {
        const criticalImages = [
            'background',
            'kenji_idle',
            'kenji_run',
            'kenji_attack1',
            'samuraiMack_idle',
            'samuraiMack_run',
            'samuraiMack_attack1'
        ];
        
        const missingCritical = criticalImages.filter(key => 
            !this.loadedImages.has(key)
        );
        
        let status = 'ready';
        let message = 'ゲーム開始準備完了！';
        
        if (missingCritical.length > 0) {
            status = 'not_ready';
            message = `重要な画像が不足しています: ${missingCritical.join(', ')}`;
        } else if (this.testResults.failed > 0) {
            status = 'partial';
            message = `基本機能は動作しますが、${this.testResults.failed}個の画像が不足しています`;
        }
        
        return {
            status: status,
            message: message,
            missingCritical: missingCritical,
            readyForGame: missingCritical.length === 0
        };
    }

    /**
     * ゲームレポート出力
     * @param {Object} report - レポート
     */
    printGameReport(report) {
        console.log('\n🎮 === ゲーム画像読み込みテスト結果 ===');
        console.log(`総画像数: ${report.summary.total}`);
        console.log(`読み込み成功: ${report.summary.loaded}`);
        console.log(`読み込み失敗: ${report.summary.failed}`);
        console.log(`成功率: ${report.summary.successRate}%`);
        console.log(`総読み込み時間: ${report.summary.totalLoadTime}ms`);
        console.log(`平均読み込み時間: ${report.summary.averageLoadTime}ms`);
        
        console.log(`\n🎯 ゲーム準備状況: ${report.gameReadiness.status.toUpperCase()}`);
        console.log(`${report.gameReadiness.message}`);
        
        if (Object.keys(report.failedImages).length > 0) {
            console.log('\n❌ 読み込み失敗画像:');
            Object.entries(report.failedImages).forEach(([key, info]) => {
                console.log(`  - ${key}: ${info.src}`);
            });
        }
        
        if (Object.keys(report.loadedImages).length > 0) {
            console.log('\n✅ 読み込み成功画像:');
            Object.entries(report.loadedImages).forEach(([key, info]) => {
                console.log(`  - ${key}: ${info.width}x${info.height}px (${info.loadTime}ms)`);
            });
        }
    }

    /**
     * ゲーム用スプライトテスト
     * @param {string} imageKey - 画像キー
     * @returns {Object} スプライト情報
     */
    createTestSprite(imageKey) {
        const imageInfo = this.loadedImages.get(imageKey);
        
        if (!imageInfo) {
            throw new Error(`Image not loaded: ${imageKey}`);
        }
        
        // ゲームのSpriteクラスと同様の情報を生成
        return {
            imageKey: imageKey,
            width: imageInfo.width,
            height: imageInfo.height,
            scale: 1,
            framesMax: 1, // アニメーションフレーム数（実際は画像により異なる）
            ready: true,
            element: imageInfo.element
        };
    }

    /**
     * キャンバス描画テスト
     * @param {string} imageKey - 画像キー
     * @param {HTMLCanvasElement} canvas - キャンバス要素
     * @returns {boolean} 描画成功可否
     */
    testCanvasRender(imageKey, canvas) {
        const imageInfo = this.loadedImages.get(imageKey);
        
        if (!imageInfo) {
            console.error(`Cannot render: Image not loaded - ${imageKey}`);
            return false;
        }
        
        try {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imageInfo.element, 0, 0, 100, 100); // テスト用に100x100で描画
            
            console.log(`✅ キャンバス描画成功: ${imageKey}`);
            return true;
        } catch (error) {
            console.error(`❌ キャンバス描画失敗: ${imageKey}`, error);
            return false;
        }
    }
}

// HTMLに読み込まれた時の自動テスト実行
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 ゲーム画像テストを自動開始...');
    
    const gameTester = new GameImageTester();
    
    gameTester.loadAllGameImages().then(report => {
        // テスト結果をページに表示
        if (document.getElementById('game-test-results')) {
            displayGameTestResults(report);
        }
    }).catch(error => {
        console.error('ゲーム画像テストでエラーが発生:', error);
    });
});

/**
 * ゲームテスト結果をHTMLに表示
 * @param {Object} report - テストレポート
 */
function displayGameTestResults(report) {
    const container = document.getElementById('game-test-results');
    if (!container) return;
    
    const statusColor = report.gameReadiness.status === 'ready' ? '#28a745' : 
                       report.gameReadiness.status === 'partial' ? '#ffc107' : '#dc3545';
    
    container.innerHTML = `
        <div style="padding: 20px; border: 2px solid ${statusColor}; border-radius: 8px; background: #f8f9fa;">
            <h3 style="color: ${statusColor}; margin-top: 0;">🎮 ゲーム準備状況</h3>
            <p><strong>${report.gameReadiness.message}</strong></p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                    <div style="font-size: 24px; font-weight: bold; color: #28a745;">${report.summary.loaded}</div>
                    <div>読み込み成功</div>
                </div>
                <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                    <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${report.summary.failed}</div>
                    <div>読み込み失敗</div>
                </div>
                <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                    <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${report.summary.successRate}%</div>
                    <div>成功率</div>
                </div>
                <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                    <div style="font-size: 24px; font-weight: bold; color: #6f42c1;">${report.summary.totalLoadTime}ms</div>
                    <div>総読み込み時間</div>
                </div>
            </div>
        </div>
    `;
}

// グローバルアクセス用
window.GameImageTester = GameImageTester;
window.GAME_IMAGES = GAME_IMAGES;
