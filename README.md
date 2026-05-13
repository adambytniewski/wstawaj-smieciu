# wstawaj śmieciu

Personalny coach self-improvement. Działa lokalnie. Brutalnie szczery, mówi po polsku, podpięty pod twój Ollama (qwen3:8b) i Second Brain.

```
┌─────────────────────────────────────┐
│  4 obszary: Deep Work · Gym · Sen   │
│            · AI Coding (auto)        │
│  AI coach z brutalnym tonem          │
│  Push na telefonie przez Tailscale   │
│  100% lokalnie. Zero chmury.         │
└─────────────────────────────────────┘
```

---

## Jak to działa

- **Next.js 15 PWA** — instalujesz na home screen telefonu, wygląda jak natywna apka
- **SQLite (better-sqlite3)** lokalnie w `./data/wstawaj.db`
- **Ollama (qwen3:8b)** w WSL2 — coach generuje brutalne wiadomości po polsku
- **Second Brain integration** — auto-track sesji z Claude Code czytanych z `Sessions/*.md`
- **Web Push** przez VAPID — coach wysyła powiadomienia na twój telefon
- **Tailscale Funnel** — wystawiasz lokalny serwer pod HTTPS, telefon łączy się z całego świata

---

## Pierwsze uruchomienie

### 1. Zainstaluj zależności

```bash
cd /c/Users/adamb/OneDrive/Desktop/wstawaj-smieciu
npm install
```

### 2. Skonfiguruj `.env.local`

Plik już istnieje z wygenerowanymi kluczami VAPID. Sprawdź `.env.local.example` jako wzór.

Jeśli musisz wygenerować nowe klucze VAPID:

```bash
npm run vapid:gen
```

### 3. Wygeneruj ikony PWA (jednorazowo)

```bash
node scripts/gen-icons.mjs
```

### 4. Odpal Ollama w WSL

```bash
wsl
ollama serve  # zostaw otwarte
# w innym tabie WSL:
ollama pull qwen3:8b   # jeśli jeszcze nie masz
```

### 5. Odpal aplikację

```bash
npm run dev
# → http://localhost:3040
```

Pierwsze wywołanie coacha zajmie ~6s (cold-start WSL fallback). Kolejne <2s.

---

## Telefon (PWA + Tailscale)

### A. Tailscale — połącz telefon z PC

1. Załóż konto: https://login.tailscale.com (darmowe, do 100 urządzeń)
2. **Na PC (Windows):** zainstaluj https://tailscale.com/download/windows, zaloguj się
3. **Na telefonie:** zainstaluj appkę "Tailscale" z App Store / Google Play, zaloguj się tym samym kontem
4. Sprawdź IP swojego PC w sieci tailscale: powiedzmy `100.x.y.z`

### B. Wystaw appkę przez Tailscale Funnel (HTTPS publiczne)

PWA + Web Push **wymagają HTTPS**. Tailscale Funnel daje ci HTTPS za darmo:

```bash
# Jednorazowo: włącz Funnel dla swojego konta
tailscale funnel --bg --https=443 http://localhost:3040
```

Tailscale wypisze publiczny URL: `https://twoj-pc.tail-scale.ts.net`. Otwórz go na telefonie.

> **Alternatywa bardziej prywatna:** zamiast `funnel` użyj `serve`, wtedy URL działa **tylko** w twojej sieci tailscale (telefon → PC). Brak publicznego dostępu.
>
> ```bash
> tailscale serve --bg --https=443 http://localhost:3040
> ```
>
> Adres: `https://twoj-pc.tail-scale.ts.net` — działa tylko gdy telefon jest zalogowany do tailnet. To preferowana opcja.

### C. Zainstaluj na home screen telefonu

**iOS (Safari):** Otwórz URL → Share → "Dodaj do ekranu początkowego"
**Android (Chrome):** Otwórz URL → ⋮ → "Zainstaluj aplikację"

Po instalacji aplikacja działa w trybie standalone (bez paska adresu), z własną ikoną.

### D. Włącz powiadomienia push

W aplikacji wejdź na **Coach** → przycisk **"Włącz push"** → zezwól w przeglądarce/systemie.
Test: kliknij **"Test push"**.

