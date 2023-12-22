renderData();

async function renderData() {
  const GET_query = document.location.search.match(/q=([^&]*)/);
  let query = (GET_query) ? GET_billNo[1] : "";
  query = encodeURIComponent(query);
  if (query === "") { return; }

  //Lookup law id by query (only root law for now)
  const lawResponse = await fetch(`https://ly.govapi.tw/law?type=母法&q=${query}`);
  const lawData = await lawResponse.json();
  //Lookup bills for each law-id (only top 10 result and propose by legislator for now)
  //Combine each bills result
  //Order final result by last_time

}
