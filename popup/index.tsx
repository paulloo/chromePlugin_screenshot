import axios from "axios"
import dayjs from "dayjs"
import { useEffect, useRef, useState } from "react"

import {
  sendToBackground,
  sendToBackgroundViaRelay,
  sendToContentScript
} from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { getPort } from '@plasmohq/messaging/port'

import "../styles/main.css"

import clsx from "clsx"
import generalSnd from "data-base64:~assets/sound/general.wav"
import { isEmpty } from "radash"

import defaultIcon from "~assets/icon.png"
import falloutBg from "~assets/img/bg_fallout_2.jpg"
import pokemonBg from "~assets/img/bg_game.jpg"
import londonBg from "~assets/img/bg_london.jpg"
import r2d2Bg from "~assets/img/bg_r2d2.jpg"
import simpleBg from "~assets/img/bg_simple.jpg"
import vaderBg from "~assets/img/bg_vader.jpg"
import simpleDoneBg from "~assets/img/BG01.jpg"
import londonDoneBg from "~assets/img/BG03.jpg"
import pokemonDoneBg from "~assets/img/BG04.jpg"
import vaderDoneBg from "~assets/img/BG05.jpg"
import r2d2DoneBg from "~assets/img/BG06.jpg"
import falloutDoneBg from "~assets/img/fall.jpg"
import londonIcon from "~assets/img/icon_bus.svg"
import falloutIcon from "~assets/img/icon_cowboy_hat.svg"
import pokemonIcon from "~assets/img/icon_game.svg"
import vaderIcon from "~assets/img/icon_helmet.svg"
import r2d2Icon from "~assets/img/icon_r2d2.svg"
import simpleIcon from "~assets/img/icon_stopwatch.svg"
import { unescape } from "querystring"

const projects = [
  {
    id: 1,
    doneBg: simpleDoneBg,
    className: "simple",
    color: "#013d99",
    snd: "simple",
    bg: simpleBg,
    icon: simpleIcon,
    title: "Simple",
    on: true,
    theme: "theme-light"
  },
  {
    id: 2,
    doneBg: falloutDoneBg,
    className: "fallout",
    color: "#0e980c",
    snd: "fallout",
    bg: falloutBg,
    icon: falloutIcon,
    title: "Fallout",
    on: false,
    theme: "theme-evergreen"
  },
  {
    id: 3,
    doneBg: londonDoneBg,
    className: "london",
    color: "#ba0001",
    snd: "london",
    bg: londonBg,
    icon: londonIcon,
    title: "London",
    on: false,
    theme: "theme-light"
  },
  {
    id: 4,
    doneBg: pokemonDoneBg,
    className: "pokemon",
    color: "#990001",
    snd: "pokemon",
    bg: pokemonBg,
    icon: pokemonIcon,
    title: "Pokemon",
    on: false,
    theme: "theme-solar"
  },
  {
    id: 5,
    doneBg: vaderDoneBg,
    className: "vader",
    color: "#00869a",
    snd: "vader",
    bg: vaderBg,
    icon: vaderIcon,
    title: "Vader",
    on: false,
    theme: "theme-dark"
  },
  {
    id: 6,
    doneBg: r2d2DoneBg,
    className: "r2d2",
    color: "#1f0099",
    snd: "r2d2",
    bg: r2d2Bg,
    icon: r2d2Icon,
    title: "R2D2",
    on: false,
    theme: "theme-dark"
  }
]

const storage = new Storage()

const capturePort = getPort('capture')

