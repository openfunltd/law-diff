import Diff from '/js/text_diff.js'

const { ref, computed, createApp, onMounted } = Vue

const common = {
  setup () {
    // ---------- 共用 ----------
    // 是否顯示rwd menu
    const rwdMenuVisible = ref(false)

    // ---------- 搜尋頁 ----------
    // 搜尋頁是否顯示進階搜尋
    const advancedSearchVisible = ref(false)
    const searchConditions = ref([
      {
        title: '法律名稱關鍵字',
        value: 'law_name'
      },
      {
        title: '依照屆期會期搜尋',
        value: 'period'
      },
      {
        title: '依提案人名稱',
        value: 'legislator'
      },
      {
        title: '依立法進度搜尋',
        value: 'progress'
      }
    ])
    const searchBy = ref({})
    searchBy.value = searchConditions.value[0]

    const rwdFilterOptionsVisible = ref(false)

    // ---------- 議案頁 ----------
    // 議案頁的兩個對照版本 0為現行條文 -1為通過條文 其他請參考網頁中的versions
    const billViewing = ref('comparation') // 預設顯示法案對照表

    const selectedVersions = ref([])

    // 議案頁版本修改者與修改內容
    const billVersions = ref([])
    const billsData = ref([])

    try {
      if (versions && versions.length) {
        billVersions.value = versions
      }
      if (bills && bills.length) {
        billsData.value = bills
      }
    } catch {}

    // 一目前選的版本，決定要顯示出哪幾條共同都有修改的條文
    const allAvailableSections = computed (() => {
      const result = []

      billsData.value.map((item, idx) => {
        return item.versions.filter((it, i) => {
          return it.content && selectedVersions.value.includes(i)
        }).length
      }).forEach((item, idx) => {
        if (item === selectedVersions.value.length) {
          result.push(idx)
        }
      })

      // 重新整理 selectedSections，若有不存在 allAvailableSections 的 Section 須移除
      selectedSections.value = selectedSections.value.filter(item => result.includes(item))

      return result
    })

    const selectedSections = ref([])

    function compareDiff (content1, content2) {
      const diff = new Diff()
      let textDiff = diff.main(content1, content2)
      return diff.prettyHtml(textDiff)
    }

    return {
      rwdMenuVisible,
      advancedSearchVisible,
      searchConditions,
      searchBy,
      rwdFilterOptionsVisible,

      billViewing,
      billVersions,
      billsData,
      selectedVersions,
      allAvailableSections,
      selectedSections,

      compareDiff
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(common)
  app.mount('._congress')
})