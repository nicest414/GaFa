/**
 * 画像挿入テスト用ユーティリティ
 * 格闘ゲームプロジェクト用の画像読み込み・検証ツール
 */

class ImageTester {
    constructor() {
        this.results = {
            total: 0,
            success: 0,
            failed: 0,
            failedImages: [],
            performance: []
        };
        
        this.imageCategories = {
            kenji: [
                'Attack1.png', 'Attack2.png', 'Death.png', 'Fall.png',
                'Idle.png', 'Jump.png', 'Run.png', 'Take hit.png'
            ],
            samuraiMack: [
                'Attack1.png', 'Attack2.png', 'Death.png', 'Fall.png',
                'Idle.png', 'Jump.png', 'Run.png', 'Take Hit.png', 'Take Hit - white silhouette.png'
            ],
            background: [
                'background.png', 'shop.png'
            ]
        };
    }

    /**
     * 単一画像の読み込みテスト
     * @param {string} imagePath - 画像のパス
     * @param {string} filename - ファイル名
     * @returns {Promise<Object>} テスト結果
     */
    async testSingleImage(imagePath, filename) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const img = new Image();
            
            img.onload = () => {
                const endTime = performance.now();
                const loadTime = endTime - startTime;
                
                const result = {
                    success: true,
                    filename: filename,
                    path: imagePath,
                    loadTime: loadTime,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    aspectRatio: img.naturalWidth / img.naturalHeight
                };
                
                this.results.success++;
                this.results.performance.push(result);
                resolve(result);
            };
            
            img.onerror = () => {
                const result = {
                    success: false,
                    filename: filename,
                    path: imagePath,
                    error: 'Failed to load image'
                };
                
                this.results.failed++;
                this.results.failedImages.push(`${imagePath}/${filename}`);
                resolve(result);
            };
            
