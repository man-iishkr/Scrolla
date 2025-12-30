# 📰 Scrolla  
**AI-Powered News Aggregation Platform**

Scrolla is a full-stack, AI-powered news aggregation web application designed to reduce information overload and enhance news consumption through intelligent summaries, interactive Q&A, and personalized content recommendations. The platform integrates modern web technologies with Google Gemini AI to deliver fast, relevant, and user-centric news experiences.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)

---

## 📖 Overview

In today’s information-rich environment, users often struggle with time constraints, fragmented news sources, and content overload. Scrolla addresses these challenges by providing:
- AI-generated concise summaries
- Personalized news feeds
- Interactive, context-aware AI assistance
- A secure and seamless reading experience

---

## 🚀 Core Features

- **AI-Powered Article Summaries**  
  Generates accurate 40–50 word summaries using Google Gemini 2.5 Flash.

- **Interactive AI Q&A**  
  Ask natural language questions about articles and receive instant, contextual answers.

- **Personalized “For You” Feed**  
  Recommendation engine based on user interactions, category preferences, and recency.

- **Multi-Category News Aggregation**  
  National, International, Regional, and personalized feeds powered by NewsAPI.

- **Multi-Method Authentication**
  - Email & password login
  - OTP-based authentication
  - Email verification
  - Guest mode access

- **Bookmarking System**  
  Save and manage favorite articles securely.

---

## 🛠️ Tech Stack

### Frontend
- HTML5  
- CSS3  
- Vanilla JavaScript (ES6+)  
- Fetch API  

### Backend
- Node.js  
- Express.js  
- RESTful API architecture  

### Database
- MongoDB  
- Mongoose ODM  
- MongoDB Atlas  

### AI & External Services
- Google Gemini 2.5 Flash API  
- NewsAPI.org  
- Nodemailer (SMTP)  

### Authentication & Security
- JSON Web Tokens (JWT)  
- bcryptjs  
- Email verification & OTP system  

---

## 🧩 System Architecture

```text
┌──────────────┐
│   Frontend   │
│ (HTML/CSS/JS)│
└──────┬───────┘
       ↓
┌──────────────┐
│ Express API  │
│  (Node.js)   │
└──────┬───────┘
       ↓
┌──────────────┐
│ MongoDB      │
│ Atlas Cloud  │
└──────┬───────┘
       ↓
┌──────────────────────────────┐
│ External Services            │
│ • NewsAPI                    │
│ • Google Gemini AI           │
│ • Nodemailer (SMTP)          │
└──────────────────────────────┘
```
---
## 📁 Project Structure
scrolla/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── middlewares/
│   ├── utils/
│   └── app.js
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── index.html
│
├── .env
├── package.json
└── README.md

---
## 🔮 Future Enhancements

- Dark mode support  
- Advanced search with filters  
- Reading history tracking  
- Breaking news notifications  
- Audio summaries (text-to-speech)  
- Multi-language UI  
- Mobile applications (React Native)  
- Sentiment analysis  
- Trending topics detection  
- Analytics dashboard  
- Premium tier & publisher portal  
