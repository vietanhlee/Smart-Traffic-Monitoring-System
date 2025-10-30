# 🗄️ Database Migrations với Alembic

## 📖 Giới thiệu

Alembic là công cụ quản lý database migrations cho SQLAlchemy. Nó cho phép bạn version control schema changes và dễ dàng rollback khi cần.

## 🚀 Cách sử dụng

### 1. Tạo migration mới

Khi bạn thay đổi models (thêm/sửa/xóa columns, tables):

```bash
cd backend
alembic revision --autogenerate -m "Mô tả thay đổi"
```

Ví dụ:

```bash
alembic revision --autogenerate -m "Add email column to User table"
alembic revision --autogenerate -m "Create new Vehicle model"
```

### 2. Áp dụng migrations (upgrade)

Upgrade lên version mới nhất:

```bash
alembic upgrade head
```

Upgrade lên version cụ thể:

```bash
alembic upgrade <revision_id>
```

### 3. Rollback migrations (downgrade)

Rollback về version trước:

```bash
alembic downgrade -1
```

Rollback về version cụ thể:

```bash
alembic downgrade <revision_id>
```

Rollback tất cả về trạng thái ban đầu:

```bash
alembic downgrade base
```

### 4. Xem lịch sử migrations

Xem tất cả migrations:

```bash
alembic history
```

Xem migration hiện tại:

```bash
alembic current
```

### 5. Tạo migration thủ công (không autogenerate)

```bash
alembic revision -m "Custom migration"
```

Sau đó chỉnh sửa file migration trong `alembic/versions/`.

## 📁 Cấu trúc thư mục

```
backend/
├── alembic/
│   ├── versions/          # Chứa tất cả migration files
│   │   └── 54be4477c094_initial_migration.py
│   ├── env.py            # Config môi trường Alembic
│   ├── README            # Alembic documentation
│   └── script.py.mako    # Template cho migration files
├── alembic.ini           # Config chính của Alembic
└── app/
    ├── models/           # SQLAlchemy models
    │   ├── user.py
    │   └── TokenLLM.py
    └── db/
        └── base.py       # Database Base và engine
```

## ⚙️ Configuration

### Database URL

Database URL được load từ `.env` file:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname
```

**Lưu ý**: Alembic tự động convert `asyncpg` → `psycopg2` vì Alembic cần sync connection.

### Import Path

Alembic được cấu hình để chạy với structure:

- Server chạy từ: `backend/app/`
- Imports: Relative imports (không có `app.` prefix)

## 🔍 Workflow thực tế

### Khi thêm model mới:

1. Tạo file model trong `app/models/`:

```python
# app/models/vehicle.py
from sqlalchemy import Column, Integer, String
from db.base import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True)
    plate_number = Column(String(20), unique=True)
    vehicle_type = Column(String(50))
```

2. Import model trong `app/db/base.py`:

```python
from models.user import User
from models.TokenLLM import TokenLLM
from models.vehicle import Vehicle  # Thêm dòng này
```

3. Tạo migration:

```bash
cd backend
alembic revision --autogenerate -m "Add Vehicle model"
```

4. Review migration file được tạo trong `alembic/versions/`

5. Áp dụng migration:

```bash
alembic upgrade head
```

### Khi sửa model:

1. Sửa model (ví dụ thêm column):

```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50))
    age = Column(Integer)  # Column mới
```

2. Tạo migration:

```bash
alembic revision --autogenerate -m "Add age column to User"
```

3. Review và apply:

```bash
alembic upgrade head
```

## 🛡️ Best Practices

1. **Luôn review migration trước khi apply**

   - Check `alembic/versions/<revision>_*.py`
   - Đảm bảo `upgrade()` và `downgrade()` đúng

2. **Backup database trước khi migrate production**

   ```bash
   pg_dump dbname > backup.sql
   ```

3. **Test migrations trên staging trước**

   - Chạy upgrade → test app → rollback → test lại

4. **Commit migration files vào Git**

   ```bash
   git add alembic/versions/*.py
   git commit -m "Add migration: <description>"
   ```

5. **Không sửa migration đã apply**
   - Nếu cần fix, tạo migration mới
   - Hoặc rollback và tạo lại

## 🐛 Troubleshooting

### Lỗi: "Can't locate revision identified by"

Xảy ra khi database và alembic versions không sync.

**Fix:**

```bash
# Xem version hiện tại
alembic current

# Stamp version hiện tại thủ công
alembic stamp head
```

### Lỗi: "Target database is not up to date"

Database đang ở version cũ hơn code.

**Fix:**

```bash
alembic upgrade head
```

### Lỗi: Import không work

Check `sys.path` trong `alembic/env.py`:

```python
app_path = str(Path(__file__).resolve().parent.parent / "app")
sys.path.insert(0, app_path)
```

## 📚 Tài liệu thêm

- [Alembic Official Docs](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

## ✅ Migration hiện tại

### Initial Migration (54be4477c094)

- ✅ Created `users` table (đã tồn tại)
- ✅ Created `token_llm` table with foreign key to users
- ✅ Removed old `traffic_data` table (không dùng nữa)

Để apply:

```bash
cd backend
alembic upgrade head
```