---

## Konfiguracja Ollama (jeśli WSL fallback nie działa)

Aplikacja domyślnie próbuje `http://localhost:11434`. Jeśli się nie uda — automatycznie spada na `wsl.exe -- curl ...` (~6s cold-start, potem szybkie).

### Opcja 1: Mirrored networking (Windows 11, najlepsze)

Stwórz/edytuj `C:\Users\adamb\.wslconfig`:

```ini
[wsl2]
networkingMode=mirrored
```

Zrestartuj WSL: `wsl --shutdown`. Teraz `localhost:11434` z Windows pójdzie prosto do Ollama. Healthcheck zwróci `via: "fetch"` zamiast `"wsl"`.

### Opcja 2: Bind Ollama na 0.0.0.0

W WSL:

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

Wtedy z Windows: `OLLAMA_URL=http://$(wsl hostname -I | awk '{print $1}'):11434`

---

## Skróty klawiszowe & API

### Endpointy

| Metoda | Path                       | Co robi                                 |
| ------ | -------------------------- | --------------------------------------- |
| GET    | `/api/health`              | Status Ollama + DB                       |
| GET    | `/api/stats/today`         | Dzisiejsze statystyki + streaki          |
| GET    | `/api/stats/week?days=7`   | Ostatnie N dni                           |
| POST   | `/api/deep-work`           | Start sesji deep work                    |
| PATCH  | `/api/deep-work`           | Zakończ sesję                            |
| POST   | `/api/gym/workout`         | Zapisz trening                           |
| GET    | `/api/gym/overload`        | Progressive overload chart data          |
| POST   | `/api/sleep`               | Zapisz sen                               |
| POST   | `/api/coding/sync`         | Zsynchronizuj z Second Brain             |
| POST   | `/api/coach/message`       | Generuj coach message (`daily`/`audit`)  |
| POST   | `/api/coach/chat`          | Czat z coachem                           |
| POST   | `/api/push/subscribe`      | Subskrypcja push z przeglądarki          |
| POST   | `/api/push/test`           | Wyślij test push do wszystkich subów     |

### Cron / scheduled push (opcjonalne)

Możesz pingować `/api/push/test` cronem (Windows Task Scheduler / `mcp__scheduled-tasks__create_scheduled_task`) co X minut/godzin żeby coach codziennie cię zaopieprzał.

Przykład: codziennie o 7:00 → wyśle push z świeżą wiadomością coacha bazującą na danych z poprzedniego dnia.

---

## Stack

- **Next.js 15.5** + React 19 + App Router
- **TypeScript 5.7** + strict mode
- **Tailwind 3** + custom design tokens (czarny + akcent #ff3b30)
- **Drizzle ORM** + better-sqlite3
- **lucide-react** ikony
- **recharts** wykresy
- **web-push** powiadomienia
- **zod** walidacja API

---

## Filozofia

> Apps celebrate the checkbox. **wstawaj śmieciu** celebrates the change.

- Brak filler tasks (czytanie, zimne prysznice, itp.) — tylko 4 obszary które naprawdę ruszają igłą
- AI nie pochwala. AI pcha do przodu z liczbami i targetami
- Wszystko lokalnie — twoje dane nie wychodzą z PC
- Brutalny po polsku. Bez owijania.

---

## ⚠️ OneDrive na Windows

Folder projektu jest w OneDrive (`OneDrive/Desktop/wstawaj-smieciu`). OneDrive synchronizuje też `.next` cache podczas kompilacji co może powodować błędy `UNKNOWN: open...`.

**Rozwiązanie:** kliknij PPM na `.next` w eksploratorze → "Always keep on this device" + "Free up space" wyłączone, ALBO użyj OneDrive ustawień: Settings → Sync and backup → Manage backup → odłącz Desktop.

Najprościej: jeśli zobaczysz błędy build, usuń `.next` i restart:

```bash
rm -rf .next && npm run dev
```

---

## Backup bazy

Skopiuj `data/wstawaj.db`. To wszystko — cała twoja historia w jednym pliku.

```bash
cp data/wstawaj.db ~/Backups/wstawaj-$(date +%Y%m%d).db
```
