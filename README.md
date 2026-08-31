StrawFi 3.0

AI-powered personalized financial intelligence

Financial information is everywhere. Financial intelligence that understands you isn't.

StrawFi is a personalized financial intelligence platform that brings investment-style personalization, financial modelling, research workflows, financial data, and a local AI financial assistant into one workspace.

Instead of treating every investor the same, StrawFi starts with the investor and carries that context through the research and analysis workflow.

___________________________________________________________________________________________


What StrawFi 3.0 Does

StrawFi is designed around a simple idea:

Investor
   ↓
Financial Persona
   ↓
Investment Sector
   ↓
Analysis Choice
   ├── Financial Model
   └── FinBot

The user can choose an investment style, select a sector, and then move into either financial modelling or an AI-assisted financial research workflow.
___________________________________________________________________________________________

Core Features

1. Personalized Investment Personas

StrawFi supports multiple investing styles, including:

Traditionalist

Innovator

Adventurer

Athlete

Artist

Environmentalist

The selected persona is carried into the analysis experience so the platform can frame research and financial explanations around the user's investing approach.

2. Sector-Specific Analysis

After choosing an investment persona, users select a sector such as:

Technology

Fintech

Healthcare

Energy

Consumer

Industrials

The persona and sector together define the context for the next stage of analysis.

3. Financial Model Builder

StrawFi includes a DCF-based financial modelling workflow.

Users can work with assumptions such as:

Revenue growth

EBITDA margin

Tax rate

Capex

Working capital

WACC

Terminal growth

Shares outstanding

The model produces valuation outputs including:

Projected financials
       ↓
Free cash flow
       ↓
Discounted cash flow
       ↓
Terminal value
       ↓
Enterprise value
       ↓
Equity value
       ↓
Implied value per share
       ↓
Sensitivity analysis

The purpose is not to guarantee an investment outcome, but to help users understand how valuation changes when assumptions change.

4. FinBot — StrawFi's Local AI Financial Assistant

FinBot is the conversational AI layer inside StrawFi.

The current architecture does not require OpenAI or Gemini for chatbot generation. StrawFi runs a local model through Ollama and connects it to StrawFi's own financial knowledge and retrieval layer.

The current local AI stack uses:

FinBot UI
   ↓
StrawFi Backend /api/chat
   ↓
StrawFi AI Server
   ↓
Financial Retriever
   ↓
Financial Context
   ↓
Ollama
   ↓
Qwen 0.5B

FinBot receives:

The user's question

Investment persona

Recent conversation history

StrawFi financial context

This allows the model to generate answers using a controlled financial context instead of relying only on the model's general knowledge.

5. Financial Knowledge & Retrieval

StrawFi includes a dedicated AI data layer containing financial concepts, definitions, importance, and limitations.

Examples include:

EBITDA

EBITDA margin

Revenue

Profit

P/E ratio

DCF

WACC

Terminal value

Free cash flow

Market capitalization

Investment risk

Diversification

Investment thesis

Financial modelling concepts

The retrieval pipeline is:

User Question
      ↓
Financial Retriever
      ↓
Relevant Topics
      ↓
Context Builder
      ↓
FinBot

This gives StrawFi a controllable source of financial context that can be expanded over time.

6. Conversation Context

FinBot accepts recent conversation history so follow-up questions can be handled as part of the same discussion.

For example:

User: What is P/E ratio?
FinBot: ...

User: Why can a high P/E be risky?
FinBot: ...

The backend limits the amount of recent conversation sent to the AI so unnecessary context does not continuously grow.

7. Controlled AI Usage

StrawFi currently enforces a 6 AI questions per day limit.

The limit is enforced at the backend rather than relying only on the frontend.

Question 1 → ✅
Question 2 → ✅
Question 3 → ✅
Question 4 → ✅
Question 5 → ✅
Question 6 → ✅
Question 7 → 🚫 Daily AI limit reached

This serves two purposes:

Controls AI usage and abuse during the prototype/buildathon stage.

Keeps local and future AI infrastructure predictable as the product grows.

Prototype note: the current quota store is in-memory. A future production version can persist usage in Supabase and associate quotas with authenticated users.

8. Research Knowledge Repository

StrawFi includes a persistent research workspace where users can:

Create research documents

Browse research

Search research

Open individual research items

Maintain research versions

Organize research with tags

Work with research files

The goal is to turn temporary research activity into reusable knowledge.

9. Research Versioning

Research updates can be preserved as versions rather than simply overwriting earlier work.

Version information can include:

Version numbers

Content history

Authors

Tags

File references

Creation timestamps

Update timestamps

This creates a research trail that can help users understand how a thesis or analysis evolved.

10. Team Authentication & Collaboration

StrawFi includes team-oriented infrastructure for collaborative research.

The backend supports:

Team creation

Team login

JWT-based team authentication

Protected research endpoints

Research editing locks

WebSocket-based presence infrastructure

The architecture is designed so multiple researchers can work in the same research environment.

11. Financial Research Tools

StrawFi also includes backend and UI infrastructure for additional financial research workflows, including:

SEC filing analysis

Corporate event analysis

Economic data

Insider transaction analysis

Regulation and compliance tracking

ESG disclosure analysis

Delta detection

Peer comparison

Research writing assistance

Research memory

AI-powered tracking tools

These capabilities are designed to reduce the number of disconnected tools required during financial research.

