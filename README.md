# Wyszukiwarka klauzul niedozwolonych z rejestru UOKiK

Klauzule niedozwolone na stronie uokiku - rejestr.uokik.gov.pl - są dość trudne do przeszukiwania. Wyszukiwarka działa wolno, oraz ma bardzo dużo opcji, które przytłaczają użytkownika.

Projekt ma na celu ułatwienie przeszukiwania klauzul przez:
- Szybką informację zwrotną z wynikami do wyszukiwanej frazy lub zdania
- Wyszczególnienie treści (wzorca) klauzuli niedozwolonej a zmniejszenie innych danych
- Pozwolenie na wyszukiwanie w ramach karty przeglądarki bez niepotrzebnych żądań do serwera. Rejestr jest mały - 3,5 MB - i publiczny więc dostarczenie go do przeglądarki w całości przyspieszy proces i pozwoli przeszukiwać online

Dodatkowo projekt powstał w celu poćwiczenia pracy z wyszukiwarkami "Full-text".

<img width="600" src="https://user-images.githubusercontent.com/25948390/204420393-e70df196-f8aa-4668-bd8b-4452733a17d5.png">
<img width="600" src="https://user-images.githubusercontent.com/25948390/204420412-89581c7c-02f5-475c-8e83-a6bd92108f0c.png">

## Instrukcja odpalenia projektu

1. Zainstaluj zależności za pomocą yarn, node 16+
```
yarn 
```

2. Uruchom serwer deweloperski (Vite) za pomocą:
```
yarn dev
```

3. Przejdź na podany, w odpowiedzi, adres aby przeglądać i modyfikować stronę.

## Motywacja

UOKiK udostępnia rejestr klauzul niedozwolonych, wraz z wyszukiwarką na swojej stronie internetowej. Jednakże interfejs wyszukiwarki i tego rejestru powstał już wiele lat temu i nie był zoptamalizowany pod korzystanie przez "przeciętnych obywateli". 

Sam rejestr nie jest dość duży, gdyż pobierając ze strony rejestr w formacie CSV mamy plik ok 3,1 MB, co po skompresowaniu gzip zajmuje tylko ok 770 kB. To są wielkości, które można bez wątpienia i bez obawy przesyłać przeglądarkom.

Celem mojego projektu jest stworzenie nowej, przyjaźniejszej wyszukiwarki do klauzul, która zamiast skupiania się na różnych polach, daje jedno pole - omnibox - służące do przeszukania naraz całego rejestru.

W tym celu wymagane jest zastososwanie Full-Text Search na rejestrze.

Są dwie możliwości:

1. Użycie serwera, który po zingestowaniu i zindeksowaniu dokumentów jakimi byłyby kolejne klauzule w pliku CSV zwracałby wyniki
2. Zbudowanie indeksu za wczasu (rejestr jest rzadko aktualizowany) i przesłanie wszystkich danych do przeglądarki i implementacja całej wyszukiwarki po stronie klienta.

Przewagą opcji 2 nad opcją 1 jest prawdodpodobnie:

* szybsze działania - brak potrzeby dodatkowych żądań sieciowych
* tańsze utrzymanie - brak potrzeby utrzymania serwera z wyszukiwarką

Warto zauważyć, że jest to możliwe głównie dzięki tak małemu "korpusowi" jakim jest rejestr, zawiera on na tyle mało rekordów, że przesłanie go do przeglądarki przy załadowaniu strony może być równaważne z ładowaniem przez większe strony z wiadomościami paru obrazków więc jest w pełni akceptowalnym działaniem i czasem ładowania przez użytkownika.

Do zaimplementowania wersji drugiej przydatna będzie biblioteka do FTS po stronie klienta - rozważane:

* FlexSearch - https://www.npmjs.com/package/flexsearch
    
    Brak wsparcia dla ESM, sporo otwartych issue z bugami i PR-ów, które są długo nieprzeglądane przez maintainera. Między innymi ogarnięcie kodu aby był czytelny.

