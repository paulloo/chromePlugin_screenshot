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
  
  
      // console.log("message: ", message)
      const templateUrl = chrome.runtime.getURL('templates/puppy.hbs')
      fetch(templateUrl)
          .then(response => response.text())
          .then(templateSource => {
              // 渲染模板并插入到 DOM 中
              console.log("message: ", message);
              const json = {
                ...message,
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
          })
          .catch(error => console.error("Error loading template:", error));
  
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
      <section id="main" className="flex h-full flex-col justify-between">
        {/* <div className="border-b-2 p-4 dark:border-gray-800">
          <h1 className="text-center text-xl font-semibold leading-6">
            倒计时
          </h1>
        </div> */}

        <div className="action-container flex flex-col text-sm gap-3 justify-between px-4 py-4">
          <input type="text" placeholder="请输入网址" ref={urlRef} />
          {/* <div
            className="action-item select align-center border border-gray-300 dark:border-gray-600 border-r-8 cursor-pointer flex h-14 px-4 relative text-center"
            id="selected"
            title="">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="h-4 w-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
            </svg>
            <div className="tip align-center flex flex-1 text-sm font-bold line-height-4 ml-2">
              Selected Area
            </div>
            <div className="short-cut-tip text-xs">Ctrl+Shift+S</div>
          </div> */}
          <div
            className="action-item fullpage align-center border border-gray-300 dark:border-gray-600 border-r-8 cursor-pointer flex h-14 line-height-4 px-4 relative text-center"
            id="entire" onClick={() => handleFullPage()}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="h-4 w-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
            </svg>
            <div className="tip align-center flex flex-1 text-sm font-bold ml-2">
              一键生成
            </div>
            <div className="short-cut-tip">Ctrl+Shift+E</div>
          </div>
          {/* <div
            className="action-item visible align-center border border-gray-300 dark:border-gray-600 border-r-8 cursor-pointer flex h-14 px-4 relative text-center"
            id="visible">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="h-4 w-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
            </svg>
            <div className="tip align-center flex flex-1 text-sm font-bold line-height-4 ml-2">
              Visible Part
            </div>
            <div className="short-cut-tip">Ctrl+Shift+V</div>
          </div>
          <div
            className="action-item desktop align-center border border-gray-300 dark:border-gray-600 border-r-8 cursor-pointer flex h-14 px-4 relative text-center"
            id="desktop">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="h-4 w-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
            </svg>
            <div className="tip align-center flex flex-1 text-sm font-bold line-height-4 ml-2">
              Whole Screen &amp; Window
            </div>
            <div className="short-cut-tip"></div>
          </div> */}
        </div>

        <div
          id="footer"
          className="grid grid-cols-2 justify-center gap-x-2 divide-x border-t-2 py-4 text-xs font-semibold dark:divide-gray-800 dark:border-gray-800">
          <div className="flex items-center justify-center text-gray-500">
            <a
              href="https://ddp.life/"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-x-1 text-muted">
              Help
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="h-4 w-4">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
              </svg>
            </a>
          </div>
          <div
            className="flex items-center justify-center text-gray-500"
            onClick={() => handleFullPage()}>
            <button className="flex items-center justify-center gap-x-1 font-semibold text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="h-5 w-5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"></path>
              </svg>

              {couting ? "Cancel" : `Start`}
            </button>
          </div>
        </div>
      </section>
      <button
        onClick={() => {
          iframeRef.current.contentWindow.postMessage("10 + 20", "*")
        }}>
        Trigger iframe eval
      </button>
      <iframe src="sandboxes/mpWixin.html" ref={iframeRef} style={{ display: "none" }} />
    </div>
  )
}

export default IndexPopup
