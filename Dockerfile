# --- ベースイメージの選択 ---
# bullseyeは安定している
FROM python:3.11.9-bullseye

# --- Python環境の構築 ---
WORKDIR /app

COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- アプリケーションのコピーと実行 ---
COPY ./backend .
COPY ./frontend ./frontend

# コンテナが外部からのリクエストを受け付けるポートを8000に指定
EXPOSE 8000

# Gunicornでアプリケーションを起動
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--worker-class", "gevent", "app:app"]