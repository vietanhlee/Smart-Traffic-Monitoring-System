from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, CommandHandler, filters, ContextTypes
import requests
import logging
from io import BytesIO
from core.config import settings_network
from dotenv import load_dotenv
load_dotenv()
import os

API_URL = f"{settings_network.BASE_URL_API}/api/v1/chat_no_auth"
BOT_TOKEN = os.getenv("BOT_TOKEN")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Xin chào! Hãy gửi tin nhắn để tôi trả lời bạn 😊")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_text = update.message.text
    
    try:
        # Gửi tới API backend
        res = requests.post(API_URL, json={"message": user_text}, timeout=30)
        data = res.json()
        
        # Gửi text trả lời
        if "message" in data:
            await update.message.reply_text(data["message"])
        
        # Gửi các ảnh trả về (nếu có)
        if "image" in data and isinstance(data["image"], list):
            for img_url in data["image"]:
                try:
                    if isinstance(img_url, str) and img_url.startswith(("http://", "https://")):
                        img_response = requests.get(img_url, timeout=10)
                        if img_response.status_code == 200:
                            img_bytes = BytesIO(img_response.content)
                            img_bytes.name = 'image.jpg'
                            await update.message.reply_photo(photo=img_bytes)
                        else:
                            await update.message.reply_text("❌ Không thể tải ảnh từ url: " + img_url)
                    else:
                        await update.message.reply_text("❌ Định dạng ảnh trả về không hợp lệ (chỉ hỗ trợ url)")
                except Exception as img_err:
                    logger.exception("Loi khi tai anh")
                    await update.message.reply_text(f"❌ Lỗi khi xử lý ảnh: {str(img_err)}")
                    
    except requests.exceptions.Timeout:
        await update.message.reply_text("⏱️ API phản hồi quá lâu, vui lòng thử lại!")
    except requests.exceptions.RequestException as e:
        await update.message.reply_text(f"❌ Lỗi kết nối API: {str(e)}")
    except Exception as e:
        logger.exception("Loi khong mong doi trong telegram bot")
        await update.message.reply_text(f"❌ Có lỗi xảy ra: {str(e)}")

def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    logger.info("Telegram bot dang chay")
    app.run_polling()

if __name__ == "__main__":
    main()