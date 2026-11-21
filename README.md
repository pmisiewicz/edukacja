# Generator kart pracy

Drukowalne karty pracy dla dzieci (A4), nowa karta jednym kliknięciem.
Online: https://pmisiewicz.github.io/edukacja/

## Rodzaje kart

**Czas i mierzenie**
- **Zegary** — odczytywanie godziny lub rysowanie wskazówek; dokładność od pełnych godzin do 1 minuty, format 24h, pomoce na tarczy.
- **Upływ czasu** — ile minęło między dwoma zegarami albo która będzie „za 45 min”.
- **Kalendarz** — kartka miesiąca i pytania (dzień tygodnia, data za tydzień, ile sobót…).
- **Termometry** — odczyt temperatury lub zamalowanie słupka; skala −30…+50 °C, dokładność 10/5/2/1 °C.
- **Linijka** — pomiar odcinka w cm lub cm i mm; linijka w skali 1:1 (drukuj w skali 100%).
- **Waga kuchenna** — odczyt masy lub rysowanie wskazówki; skala 0–1000 g lub 0–5 kg.

**Matematyka**
- **Działania matematyczne** — dodawanie/odejmowanie, zakresy liczb i wyniku, do 60 działań na stronie.
- **Pieniądze** — policz monety i banknoty (złote, opcjonalnie grosze).

**Pisanie**
- **Szlaczki** — fale, pętelki, zygzaki, schodki, łuki, sprężynki: wzór, ślad i miejsce na kontynuację.
- **Litery pisane** — liniatura jak w zeszycie 1-klasisty; losowe litery lub własne litery/wyrazy. Domyślnie czcionka Playwrite Polska, która **nie** jest wzorem z elementarza — w panelu można wczytać własną czcionkę (TTF/OTF/WOFF, np. licencjonowane „Pismo Szkolne”). Plik zostaje tylko w tej przeglądarce i jest automatycznie dopasowywany do liniatury.

Każda karta ma opcjonalny klucz odpowiedzi (osobna strona). Link z paska adresu odtwarza dokładnie tę samą kartę (kod karty = ziarno losowania).

## Praca z kodem

```
npm install
npm run dev     # http://localhost:5173/edukacja/
npm test
npm run build
```

Push na `main` publikuje stronę przez GitHub Actions (w ustawieniach repo: Settings → Pages → Source: GitHub Actions).

## Dodawanie nowego rodzaju karty

1. Utwórz `src/tasks/<nazwa>/index.ts` eksportujący obiekt `TaskModule` (zob. `src/core/types.ts`): opcje (panel buduje się z nich sam), generator zadań z ziarna, renderowanie zadania i odpowiedzi.
2. Dopisz moduł do listy w `src/tasks/index.ts`.
3. Testy generatora w `src/tasks/tasks.test.ts`.