12. Security & Authentication

StrawFi uses multiple layers of application security, including:

Supabase Authentication

JWT-based backend authentication

Protected research endpoints

Team authentication

Environment variables for sensitive configuration

.env protection through .gitignore

API keys and secrets should remain outside the repository.

AI Architecture

The AI system is intentionally separated into distinct layers.

                    USER
                      │
                      ▼
                 FinBot UI
                      │
                      ▼
              POST /api/chat
                      │
                      ▼
             StrawFi Backend
             ┌────────┴────────┐
             │                 │
        Usage Limit        Chat History
             │                 │
             └────────┬────────┘
                      ▼
              StrawFi AI Server
                      │
          ┌───────────┴───────────┐
          │                       │
   Financial Retrieval      Persona Context
          │                       │
          └───────────┬───────────┘
                      ▼
               Financial Context
                      │
                      ▼
                Ollama / Qwen
                      │
                      ▼
                  FinBot Reply

The architecture intentionally separates knowledge/context from the language model. This means the model can be replaced or upgraded later without rebuilding the entire application.

StrawFi's Own Model R&D

The repository also contains an experimental NanoGPT-style model built specifically for StrawFi research.

AI/
├── data/
├── evaluation/
├── inference/
├── model/
└── training/

The model development pipeline includes:

Financial Training Data
        ↓
Data Preparation
        ↓
Tokenization
        ↓
Tiny GPT Training
        ↓
Checkpoint
        ↓
Generation
        ↓
Evaluation

The current tiny model is a research prototype and is not presented as a replacement for a production-scale language model.

The current chatbot uses the local Qwen model through Ollama while the StrawFi model remains an R&D path toward a more proprietary financial AI stack.

Project Structure

strawfi-3.0/
│
├── AI/
│   ├── data/
│   │   ├── financial_instructions.txt
│   │   ├── financial_knowledge.json
│   │   ├── financial_training.txt
│   │   └── prepare_data.py
│   │
│   ├── evaluation/
│   │   └── evaluate.py
│   │
│   ├── inference/
│   │   ├── ai_server.py
│   │   ├── chat_service.py
│   │   ├── context_builder.py
│   │   ├── generate.py
│   │   ├── local_model.py
│   │   └── retriever.py
│   │
│   ├── model/
│   │   ├── gpt.py
│   │   └── strawfi_tiny_gpt.pt
│   │
│   └── training/
│       ├── model.py
│       └── train.py
│
├── Backend/
│   ├── api/
│   ├── scripts/
│   ├── websocket/
│   └── server.js
│
├── Database/
│   ├── migrations/
│   ├── mockDb.js
│   └── schema.sql
│
└── Frontend/
    ├── src/
    │   └── app/
    └── package.json

Local Development

StrawFi currently runs as separate frontend, backend, and local AI services.

1. Start Ollama

Install and run Ollama, then make sure the required local model is available.

For the current chatbot setup:

ollama pull qwen2.5:0.5b

Verify:

ollama list

2. Start the StrawFi AI server

cd "AI"
.\.venv\Scripts\Activate.ps1
python ".\inference i_server.py"

The local AI service runs on:

http://127.0.0.1:5001

3. Start the backend

cd "Backend"
npm install
npm start

The backend runs on:

http://localhost:3001

4. Start the frontend

cd "Frontend"
npm install
npm run dev

The frontend runs on:

http://localhost:3000

Environment Variables

Create the required .env files locally.

The backend currently requires configuration such as:

JWT_SECRET
SUPABASE_URL
SUPABASE_SERVICE_KEY

Additional features may require their respective API credentials, such as the economic-data integrations.

Never commit secrets, API keys, or .env files to GitHub.

Current User Flow

The main analysis experience is:

1. Choose Investment Style
             ↓
2. Choose Investment Sector
             ↓
3. Choose Analysis Tool
             ├── Build Financial Models
             │       ↓
             │     DCF
             │
             └── Sector-Specific Chatbot
                     ↓
                   FinBot

This keeps the user's persona and sector at the center of the experience.

Why StrawFi?

Financial research is fragmented across:

Company filings

Financial statements

Market data

Research notes

Valuation models

AI tools

Collaboration systems

StrawFi brings these workflows together around the investor instead of forcing the investor to adapt to disconnected tools.

                    USER
                      │
                      ▼
              FINANCIAL PERSONA
                      │
                      ▼
                SECTOR CONTEXT
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
        MODELS       FINBOT     RESEARCH
          │           │           │
          └───────────┼───────────┘
                      ▼
             FINANCIAL INTELLIGENCE


Roadmap

Near term

Improve persona-aware retrieval

Persist AI usage with Supabase

Tie AI quotas to authenticated users

Expand the financial knowledge base

Improve chat history persistence

Improve evaluation of AI responses

Market expansion

Indian market coverage

NSE/BSE-oriented company workflows

Indian financial context

Additional market data sources

AI R&D

Larger and better financial datasets

Better model evaluation

Stronger local models

Improved financial grounding

Further development of a proprietary StrawFi model

Responsible AI

FinBot is intended to support financial research and education.

It should:

Distinguish facts from assumptions

Avoid guaranteeing returns

Communicate uncertainty

Avoid inventing company-specific information

Surface important limitations of financial metrics and valuation methods

StrawFi is designed to assist analysis, not replace professional financial judgment.

License

Add your preferred project license here before public distribution.
