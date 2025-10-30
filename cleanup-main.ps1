# 🧹 Script xóa các files/folders thừa trên nhánh main
# Chỉ giữ lại localStorage implementation, xóa database chat history

Write-Host "🧹 Cleaning up main branch - Removing database chat history implementation..." -ForegroundColor Cyan
Write-Host ""

# Backend files to remove
Write-Host "📁 Backend cleanup:" -ForegroundColor Yellow

Remove-Item -Path "backend\app\api\v1\chat_history.py" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: backend\app\api\v1\chat_history.py" -ForegroundColor Green

Remove-Item -Path "backend\app\models\chat_message.py" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: backend\app\models\chat_message.py" -ForegroundColor Green

Remove-Item -Path "backend\app\schemas\ChatMessage.py" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: backend\app\schemas\ChatMessage.py" -ForegroundColor Green

Remove-Item -Path "backend\alembic\versions\chat_messages_001_create_table.py" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: backend\alembic\versions\chat_messages_001_create_table.py" -ForegroundColor Green

Remove-Item -Path "backend\CHAT_DATABASE_GUIDE.md" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: backend\CHAT_DATABASE_GUIDE.md" -ForegroundColor Green

Remove-Item -Path "backend\PYDANTIC_V2_MIGRATION.md" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: backend\PYDANTIC_V2_MIGRATION.md" -ForegroundColor Green

Write-Host ""

# Frontend files to remove
Write-Host "📁 Frontend cleanup:" -ForegroundColor Yellow

Remove-Item -Path "frontend\src\services\chatHistoryService.ts" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: frontend\src\services\chatHistoryService.ts" -ForegroundColor Green

Remove-Item -Path "frontend\DEBUG_CHAT_STORAGE.js" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: frontend\DEBUG_CHAT_STORAGE.js" -ForegroundColor Green

# Remove services directory if empty
if (Test-Path "frontend\src\services") {
    $files = Get-ChildItem -Path "frontend\src\services" -File
    if ($files.Count -eq 0) {
        Remove-Item -Path "frontend\src\services" -Force -Recurse -ErrorAction SilentlyContinue
        Write-Host "  ✓ Removed: frontend\src\services\ (empty directory)" -ForegroundColor Green
    }
}

Write-Host ""

# Root documentation files to remove
Write-Host "📁 Root documentation cleanup:" -ForegroundColor Yellow

Remove-Item -Path "ACCOUNT_SEPARATION_FIX.md" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: ACCOUNT_SEPARATION_FIX.md" -ForegroundColor Green

Remove-Item -Path "CHAT_ACCOUNT_SEPARATION_GUIDE.md" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: CHAT_ACCOUNT_SEPARATION_GUIDE.md" -ForegroundColor Green

Remove-Item -Path "CHAT_STORAGE_COMPARISON.md" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: CHAT_STORAGE_COMPARISON.md" -ForegroundColor Green

Remove-Item -Path "FIX_SUMMARY_VI.md" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: FIX_SUMMARY_VI.md" -ForegroundColor Green

Remove-Item -Path "TESTING_CHECKLIST.md" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed: TESTING_CHECKLIST.md" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  - Removed chat database backend implementation" -ForegroundColor White
Write-Host "  - Removed chat history API endpoints" -ForegroundColor White
Write-Host "  - Removed database schemas and models" -ForegroundColor White
Write-Host "  - Removed migration files" -ForegroundColor White
Write-Host "  - Removed frontend database service" -ForegroundColor White
Write-Host "  - Removed documentation files" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Main branch now only uses localStorage for chat history" -ForegroundColor Green
Write-Host ""
