"""
GUI关于页面模块（离线版）

功能：
1. 作为左侧导航的"关于"菜单对应内容页
2. 显示系统版本信息
3. 保留二维码展示格子，但完全不联网下载（显示本地占位）
"""
import tkinter as tk

from launcher.gui_theme import COLORS
from launcher.version import CURRENT_VERSION

# 二维码展示项：(显示名称)
_QRCODE_ITEMS = [
    ("微信群",),
    ("QQ群",),
    ("公众号",),
    ("Telegram",),
    ("赞赏码",),
]


def render_about_page(app):
    """
    在右侧内容区渲染"关于"页面（离线版）

    显示版本号和二维码格子（本地占位，不联网）。
    Args:
        app: LauncherApp实例
    """
    content = app._content_frame

    # 滚动容器
    canvas = tk.Canvas(content, bg=COLORS["card_bg"], highlightthickness=0)
    canvas.pack(fill=tk.BOTH, expand=True)
    inner = tk.Frame(canvas, bg=COLORS["card_bg"])
    canvas.create_window((0, 0), window=inner, anchor=tk.NW)
    inner.bind("<Configure>",
               lambda e: canvas.configure(scrollregion=canvas.bbox("all")))

    # 标题
    tk.Label(inner, text="关于", font=("微软雅黑", 14, "bold"),
             fg=COLORS["text"], bg=COLORS["card_bg"]).pack(
        anchor=tk.W, padx=20, pady=(16, 4))

    # 系统名称和版本
    tk.Label(inner, text="闲鱼自动回复管理系统",
             font=("微软雅黑", 12),
             fg=COLORS["text"], bg=COLORS["card_bg"]).pack(
        anchor=tk.W, padx=20)
    tk.Label(inner, text=f"当前版本: v{CURRENT_VERSION}",
             font=("微软雅黑", 10),
             fg=COLORS["text_secondary"], bg=COLORS["card_bg"]).pack(
        anchor=tk.W, padx=20, pady=(0, 8))

    # 分割线
    tk.Frame(inner, height=1, bg=COLORS["border"]).pack(
        fill=tk.X, padx=20, pady=8)

    # 二维码区域标题
    tk.Label(inner, text="扫码关注 / 加群交流 / 赞赏支持",
             font=("微软雅黑", 10),
             fg=COLORS["text_secondary"], bg=COLORS["card_bg"]).pack(
        anchor=tk.W, padx=20)

    # 二维码网格（离线占位）
    qr_frame = tk.Frame(inner, bg=COLORS["card_bg"])
    qr_frame.pack(fill=tk.X, padx=20, pady=(8, 16))
    for col_idx in range(len(_QRCODE_ITEMS)):
        qr_frame.columnconfigure(col_idx, weight=1)

    for col_idx, (label_text,) in enumerate(_QRCODE_ITEMS):
        _create_qrcode_cell(qr_frame, col_idx, label_text)


def _create_qrcode_cell(parent, col, label_text):
    """
    创建单个二维码单元格（离线占位，不联网下载）

    Args:
        parent: 父Frame
        col: 列索引
        label_text: 显示名称
    """
    cell = tk.Frame(parent, bg=COLORS["card_bg"])
    cell.grid(row=0, column=col, padx=6, pady=4, sticky="nsew")

    # 名称标签
    tk.Label(cell, text=label_text, font=("微软雅黑", 9, "bold"),
             fg=COLORS["text"], bg=COLORS["card_bg"]).pack(pady=(0, 4))

    # 图片容器（固定大小，带边框），显示离线占位
    img_frame = tk.Frame(cell, width=120, height=120,
                         bg=COLORS["input_bg"],
                         highlightbackground=COLORS["border"],
                         highlightthickness=1)
    img_frame.pack()
    img_frame.pack_propagate(False)

    # 占位提示
    placeholder = tk.Label(img_frame, text="未配置",
                           font=("微软雅黑", 9),
                           fg=COLORS["text_secondary"],
                           bg=COLORS["input_bg"])
    placeholder.pack(expand=True)
