# Minecraft-bot

## Opis
Implementacja autonomicznego bota w grze Minecraft z wykorzystaniem algorytmów podejmowania decyzji i wyszukiwania ścieżki.
Projekt miałby na celu stworzenie bota, który samodzielnie porusza się po świecie, podejmuje decyzje i wykonuje zadania (np. zbieranie surowców, unikanie zagrożeń).

---

[How to run the project](./How_to_run.md)

## Autorki
* Izabela Kalenik
* Magdalena Szeląg
* Małgorzata Sielska

## Plan projektu
### *do 21 kwietnia*
* Konfiguracja środowiska i uruchomienie Mineflayer
* Połączenie bota z serwerem
* Podstawowe sterowanie: ruch, obrót, skok
* Implementacja poruszania się do wskazanego punktu
* Wstępna implementacja algorytmu A* do planowania trasy (omijanie przeszkód itp.)

### *do 21 maja*
* Interakcje ze światem: kopanie bloków, zbieranie zasobów
* Integracja ruchu z akcjami (np. idź i kop)
* Rozwinięcie systemu decyzyjnego: <br>
  a) reakcje (zagrożenie -> ucieczka, brak zasobów -> zbieranie) <br>
  b) łączenie akcji w sekwencje (np. znajdź drzewo → podejdź → zetnij)

### *do 16 czerwca*
* Pełna integracja systemu (ruch + decyzje + akcje)
* Testy końcowe i poprawa błędów
* Przygotowanie demonstracji projektu
