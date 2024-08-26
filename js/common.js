import Diff from './text_diff.js'

const { ref, computed, createApp, onMounted } = Vue

const common = {
  setup () {
    // ---------- 共用 ----------
    // 是否顯示rwd menu
    const rwdMenuVisible = ref(false)

    // ---------- 搜尋頁 ----------
    // 小畫面模式是否顯示二次篩選條件
    const rwdFilterOptionsVisible = ref(false)

    // ---------- 議案頁 ----------
    // 議案頁的兩個對照版本 0為現行條文 -1為通過條文 其他請參考網頁中的versions
    const billViewing = ref('comparation') // 預設顯示法案對照表

    const selectedVersions = ref(checkedBills())

    // 議案頁版本修改者與修改內容
    const billVersions = ref([])
    const billsData = ref([])

    const loadComparationData = async () => {
      const [versions, bills] = await getComparationData();
      try {
        if (versions) {
          billVersions.value = versions
        }
        if (bills && bills.length) {
          billsData.value = bills
        }
      } catch {}
    }
    onMounted(loadComparationData);

    // 改成依照目前選的版本，取得有修改的聯集的條文
    const allAvailableSections = computed (() => {
      let result = []
     
      // update url
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      // add checked bills to url
      urlParams.delete('checked');
      const billNo = urlParams.get('billNo');
      if (selectedVersions.value.length == 0) {
      } else if (selectedVersions.value.length == 1 && selectedVersions.value[0] === billNo) {
      } else {
        urlParams.append('checked', selectedVersions.value.join(','));
      }
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.pushState({}, '', newUrl);
      

      billsData.value.map((item, idx) => {
        return selectedVersions.value.filter((it, i) => {
          if ('undefined' === typeof(item.versions[it])) {
            return false
          }
          return item.versions[it].content !== null
        }).length
      }).forEach((item, idx) => {
        // 交集
        // if (item === selectedVersions.value.length) {
        //   result.push(idx)
        // }
        // 聯集
        if (item) {
          result.push(idx)
        }
      })

      if (!result.length) {
        result = billsData.value.map((item, idx) => idx)
      }

      // 重新整理 selectedSections，若有不存在 allAvailableSections 的 Section 須移除
      // selectedSections.value = selectedSections.value.filter(item => result.includes(item))

      return result
    })

    // const selectedSections = ref([])

    function compareDiff (content1, content2) {
      const diff = new Diff()

      if (content1) {
        const textDiff = diff.main(content1, content2)
        return diff.prettyHtml(textDiff)
      } else {
        return content2
      }
    }

    async function getBillByNo ({ target, target: { value } }, billNo) {
      // value 是使用者輸入的文字
      console.log(value, billNo)

      if (!value) {
        return
      }

      try {
        // 這邊需要做一隻 API，到時可能需要帶入目前頁面的法案編號，與使用者查詢的提案編號。
        // 以下因為只是範例，網址就以 sample_bill_api 帶過
        const result = await fetch('/sample_bill_api')
        // 當正式串接時應該會類似長這樣
        // const result = await fetch(`/sample_bill_api/${billNo}/value`)
        const data = await result.json()
        // API須回應包含新提案資料的json
        // 格式：{ versions: [格式與html中的versions相同], bills: [格式與html中的bills相同] }

        // 接下來更新
        billVersions.value = data.versions
        billsData.value = data.bills
        // 清空輸入欄位
        target.value = ''
      } catch (err) {
        // if find no bill
        alert('提案編號是不同法律')
        // or not the same law
        // alert('查無提案')
      }
    }

    onMounted(() => {
      let pointerX, pointerY = null
      let allowToggleBillReason = false

      document.addEventListener('click', (event) => {
        if (event.target.classList.contains('bill-reason') && allowToggleBillReason) {
          event.target.classList.toggle('show-all')
        }
      })

      function checkMouseMove (event) {
        const xdiff = pointerX - event.screenX
        const ydiff = pointerY - event.screenY
        const length = Math.sqrt(xdiff * xdiff + ydiff * ydiff)

        if (length > 4) {
          document.removeEventListener('mousemove', checkMouseMove)
          allowToggleBillReason = false
        }
      }

      document.addEventListener('mousedown', (event) => {
        if (event.target.classList.contains('bill-reason')) {
          allowToggleBillReason = true
          pointerX = event.screenX
          pointerY = event.screenY
          document.addEventListener('mousemove', checkMouseMove)
        }
      })

      document.addEventListener('mouseup', (event) => {
        document.removeEventListener('mousemove', checkMouseMove)
      })
    })


    return {
      rwdMenuVisible,
      rwdFilterOptionsVisible,

      billViewing,
      billVersions,
      billsData,
      selectedVersions,
      allAvailableSections,
      // selectedSections,

      compareDiff,
      getBillByNo
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(common)
  app.mount('._congress')
})

function checkedBills() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const hasChecked = urlParams.has('checked');
  if (hasChecked) {
    const checked = urlParams.get('checked');
    const checkedArray = checked ? checked.split(',') : [];
    return checkedArray;
  }
  const billNo = urlParams.get('billNo');
  return [billNo];
}
