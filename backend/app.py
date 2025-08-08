from flask import Flask

app = Flask(__name__)


@app.get("/")
def hello():
    return "Hello World"


if __name__ == "__main__":
    # 開発用: python backend/app.py で起動可（http://127.0.0.1:5000）
    app.run(host="127.0.0.1", port=5000, debug=True)
