import Diff from '/js/text_diff.js'

const { ref, computed, createApp, onMounted } = Vue

const common = {
  setup () {
    // 是否顯示rwd menu
    const rwdMenuVisible = ref(false)

    // 搜尋頁是否顯示進階搜尋
    const advancedSearchVisible = ref(false)

    // 議案頁的兩個對照版本 0為現行條文 -1為通過條文 其他請參考網頁中的versions
    const compareFrom = ref(0)
    const compareBy = ref(-1)

    // 議案頁版本修改者與修改內容
    const billVersions = ref([])
    const billsData = ref([])

    try {
      if (versions && versions.length) {
        billVersions.value = versions.slice(1, versions.length)
      }
      if (bills && bills.length) {
        billsData.value = bills
      }
    } catch {}

    // 產生比較法條列表
    const filterBills = computed(() => {
      if (!billVersions.value.length || !billsData.value.length) {
        return
      }

      const result = []

      // 一條一條找有from（比較欄位左邊）與有by（比較欄位右邊）的資料
      billsData.value.forEach(billsSet => {
        const row = {
          from: null,
          by: null
        }

        const isNew = !billsSet[0].content

        // 找左欄資料
        if (billsSet[compareFrom.value].content) {
          row.from = {
            name: versions[compareFrom.value],
            nowRule: compareFrom.value === 0,
            new: isNew,
            ...billsSet[compareFrom.value]
          }
        }

        // 找右欄資料 當compareBy.value === -1時，要找審過(passed)的資料
        if (compareBy.value === -1) {
          const idx = billsSet.findIndex(bill => bill.passed)
          row.by = idx > -1
            ? {
              name: versions[idx],
              nowRule: false,
              new: isNew,
              ...billsSet[idx]
            }
            : null
        } else if (billsSet[compareBy.value]?.content) {
          row.by = {
            name: versions[compareBy.value],
            nowRule: false,
            new: isNew,
            ...billsSet[compareBy.value]
          }
        }

        // 如果兩欄都有資料，製作diff顯示，只需要跟現行條文比較，不用做委員與委員之間的比較
        // 只有其中一欄有資料的話，只要把\n轉br即可

        // 現行條文
        const nowBill = billsSet[0].content || ''
        const diff = new Diff()
        let textDiff

        if (row.from) {
          textDiff = diff.main(nowBill, row.from.content)
          row.from.htmlContent = diff.prettyHtml(textDiff)
          // row.from.htmlContent = row.from.content.replace(/\n/g, '<br>')
        }

        if (row.by) {
          // row.by.htmlContent = '<ins>' + row.by.content.replace(/\n/g, '<br>') + '</ins>'
          textDiff = diff.main(nowBill, row.by.content)
          row.by.htmlContent = diff.prettyHtml(textDiff)
        }

        result.push(row)
      })

      return result
    })

    return {
      rwdMenuVisible,
      advancedSearchVisible,
      compareFrom,
      compareBy,
      billVersions,
      billsData,
      filterBills
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(common)
  app.mount('._congress')
})