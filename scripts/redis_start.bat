@echo off
rem =====================================================================
rem  Redis 免安装版：启动服务（端口 6379，无密码）
rem =====================================================================
setlocal EnableDelayedExpansion
chcp 65001 >nul

set "ROOT=%~dp0.."
set "REDIS_SERVER=%ROOT%\redis\redis-server.exe"

if not exist "%REDIS_SERVER%" (
    echo [错误] 未找到 Redis 可执行文件：%REDIS_SERVER%
    echo        请确认 redis\redis-server.exe 存在
    pause
    exit /b 1
)

rem --- 若 6379 已被占用，提示已运行 ---
netstat -ano | findstr /R /C:":6379 .*LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo [提示] 端口 6379 已被占用，可能 Redis 已在运行。
    exit /b 0
)

echo [信息] 正在启动 Redis 服务（端口 6379，无密码）...
start "Redis" /min "%REDIS_SERVER%" --port 6379 --bind 127.0.0.1 --maxmemory 256mb --maxmemory-policy allkeys-lru

rem --- 等待就绪 ---
for /l %%i in (1,1,15) do (
    "%ROOT%\redis\redis-cli.exe" -h 127.0.0.1 -p 6379 ping >nul 2>&1
    if !errorlevel! equ 0 (
        echo [成功] Redis 已就绪（127.0.0.1:6379）
        goto :done
    )
    timeout /t 1 /nobreak >nul 2>&1
)
echo [警告] 等待 Redis 就绪超时

:done
endlocal
exit /b 0