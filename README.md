# StrawFi 3.0

### AI-powered personalized financial intelligence

> **Financial information is everywhere. Financial intelligence that understands _you_ isn't.**

StrawFi is an AI-powered financial intelligence platform that personalizes financial research around the user's **financial persona, goals, and context**.

Instead of giving every user the same generic financial information, StrawFi creates a personalized research environment where AI, financial data, corporate filings, and research workflows come together.

---

## What's New in StrawFi 3.0?

StrawFi 3.0 moves beyond a simple financial research interface and introduces a more connected, personalized research workflow.

###  Personalized User Profiles

Users now have persistent financial profiles that can store:

- Full name
- Username
- Company
- Position
- Phone number
- Bio
- Financial persona and context

Profiles are securely connected to Supabase authentication using Row Level Security (RLS).

###  Team-Based Research

StrawFi 3.0 introduces team authentication and collaboration capabilities.

Teams can:

- Create team workspaces
- Authenticate securely
- Access shared research environments
- Work with research and version history

###  Research Knowledge Repository

The Research Repository acts as a persistent knowledge layer for financial research.

Users can:

- Create research documents
- Browse research
- Search research
- Open individual research items
- Maintain research versions
- Organize research using tags

Instead of treating every AI interaction as temporary, StrawFi preserves research as reusable institutional knowledge.

###  Research Versioning

Research is no longer overwritten when it changes.

StrawFi maintains versions of research with:

- Version numbers
- Content history
- Authors
- Tags
- File references
- Creation timestamps
- Update timestamps

This creates a persistent research history that allows users to understand how an investment thesis evolved.

###  Research Tags

Research can be tagged and indexed for faster organization and discovery.

Tags allow researchers to categorize knowledge across:

- Companies
- Sectors
- Themes
- Investment strategies
- Research topics

###  FinBot — Personalized AI Assistant

StrawFi 3.0 includes **FinBot**, an AI financial assistant designed around the user's financial persona.

Instead of providing completely generic answers, FinBot receives the user's selected investing persona and adapts its responses accordingly.

> **Note:** FinBot's OpenAI integration requires an OpenAI API key with available API quota.

###  Financial Research Tools

StrawFi brings multiple financial research capabilities into one workspace, including:

- SEC filing analysis
- Corporate event analysis
- Financial insights
- Delta detection
- Peer comparison
- Research writing assistance
- Research memory
- AI-powered tracking tools

The goal is to reduce the number of disconnected tools a researcher needs to use.

###  Secure Authentication & Authorization

StrawFi 3.0 uses:

- Supabase Authentication
- JWT-based backend authentication
- Row Level Security
- Protected research endpoints
- Team authentication

Sensitive environment variables and API keys are kept outside the repository through `.env` protection.

###  Real-Time Collaboration Infrastructure

StrawFi 3.0 includes WebSocket infrastructure for:

- Research editing
- Presence tracking
- Corporate event live workflows

This provides the foundation for real-time collaborative financial research.

---

## Why StrawFi?

Financial research today is fragmented.

Investors and financial researchers often have to move between:

- Company filings
- Financial reports
- Research documents
- Market information
- AI tools
- Different analytical workflows

And most financial AI tools still give users essentially the same experience regardless of who they are.

### StrawFi takes a different approach.

We start with the **person**, not just the financial question.

```text
                    USER
                      │
                      ▼
              FINANCIAL PERSONA
                      │
                      ▼
             PERSONALIZED WORKSPACE
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
        AI          Research    Financial
      Analysis      Workflow      Data
          │           │           │
          └───────────┼───────────┘
                      ▼
               ACTIONABLE INSIGHT