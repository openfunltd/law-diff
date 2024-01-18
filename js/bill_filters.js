function updateFilters(inputEle) {
  const [filterType, target] = inputEle.id.split('-');
  const filterInputs = document.getElementsByClassName('filter-option');
  const checkedInputs = Array.from(filterInputs).filter((ele) => ele.checked);
  const filteredBills = filterBills(checkedInputs);
}

function filterBills(checkedInputs) {
  let sessionPeriodFilters = [];
  let lawFilters = [];
  let billProgressFilters = [];
  let proposerFilters = [];
  for (const checkedInput of checkedInputs) {
    const [filterType, target] = checkedInput.id.split('-');
    switch (filterType) {
      case "sessionPeriod":
        sessionPeriodFilters.push(parseInt(target));
        break;
      case "law":
        lawFilters.push(target);
        break;
      case "billProgress":
        billProgressFilters.push(target);
        break;
      case "proposer":
        proposerFilters.push(target);
        break;
    }
  }
  let filteredBills = allBills;
  if (sessionPeriodFilters.length) {
    filteredBills = filteredBills.filter((bill) => sessionPeriodFilters.includes(bill.sessionPeriod))
  }
  if (lawFilters.length) {
    filteredBills = filteredBills.filter((bill) => lawFilters.some((law) => bill.laws.includes(law)))
  }
  if (billProgressFilters.length) {
    filteredBills = filteredBills.filter((bill) => billProgressFilters.includes(bill.billProgress))
  }
  if (proposerFilters.length) {
    filteredBills = filteredBills.filter((bill) => {
      proposerFilters.some((proposer) => {
        bill.proposers.includes(proposer)
      })
    });
  }
  return filteredBills;
}

function setAllBills(bill) {
  let payload = {};
  payload.billNo = bill.billNo;
  payload.sessionPeriod = bill.會期;
  payload.laws = bill.laws;
  payload.billProgress = bill.議案狀態;
  payload.proposers = bill.提案人;
  allBills.push(payload);
}
