from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, CommandHandler, filters, ContextTypes
import requests
import logging

API_URL = "http://localhost:8000/api/chat"  # Đổi sang API của bạn
BOT_TOKEN = "7278180996:AAF3zjRmDm2tpTYzl5W1rRXMfTBkt47xWBA"

logging.basicConfig(level=logging.INFO)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Xin chào! Hãy gửi tin nhắn để tôi trả lời bạn 😊")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_text = update.message.text
    try:
        # Gửi tới API backend của bạn
        res = requests.post(API_URL, json={"message": user_text}, timeout=10)
        data = res.json()

        # Gửi text trả lời
        if "message" in data:
            await update.message.reply_text(data["message"])

        # Gửi các ảnh trả về (nếu có)
        if "image" in data and isinstance(data["image"], list):
            for img_url in data["image"]:
                await update.message.reply_photo(photo=img_url)

    except Exception as e:
        await update.message.reply_text("❌ Lỗi khi gọi API: " + str(e))

def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("🤖 Bot đang chạy...")
    app.run_polling()

if __name__ == "__main__":
    main()
