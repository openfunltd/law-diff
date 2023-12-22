renderData();

async function renderData() {
  const GET_query = document.location.search.match(/q=([^&]*)/);
  let query = (GET_query) ? GET_query[1] : "";
  query = decodeURIComponent(encodeURIComponent(query));
  if (query === "") { return; }

  //Lookup law id by query (only root law for now)
  const lawResponse = await fetch(`https://ly.govapi.tw/law?type=母法&q=${query}`);
  const lawData = await lawResponse.json();
  if (lawData.total.value === 0) { return; }

  //Lookup bills for each law-id (only top 10 result and propose by legislator for now)
  let bills = [];
  for (law of lawData.laws) {
    const query_url = "https://ly.govapi.tw/bill" +
                      "?proposal_type=委員提案" +
                      "&field=議案流程&field=提案人&field=last_time&limit=10" +
                      `&law=${law.id}`;
    const billResponse = await fetch(query_url);
    const billsData = await billResponse.json();
    bills.push(...billsData.bills);
  }

  //Order final result by last_time
  bills.sort(compareDate);

}

function compareDate(billA, billB) {
  return (billA.last_time < billB.last_time) ? 1 : -1;
}
