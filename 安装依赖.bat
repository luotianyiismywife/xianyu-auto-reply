@echo off
rem =====================================================================
rem  闲鱼自动回复系统 - 一键安装依赖
rem  自动准备运行环境（分发时不含这些大文件，首次运行本脚本自动下载安装）：
rem    1. 下载 MySQL 8.0 绿色版 -> mysql\
rem    2. 下载 Redis 绿色版     -> redis\
rem    3. 创建 .venv 并安装后端 Python 依赖
rem    4. 安装前端依赖并构建 dist
rem    5. 安装 Playwright Chromium 浏览器
rem =====================================================================
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   闲鱼自动回复系统 - 一键安装依赖
echo ============================================================
echo.

rem --- 镜像源配置（国内加速，可按需修改） ---
set "MYSQL_URL=https://mirrors.huaweicloud.com/mysql/Downloads/MySQL-8.0/mysql-8.0.29-winx64.zip"
set "REDIS_URL=https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
set "PIP_INDEX=https://mirrors.aliyun.com/pypi/simple/"
set "NPM_REGISTRY=https://registry.npmmirror.com"

rem --- 检查 Python ---
where python >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.11+ 并加入 PATH
    pause
    exit /b 1
)

rem =====================================================================
rem  1. MySQL 绿色版
rem =====================================================================
if exist "mysql\mysql-8.0.29-winx64\bin\mysqld.exe" (
    echo [1/5] MySQL 已存在，跳过下载。
) else (
    echo [1/5] 下载 MySQL 8.0 绿色版（约 213MB）...
    if not exist "mysql" mkdir "mysql"
    curl -L -o "mysql.zip" "%MYSQL_URL%"
    if errorlevel 1 (
        echo [错误] MySQL 下载失败，请检查网络或手动下载放到 mysql.zip
        pause
        exit /b 1
    )
    echo       解压中（较慢，请耐心等待）...
    powershell -NoProfile -Command "Expand-Archive -Path 'mysql.zip' -DestinationPath 'mysql' -Force"
    del /f /q "mysql.zip" >nul 2>&1
    if not exist "mysql\mysql-8.0.29-winx64\bin\mysqld.exe" (
        echo [错误] MySQL 解压失败
        pause
        exit /b 1
    )
    echo       MySQL 准备完成。
)

rem =====================================================================
rem  2. Redis 绿色版
rem =====================================================================
if exist "redis\redis-server.exe" (
    echo [2/5] Redis 已存在，跳过下载。
) else (
    echo [2/5] 下载 Redis 绿色版（约 12MB）...
    if not exist "redis" mkdir "redis"
    curl -L -o "redis.zip" "%REDIS_URL%"
    if errorlevel 1 (
        echo [错误] Redis 下载失败，请检查网络或手动下载放到 redis.zip
        pause
        exit /b 1
    )
    powershell -NoProfile -Command "Expand-Archive -Path 'redis.zip' -DestinationPath 'redis' -Force"
    del /f /q "redis.zip" >nul 2>&1
    if not exist "redis\redis-server.exe" (
        echo [错误] Redis 解压失败
        pause
        exit /b 1
    )
    echo       Redis 准备完成。
)

rem =====================================================================
rem  3. Python 虚拟环境 + 后端依赖
rem =====================================================================
if exist ".venv\Scripts\python.exe" (
    echo [3/5] .venv 已存在，检查后端依赖...
) else (
    echo [3/5] 创建 Python 虚拟环境 .venv ...
    python -m venv .venv
    if errorlevel 1 (
        echo [错误] 创建 .venv 失败
        pause
        exit /b 1
    )
)
echo       安装后端依赖（首次较慢）...
".venv\Scripts\python.exe" -m pip install --upgrade pip -i %PIP_INDEX%
".venv\Scripts\python.exe" -m pip install -i %PIP_INDEX% -e backend-web -e websocket -e scheduler
if errorlevel 1 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)
echo       后端依赖安装完成。

rem =====================================================================
rem  4. 前端依赖 + 构建 dist
rem =====================================================================
where npm >nul 2>&1
if errorlevel 1 (
    echo [警告] 未找到 npm（Node.js），跳过前端构建。
    echo        请安装 Node.js 18+ 后手动执行： cd frontend ^&^& npm install ^&^& npm run build
) else (
    if exist "frontend\dist\index.html" (
        echo [4/5] 前端 dist 已存在，跳过构建。
    ) else (
        echo [4/5] 安装前端依赖并构建（首次较慢）...
        pushd frontend
        call npm config set registry %NPM_REGISTRY%
        call npm install --no-audit --no-fund
        if errorlevel 1 (
            echo [错误] 前端依赖安装失败
            popd
            pause
            exit /b 1
        )
        call npm run build
        if errorlevel 1 (
            echo [错误] 前端构建失败
            popd
            pause
            exit /b 1
        )
        popd
        echo       前端构建完成。
    )
)

rem =====================================================================
rem  5. Playwright Chromium 浏览器
rem =====================================================================
echo [5/5] 安装 Playwright Chromium 浏览器（约 150MB）...
".venv\Scripts\python.exe" -m playwright install chromium
".venv\Scripts\python.exe" -m patchright install chromium
echo       Chromium 安装完成。

echo.
echo ============================================================
echo   全部依赖安装完成！现在可以双击「一键启动.bat」启动系统
echo ============================================================
pause
endlocal
exit /b 0