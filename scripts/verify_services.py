"""命令行验证脚本：直接调用 ServiceManager 启动全部服务并检查端口。

用于在无 GUI 环境下验证后端服务能否正常启动。
用法： .venv\\Scripts\\python.exe scripts\\verify_services.py
"""
import sys
import time
from pathlib import Path

# 项目根目录
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

    print("=== 等待服务就绪（最多 60 秒）===")
    ports = {"backend-web": 8089, "websocket": 8090, "scheduler": 8091, "frontend": 9000}
    deadline = time.time() + 60
    status = {}
    while time.time() < deadline:
        status = {name: check_port(port) for name, port in ports.items()}
        if all(status.values()):
            break
        time.sleep(2)

    print("=== 端口检查 ===")
    for name, port in ports.items():
        ok = status.get(name, False)
        print(f"  {name:12s} :{port}  {'✓ 运行中' if ok else '✗ 未监听'}")

    errors = sm.get_errors()
    if errors:
        print("=== 错误 ===")
        for k, v in errors.items():
            print(f"  {k}: {v}")

    all_ok = all(status.values())
    print(f"\n=== 结论: {'全部服务正常' if all_ok else '部分服务异常'} ===")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())