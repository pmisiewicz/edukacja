# Generator kart pracy

Drukowalne karty pracy dla dzieci (A4), nowa karta jednym kliknięciem.
Online: https://pmisiewicz.github.io/edukacja/

## Rodzaje kart

- **Zegary** — odczytywanie godziny lub rysowanie wskazówek; dokładność od pełnych godzin do 1 minuty, format 24h, pomoce na tarczy.
- **Termometry** — odczyt temperatury lub zamalowanie słupka; skala −30…+50 °C, dokładność 10/5/2/1 °C.
- **Działania matematyczne** — dodawanie/odejmowanie, limity wyniku i składników, do 60 działań na stronie.

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
