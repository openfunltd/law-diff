renderData();

async function renderData(){
  const billResponse = await fetch("https://ly.govapi.tw/bill/20委10033531");
  //const billResponse = await fetch("https://ly.govapi.tw/bill/20政10034320");
  const billData = await billResponse.json();
    
  let billName = billData.議案名稱;
  if (billName.substring(0, 2) === "廢止") {
    billName = billName.split("，")[0];
    billName = billName.replace(/[「」]/g, '');
  } else {
    const startIdx = billName.indexOf("「");
    const endIdx = billName.indexOf("」");
    billName = billName.substring(startIdx + 1, endIdx);
  }
  const reason = (billData.案由 != undefined) ? billData.案由 : "無資料";
  const theFirst = (billData.提案人 != undefined) ? billData.提案人[0] : "無資料";
  const sessionPeriod = billData.屆期;
  const legislatorResponse = await fetch(`https://ly.govapi.tw/legislator/${sessionPeriod}?limit=200`)
  const legislatorData = await legislatorResponse.json(); 
  const [partyTheFirst, picUrlTheFirst] = getLegislatorData(theFirst, legislatorData);
  document.getElementById('billName').innerText = billName;
  document.getElementById('reason').innerText = reason;
  document.getElementById('text-theFirst').innerText = theFirst;
  document.getElementById('party-theFirst').classList.add('party--1');
  const imgTheFirst = document.getElementById('img-theFirst');
  imgTheFirst.src = picUrlTheFirst;
  imgTheFirst.alt = theFirst;
}

function getLegislatorData(name, legislatorData){
  const legislators = legislatorData.legislators.filter((legislator) => legislator.name === name);
  if (legislators.length === 1){
    const picUrl = legislators[0].picUrl.replace("http://", "https://");
    return [legislators[0].party, picUrl];
  }
  return ["", ""];
}
