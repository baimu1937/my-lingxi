@echo off
chcp 65001 >nul
echo ========================================
echo   灵犀创作平台 - 强制刷新工具
echo ========================================
echo.
echo 正在清除浏览器缓存...
echo.

REM 清除Edge浏览器缓存
if exist "%LocalAppData%\Microsoft\Edge\User Data\Default\Cache" (
    echo 清除 Edge 缓存...
    del /q /s "%LocalAppData%\Microsoft\Edge\User Data\Default\Cache\*" >nul 2>&1
)

REM 清除Chrome浏览器缓存
if exist "%LocalAppData%\Google\Chrome\User Data\Default\Cache" (
    echo 清除 Chrome 缓存...
    del /q /s "%LocalAppData%\Google\Chrome\User Data\Default\Cache\*" >nul 2>&1
)

echo.
echo 缓存清理完成！
echo.
echo 正在打开优化后的灵犀平台...
echo.

REM 使用随机参数打开HTML文件避免缓存
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

start "" "file:///d:/桌面/my-lingxi/index.html?t=%TIMESTAMP%"

echo.
echo ========================================
echo 完成！请检查页面左上角是否有绿色标识：
echo "✅ v2.0已优化"
echo.
echo 如果没有看到，请按 Ctrl+Shift+R 强制刷新
echo ========================================
pause
