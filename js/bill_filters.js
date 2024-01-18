function updateFilters(inputEle) {
  const [filterType, target] = inputEle.id.split('-');
  const filterInputs = document.getElementsByClassName('filter-option');
  const checkedInputs = Array.from(filterInputs).filter((ele) => ele.checked);
  const filteredBills = filterBills(checkedInputs);
  const optionsCount = countBillFieldValues(filteredBills, filterType);
}

function countBillFieldValues(filteredBills, filterType) {
  const fields = ['sessionPeriod', 'law', 'billProgress', 'proposer'];
  const optionsCount = {};
  for (const field of fields) {
    for (const bill of filteredBills) {
      let values = [];
      switch (field) {
        case "sessionPeriod":
          values.push(bill.sessionPeriod);
          break;
        case "law":
          values = bill.laws;
          break;
        case "billProgress":
          values.push(bill.billProgress);
          break;
        case "proposer":
          values = bill.proposers;
          break;
      }
      for (const value of values) {
        filterID = `${field}-${value}`;
        if (optionsCount.hasOwnProperty(filterID)) {
          optionsCount[filterID] += 1;
          continue;
        }
        optionsCount[filterID] = 1;
      }
    }
  }
  return optionsCount;
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
