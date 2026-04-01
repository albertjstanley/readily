# Readily Compliance Audit Tool

A web application that automates healthcare compliance auditing by matching audit questions against a library of policy documents using AI.

**Live App:** https://app-c8mvsy4wo-albertjstanleys-projects.vercel.app

## Architecture

```
Browser                          Vercel Serverless
┌──────────────────────┐        ┌─────────────────────────┐
│                      │        │                         │
│  Next.js 16 + React  │        │  /api/parse-questionnaire│
│                      │        │    ↓ receives plain text │
│  1. User selects     │        │    ↓ calls OpenAI       │
│     policies from    │        │    ↓ returns structured  │
│     pre-indexed list │        │       questions          │
│                      │        │                         │
│  2. User uploads     │        │  /api/analyze            │
│     audit PDF        │        │    ↓ receives 5 questions│
│     → parsed in      │        │      + policy texts     │
│       browser via    │        │    ↓ calls OpenAI       │
│       pdfjs-dist     │        │    ↓ returns compliance │
│                      │        │       results           │
│  3. Client batches   │        │                         │
│     questions (5/req)│        │  /api/policies           │
│     to avoid timeout │        │    ↓ serves pre-indexed │
│                      │        │       policy text from  │
│  4. Results render   │        │       policy-index.json │
│     incrementally    │        │                         │
└──────────────────────┘        └─────────────────────────┘
```

### Key decisions

- **Client-side PDF parsing** — `pdfjs-dist` requires browser APIs (`DOMMatrix`, `Path2D`) that don't exist in Node.js serverless environments. Parsing in the browser avoids all polyfill issues.
- **Pre-extracted policy index** — 373 policy PDFs are processed once via a build script into `policy-index.json` (~9 MB), bundled with the app. No runtime PDF parsing needed for policies.
- **Client-side batching** — Analysis is split into batches of 5 questions, each a separate API call (~15-30s). This avoids Vercel's 300s function timeout and provides incremental progress.
- **Intelligent policy selection** — For each batch, only the most relevant policies are sent to OpenAI based on keyword matching, staying within token limits.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS |
| LLM | OpenAI GPT-4o-mini |
| PDF parsing | pdfjs-dist (browser-side) |
| State | React Context + localStorage persistence |
| Hosting | Vercel |

## Setup

```bash
cd app
cp .env.example .env.local   # add your OPENAI_API_KEY
npm install
npm run dev
```

To rebuild the policy index from the `Public Policies/` folder:

```bash
node scripts/extract-policies.mjs
```

---

## Original Instructions

Healthcare organizations must demonstrate compliance with regulatory requirements. During audits, they provide excerpts from their policies as evidence of compliance.

For example:

Requirement: 
Does the P&P state that the MCP must respond to retrospective requests no longer than 14 calendar days from receipt?

Evidence:
GG.1508: Authorization and Processing of Referrals Revised
Page 10 of 25 
"For a retrospective request involving direct payment to the Member, CalOptima Health shall complete the CD, notify the Member or Member's Authorized Representative and the Prescriber, and effectuate the decision, if applicable, no later than fourteen (14) calendar days after the date and time CalOptima Health received the request."

Task
Develop a web app that:
Lets a user upload a PDF of audit questions.
Extracts the questions into a structured list.
For each question, show:
Whether the requirement is met.
The evidence (if met).
[Stretch] Think about what would make this a functional application
What user requirements around policy selection, questionnaire answering workflow, etc. might exist
Input
Readily Take Home Google Drive

Deliverables
A live URL to the deployed app.
A GitHub repo with your code.

Notes
Use any AI tools you'd like.
One of us can provide you with a AiStudio API key for LLM integration in your app
Keep it simple - aim for something functional in ~2 hours.
Think about the User Experience and what the process of using this app should be like
Questions? Email edward@readily.co or paul@readily.co 

Have fun building! 🚀
