# LinkedIn Profile Enricher

En applikation för att berika LinkedIn-profiler med data från SignalHire.

## Installation

1. Klona detta repository
2. Installera beroenden:
   ```
   npm install
   ```
3. Skapa en `.env.local`-fil i projektets rotkatalog med följande innehåll:
   ```
   SIGNALHIRE_API_KEY=din_signalhire_api_nyckel_här
   ```

## Starta applikationen

Du behöver starta både backend-servern och frontend-applikationen separat:

### 1. Starta backend-servern:

```
npm run start:server
```

Servern kommer att starta på port 3333 och hantera API-anrop för ProfileEnricher. Se till att denna server körs innan du startar frontend-applikationen.

### 2. Starta frontend-utvecklingsservern:

I en separat terminal:

```
npm run dev
```

Frontend-applikationen kommer att starta på port 3000 eller nästa tillgängliga port (t.ex. 3001 om 3000 redan används).

## Felsökning

Om http://localhost:3000/ inte visas:

1. Kontrollera att backend-servern körs på port 3333
2. Kontrollera vilken port frontend-servern använder i terminalen (kan vara 3001, 3002 etc. om port 3000 är upptagen)
3. Se till att inget blockerar porten (andra processer, brandvägg, etc.)
4. Öppna webbläsarens utvecklarverktyg (F12) och kontrollera efter fel i konsolen

För debuggingsinformation, kontrollera terminalen där servern körs för att se API-anrop och eventuella felmeddelanden.

## Konfigurera SignalHire API-nyckel

För att använda SignalHire API behöver du:

1. Skaffa en API-nyckel från [SignalHire](https://www.signalhire.com/)
2. Lägg till API-nyckeln i din `.env.local`-fil:
   ```
   SIGNALHIRE_API_KEY=din_signalhire_api_nyckel_här
   ```
3. Starta om servern om den redan är igång

## För produktionssättning

När du deployar applikationen, se till att konfigurera miljövariabeln `SIGNALHIRE_API_KEY` på din server eller värdtjänst (Vercel, Netlify, etc.).

### Exempel på Vercel

1. Gå till ditt projektets inställningar
2. Välj "Environment Variables"
3. Lägg till en variabel med namn `SIGNALHIRE_API_KEY` och ditt API-nyckel som värde
4. Spara och deploy applikationen

## Funktioner

- Söka och filtrera LinkedIn-profiler
- Berika profiler med data från SignalHire
- Analysera profiler med AI baserat på kriterierna du anger
- Exportera data för vidare analys

# Mer information om projektet

## Project info

**URL**: https://lovable.dev/projects/ad08adb0-feb2-4c88-9876-792a9a916dde

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Express (for the backend server)
- SignalHire API integration

## How to download and run this project locally

To get a complete copy of this project to your local machine, follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Other ways to edit this code

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ad08adb0-feb2-4c88-9876-792a9a916dde) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

