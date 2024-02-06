# Wyszukiwarka klauzul niedozwolonych z rejestru UOKiK

Klauzule niedozwolone na stronie uokiku - rejestr.uokik.gov.pl - są dość trudne do przeszukiwania. Wyszukiwarka działa wolno, oraz ma bardzo dużo opcji, które przytłaczają użytkownika.

Projekt ma na celu ułatwienie przeszukiwania klauzul przez:
- Szybką informację zwrotną z wynikami do wyszukiwanej frazy lub zdania
- Wyszczególnienie treści (wzorca) klauzuli niedozwolonej a zmniejszenie innych danych
- Pozwolenie na wyszukiwanie w ramach karty przeglądarki bez niepotrzebnych żądań do serwera. Rejestr jest mały - 3,5 MB (~750 kB gzip) - i publiczny więc dostarczenie go do przeglądarki w całości przyspieszy proces i pozwoli przeszukiwać online

Dodatkowo projekt powstał w celu poćwiczenia pracy z wyszukiwarkami "Full-text".

Zbudowaną wersję tego projektu można podejrzeć pod: https://klauzule-uokik.pages.dev/

<p><img width="49%" src="https://user-images.githubusercontent.com/25948390/204420393-e70df196-f8aa-4668-bd8b-4452733a17d5.png"><img width="49%"  src="https://user-images.githubusercontent.com/25948390/204420412-89581c7c-02f5-475c-8e83-a6bd92108f0c.png"></p>

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
```
localhost:5173
```

### Budowanie projektu

```
yarn build
```

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


## Przygotowanie danych

Spróbuj najpierw skryptem `yarn update-csv`

1. Pobranie CSV z rejestrem, z https://rejestr.uokik.gov.pl/csv-archive/uokik-rejestr-klauzul-niedozwolonych-automat.csv

    ```
    wget https://rejestr.uokik.gov.pl/csv-archive/uokik-rejestr-klauzul-niedozwolonych-automat.csv
    ```

2. Przekonwertowanie encodingu Windows-1250 na utf-8 (https://github.com/nijel/enca lub iconv(1))
    
    ```
    enca -L polish data/uokik-rejestr-klauzul-niedozwolonych-automat.csv -x utf8
    ```
    albo
    ```
    iconv -f windows-1250 -t utf-8 data/uokik-rejestr-klauzul-niedozwolonych-automat.csv > data/uokik.rejestr-klauzul-niedozwolonych-automat.csv
    ```

3. Konwersja z CSV na JSON za pomocą `csv-parser`.

    ```
    tsx data/convert.ts data/uokik-rejestr-klauzul-niedozwolonych-automat.csv data/klauzule.json
    ```

4. Teraz można te klauzule wykorzystać jako zbiór dokumentów dla `miniSearch`.

5. (opcjonalne) Stworzenie indeksu (zależnie od obranej strategii przesyłania:
`node --loader ts-node/esm data/search-index.ts > /dev/null`, czas wykonania: 3,67s user 0,20s system 160% cpu 2,411 total

### Porównanie metod przesłania danych do przeglądarki

Z racji rzadkiej aktualizacji indeksu można część pracy wykonywanej przez przeglądarkę - a szczególnie indeksowanie - zrobić za wczasu przy budowaniu projektu. Jednak zbudowany indeks może byc większy niż skompresowany zbiór dokumentów do zindeksowania. 

**Potencjalne rozwiązania:**

- Pobieranie JSON/csv z dokumentami i indeksowanie (`miniSearch.addAll()`) po stronie klienta
- Pobieranie gotowego indeksu (większy) i możliwość natychmiastowego wyszukiwania.

Aby móc porównać te rozwiązania należy sprawdzić wielkość plików (wykorzystywany transfer) i porównać z czasem ładowania się strony aż do pokazania pierwszego wyniku - _To jeszcze nie jest robione_.

Sprawdzanie rozmiaru (`du -h`) i rozmiaru gzip (`gzip -9 -c data/klauzule.json | wc -c | gnumfmt --to=iec-i --suffix=B --padding=10`):

| Format danych | `du -h` | `gzip -9 ...` |
| -- | -- | -- |
| CSV | 3,8 MB | 777 kB |
| JSON | 4,8 MB | 829 kB |
| JSON.stringify(miniSearch) | 6,8 MB | 1,5 MB |

Należy sprawdzić jak długo zajmuje `addAll` na wolnych procesorach, szczególnie telefonach.

_Ta sekcja dokumentacji jest jeszcze rozwijana w ramach rozwoju projektu_

## TODO

- [ ] Sugestie za pomocą `autoSuggest`
- [x] ~Natychmiastowe wyszukiwanie bez czekania na debounce w przypadku kliknięcia enter~
- [ ] Permalink do wyników wyszukiwania (w query parametrach)
- [ ] Permalinki do konkretnych klauzul
- [ ] Linkowanie do wyroków lub konkretnych klauzul na stronie uokiku.
- [ ] Dokonywanie wyszukiwań w Web Workerze.
- [ ] Dodanie Service Workera aby wyszukiwarka była dostępna offline i zarządzała cachem dla pobranego rejestru.
- [ ] Automatyczna aktualizacja klauzul - GitHub action na sprawdzanie i porównywanie czy csv ze strony UOKiK różni się od wersji w repozytorium a potem pobieranie i przygotowywanie go - cache buster z datą aktualizacji.
- [ ] Użycie stemming i lemmetyzacji zamiast fuzzy - morfeusz2
- [ ] Testy automatyczne - cypress albo react-testing library
- [ ] Użycie web-vitals aby na bieżąco porównywać wielkość pobieranej paczki i zachowanie cache