            this.results.total++;
            img.src = `${imagePath}/${filename}`;
        });
    }

    /**
     * 全画像のテスト実行
     * @param {string} basePath - ベースパス
     * @returns {Promise<Object>} 全体のテスト結果
     */
    async runAllTests(basePath = '../img') {
        console.log('🎮 画像読み込みテストを開始します...');
        
        const allTests = [];
        
        // Kenjiキャラクター画像
        for (const filename of this.imageCategories.kenji) {
            allTests.push(this.testSingleImage(`${basePath}/kenji`, filename));
        }
        
        // SamuraiMackキャラクター画像
        for (const filename of this.imageCategories.samuraiMack) {
            allTests.push(this.testSingleImage(`${basePath}/samuraiMack`, filename));
        }
        
        // 背景画像
        for (const filename of this.imageCategories.background) {
            allTests.push(this.testSingleImage(basePath, filename));
        }
        
        const results = await Promise.all(allTests);
        
        return this.generateReport(results);
    }

    /**
     * テスト結果レポート生成
     * @param {Array} results - テスト結果配列
     * @returns {Object} レポートオブジェクト
     */
    generateReport(results) {
        const successfulImages = results.filter(r => r.success);
        const failedImages = results.filter(r => !r.success);
        
        const averageLoadTime = successfulImages.length > 0 
            ? successfulImages.reduce((sum, r) => sum + r.loadTime, 0) / successfulImages.length 
            : 0;
        
        const report = {
            summary: {
                total: this.results.total,
                success: this.results.success,
                failed: this.results.failed,
                successRate: Math.round((this.results.success / this.results.total) * 100),
                averageLoadTime: Math.round(averageLoadTime * 100) / 100
            },
            successful: successfulImages,
            failed: failedImages,
            performance: this.results.performance,
            recommendations: this.generateRecommendations(successfulImages, failedImages)
        };
        
        this.printReport(report);
        return report;
    }

    /**
     * 推奨事項生成
     * @param {Array} successful - 成功した画像
     * @param {Array} failed - 失敗した画像
     * @returns {Array} 推奨事項
     */
    generateRecommendations(successful, failed) {
        const recommendations = [];
        
        if (failed.length > 0) {
            recommendations.push({
                type: 'error',
                message: `${failed.length}個の画像が読み込めませんでした。ファイルパスと存在を確認してください。`
            });
        }
        
        const largeDimensions = successful.filter(img => img.width > 1000 || img.height > 1000);
        if (largeDimensions.length > 0) {
            recommendations.push({
                type: 'warning',
                message: `${largeDimensions.length}個の画像が大きすぎます（1000px超）。パフォーマンスのために最適化を検討してください。`
            });
        }
        
        const slowLoading = successful.filter(img => img.loadTime > 100);
        if (slowLoading.length > 0) {
            recommendations.push({
                type: 'info',
                message: `${slowLoading.length}個の画像の読み込みが遅いです（100ms超）。ファイルサイズの最適化を検討してください。`
            });
        }
        
        if (successful.length === this.results.total) {
            recommendations.push({
                type: 'success',
                message: '✅ すべての画像が正常に読み込まれました！'
            });
        }
        
        return recommendations;
    }

    /**
     * レポート出力
     * @param {Object} report - レポートオブジェクト
     */
    printReport(report) {
        console.log('\n📊 === 画像読み込みテスト結果 ===');
        console.log(`総画像数: ${report.summary.total}`);
        console.log(`成功: ${report.summary.success}`);
        console.log(`失敗: ${report.summary.failed}`);
        console.log(`成功率: ${report.summary.successRate}%`);
        console.log(`平均読み込み時間: ${report.summary.averageLoadTime}ms`);
        
        if (report.failed.length > 0) {
            console.log('\n❌ 読み込み失敗:');
            report.failed.forEach(img => {
                console.log(`  - ${img.path}/${img.filename}`);
            });
        }
        
        console.log('\n💡 推奨事項:');
        report.recommendations.forEach(rec => {
            const icon = rec.type === 'error' ? '❌' : rec.type === 'warning' ? '⚠️' : rec.type === 'success' ? '✅' : 'ℹ️';
            console.log(`  ${icon} ${rec.message}`);
        });
    }

    /**
     * キャンバス描画テスト
     * @param {string} imagePath - テストする画像のパス
     * @returns {Promise<boolean>} 描画成功可否
     */
    async testCanvasDrawing(imagePath) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                try {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    // 画像データが正常に描画されたかチェック
                    const imageData = ctx.getImageData(0, 0, 1, 1);
                    resolve(imageData.data[3] > 0); // アルファ値が0より大きければ成功
                } catch (error) {
                    console.error('Canvas drawing failed:', error);
                    resolve(false);
                }
            };
            
            img.onerror = () => resolve(false);
            img.src = imagePath;
        });
    }

    /**
     * ファイルサイズチェック（概算）
     * @param {string} imagePath - 画像パス
     * @returns {Promise<number>} ファイルサイズ（バイト単位、概算）
     */
    async estimateFileSize(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // 概算: 幅 × 高さ × 4バイト（RGBA）
                const estimatedSize = img.naturalWidth * img.naturalHeight * 4;
                resolve(estimatedSize);
            };
            img.onerror = () => resolve(0);
            img.src = imagePath;
        });
    }
}

// グローバルで使用可能にする
window.ImageTester = ImageTester;

// 使用例をコンソールに出力
console.log(`
🎮 画像テストツールの使用方法:

const tester = new ImageTester();

// 全画像テスト実行
tester.runAllTests('../img').then(report => {
    console.log('テスト完了!', report);
});

// 単一画像テスト
tester.testSingleImage('../img/kenji', 'Idle.png').then(result => {
    console.log('単一テスト結果:', result);
});

// キャンバス描画テスト
tester.testCanvasDrawing('../img/kenji/Idle.png').then(success => {
    console.log('キャンバス描画:', success ? '成功' : '失敗');
});
`);
