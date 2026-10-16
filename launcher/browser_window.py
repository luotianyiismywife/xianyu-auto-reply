"""
内置浏览器窗口模块

功能：
1. 复用已内置的 Playwright Chromium 可执行文件
2. 以应用窗口模式(--app=)打开本地后台界面，无需外部浏览器
3. 使用独立的 user-data-dir，避免与系统自动化用的浏览器目录冲突
"""
import subprocess
import sys
import threading
from pathlib import Path
from typing import Optional

from loguru import logger

from launcher.browser_setup import (
    get_chromium_executable_path,
    ensure_playwright_browser_path,
)
from launcher.frozen_detect import get_project_root

# 默认后台地址
DEFAULT_URL = "http://127.0.0.1:9000"

# 已打开的浏览器窗口进程句柄
_window_proc: Optional[subprocess.Popen] = None
_window_lock = threading.Lock()


def _resolve_user_data_dir() -> Path:
    """解析内置窗口使用的 user-data-dir（放在项目根目录下的 launcher_browser_data）"""
    root = get_project_root()
    return root / "launcher_browser_data"


def open_browser_window(url: str = DEFAULT_URL) -> bool:
    """
    用内置 Chromium 以应用窗口模式打开指定 URL

    复用已打包/已安装的 Chromium 可执行文件，零新增依赖。
    使用独立 user-data-dir，避免影响系统自动化登录用的浏览器数据。

    Args:
        url: 要打开的地址

    Returns:
        True 打开成功（或已打开），False 打开失败
    """
    global _window_proc

    # 确保 PLAYWRIGHT_BROWSERS_PATH 指向内置浏览器目录
    ensure_playwright_browser_path()

    # 定位 Chromium 可执行文件
    chromium = get_chromium_executable_path()
    if not chromium:
        logger.warning("未找到内置 Chromium 可执行文件，无法打开内置窗口")
        return False

    # 若已有窗口进程在运行，直接返回（避免重复弹窗）
    with _window_lock:
        if _window_proc is not None and _window_proc.poll() is None:
            return True

    # 独立用户数据目录，避免锁冲突
    data_dir = _resolve_user_data_dir()
    data_dir.mkdir(parents=True, exist_ok=True)

    # 组装命令：以应用窗口模式打开，去掉地址栏/标签栏
    cmd = [
        chromium,
        f"--app={url}",
        "--window-size=1280,800",
        f"--user-data-dir={data_dir}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-session-crashed-bubble",
        "--disable-infobars",
    ]

    logger.info(f"打开内置后台窗口: {url} (chromium={chromium})")

    try:
        popen_kwargs = dict(
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if sys.platform == "win32":
            popen_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

        proc = subprocess.Popen(cmd, **popen_kwargs)
        with _window_lock:
            _window_proc = proc
        return True
    except Exception as e:
        logger.error(f"打开内置后台窗口失败: {e}")
        return False


def is_window_open() -> bool:
    """判断内置后台窗口是否仍在运行"""
    global _window_proc
    with _window_lock:
        return _window_proc is not None and _window_proc.poll() is None


def close_window() -> None:
    """关闭内置后台窗口（若仍打开）"""
    global _window_proc
    with _window_lock:
        proc = _window_proc
        _window_proc = None
    if proc is not None and proc.poll() is None:
        try:
            proc.terminate()
        except Exception:
            pass