* minisearch - https://www.npmjs.com/package/minisearch
    
    Wybór do wdrożenia pierwszej wersji pada na niego. 
    Przewagą jest szybkość, obsługa ESM, możliwośc łatwego importu i eksportu indeksu, bardzo sensowne domyślne ustawienia dla relevance scoringu itd.
    Projekt wydaje się być w dobrym stanie, mając jedynie 1 issue otwarty i 112 zamkniętych w momencie pisania tego.
    Minusami jest brak wbudowanego stemming i lemmetyzacji dla języka polskiego co jest wytłumaczalne wspieraniem fuzzysearchu - https://github.com/lucaong/minisearch/issues/113

* search-index - https://www.npmjs.com/package/search-index
    
    Wydaje się bardzo podstawowy we wspieranych funkcjach. Wydaje się niewspierany.

* lunr - https://www.npmjs.com/package/lunr

    Z opisu ma być podobny do Solr.
    Ma otwarte 89 issues i 29 PR, ostatni commit ponad 2 lata temu. 
    Prawdopodobnie wymaga sporo konfiguracji aby osiągnąc podobne rezultaty wykonywane przez np. minisearch. Co prawda projekt ma wsparcie dla stop words, stemmingu i lemmetyzacji to nie wśród wspieranych języków nie ma polskiego.

* elasticlunr - https://www.npmjs.com/package/elasticlunr

    Podobny do Lunr.js (chyba jest forkiem)

Powyższa lista to znalezione zależności na podstawie wyszukania "full text search" w rejestrze NPM i skupieniu się na tych wspominających "browser".


### Kroki

1. Pobranie CSV z rejestrem
2. Przekonwertowanie encodingu Windows-1250 na utf-8 (https://github.com/nijel/enca lub iconv(1))
    
    ```
    enca -L polish src/uokik-rejestr-klauzul-niedozwolonych-automat.csv -x utf8
    ```
    albo
    ```
    iconv -f windows-1250 -t utf-8 src/uokik-rejestr-klauzul-niedozwolonych-automat.csv 
    ```

3. Konwersja z CSV na JSON za pomocą `csv-parser`.

    ```
    node --loader ts-node/esm src/convert.ts src/uokik-rejestr-klauzul-niedozwolonych-automat.csv src/klauzule.json
    ```

4. Teraz należy te klauzule zindeksować oraz ten indeks, albo dane źródłowe wysłać do przeglądarki aby móc je wyszukiwać.


Stworzenie wygenerowanego indeksu do wyszukiwania:
`node --loader ts-node/esm src/search-index.ts > /dev/null`  

czas: 3,67s user 0,20s system 160% cpu 2,411 total

Sprawdzanie rozmiaru (`ls -lh`) + rozmiar gzip (`gzip -9 -c src/klauzule.json | wc -c | gnumfmt --to=iec-i --suffix=B --padding=10`):

Rozmiar CSV: 3,8 MB     gzip: 777 kB

Rozmiar JSON: 4,8 MB    gzip: 829 kB

JSON.stringify(miniSearch): 6,8 MB    gzip: 1,5 MB


**Potencjalne rozwiązania:**

- Pobieranie JSON z dokumentami i indeksowanie (`miniSearch.addAll()`) po stronie klienta
- Pobieranie gotowego indeksu (większy) i możliwość natychmiastowego wyszukiwania.

Należy sprawdzić jak długo zajmuje `addAll` na wolnych procesorach, szczególnie telefonach.


## TODO

- Użycie stemming i lemmetyzacji zamiast fuzzy
- Sugestie za pomocą `autoSuggest`
- Natychmiastowe wyszukiwanie bez czekania na debounce w przypadku kliknięcia enter
- Permalink do wyników wyszukiwania (w query parametrach)
- Permalinki do konkretnych klauzul
- Linkowanie do wyroków lub konkretnych klauzul na stronie uokiku.
- Dokonywanie wyszukiwań w Web Workerze
- Dodanie Service Workera aby wyszukiwarka była dostępna offline i zarządzała cachem dla pobranego rejestru.
- Automatyczna aktualizacja klauzul - GitHub action na sprawdzanie i porównywanie czy csv udostępniony na stronie https://rejestr.uokik.gov.pl/csv-archive/uokik-rejestr-klauzul-niedozwolonych-automat.csv różni się od wersji w repozytorium.
- Testy automatyczne

