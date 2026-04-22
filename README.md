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
  
## *Final milestone*
### *Podejmowanie decyzji oparte na kilku drzewach decyzyjnych:*
* W przypadku wykrycia zagrożenia bot podejmuje decyzję o walce lub ucieczce w zależności od poziomu życia.
* Jeśli jest noc, idzie spać lub szuka schronienia (np. zakopuje się w ziemi).
* W przypadku głodu bot szuka jedzenia, a po zdobyciu mięsa piecze w piecu.
* Gdy nie występuje zagrożenie, głód ani noc, bot zdobywa doświadczenie poprzez eksplorację i zbieranie surowców.
* Bot wyszukuje i wykorzystuje odpowiednie narzędzia do niszczenia bloków, dobierając je w zależności od rodzaju wykonywanej akcji.
* Jeśli bot napotka wodę, próbuje ją przepłynąć, a jeśli nie jest to możliwe -> tworzy łódkę.
* W przypadku napotkania lawy bot wybiera alternatywną trasę, a jeśli nie ma innej możliwości, buduje przejście poprzez dodawanie bloków.

#### Drzewa decyzyjne bota:

**1. Zagrożenie**

Czy wykryto zagrożenie?
* TAK -> Czy poziom życia jest niski?
  * TAK -> Ucieczka
  * NIE -> Walka
* NIE -> przejdź dalej

**2. Noc**

Czy jest noc?
* TAK -> Czy w pobliżu jest łóżko?
  * TAK -> Idź spać
  * NIE -> Czy bot ma surowce na łóżko?
    * TAK -> Craftuj łóżko → Idź spać
    * NIE -> Szukaj schronienia (np. zakop się)
* NIE -> przejdź dalej

**3. Głód**

Czy bot jest głodny?
* TAK -> Szukaj jedzenia
  * Czy zdobyto mięso?
    * TAK -> Podgrzej w piecu → Zjedz
    * NIE -> Zjedz dostępne jedzenie
* NIE -> przejdź dalej

**4. Brak zagrożeń / potrzeb**

Czy brak zagrożenia, głodu i nocy?
  * TAK -> Eksploracja i zbieranie surowców (zdobywanie XP)

**5. Narzędzia**

Czy potrzebne jest niszczenie bloków?
* TAK -> Dobierz odpowiednie narzędzie do typu bloku
* NIE -> pomiń

**6. Woda**

Czy na drodze jest woda?
* TAK → Czy można ją przepłynąć?
  * TAK → Przepłyń
  * NIE → Craftuj łódkę -> Przepłyń
* NIE → przejdź dalej

**7. Lawa**

Czy na drodze jest lawa?
* TAK -> Czy istnieje alternatywna trasa?
  * TAK -> Wybierz inną drogę
  * NIE -> Buduj przejście (dodawaj bloki)
* NIE -> kontynuuj eksplorację
