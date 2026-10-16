@echo off
rem =====================================================================
rem  闲鱼自动回复系统 - 一键启动
rem  依次：启动 MySQL 绿色版 -> 启动 Redis 绿色版 -> 打开启动器
rem  优先使用项目内 .venv，实现文件夹自包含
rem =====================================================================
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   闲鱼自动回复系统 - 一键启动
echo ============================================================
echo.

rem --- 选择 Python：优先项目内 .venv，否则系统 python ---
if exist ".venv\Scripts\python.exe" (
    set "PY=%~dp0.venv\Scripts\python.exe"
    echo [信息] 使用项目内虚拟环境：.venv
) else (
    set "PY=python"
    where python >nul 2>&1
    if errorlevel 1 (
        echo [错误] 未找到 Python，请先安装 Python 3.11+ 并加入 PATH
        pause
        exit /b 1
    )
)

rem --- 前置检查：前端 dist（启动器需托管静态文件） ---
if not exist "frontend\dist\index.html" (
    echo [警告] 前端 dist 未构建，管理后台将无法访问。
    echo        请先执行： cd frontend ^&^& npm ci ^&^& npm run build
)

rem --- 前置检查：Python 依赖 ---
"%PY%" -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo [警告] 后端依赖未安装，服务可能无法启动。
    echo        请先执行： %PY% -m pip install -e backend-web -e websocket -e scheduler
    echo.
)

echo [1/3] 启动 MySQL 绿色版...
call "scripts\mysql_start.bat"

echo [2/3] 启动 Redis 绿色版...
call "scripts\redis_start.bat"

echo [3/3] 打开启动器...
echo.
echo   启动器打开后：填写 MySQL/Redis 连接信息 -^> 点击"保存配置并启动服务"
echo   （默认已匹配绿色版：MySQL 127.0.0.1:3306 root 无密码 / Redis 127.0.0.1:6379）
echo.
start "" "%PY%" launcher\main.py

endlocal
exit /b 0