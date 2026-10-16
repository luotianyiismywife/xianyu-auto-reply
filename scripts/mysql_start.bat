@echo off
rem =====================================================================
rem  MySQL 免安装版：初始化数据目录 + 启动服务 + 创建数据库
rem  仅首次运行需要初始化，之后只做启动
rem =====================================================================
setlocal EnableDelayedExpansion
chcp 65001 >nul

rem --- 项目根目录 ---
set "ROOT=%~dp0.."
set "MYSQL_HOME=%ROOT%\mysql\mysql-8.0.29-winx64"
set "MYSQLD=%MYSQL_HOME%\bin\mysqld.exe"
set "MYSQL_BIN=%MYSQL_HOME%\bin"
set "DATADIR=%ROOT%\mysql\data"
set "INI=%ROOT%\mysql\my.ini"

if not exist "%MYSQLD%" (
    echo [错误] 未找到 MySQL 可执行文件：%MYSQLD%
    echo        请确认 mysql\mysql-8.0.29-winx64\bin\mysqld.exe 存在
    pause
    exit /b 1
)

rem --- 生成 my.ini（替换占位路径） ---
if exist "%ROOT%\mysql\my.ini.tmp" del /f "%ROOT%\mysql\my.ini.tmp" >nul 2>&1
set "BASEDIR_ESC=%MYSQL_HOME:\=/%"
set "DATADIR_ESC=%DATADIR:\=/%"
(
    echo # MySQL 免安装版配置
    echo [mysqld]
    echo basedir=%BASEDIR_ESC%
    echo datadir=%DATADIR_ESC%
    echo port=3306
    echo bind-address=127.0.0.1
    echo character-set-server=utf8mb4
    echo collation-server=utf8mb4_unicode_ci
    echo max_connections=200
    echo max_connect_errors=100000
    echo max_allowed_packet=256M
    echo default-time-zone=+08:00
    echo innodb_buffer_pool_size=128M
    echo innodb_log_file_size=32M
    echo performance_schema=0
    echo skip-networking=0
    echo [client]
    echo port=3306
    echo default-character-set=utf8mb4
) > "%INI%"

rem --- 若 3306 已被占用，先提示 ---
netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo [提示] 端口 3306 已被占用，可能 MySQL 已在运行，跳过启动。
    goto :create_db
)

rem --- 首次初始化数据目录 ---
if not exist "%DATADIR%\mysql" (
    echo [信息] 首次运行，正在初始化 MySQL 数据目录...
    "%MYSQLD%" --initialize-insecure --basedir="%MYSQL_HOME%" --datadir="%DATADIR%"
    if !errorlevel! neq 0 (
        echo [错误] MySQL 初始化失败，请检查 %MYSQLD%
        pause
        exit /b 1
    )
    echo [成功] MySQL 数据目录初始化完成（root 无密码）
)

rem --- 启动 MySQL ---
echo [信息] 正在启动 MySQL 服务（端口 3306）...
start "MySQL8.0" /min "%MYSQLD%" --defaults-file="%INI%" --console

rem --- 等待 MySQL 就绪 ---
set "READY="
for /l %%i in (1,1,30) do (
    "%MYSQL_BIN%\mysqladmin.exe" --host=127.0.0.1 --port=3306 --user=root ping >nul 2>&1
    if !errorlevel! equ 0 (
        set "READY=1"
        goto :ready
    )
    timeout /t 1 /nobreak >nul 2>&1
)
echo [警告] 等待 MySQL 就绪超时

:ready
if not defined READY (
    timeout /t 3 /nobreak >nul 2>&1
    "%MYSQL_BIN%\mysqladmin.exe" --host=127.0.0.1 --port=3306 --user=root ping >nul 2>&1
    if !errorlevel! equ 0 set "READY=1"
)

:create_db
rem --- 创建数据库（若不存在） ---
"%MYSQL_BIN%\mysql.exe" --host=127.0.0.1 --port=3306 --user=root -e "CREATE DATABASE IF NOT EXISTS xianyu_data DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
echo [成功] MySQL 启动完成，数据库 xianyu_data 已就绪（root 无密码，端口 3306）

endlocal
exit /b 0