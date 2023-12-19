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

  let nonFirsts = [];
  if (billData.提案人 != undefined && billData.提案人.length > 1) {
    nonFirsts = billData.提案人.slice(1);
  }

  const mainDiv = document.querySelector('.main');
  mainDivObserver = new MutationObserver(() => renderLegislatorsSection(nonFirsts, legislatorData));
  mainDivObserver.observe(mainDiv, {childList: true});
}

function getLegislatorData(name, legislatorData) {
  const legislators = legislatorData.legislators.filter((legislator) => legislator.name === name);
  if (legislators.length === 1){
    const picUrl = legislators[0].picUrl.replace("http://", "https://");
    return [legislators[0].party, picUrl];
  }
  return ["", ""];
}

function renderLegislatorsSection(nonFirsts, legislatorData) {
  const nonFirstsDiv = document.getElementById('nonFirsts');
  if (nonFirstsDiv === null || nonFirsts.length === 0) { return; }
  for (const nonFirst of nonFirsts) {
    const legislators = legislatorData.legislators.filter((legislator) => legislator.name === nonFirst);
    let picUrl = "";
    let party = "";
    if (legislators.length === 1) {
      picUrl = legislators[0].picUrl.replace("http://", "https://");
      party = legislators[0].party;
    }
    nonFirstsDiv.appendChild(buildlegislatorDiv("nonFirst", nonFirst, party, picUrl));
  }
}

function buildlegislatorDiv(listName, name, party, picUrl) {
  const legislatorDiv = document.createElement('div');
  if (listName === "nonFirst") {
    legislatorDiv.className = 'legislator';
  } else if (listName === "cosign") {
    legislatorDiv.className = 'legislator legislator--sm';
  }
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'avatar';
  const partySpan = document.createElement('span');
  partySpan.className = 'party party--0';
  const img = document.createElement('img');
  img.src = picUrl;
  img.alt = name;
  const nameDiv = document.createElement('div');
  nameDiv.textContent = name;

  avatarDiv.appendChild(partySpan);
  avatarDiv.appendChild(img);
  legislatorDiv.appendChild(avatarDiv);
  legislatorDiv.appendChild(nameDiv);

  return legislatorDiv;
}
