# 🎫 Ticket Triage Agent

An intelligent ticket triage system that uses **rule-based classification** (Level 1) combined with **AI enhancement via Google Gemini** (Level 2) to automatically categorize, prioritize, and assign support tickets.

## 🏗️ Architecture

### Level 1: Rule-Based Triage
- Keyword-based pattern matching
- Fast, deterministic classification
- Handles common scenarios (security issues, bugs, features)
- No API calls required

### Level 2: AI Enhancement
- Uses Google Gemini 1.5 Flash
- Refines rule-based suggestions
- Provides contextual understanding
- Generates triage notes

## 📁 Project Structure

```
ticket-agent/
  src/
    cli.ts          # Command-line interface
    gemini.ts       # Google Gemini API integration
    schema.ts       # Zod schemas and types
    triage.ts       # Triage logic orchestration
    rules.ts        # Rule-based classification (Level 1)
  data/
    tickets/        # Triaged ticket storage
  .env              # Environment variables
  README.md
```

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API key:**
   Create a `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## 🎯 Usage

### Triage a Single Ticket

```bash
npm run triage -- "Login broken" "Users can't access the dashboard after entering credentials"
```

### Triage from File

Create a JSON file with tickets:

```json
[
  {
    "title": "Database connection timeout",
    "description": "Production database is timing out on queries"
  },
  {
    "title": "Add dark mode",
    "description": "Users requesting dark theme option"
  }
]
```

Run triage:
```bash
npm run triage -- --file tickets.json
```

### Generate Report

```bash
npm run triage -- --report
```

## 📊 Output

Each triaged ticket is saved to `data/tickets/` with:
- Rule-based classification
- AI-enhanced analysis
- Final merged classification
- Triage notes

Example output:
```json
{
  "ticket": {
    "id": "TICKET-1738172123456",
    "title": "Security vulnerability in auth",
    "category": "security",
    "priority": "critical",
    "assignedTeam": "Security Team",
    "tags": ["security", "urgent"],
    "triageNotes": "Critical security issue requiring immediate attention"
  }
}
```

## 🔧 Development

- **Build:** `npm run build`
- **Run:** `npm run triage`
- **Add rules:** Edit `src/rules.ts`

## 📦 Dependencies

- `@google/genai` - Google Gemini API
- `zod` - Schema validation
- `zod-to-json-schema` - Zod to JSON Schema conversion
- `dotenv` - Environment variable management

## 🎓 How It Works

1. **Rule-Based Triage (Level 1):**
   - Applies keyword matching rules
   - Fast initial classification
   - Determines baseline priority

2. **AI Enhancement (Level 2):**
   - Sends ticket + rule suggestions to Gemini
   - AI refines classification
   - Adds contextual triage notes

3. **Final Classification:**
   - Merges both approaches
   - Saves complete triage result
   - Ready for team assignment

## 📝 License

MIT
