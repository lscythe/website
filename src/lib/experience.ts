// Recovered from the previous build of lscythe.dev/experience.
export const EXPERIENCE_INTRO = "Where I've worked and what I've built.";
// `backticks` in text are rendered as inline code.

export interface Project {
  name: string;
  url?: string;
  status?: "internal" | "discontinued";
  tech: string[];
  points: string[];
}

export interface Role {
  role: string;
  company: string;
  period: string;
  points: string[];
  projects: Project[];
}

export const EXPERIENCE: Role[] = [
  {
    role: "Senior Android Developer",
    company: "SALT",
    period: "Jun 2024 – Apr 2026",
    points: [
      "Maintain and develop new features for BCA Life mobile app using Kotlin and Jetpack Compose, delivering 2 major features including a hospital locator with Google Maps integration",
      "Modernized project architecture by refactoring incorrect MVVM implementation, consolidating scattered ViewModels into proper architecture patterns",
      "Led analytics migration for Downer Mobile App from Microsoft Analytics to Google Analytics (C#), ensuring seamless data continuity",
      "Developed CNOP monitoring application for Telkom Indonesia using Flutter, enabling real-time network metrics tracking",
    ],
    projects: [
      {
        name: "Now by BCA Life",
        url: "https://play.google.com/store/apps/details?id=com.bcalife.now",
        tech: ["Kotlin", "Jetpack Compose", "Ktor", "Koin", "Room", "Coroutines", "Google Maps SDK", "Google Analytics", "Google Health Connect"],
        points: [
          "Built nearby hospital locator with Google Maps integration for partner hospitals",
          "Enhanced claim and policy features",
          "Migrated anti-pattern code into proper MVVM architecture",
          "Modernized build convention using `build-logic`, replacing scattered `test.gradle` files in root project",
          "Set up CI/CD pipeline",
          "Added telemedicine feature using third-party OAuth and service integration",
          "Built hospital referral letter feature",
        ],
      },
      {
        name: "DownerConnect",
        url: "https://www.downergroup.com/downerconnect",
        tech: ["C#", "Xamarin", "Firebase Analytics"],
        points: ["Migrated analytics from Microsoft Analytics to Google Analytics due to Microsoft Analytics sunsetting"],
      },
      {
        name: "Qosmo",
        status: "internal",
        tech: ["Flutter", "Melos", "Mason Bricks", "Dio", "Cubit"],
        points: [
          "Built the mobile app from scratch for Telkom Indonesia's internal network monitoring",
          "Implemented CTI Monitoring dashboard with PE Transit, Perf Tutela AWS, and Perf EBR metrics",
          "Built Monday Monitoring with SLA Performance tracking (packet loss, latency, jitter) across regions",
          "Implemented RPJ CX monitoring with regional latency comparison tables across carriers",
          "Built search functionality for sites and documents with incident tracking and detail views",
          "Created region detail screens with healthiness levels, profiling data, and quality performance metrics",
          "Integrated site maps with topology link route visualization",
        ],
      },
    ],
  },
  {
    role: "Android Developer",
    company: "Bumi Amartha Teknologi Mandiri",
    period: "Jun 2021 – Jun 2024",
    points: [
      "Contributed to the development of Livin' by Mandiri, one of Indonesia's leading banking super apps",
      "Collaborated closely with Bank Mandiri stakeholders to gather requirements and ensure compliance with banking industry standards and security protocols",
      "Enhanced application security, performance, and user experience through continuous improvements and code optimization",
      "Integrated backend services and third-party APIs in cross-functional team environment using Agile methodologies",
    ],
    projects: [
      {
        name: "Livin' by Mandiri",
        url: "https://play.google.com/store/apps/details?id=id.bmri.livin",
        tech: ["Kotlin", "Hilt", "Room", "SharedPreferences", "Retrofit", "Coroutines", "NFC", "Firebase Analytics", "Firebase Crashlytics", "Jenkins"],
        points: [
          "Built mutual fund investment feature",
          "Built bond investment feature",
          "Implemented Tap to Pay in collaboration with Visa using NFC",
          "Enhanced top-up flow",
        ],
      },
    ],
  },
  {
    role: "Mobile Application Developer",
    company: "Ent-Vision",
    period: "Sep 2023 – Feb 2024",
    points: [
      "Developed 2 delivery tracking applications using Flutter for mobile and tablet platforms",
      "Implemented geofencing functionality to enhance location tracking accuracy and operational efficiency",
      "Integrated Firebase Cloud Messaging (FCM) for real-time notifications and updates",
    ],
    projects: [
      {
        name: "Driver App",
        status: "discontinued",
        tech: ["Flutter", "Riverpod", "Chopper", "Geofencing", "WebSocket", "FCM", "Firebase Analytics", "Firebase Crashlytics"],
        points: ["Built attendance logging system", "Built work logging and tracking", "Implemented real-time location tracking"],
      },
      {
        name: "Supervisor App",
        status: "discontinued",
        tech: ["Flutter", "Riverpod", "Chopper", "Geofencing", "WebSocket", "FCM", "Firebase Analytics", "Firebase Crashlytics"],
        points: ["Built work assignment system", "Implemented driver tracking dashboard", "Built delivery tracking and monitoring"],
      },
    ],
  },
  {
    role: "Full Stack Developer",
    company: "IDOgo",
    period: "Sep 2022 – Apr 2023",
    points: [
      "Developed instant messaging application with real-time audio/video calls",
      "Implemented end-to-end encryption for secure communication",
      "Built both frontend (Flutter) and backend (NestJS) components",
    ],
    projects: [
      {
        name: "IDOgo Chat",
        status: "discontinued",
        tech: ["Flutter", "Riverpod", "Dio", "WebSocket", "XMPP", "WebRTC", "NestJS", "MySQL", "E2E Encryption"],
        points: [
          "Built real-time messaging with XMPP protocol",
          "Integrated WebRTC for audio/video calls",
          "Implemented file transfer with end-to-end encryption",
          "Built backend services with NestJS and WebSocket",
        ],
      },
    ],
  },
  {
    role: "Android Developer",
    company: "CODEX powered by Telkom Indonesia",
    period: "Jun 2020 – May 2021",
    points: [
      "Contributed to UmeetMe video conferencing application development using Jitsi SDK",
      "Led migration of Agree app from React Native to Android Native, rewriting key components and optimizing performance",
    ],
    projects: [
      {
        name: "UmeetMe",
        status: "discontinued",
        tech: ["Kotlin", "RxJava", "Coroutines", "SQLite", "SharedPreferences", "JavaScript", "Jitsi SDK"],
        points: ["Built meeting list feature", "Modified Jitsi SDK library to customize the video room UI"],
      },
      {
        name: "Agree",
        status: "discontinued",
        tech: ["Kotlin", "Coroutines", "Room", "SharedPreferences"],
        points: [
          "Led full migration from React Native to Android Native",
          "Rewrote key components for farmer lending and agricultural marketplace (seeds, fertilizer)",
          "Optimized performance for improved stability",
        ],
      },
    ],
  },
  {
    role: "Android Developer",
    company: "Gama Textile",
    period: "Feb 2019 – Aug 2019",
    points: [
      "Developed comprehensive POS Android application integrated with Tokopedia and Shopee marketplaces",
      "Implemented inventory synchronization across multiple sales platforms with real-time API integration",
    ],
    projects: [
      {
        name: "Gama Textile POS",
        status: "internal",
        tech: ["Java", "SQLite", "SharedPreferences", "Retrofit"],
        points: [
          "Built POS system integrated with Tokopedia and Shopee marketplaces",
          "Implemented inventory synchronization across multiple platforms",
          "Built background sync for real-time stock updates",
        ],
      },
    ],
  },
];
