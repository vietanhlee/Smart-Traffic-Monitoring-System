# 📁 Modules Structure

This directory contains the modularized frontend code organized by features and shared utilities.

## 🏗️ Structure Overview

```
modules/
├── features/          # Feature-based modules (business logic)
│   ├── auth/         # Authentication & Authorization
│   ├── traffic/      # Traffic Monitoring & Analytics
│   ├── video/        # Video Streaming & Monitoring
│   └── chat/         # AI Assistant Chat
│
└── shared/           # Shared/Common utilities across features
    └── components/   # Reusable UI components
```

## 📦 Features

### 🔐 Auth (`features/auth/`)

Handles user authentication, registration, and profile management.

**Components:**

- `LoginForm.tsx` - User login interface
- `RegisterForm.tsx` - New user registration
- `UserProfileForm.tsx` - User profile management

**Guards:**

- `ProtectedRoute.tsx` - Route protection wrapper

### 🚦 Traffic (`features/traffic/`)

Traffic monitoring and analytics visualization.

**Components:**

- `TrafficDashboard.tsx` - Main traffic monitoring dashboard
- `TrafficAnalytics.tsx` - Traffic analytics with charts

### 📹 Video (`features/video/`)

Video streaming and camera monitoring.

**Components:**

- `VideoMonitor.tsx` - Live video feed monitor
- `VideoModal.tsx` - Full-screen video modal

### 💬 Chat (`features/chat/`)

AI-powered traffic assistant chatbot.

**Components:**

- `ChatInterface.tsx` - Main chat interface

## 🔄 Shared (`shared/`)

Reusable components and utilities used across multiple features.

**Components:**

- `LoadingSpinner.tsx` - Loading indicator

## 📝 Usage

### Importing Components

```typescript
// Direct import
import { LoginForm } from "@/modules/features/auth/components";
import { TrafficDashboard } from "@/modules/features/traffic/components";

// Or specific path
import LoginForm from "@/modules/features/auth/components/LoginForm";
```

### Adding New Features

1. Create a new folder under `features/`
2. Add `components/`, `hooks/`, `services/`, `types/` as needed
3. Create an `index.ts` for easy exports
4. Update this README

## 🎯 Design Principles

- **Feature-First**: Code is organized by business features, not technical layers
- **Colocation**: Related code stays together (components, hooks, types in same feature)
- **Shared Components**: Common UI elements in `shared/` to avoid duplication
- **Clear Boundaries**: Each feature is independent with minimal cross-dependencies

## 🔍 Benefits

✅ **Easy Navigation**: Find code by feature, not by technical type  
✅ **Better Scalability**: Add new features without affecting existing ones  
✅ **Clearer Dependencies**: Understand feature relationships at a glance  
✅ **Improved Maintainability**: Changes isolated to specific features  
✅ **Team Collaboration**: Multiple developers can work on different features simultaneously

---

Last updated: October 28, 2025
