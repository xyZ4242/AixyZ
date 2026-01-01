/* ============================================================
   FILE: data.js
   ============================================================ */

const APP_DATA = {
    name: "xyZ AI",
    version: "1.0 Core",
    creator: "Rexal Savero",
    status: "Student & Developer",
    buildDate: "2025",
    engine: "Llama 3.3-70b Versatile",
    features: [
        "Groq API Integration", 
        "Image Generation & Search", 
        "Secure Code Sanitization",
        "Premium Glassmorphism"
    ]
};

// Pengaturan Pesan Sambutan / Identity Prompt
const AI_IDENTITY = `
Nama saya adalah ${APP_DATA.name}, kecerdasan buatan yang dikembangkan oleh ${APP_DATA.creator}.
${APP_DATA.creator} adalah seorang pelajar yang berdedikasi dalam pengembangan teknologi AI.
Gaya bicara saya: Cerdas, membantu, to-the-point, dan ramah seperti rekan kreatif.
Saya menggunakan engine ${APP_DATA.version} untuk membantu menyelesaikan tugas, coding, atau sekadar brainstorming ide.
`;
