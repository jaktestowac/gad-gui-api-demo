# Wprowadzenie

<p align="center">
  <img src="./assets/gad-header.png" alt="GAD" width="300" height="300">
</p>

> [!TIP]
> 💡 Wybierz swój język:
>
> - 🇬🇧 [English](./README.md)
> - 🇵🇱 [Polski](./README.pl.md)

Ta aplikacja (nazywana **🦎 GAD**) została przygotowana i stworzona **wyłącznie w celach testowych**. Zapewnia:

- Graficzny interfejs użytkownika (GUI)
- REST API
- Zintegrowaną dokumentację Swagger

Aplikacja zawiera funkcje takie jak prosta logika, statystyki, wykresy, gry oraz różne zasoby. Jest celowo zaprojektowana z **umyślnymi błędami**🐛 i wyzwaniami, aby symulować złożoność rzeczywistych projektów.

**🦎 GAD** jest idealny do nauki automatyzacji testów, doskonalenia technik QA oraz praktykowania scenariuszy spotykanych w różnorodnych, **rzeczywistych projektach** z różnorodnymi scenariuszami, które odwzorowują rzeczywiste projekty.

P.S. Dodatkowo, aplikacja ma pewne **poważne wady architektury** - ciekawe czy je zauważysz?😉

> [!IMPORTANT]  
> Chcesz szybko uruchomić aplikację?
>
> - sklonuj lub pobierz repozytorium
> - uruchom `npm i`
> - uruchom `npm run start`
> - otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce
> - ciesz się działającą aplikacją **🦎 GAD**!

# Spis treści

