# GaFa
画像認識ファイターズ

## 環境構成（Team Setup）
- OS: Windows/Mac/Linux（開発は主にWindows想定）
- Python: 3.11 系（MediaPipe互換のため必須）
- 仮想環境: `.venv311`（リポジトリ直下）
- フロントエンド: p5.js（CDN読込）
- バックエンド: Flask + Flask-Sock（WebSocket）
- 主要ライブラリ: OpenCV, MediaPipe

## 事前準備
- Python 3.11 をインストール（Windowsなら `py` ランチャあり）
- Git をインストール
- VS Code 推奨（`.vscode/settings.json` で既定インタプリタを `.venv311` に設定済み）

## セットアップ手順
1) 仮想環境の作成（Python 3.11）
   - Windows (PowerShell)
     - `py -3.11 -m venv .venv311`
     - `./.venv311/Scripts/Activate.ps1`
   - macOS/Linux (bash/zsh)
     - `python3.11 -m venv .venv311`
     - `source .venv311/bin/activate`

2) 依存関係のインストール
- `pip install -U pip setuptools wheel`
- `pip install -r requirements.txt`

3) インストール確認（任意）
- `python -c "import mediapipe as mp; print(mp.__version__)"`（0.10系が表示されればOK）

## 動作確認
- バックエンド（Hello World）
  - `python backend/app.py` → http://127.0.0.1:5000 が "Hello World"
- 骨格検出テスト（Webカメラ）
  - `python backend/pose_test.py`（終了は q キー）
- フロントエンド（p5.js）
  - `frontend/index.html` をブラウザで開く（拡張機能 Live Server など推奨）

## 開発メモ
- Pythonバージョン固定
  - 3.13 では MediaPipe が入らないため、必ず `.venv311` を有効化して作業してください。
- VS Code
  - 右下のインタプリタ選択で `.venv311` を選ぶ。`python.defaultInterpreterPath` も設定済み。
- デプロイ
  - `requirements.txt`, `Procfile`, `runtime.txt`（python-3.11.9）を用意済み。
  - Railway/Heroku などにリポジトリを接続してデプロイ可能。

## トラブルシュート
- MediaPipe が入らない/動かない
  - Python 3.11 を使用しているか確認。`.venv311` を再作成し直す。
- カメラが映らない
  - OSのカメラ権限、他アプリの占有、外付けカメラの選択を確認。
- OpenCV ImportError
  - `pip install --force-reinstall opencv-python` を試す。GPU版不要なら通常版でOK。
