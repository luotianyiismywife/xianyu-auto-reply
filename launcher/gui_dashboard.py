"""
GUI仪表盘页面模块（离线版）

功能：
1. 本地欢迎页，不访问任何远程服务器
2. 显示系统名称、版本信息、服务访问地址
3. 提供服务状态使用提示
"""
import tkinter as tk

from launcher.gui_theme import COLORS
from launcher.version import CURRENT_VERSION


def render_dashboard_page(app):
    """
    在右侧内容区渲染仪表盘页面（本地欢迎页）

    Args:
        app: LauncherApp实例
    """
    content = app._content_frame

    # 滚动容器
    scroll_canvas = tk.Canvas(content, bg=COLORS["card_bg"], highlightthickness=0)
    scroll_canvas.pack(fill=tk.BOTH, expand=True)

    inner = tk.Frame(scroll_canvas, bg=COLORS["card_bg"])
    canvas_window = scroll_canvas.create_window((0, 0), window=inner, anchor=tk.NW)

    def _on_inner_configure(e):
        scroll_canvas.configure(scrollregion=scroll_canvas.bbox("all"))

    def _on_canvas_configure(e):
        scroll_canvas.itemconfig(canvas_window, width=e.width)

    inner.bind("<Configure>", _on_inner_configure)
    scroll_canvas.bind("<Configure>", _on_canvas_configure)

    # 标题
    tk.Label(inner, text="仪表盘", font=("微软雅黑", 14, "bold"),
             fg=COLORS["text"], bg=COLORS["card_bg"]).pack(anchor=tk.W, padx=20, pady=(16, 4))
    tk.Label(inner, text="欢迎使用闲鱼自动回复系统",
             font=("微软雅黑", 9), fg=COLORS["text_secondary"],
             bg=COLORS["card_bg"]).pack(anchor=tk.W, padx=20, pady=(0, 12))

    # 系统信息卡片
    info_card = _make_card(inner, "系统信息")
    info_card.pack(fill=tk.X, padx=16, pady=(0, 10))

    _info_row(info_card, "系统名称", "闲鱼自动回复管理系统")
    _info_row(info_card, "当前版本", f"v{CURRENT_VERSION}")

    # 服务访问卡片
    addr_card = _make_card(inner, "服务访问地址")
    addr_card.pack(fill=tk.X, padx=16, pady=(0, 10))

    _info_row(addr_card, "管理后台", "http://127.0.0.1:9000")
    _info_row(addr_card, "后端 API", "http://127.0.0.1:8089")
    _info_row(addr_card, "WebSocket", "http://127.0.0.1:8090")
    _info_row(addr_card, "定时任务", "http://127.0.0.1:8091")

    # 使用提示卡片
    tip_card = _make_card(inner, "使用提示")
    tip_card.pack(fill=tk.X, padx=16, pady=(0, 16))

    _info_row(tip_card, "启动服务", "请在左侧点击「服务状态」，再点击「启动所有服务」")
    _info_row(tip_card, "打开后台", "服务启动后点击「打开管理后台」即可进入系统")


def _make_card(parent, title: str) -> tk.Frame:
    """创建一个卡片容器"""
    card = tk.Frame(parent, bg="#ffffff", highlightbackground="#e2e8f0",
                    highlightthickness=1)

    card_header = tk.Frame(card, bg="#ffffff", padx=12, pady=8)
    card_header.pack(fill=tk.X)
    tk.Label(card_header, text=title, font=("微软雅黑", 11, "bold"),
             fg=COLORS["text"], bg="#ffffff").pack(anchor=tk.W)

    body = tk.Frame(card, bg="#ffffff", padx=16, pady=(0, 12))
    body.pack(fill=tk.X)
    return body


def _info_row(parent, label: str, value: str):
    """在卡片中显示一行信息（标签: 值）"""
    row = tk.Frame(parent, bg="#ffffff")
    row.pack(fill=tk.X, pady=3)

    tk.Label(row, text=label, font=("微软雅黑", 9), width=14, anchor=tk.W,
             fg=COLORS["text_secondary"], bg="#ffffff").pack(side=tk.LEFT)
    tk.Label(row, text=value, font=("微软雅黑", 9),
             fg=COLORS["primary"], bg="#ffffff", anchor=tk.W).pack(side=tk.LEFT)
