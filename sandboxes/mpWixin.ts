import { unescape } from "querystring"
import axios from "axios"
import Handlebars from "handlebars"

function filterReference(htmlString) {
  if (!htmlString) {
    return ""
  }

  // // 创建一个 DOMParser 实例
  // const parser = new DOMParser();
  // // 将 HTML 字符串解析成 DOM 对象
  // const doc = parser.parseFromString(htmlString, 'text/html');
  // // 获取所有 class 为 'reference' 的 sup 标签
  // const sups = doc.querySelectorAll('sup.reference');
  // // 遍历并移除找到的 sup 标签
  // sups.forEach(sup => sup.parentNode.removeChild(sup));
  // // 将修改后的 DOM 对象转换回 HTML 字符串
  // const cleanedHtmlString = doc.documentElement.outerHTML;

  // 定义正则表达式来匹配 class="reference" 的 <sup> 标签及其内容
  const pattern = /<sup[^>]*>[\s\S]*?<\/sup>/g
  // 使用 replace 方法来删除匹配的内容
  const cleanedHtmlString = htmlString.replace(pattern, "")

  // 过滤 class 是reference的 sup 标签
  return cleanedHtmlString
}

/**
 * Strip HTML tags from a given string.
 * @param {string} htmlString - The input string containing HTML tags.
 * @param {string[]} [tagNames] - Optional array of tag names to strip. If not provided, all tags will be stripped.
 * @returns {string} - The input string with HTML tags stripped.
 */
function stripHTMLTags(htmlString: string, tagNames?: string[]): string {
  if (!htmlString) {
    return ""
  }
  htmlString = filterReference(htmlString)

  let regex: RegExp
  if (tagNames && Array.isArray(tagNames)) {
    // Create a regex to match specified tags
    regex = new RegExp(
      `<\\/?(?:${tagNames.map((tag) => tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})[^>]*>`,
      "gi"
    )
  } else {
    // Regex to match all tags
    regex = /<\/?[^>]+(>|$)/g
  }
  return htmlString.replace(regex, "")
}

Handlebars.registerHelper("addOne", function (num) {
  return num + 1
})

Handlebars.registerHelper("hasItems", function (items) {
  return items && items.length > 0
})

Handlebars.registerHelper("boldFirstSentence", function (text) {
  let indexCN = text.indexOf("。")
  let indexEN = text.indexOf(".")

  // 找到第一个句号的位置
  let index = Math.min(
    indexCN !== -1 ? indexCN : Infinity,
    indexEN !== -1 ? indexEN : Infinity
  )

  if (
    index !== Infinity &&
    (index !== text.lastIndexOf("。") || index !== text.lastIndexOf("."))
  ) {
    let firstSentence = text.slice(0, index + 1)
    let remainingText = text.slice(index + 1)
    return new Handlebars.SafeString(
      "<strong>" + firstSentence + "</strong>" + remainingText
    )
  }
  return text // 如果没有找到句号，则返回原文本
})

export const life = 42

window.addEventListener("message", async function (event) {
  try {
    const { temp, data } = event.data
    console.log("templateSource: ", temp)
    const source = event.source as {
      window: WindowProxy
    }

    const tempData = JSON.parse(stripHTMLTags(JSON.stringify(data)))
    // 渲染模板并插入到 DOM 中
    const template = Handlebars.compile(temp)
    const htmlString = template(tempData)
    console.log("htmlString in sendbox: ", htmlString)
    source.window.postMessage(htmlString, event.origin)
  } catch (err) {
    console.error(err)
  }

  // source.window.postMessage(eval(event.data), event.origin)
})
