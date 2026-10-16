"""命令行验证脚本：启动全部服务并保持进程存活，供外部访问验证。

用法： .venv\\Scripts\\python.exe scripts\\verify_services_alive.py
按 Ctrl+C 或关闭窗口结束（会停止所有服务）。
"""
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from launcher.service_manager import ServiceManager  # noqa: E402
from launcher.process_utils import check_port  # noqa: E402


def main():
    config = {
        "mysql_host": "127.0.0.1",
        "mysql_port": "3306",
        "mysql_user": "root",
        "mysql_password": "",
        "mysql_database": "xianyu_data",
        "redis_host": "127.0.0.1",
        "redis_port": "6379",
        "redis_password": "",
        "redis_db": "0",
    }

    sm = ServiceManager(ROOT)
    print("=== 启动全部服务 ===")
    results = sm.start_all(config)
    print(f"启动结果: {results}")

    ports = {"backend-web": 8089, "websocket": 8090, "scheduler": 8091, "frontend": 9000}
    print("=== 等待就绪 ===")
    deadline = time.time() + 60
    while time.time() < deadline:
        if all(check_port(p) for p in ports.values()):
            break
        time.sleep(2)

    for name, port in ports.items():
        print(f"  {name:12s} :{port}  {'✓' if check_port(port) else '✗'}")

    print("\n=== 服务已启动，进程保持存活。按 Ctrl+C 结束 ===")
    try:
        while True:
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n=== 停止所有服务 ===")
        sm.stop_all()


if __name__ == "__main__":
    main()