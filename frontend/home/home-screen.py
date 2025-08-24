import tkinter as tk
from tkinter import font as tkfont
from PIL import Image, ImageTk
import pygame
import os
import webbrowser

# pygameを初期化
pygame.mixer.init()

# 変数を使う前に、スクリプトのディレクトリを定義
script_dir = os.path.dirname(__file__)

# 音楽ファイルの絶対パスを構築
music_file_path = os.path.join(script_dir, "gafa_home_bgm.mp3")

# メインウィンドウの作成（例）
root = tk.Tk()
root.title("URLを開くボタン")
main_frame = tk.Frame(root)
main_frame.pack()

# ウィンドウをフルスクリーンに設定
root.attributes('-fullscreen', True)


# 画面全体を囲むメインフレーム
main_frame = tk.Frame(root, bg="white", bd=5, relief="solid")
main_frame.pack(fill="both", expand=True, padx=20, pady=20)


# 画面上部のバー
top_bar = tk.Frame(main_frame, bg="#555555", height=30, bd=2, relief="solid")
top_bar.pack(fill="x")

# メインコンテンツエリア（左右のボックスと中央のキャラクター）
content_frame = tk.Frame(main_frame, bg="white")
content_frame.pack(fill="both", expand=True, padx=20, pady=20)

# --- 左右のボックスと中央のキャラクターの配置 ---
# `side`を使って横に並べる

#左のキャラ
try:
    # 1. 画像ファイルのパスを指定します
    image_path = "fighting-game-pose/img/gafa.robo.png"

    # 2. PillowのImage.open()で画像を開きます
    pil_image = Image.open(image_path)
    pil_image = pil_image.resize((290, 400))

    # 3. Pillowの画像をTkinterが扱えるPhotoImageに変換します
    tk_image = ImageTk.PhotoImage(pil_image)

    # 4. Labelにimage引数を使って、変換した画像を渡します
    center_char_label = tk.Label(content_frame, image=tk_image, bg="white")

    # 5. ⚠️ 重要: 画像の参照を保持します
    # これがないと、画像が画面から消えてしまう可能性があります
    center_char_label.image = tk_image

    center_char_label.pack(side="left", padx=10, pady=10, fill="both", expand=True)
except FileNotFoundError:
    # 画像ファイルが見つからない場合に備えて、エラー処理を行います
    print(f"エラー: 画像ファイルが見つかりません: {image_path}")
    # 代わりにテキストを表示するフォールバック処理
    center_char_label = tk.Label(content_frame, text="人", bg="white", font=("Arial", 40, "bold"))
    center_char_label.pack(side="left", padx=10, pady=10, fill="both", expand=True)


# 中央のキャラクター
try:
    # 1. 画像ファイルのパスを指定します
    image_path = "fighting-game-pose/img/gafa(wizard).png"

    # 2. PillowのImage.open()で画像を開きます
    pil_image = Image.open(image_path)
    pil_image = pil_image.resize((290, 400))

    # 3. Pillowの画像をTkinterが扱えるPhotoImageに変換します
    tk_image = ImageTk.PhotoImage(pil_image)

    # 4. Labelにimage引数を使って、変換した画像を渡します
    center_char_label = tk.Label(content_frame, image=tk_image, bg="white")

    # 5. ⚠️ 重要: 画像の参照を保持します
    # これがないと、画像が画面から消えてしまう可能性があります
    center_char_label.image = tk_image

    center_char_label.pack(side="left", padx=10, pady=10, fill="both", expand=True)
except FileNotFoundError:
    # 画像ファイルが見つからない場合に備えて、エラー処理を行います
    print(f"エラー: 画像ファイルが見つかりません: {image_path}")
    # 代わりにテキストを表示するフォールバック処理
    center_char_label = tk.Label(content_frame, text="人", bg="white", font=("Arial", 40, "bold"))
    center_char_label.pack(side="left", padx=10, pady=10, fill="both", expand=True)

# 右のキャラ
try:
    # 1. 画像ファイルのパスを指定します
    image_path = "fighting-game-pose/img/gafa.dora.png"

    # 2. PillowのImage.open()で画像を開きます
    pil_image = Image.open(image_path)
    pil_image = pil_image.resize((290, 400))

    # 3. Pillowの画像をTkinterが扱えるPhotoImageに変換します
    tk_image = ImageTk.PhotoImage(pil_image)

    # 4. Labelにimage引数を使って、変換した画像を渡します
    center_char_label = tk.Label(content_frame, image=tk_image, bg="white")

    # 5. ⚠️ 重要: 画像の参照を保持します
    # これがないと、画像が画面から消えてしまう可能性があります
    center_char_label.image = tk_image

    center_char_label.pack(side="left", padx=10, pady=10, fill="both", expand=True)
except FileNotFoundError:
    # 画像ファイルが見つからない場合に備えて、エラー処理を行います
    print(f"エラー: 画像ファイルが見つかりません: {image_path}")
    # 代わりにテキストを表示するフォールバック処理
    center_char_label = tk.Label(content_frame, text="人", bg="white", font=("Arial", 40, "bold"))
    center_char_label.pack(side="left", padx=10, pady=10, fill="both", expand=True)



# --- 下部のボタン ---
bottom_bar = tk.Frame(main_frame, bg="#dddddd", bd=2, relief="solid")
bottom_bar.pack(fill="x")

def battle_start():
    print("BATTLE START ボタンが押されました！")
    # URLはhttp://192.168.26.110:5000に設定
    url = "http://192.168.26.110:5000"
    webbrowser.open(url)

battle_button = tk.Button(bottom_bar, text="BATTLE START", command=battle_start,
                          bg="#c00000", fg="white", font=("Arial", 16, "bold"),
                          bd=3, relief="raised", padx=15, pady=10,
                          activebackground="#e00000", activeforeground="white")
battle_button.pack(pady=10)

#修正
bottom_bar.pack(side="bottom",fill="x")
content_frame.pack(fill="both",expand=True, padx=20, pady=20)


# --- BGM再生の処理をここに移す ---
try:
    pygame.mixer.music.load(music_file_path)
    # BGMを無限ループで再生
    pygame.mixer.music.play(loops=-1) 
    print("BGMが再生されました。")
except pygame.error as e:
    print(f"音楽の再生中にエラーが発生しました: {e}")

# 画面が閉じられるときに実行される関数を定義
def on_closing():
    print("ウィンドウが閉じられ、BGMが停止します。")
    # BGMを停止
    pygame.mixer.music.stop()
    # ウィンドウを破棄
    root.destroy()

# ウィンドウのクローズイベント（×ボタン）にon_closing関数をバインド
root.protocol("WM_DELETE_WINDOW", on_closing)

# ウィンドウのイベントループを開始
root.mainloop()

# Tkinterのイベントループが終了した後にpygameを終了
pygame.quit()