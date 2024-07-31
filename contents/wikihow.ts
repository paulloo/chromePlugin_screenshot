import type { PlasmoCSConfig } from "plasmo"
import { sendToBackground } from "@plasmohq/messaging"

export const config: PlasmoCSConfig = {
  matches: ["https://www.wikihow.pet/*"]
}

window.addEventListener("load", () => {
  document.body.style.background = "blue"
})


// async function sendBk() {
//   const resp = await sendToBackground({
//     name: "ping",
//     body: {
//       id: 123
//     },
//     // extensionId: process.env.PLASMO_PUBLIC_EXTENSION_ID // find this in chrome's extension manager
//     extensionId: 'dibhfckmodmfeoiopkjfabppkkkhkmie'
//   })
//   console.log('baidu res: ', resp)
// }

// sendBk()
