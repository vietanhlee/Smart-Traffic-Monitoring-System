# Dashboard Giám Sát Giao Thông Realtime

## Giới thiệu

Hệ thống giám sát giao thông realtime qua video, nhận diện và đếm số lượng phương tiện trung bình, tốc độ trung bình ô tô và xe máy, hiển thị trực quan trên dashboard web. Ngoài ra còn có khung chat để trao đổi nhanh.

## Yêu cầu hệ thống

- Python >= 3.11
- Các thư viện trong `requirements_cpu` hoặc `requirements_gpu`
- Trình duyệt web (Chrome, Edge, Firefox...)

## Cài đặt
### Chạy trên CPU
```bash
pip install -r requirements_cpu
```
### Chạy trên GPU
```bash
pip install -r requirements_gpu
```

## Khởi động hệ thống

```bash
uvicorn fast_api:app --reload
```

- API sẽ chạy tại: `http://127.0.0.1:8000`
- Mở file `index.html` bằng trình duyệt để xem dashboard.

## Tính năng chính

- Hiển thị 4 video giám sát (2x2) realtime.
- Thông tin trung bình số lượng và tốc độ xe (ô tô, xe máy) từng video.
- Khung chat bên phải để trao đổi (hiện chỉ hoạt động phía client).

## DEMO

![](https://raw.githubusercontent.com/vietanhlee/SIC-project/refs/heads/main/display%20github/SIC.png)