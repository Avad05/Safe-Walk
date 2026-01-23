# 🚨 Emergency Response Coordination System (MVP)

## 📌 Overview

This project is a **bare-minimum prototype** of an **Emergency Response Coordination System** designed to demonstrate how emergencies can be reported, reviewed by an operator, and dispatched to the nearest available emergency unit using a centralized platform.

This is a **non-AI, rule-based system** built strictly for demonstration, academic, or MVP purposes.

---

## 🎯 Objective

The goal of this MVP is to prove the **end-to-end workflow**:

1. A user reports an emergency  
2. An operator reviews the incident  
3. The operator dispatches a suitable emergency unit  
4. The incident lifecycle is tracked until completion  

---

## 🧩 Features (MVP Scope)

### ✅ Included
- Emergency reporting via a simple web form
- Operator dashboard to view incidents
- Mock emergency units (ambulance, fire, police)
- Manual dispatch of nearest available unit
- Incident status tracking:
  - Pending
  - Dispatched
  - Completed

### ❌ Not Included (Intentionally)
- No AI / Machine Learning
- No authentication or user accounts
- No real GPS or maps
- No SMS, email, or push notifications
- No real emergency service integration
- No mobile apps

---

## 👥 User Roles

### 1️⃣ Citizen (Reporter)
- Submits an emergency report
- Provides emergency type, description, and location

### 2️⃣ Operator
- Views incoming incidents
- Confirms emergency details
- Dispatches appropriate emergency units
- Updates incident status

---


## 🧪 Emergency Units (Mock Data)

Emergency units are predefined in the system for demonstration.

Example:
- Ambulance-1 (Medical, Location A, Available)
- Ambulance-2 (Medical, Location B, Available)
- Fire-1 (Fire, Location A, Available)
- Police-1 (Police, Location C, Available)

“Nearest” unit selection is **simplified**:
- Same location → nearest
- Otherwise → first available unit

---

## ⚙️ Tech Stack

- **Frontend:** HTML / CSS / JavaScript (or basic React)
- **Backend:** Node.js + Express *(or Python Flask)*
- **Database:** In-memory storage or SQLite

---

## 🚀 How to Run the Project (Example)

### 1️⃣ Clone the Repository
```bash
git clone git@github.com:Avad05/Safe-Walk.git
cd Safe-Walk