function IndexPopup() {
  const timerRef = useRef(null)
  const progressTimerRef = useRef(null)
  const urlRef = useRef(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)


  const [articleData, setArticleData] = useState({})

  const timeRangeList = [
    // {
    //   value: 10,
    //   label: "10s"
    // },
    {
      value: 30,
      label: "30s"
    },
    {
      value: 60,
      label: "1m"
    },
    {
      value: 300,
      label: "5m"
    },
    {
      value: 600,
      label: "10m"
    },
    {
      value: 900,
      label: "15m"
    },
    {
      value: 1800,
      label: "30m"
    },
    {
      value: 3600,
      label: "1h"
    }
  ]

  const defaultTheme = projects[0]

  const [currentTheme, setCurrentTheme] = useStorage(
    "currentTheme",
    defaultTheme
  )

  // 倒计时状态
  const [couting, setCouting] = useState(false)

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))
  async function setArtcleToMp(message) {
    const tabIds = await chrome.tabs.query({ active: true, currentWindow: true })
    const tabId = tabIds[0].id
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: "setArticleToRichText", data: message }, (response) => {
        if (chrome.runtime.lastError || !response) {
          reject(`setArticleToRichText error:${JSON.stringify(chrome.runtime.lastError)}`)
        } else {
          resolve(response)
        }
      })
    })
  }

  useEffect(() => {
    function listener(event) {
      setArtcleToMp(event.data)
    }
    window.addEventListener("message", listener)

    return () => {
      window.removeEventListener("message", listener)
    }
  }, [])

  async function handleFullPage() {

    try {

      const url = urlRef.current.value
      if(!url) {
        console.log('请输入网址')
        return
      }

      const localData = true

      let data = {}

      if(!localData) {

        const { message } = await sendToBackground({
          name: "articleSpider",
          body: {
            url,
            rules: {
                title: "h1#section_0 > a",
                profile: "div.mf-section-0 > p",  
                steps: {
                    step_xpath: "div.section.steps",
                    step_title_xpath: "div.headline_info > h3 > span.mw-headline",
                    step_item_xpath: "li",
                    step_item_img_xpath: "div.content-spacer > img",
                    step_item_content_xpath: "div.step",
                    step_item_content_children: "li"
                }
            },
            filters: [
                "sup"
            ]
          },
          extensionId: process.env.PLASMO_PUBLIC_EXTENSION_ID // find this in chrome's extension manager
          // extensionId: 'pljhffcodclmdedjkpdjedfohelamjka'
        })

        data = message
      } else {
        const calm_down_when_firework_url = chrome.runtime.getURL('templates/calm_down_when_firework.json')
  
        const calmDownWhenFireWork = await fetch(calm_down_when_firework_url).then(response => response.text())
        console.log("calm_down_when_firework: ", JSON.parse(calmDownWhenFireWork))
  
        data = JSON.parse(calmDownWhenFireWork)
      }

      const templateUrl = chrome.runtime.getURL('templates/puppy.hbs')
      const templateSource = await fetch(templateUrl).then(response => response.text())

      // 渲染模板并插入到 DOM 中
      console.log("message: ", data);
      const json = {
        ...data,
        guide: '点击上方蓝字关注我们',
        history: [{
            title: '试试这个三分钟妙招，养狗新手秒变驯犬高手！',
            url: 'http://mp.weixin.qq.com/s?__biz=MzAwODI3OTQyMA==&amp;mid=2247489061&amp;idx=1&amp;sn=db0a547256f1f50e4b64f976840f7c07&amp;chksm=9b701236ac079b2059613eeff6d63a55c22f881a02f695c02444ac95ac201a8430680e285c59&amp;scene=21#wechat_redirect'
        }, {
            title: '喂养小狗，不仅仅是选狗粮这么简单',
            url: 'http://mp.weixin.qq.com/s?__biz=MzAwODI3OTQyMA==&amp;mid=2247484435&amp;idx=1&amp;sn=4b9e12061a1645a4f7599e78f372213f&amp;chksm=9b700000ac0789161b65aada7df60a7a7125f75f2762636bc60b26c95c30cc77f49a313f2e3d&amp;scene=21#wechat_redirect'
        }, {
            title: '炎炎夏日，狗友提醒：警惕狗狗中暑！',
            url: 'http://mp.weixin.qq.com/s?__biz=MzAwODI3OTQyMA==&amp;mid=2247484414&amp;idx=1&amp;sn=e35c36c8683b8d7dcc31373209b7e73b&amp;chksm=9b7007edac078efbdc9d3369b02f1a70fc03ef49e677e9b63696717cc1b2e1323618cbd07b9a&amp;scene=21#wechat_redirect'
        }]
    }
      iframeRef.current?.contentWindow.postMessage({
        temp: templateSource,
        data: json
      }, "*")
  
      // setArticleData(message)
    } catch(err) {
      console.error(err)
    }

  }




  return (
    <div
      className={clsx(
        "w-96 bg-no-repeat bg-center",
        currentTheme.theme || "theme-light"
      )}>
      <section id="main" className="flex h-full flex-col justify-between px-4 py-4">
        {/* <div className="border-b-2 p-4 dark:border-gray-800">
          <h1 className="text-center text-xl font-semibold leading-6">
            倒计时
          </h1>
        </div> */}

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 ">
          <div className="sm:col-span-4">
            <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
              WikiHow地址 
              <button
                  type="submit"
                  onClick={() => handleFullPage()}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  生成
                </button>
            </label>
            
            <div className="mt-2">
              <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                {/* <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">wikihow/</span> */}
                <input
                  ref={urlRef}
                  id="resourceUrl"
                  name="resourceUrl"
                  type="text"
                  placeholder="请输入目标网址"
                  autoComplete="resourceUrl"
                  className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                />
                <button
                  type="submit"
                  onClick={() => handleFullPage()}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  生成
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <iframe src="sandboxes/mpWixin.html" ref={iframeRef} style={{ display: "none" }} />
    </div>
  )
}

export default IndexPopup