- [Funkcje](#funkcje)
- [Wdrożenie](#wdrożenie)
  - [Wdrożenie lokalne](#wdrożenie-lokalne)
    - [Pierwsze użycie](#pierwsze-użycie)
    - [Aktualizacja wersji](#aktualizacja-wersji)
      - [Jeśli używasz pakietu zip](#jeśli-używasz-pakietu-zip)
      - [Jeśli używasz sklonowanego repozytorium](#jeśli-używasz-sklonowanego-repozytorium)
      - [Aktualizacja wersji jeśli masz jakieś zmiany (np. w bazie danych)](#aktualizacja-wersji-jeśli-masz-jakieś-zmiany-np-w-bazie-danych)
    - [Opcje CLI](#opcje-cli)
      - [Uruchamianie opcji CLI](#uruchamianie-opcji-cli)
  - [Wdrożenie na Glitch](#wdrożenie-na-glitch)
  - [Wdrożenie na Render](#wdrożenie-na-render)
  - [Wdrożenie za pomocą obrazu Docker](#wdrożenie-za-pomocą-obrazu-docker)
    - [Wymagania wstępne:](#wymagania-wstępne)
    - [Uruchamianie](#uruchamianie)
- [Miłej automatyzacji!](#miłej-automatyzacji)
- [📞 Kontakt i wsparcie](#-kontakt-i-wsparcie)
- [Zasoby edukacyjne](#zasoby-edukacyjne)
  - [🇵🇱 Zasoby polskie](#-zasoby-polskie)
  - [🇬🇧 Zasoby angielskie](#-zasoby-angielskie)

# Funkcje

Funkcje **🦎 GAD**:

- **GUI** (front-end)
- **REST API** i **WebSockets** (back-end)
- **Dwie domeny aplikacji**:
  - **Blog testerów**
    - Zasoby - Artykuły, Użytkownicy, Komentarze i więcej
    - Funkcjonalności - Polubienia, Komentarze, Tagi i narzędzia angażowania użytkowników
    - Analityka - Statystyki i wykresy (np. polubienia na użytkownika, komentarze na artykuł)
    - **Uwierzytelnianie** i **Autoryzacja**
  - **Strony do ćwiczeń**
    - Kolekcja stron z wyzwaniami automatyzacji, takimi jak:
      - Iframe'y
      - Przesyłanie plików
      - Przeciągnij i upuść
      - Elementy dynamiczne
      - Polubienia, etykiety i ankiety
      - Banery, pop-upy, logika front-end i back-end
      - Gry i więcej!
- **Dokumentacja Swagger** - dokumentacja API dla płynnej integracji
- **Prosta baza danych** - baza danych oparta na JSON z punktami końcowymi REST API do czyszczenia/przywracania danych
- **Różne zestawy danych** - Małe, średnie i duże zestawy danych do symulowania rzeczywistych scenariuszy
- **Dynamiczna konfiguracja** - Dostosuj ustawienia aplikacji **łatwo z interfejsu użytkownika**
  - **Flagi funkcji** - Włącz lub wyłącz funkcje
  - **Flagi błędów** - Wprowadź lub usuń błędy w celach testowych
- Różne **prezentacje danych** (wykresy, tabele itp.)
- **Wyzwaniowe elementy do automatyzacji testów** (iframe'y, przesyłanie plików, przeciągnij i upuść, uwierzytelnianie dwuskładnikowe, etykiety, ankiety, banery, pop-upy, logika front-end i back-end, elementy dynamiczne, gry itp.)
- **Panel administracyjny**: Zawiera zaawansowane funkcjonalności takie jak:
  - Reset bazy danych
  - Plac zabaw SQL do eksperymentowania i testowania zapytań

# Wdrożenie

Instrukcje, jak wdrożyć prezentowaną usługę na różnych darmowych stronach hostingowych.

- [Wdrożenie lokalne](#wdrożenie-lokalne) (zalecane)
- [Wdrożenie na Glitch](#wdrożenie-na-glitch)
- [Wdrożenie na Render](#wdrożenie-na-render)
- [Wdrożenie za pomocą obrazu Docker](#wdrożenie-za-pomocą-obrazu-docker)

## Wdrożenie **lokalne**

Wymagania:

- **node.js** zainstalowany w systemie
  - przetestowane na node.js **v20** i **v22**
- **git** zainstalowany w systemie

### Pierwsze użycie

Kroki:

1. Otwórz główny katalog projektu w cmd/terminalu
1. Sklonuj repozytorium używając `git clone ...`
   - to jest **preferowany sposób** używania tej aplikacji
1. Uruchom `npm i`
   - aby zainstalować moduły (nie używaj globalnych pakietów node.js!)
1. Uruchom `npm run start`
   - aby uruchomić aplikację **🦎 GAD**

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

### Aktualizacja wersji

#### Jeśli używasz pakietu zip

Kroki:

1. Pobierz spakowane repozytorium
1. Rozpakuj i zastąp swoją lokalną instancję GAD
1. Uruchom `npm i` w głównym katalogu
   - aby zainstalować nowe moduły
1. Uruchom `npm run start`
   - aby uruchomić GAD

#### Jeśli używasz sklonowanego repozytorium

Kroki:

1. Otwórz główny katalog projektu w cmd/terminalu
1. Pobierz najnowsze zmiany używając `git pull`
1. Uruchom `npm i`
   - aby zainstalować nowe moduły
1. Uruchom `npm run start`
   - aby uruchomić GAD

### Aktualizacja wersji jeśli masz jakieś zmiany (np. w bazie danych)

Jedną z możliwości jest zresetowanie wszystkich twoich lokalnych zmian i pobranie nowej wersji.

Używając tej metody **stracisz wszystkie swoje lokalne zmiany i dane**!

Kroki:

1. Otwórz główny katalog projektu w cmd/terminalu
1. Zresetuj lokalne zmiany i pobierz najnowsze zmiany używając:
   ```
   git reset --hard HEAD
   git pull
   ```
1. Uruchom `npm i`
   - aby zainstalować nowe moduły
1. Uruchom `npm run start`
   - aby uruchomić **🦎 GAD**

### Opcje CLI

> CLI (Command Line Interface) to interfejs, który pozwala na interakcję z aplikacją za pomocą poleceń w terminalu.

| Opcja        | Opis                                                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| READ_ONLY=1  | Uruchom w trybie tylko do odczytu. To wyłącza wszystkie metody POST, PUT i PATCH, oprócz logowania.                                                 |
| PORT=3001    | Uruchom na wybranym porcie. GAD działa domyślnie na porcie `3000`.                                                                                  |
| DB="db_name" | Użyj wybranego pliku bazy danych. GAD używa `db.json` jako domyślnej bazy danych. Przykład (dla PowerShell): `$env:DB="db-base-big"; npm run start` |

> [!WARNING]
> ⚠️ Ostrzeżenie: Wszystkie zmienne środowiskowe ustawione w terminalu będą używane przez aplikację. Jeśli chcesz uruchomić aplikację bez żadnych opcji, upewnij się, że wyczyściłeś zmienne środowiskowe.

#### Uruchamianie z CLI

Aby uruchomić GAD z **opcjami CLI**, użyj następujących poleceń np.:

PowerShell:

```PowerShell
$env:PORT=3001; npm run start
```

Bash:

```Bash
PORT=3001 npm run start
```

Windows Cmd:

```
set PORT=3001 && npm run start
```

## Wdrożenie na **Render**

Render - popularny serwis PaaS z darmowym kontem i przyciskiem "Deploy to Render" do szybkich wdrożeń.

- stwórz darmowe konto na: https://dashboard.render.com/register
- po pomyślnej rejestracji naciśnij przycisk:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jaktestowac/gad-gui-api-demo)

- nazwij swoją aplikację
- naciśnij `Apply`
- poczekaj chwilę i kliknij link do projektu `GUI API Demo`
- kliknij link, aby otworzyć aplikację (pod nazwą projektu i repozytorium)
- ciesz się 750 darmowymi godzinami usługi miesięcznie!

Kiedy wdrażasz aplikację GAD na Render, pamiętaj, że aplikacja może nie działać w pełni ze względu na ograniczenia platformy Render. Jednak dokładamy wszelkich starań, aby zapewnić jak najwyższą zgodność.

## Wdrożenie za pomocą obrazu Docker

Ta metoda może być używana:

- lokalnie
- w usługach CI/CD (GitHub Actions, GitLab CI itp.)

### Wymagania wstępne:

W środowisku lokalnym:

- najnowszy Docker jest zainstalowany

### Uruchamianie

Po prostu uruchom następujące polecenie, aby pobrać najnowszy obraz:

```
docker run -p 3000:3000 -d jaktestowac/gad
```

lub konkretną wersję:

```
docker run -p 3000:3000 -d jaktestowac/gad:2.5.5
```

Aplikacja powinna działać pod adresem http://localhost:3000/

Obrazy są dostępne na:
[🐋 https://hub.docker.com/r/jaktestowac/gad](https://hub.docker.com/r/jaktestowac/gad)

## Wdrożenie na **Glitch**

> [!WARNING] > **⚠️ Ostrzeżenie: Ta metoda wdrażania jest przestarzała i nie jest już zalecana.**
>
> Glitch zmienił swoje [zasady platformy](https://blog.glitch.com/post/changes-are-coming-to-glitch/) i ta metoda wdrażania może już nie działać zgodnie z oczekiwaniami. Proszę użyć jednej z innych metod wdrażania.

~~Nie potrzeba konta - ale twój projekt zostanie usunięty za 5 dni.~~

~~Po kliknięciu przycisku poniżej poczekaj minutę lub dwie na zakończenie wdrożenia.~~

~~[![Remix on Glitch](https://cdn.glitch.me/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button-v2.svg)](https://glitch.com/edit/#!/import/github/jaktestowac/gad-gui-api-demo)~~

~~Aby zobaczyć stronę internetową:~~

~~- przejdź do dolnych przycisków~~
~~- kliknij `🔎PREVIEW`~~
~~- wybierz `👯Preview in a new window`~~

~~Podczas wdrażania aplikacji GAD na Glitch, należy pamiętać, że aplikacja może nie działać w pełni ze względu na ograniczenia platformy Glitch. Jednak dokładamy wszelkich starań, aby zapewnić jak najwyższą zgodność.~~

## Miłej automatyzacji!

Mamy nadzieję, że świetnie się bawisz testując i automatyzując tę aplikację!

Wyzwania i funkcje zawarte w niej zostały zaprojektowane, aby pomóc ci rozwijać umiejętności testowania, jednocześnie bawiąc się.

Jeśli masz jakieś pomysły na ulepszenia lub napotkasz jakieś problemy, nie wahaj się otworzyć zgłoszenia w naszym [repozytorium GitHub](https://github.com/jaktestowac/gad-gui-api-demo/issues).

Twoja opinia pomaga uczynić GAD lepszym dla wszystkich!

📢 Czekamy na twoje wkłady i miłego testowania!🦎

[🔝 Powrót do góry](#wprowadzenie)

## 📞 Kontakt i wsparcie

Zapraszamy do kontaktu:

- 🌐 **Strona internetowa**: [jaktestowac.pl](https://jaktestowac.pl)
- 💼 **LinkedIn**: [jaktestowac.pl](https://www.linkedin.com/company/jaktestowac/)
- 💬 **Discord**: [Polish Playwright Community](https://discord.gg/mUAqQ7FUaZ)
- 📧 **Wsparcie**: Sprawdź naszą stronę internetową, aby uzyskać dane kontaktowe
- 🐛 **Problemy**: [GitHub Issues](https://github.com/jaktestowac/playwright-tools/issues)

---

## Zasoby edukacyjne

Zebraliśmy kolekcję zasobów, które pomogą ci nauczyć się i opanować Playwright, zarówno po polsku, jak i po angielsku. Niezależnie od tego, czy jesteś początkującym, czy zaawansowanym użytkownikiem, te zasoby pomogą ci udoskonalić umiejętności i wiedzę.

## 🇵🇱 Polish Resources

- [TypeScript for Testers - Ekspresowe Wprowadzenie](https://jaktestowac.pl/tsx/) - Darmowy (4h+) kurs o TypeScript dla testerów
- [JavaScript and TypeScript for Testers](https://jaktestowac.pl/js-ts/) - Kompleksowy (13h+) kurs o JavaScript i TypeScript dla testerów, z praktycznymi przykładami i ćwiczeniami
- [Professional Test Automation with Playwright](https://jaktestowac.pl/playwright/) - Kompleksowy (100h+) kurs na temat Playwright, automatyzacji testów, CI/CD i architektury testów
- [Back-end Test Automation](https://jaktestowac.pl/api/) - Kompleksowy (45h+) kurs na temat automatyzacji testów back-endowych z Postman, Mocha, Chai i Supertest
- [Free Playwright Resources](https://jaktestowac.pl/darmowy-playwright/) - Kompleksowe i darmowe materiały edukacyjne po polsku
- [Playwright Basics](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cD2TCB__K7NP5XARaCzZYn7) - Seria YouTube
- [Playwright Elements](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cAcpd-XN4pKeo-l4YK35FDA) - Zaawansowane koncepcje
- [Playwright MCP](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cCqD34AG5YRejujaBqCBgl4) - Kurs o Playwright MCP i AI
- [Discord Community](https://discord.gg/mUAqQ7FUaZ) - Pierwsza polska społeczność Playwright
- [Playwright Info](https://playwright.info/) - Pierwszy i jedyny polski blog o Playwright

### AI_Testers

<div align="center">
<a href="https://aitesters.pl">
<img src="./assets/aitesters-header-photo.jpg" alt="AI Testers Logo" height="400"/>
</a>
</div>

Zdobądź przewagę łącząc wiedzę AI z najpopularniejszymi narzędziami na rynku IT.
Pokażemy Ci jak przyspieszyć z AI i zbudować profesjonalny framework do automatyzacji testów 😉

- [AI_Testers](https://aitesters.pl) - Strona o Programie AI_Testers
- [AI_Testers LinkedIn](https://www.linkedin.com/company/aitesters) - Nasz profil na LinkedIn

## 🇬🇧 English Resources

- [VS Code Extensions](https://marketplace.visualstudio.com/publishers/jaktestowac-pl) - Nasze darmowe wtyczki Playwright do VS Code

_PS. Aby uzyskać więcej zasobów i aktualizacji, śledź nas na naszej [stronie internetowej](https://jaktestowac.pl) i [GitHub](https://github.com/jaktestowac)._

---

Powered by **[jaktestowac.pl](https://www.jaktestowac.pl) team!** 💚❤️
