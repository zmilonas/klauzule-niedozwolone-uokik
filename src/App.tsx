import React from 'react';
import MiniSearch, { SearchResult } from 'minisearch';
import klauzule from './klauzule.json';
import { csvColumns } from './config';
import { useDebounce } from 'use-debounce';
import classnames from 'classnames';

export default function App() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [searched] = useDebounce(searchTerm, 500);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  React.useEffect(() => {
    // @ts-expect-error
    if (typeof window.miniSearch !== 'undefined' && window.miniSearch._documentCount > 0) {
      return;
    }
    let miniSearch = new MiniSearch({
      fields: ['wzorzec'],
      storeFields: Object.values(csvColumns)
    })
    // @ts-expect-error
    miniSearch.addAll(klauzule)
    // @ts-expect-error
    window.miniSearch = window.miniSearch || miniSearch;
    console.log(miniSearch)
  }, [])

 
 React.useEffect(() => {
    // @ts-expect-error
    if (typeof window.miniSearch === 'undefined') {
      return;
    }
    // @ts-expect-error
    setSearchResults(window.miniSearch.search(searched, { fuzzy: 0.2 }));
  }, [searched]); 

 const expanded = searched.length === 0;

  return (
    <div className="p-4 md:max-w-4xl m-auto">
      <h1 className={classnames("text-2xl mb-4")}>Wyszukiwarka klauzul niedozwolonych</h1>
      <p className={classnames("my-8 prose lg:prose-xl", { "hidden": !expanded })}>Wyszukaj wśród wszystkich klauzul, które zebrał UOKiK w ramach swojego rejestru klauzul niedozwolonych. To ten sam który dostępny jest pod <a href="https://rejestr.uokik.gov.pl/" rel="noopener" target="_blank" className="text-blue-500">rejestr.uokik.gov.pl</a> lecz z interfejsem skupionym na wyszukiwaniu treści tych klauzul (wzorców).</p>
      <div>
        <input type="text" className="w-full" onChange={handleChange} placeholder="wpisz wyszukiwaną frazę lub zdanie np. 'waluty na rynku' albo 'rękojmia'"/> 
      </div>
      <article className="prose lg:prose-lg">
        {searched.length > 0 && <div className="text-gray-500">Wyników: {searchResults.length}</div>}
        {searchResults.map(result => 
          <div className="mb-2 border px-4" key={result.id}>
          <p className="text-gray-500">{result.powod} &rarr; {result.pozwani}</p>
          <blockquote dangerouslySetInnerHTML={{ __html: result.wzorzec}} />
          <p className="text-gray-500">{result.sygnatura}, {result.data_wyroku}, {result.sad}</p>
          </div>
        )
      }
      </article>
    </div>
  );
}