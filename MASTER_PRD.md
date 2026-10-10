System Specification: AI-Powered Interactive Mall Screen (FYP)
Role: You are an Expert Full-Stack Web Developer, UI/UX Architect, and System Designer.
Goal: Build a production-ready, interactive Smart Mall Screen application. The system consists of a public-facing Interactive Kiosk UI (optimized for laptop screens currently) and a secure Admin Dashboard. The design must be hyper-modern, fluid, and visually spectacular to impress a University Final Year Project (FYP) evaluation committee.

1. Technology Stack
Frontend: React.js, Tailwind CSS (for modern, responsive styling), Framer Motion (for fluid, eye-catching transitions and micro-interactions).

Backend: Node.js with Express.js.

AI Bridge (Crucial): A lightweight Python FastAPI or Flask microservice to host the existing .h5 EfficientNetB0 model, communicating with the Node backend via REST API.

Database: MongoDB (using Mongoose).

Cloud/Storage: Cloudinary or AWS S3 (for storing product images and temporary webcam captures).

External APIs: OpenWeather API (for contextual weather data), Google Calendar API / Eventbrite API (for local events mapping).

2. Public Interactive Screen Flow (User Facing)
Design Language: Glassmorphism, highly visual, dark/vibrant modern theme, intuitive large touch-targets.

State 1: The Attract Loop (Idle Screen)

Visuals: A mesmerizing, floating "Tap to Start" or "Step Right Up" animation. High contrast, dynamic glowing effects to capture mall foot traffic.

State 2: Camera Validation & Capture

Action: Activates the webcam.

UI: Displays a live video feed with a sleek framing overlay (like a face scanner).

Validation logic: If a face is not detected or is blurry, display a gentle, pulsing alert: "Please step closer into the frame."

Capture: Automatically captures the frame once validation passes, accompanied by a satisfying UI flash and sound effect.

State 3: AI Processing & Context Gathering

Action: The image is sent to the backend. The UI shows a futuristic "Analyzing Profile..." loader.

Backend Logic: Node sends the image to the Python AI service. Node simultaneously fetches current Weather data and Local Events data.

State 4: The "Magic" Reveal & Recommendations

Visuals: The screen dynamically unlocks. It elegantly displays the detected profile (e.g., "Welcome! [Age Category] | [Gender]").

The Engine: An intelligent grid displays products (Clothes, Food, Accessories). The backend queries MongoDB based on a weighted algorithm: [AI Demographic] + [Current Weather] + [Upcoming Event] + [Highest Conversion Past Stats].

State 5: Action & Wayfinding

Action: User clicks a product.

UI: A modal opens showing product details, the physical store location in the mall (Floor/Store Number), and a dynamically generated QR Code for the user to scan with their phone for instant purchase routing.

State 6: Gamification (Discount Engine)

Feature: A "Spin the Wheel" or quick memory matching minigame modal that appears after browsing. Winning generates a unique promo code.

State 7: Offboarding & Survey

Feature: A "Finish" button triggers a lightning-fast 5-star rating survey: "How accurate was our screen?"

Reset: After submission (or a 30-second idle timeout at any point in the flow), the system seamlessly transitions back to State 1.

3. Admin Dashboard (Backend Management)
Design Language: Clean, data-dense, light/dark mode toggle, using Recharts or Chart.js for data visualization.

Analytics Module (The FYP Showpiece):

Overview Metrics: Total users scanned today/weekly/monthly. Total purchases/QR scans.

Demographic Charts: Pie charts breaking down mall traffic by Gender and Age Categories (Kid, Young, Adult, Senior).

AI Accuracy Tracker: A line graph showing user survey feedback (1 to 5 stars) to prove model reliability.

Conversion Rates: Which demographic is clicking which products.

Inventory Management (CRUD):

A sleek data table to Add, Edit, Delete, and View products.

Product Schema needs: Name, Image URL, Category, Target Demographics (Array of matching ages/genders), Target Weather (e.g., 'Rain', 'Sunny', 'All'), Target Event tags, Store Location, Price.

Settings & Logs:

System health checks, recent error logs, and an API key management page.

4. Database Schema Structure (MongoDB)
Product Collection: Mapping products to specific demographic and environmental triggers.

Session Collection: Logs every interaction. { sessionId, timestamp, detectedAge, detectedGender, weatherAtTime, productsClicked, surveyRating }. (Do NOT save user photos to comply with privacy laws).

PromoCode Collection: Tracks gamification winners and redemption status.

5. Edge Cases & Error Handling to Implement
The Walkaway: Implement a global idle timer. If the screen registers no interaction for 45 seconds during the recommendation phase, it clears all data and resets to the Attract Loop.

API Failures: If the Weather or Event API goes down, the recommendation engine must gracefully degrade and fall back to purely Demographic + Popularity based recommendations.

Camera Denied: Beautiful error state if webcam permissions are blocked, guiding the user to allow access.

