import {Button, Col, FormCheck, Row} from "react-bootstrap";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import moment from "moment";
import tw_flag from "./assets/tw.svg";
import jp_flag from "./assets/jp.svg";
import us_flag from "./assets/us.svg";
import hk_flag from "./assets/hk.svg";
import uk_flag from "./assets/uk.svg";
import dislink from "./assets/dislink.svg";
import {APP_VERSION} from "./index";
import {countryType, useChatGPTOnlyData, useProxyData, VMDataType} from "./proxyData";
import FormCheckInput from "react-bootstrap/FormCheckInput";
import BlackWhiteList from "./blackWhiteList";
import {useProxyMode} from "./blackWhiteListData";

function App() {
    const {connected, country, vmData} = useProxyData();
    const audio = useMemo(() => new Audio(require('./assets/Jig 1.mp3')), []);

    // toggle click event
    const onDisconnect = useCallback(async () => {
        if (connected) {
            // disconnect
            // check if chrome.proxy and chrome.storage is undefined
            if (chrome.proxy === undefined || chrome.storage === undefined) return

            // clear proxy settings
            chrome.proxy.settings.clear({}, () => {
                chrome.storage.local.remove('vmData');
                audio.play()
            });
        } else {
            // open vpn.cocomine.cc
            window.open('https://vpn.cocomine.cc', '_blank')
            return
        }
    }, [connected, audio]);

    return (
        <>
            <Row className={"g-0"}>
                <Col>
                    <LinkStatus connectedProp={connected} countryProp={country} onDisconnect={onDisconnect}/>
                    {vmData && <TimeLast vmData={vmData}/>}
                    <ChatGPTOnly/>
                </Col>
                <Col>
                    <BlackWhiteList/>
                </Col>
            </Row>
            <Row className="justify-content-between" style={{fontSize: "0.7em", padding: "5px"}}>
                <Col xs="auto">
                    <span>Build by © {moment().format("yyyy")} <a
                        href="https://github.com/cocomine" target="_blank"
                        rel="noopener noreferrer">cocomine</a>.</span>
                    <br/>
                    <span className="text-muted">{APP_VERSION}</span>
                </Col>
                <Col xs="auto">
                    <Button variant="link" href="https://github.com/cocomine/chrome-vpn" target="_blank"
                            rel="noopener noreferrer">
                        <i className="bi bi-github me-2"></i>
                    </Button>
                </Col>
            </Row>
        </>
    )
}

const LinkStatus: React.FC<{
    connectedProp: boolean,
    countryProp: countryType | null,
    onDisconnect: () => void
}> = ({connectedProp, countryProp, onDisconnect}) => {
    const [connected, setConnected] = useState(connectedProp);
    const [country, setCountry] = useState<countryType | null>(countryProp);
    const [msg, setMsg] = useState<string | null>('未連線');

    // flag image element for menu item (memoized) (only update when data._country is changed)
    const flag = useMemo(() => {
        switch (country) {
            case "TW":
                return <img src={tw_flag} alt="TW Flag" className="flag fit-left" draggable={false}/>;
            case "JP":
                return <img src={jp_flag} alt="JP Flag" className="flag" draggable={false}/>;
            case "US":
                return <img src={us_flag} alt="JP Flag" className="flag fit-left" draggable={false}/>;
            case "HK":
                return <img src={hk_flag} alt="HK Flag" className="flag" draggable={false}/>;
            case "UK":
                return <img src={uk_flag} alt="UK Flag" className="flag" draggable={false}/>;
            default:
                return <img src={dislink} alt="Disconnect" className="flag"
                            style={{padding: "1.5rem", overflow: 'visible'}} draggable={false}/>;
        }
    }, [country]);

    // toggle mouse enter event
    const onMouseEnter = useCallback(() => {
        setMsg(connected ? "點擊以斷開" : "點擊以開啟網頁")
    }, [connected]);

    // toggle mouse leave event
    const onMouseLeave = useCallback(() => {
        setMsg(connected ? "已連接" + country + "節點" : "未連線")
    }, [connected, country]);

    // update state when props changed
    useEffect(() => {
        setCountry(countryProp)
        setConnected(connectedProp)
        setMsg(connectedProp ? "已連接" + countryProp + "節點" : "未連線")
    }, [connectedProp, countryProp]);

    return (
        <div className="section glow">
            {connected && <div className="particles">
                {Array.from({length: 20}).map((_, i) => (
                    <div key={i} className="particle"></div>
                ))}
            </div>}
            <Row className="justify-content-center align-content-center g-1">
                <Col xs={'auto'}>
                    <div className="link-status" data-connected={connected} onClick={onDisconnect}
                         onMouseEnter={onMouseEnter}
                         onMouseLeave={onMouseLeave}>
                        {flag}
                    </div>
                </Col>
                <div className="w-100"></div>
                <Col xs={'auto'}>
                    <h3>{msg}</h3>
                </Col>
            </Row>
        </div>
    )
}

const TimeLast: React.FC<{ vmData: VMDataType }> = ({vmData}) => {
    const [expect_offline_time_Interval, setExpect_offline_time_Interval] = useState<string>("Loading...")
    const [enableExtend, setEnableExtend] = useState<boolean>(false)
    const [expired, setExpired] = useState<string | null>(vmData._expired)

    // update expect_offline_time_Interval every second
    useEffect(() => {
        if (expired !== null) {
            const id = setInterval(() => {
                const expect_offline_time = moment(expired)
                const diff = expect_offline_time.diff(Date.now())
                const tmp = moment.utc(diff).format('HH:mm:ss')

                if (diff < 60 * 60 * 1000) setEnableExtend(true)
                setExpect_offline_time_Interval(diff > 0 ? tmp : "節點已關閉");
            }, 1000)

            return () => clearInterval(id)
        } else {
            setExpect_offline_time_Interval("節點已關閉")
        }
    }, [expired]);

    useEffect(() => {
        setExpired(vmData._expired)
    }, [vmData]);

    return (
        <div className="section glow">
            <Row className="justify-content-center align-content-center">
                <Col xs={'auto'}>
                    <span>距離節點預計離線</span>
                </Col>
                <div className="w-100"></div>
                <Col xs={'auto'}>
                    <h5>{expect_offline_time_Interval}</h5>
                </Col>
                <Col xs={12}>
                    <Button variant={enableExtend ? "primary" : "outline-primary"}
                            className="w-100 rounded-5" href={"https://vpn.cocomine.cc/" + vmData._id} target="_blank"
                            disabled={!enableExtend}>
                        {enableExtend ? "延長開放時間" : "離線前一小時可以延長開放時間"}
                    </Button>
                </Col>
            </Row>
        </div>
    )
}

const ChatGPTOnly: React.FC = () => {
    const {vmData} = useProxyData();
    const {chatGPTOnly} = useChatGPTOnlyData();
    const {mode} = useProxyMode();

    const onChatGPTOnlyChange = useCallback(() => {
        if (chrome.proxy === undefined || chrome.storage === undefined) return
        chrome.storage.local.set({chatGPTOnly: !chatGPTOnly}) // toggle chatGPTOnly

        if (vmData === null) return;
        const socks5Profile = vmData._profiles.find((p) => p.type === "socks5");

        // reconnect
        chrome.runtime.sendMessage({type: "Connect", data: socks5Profile});
    }, [chatGPTOnly, vmData])

    return (
        <div className="section glow">
            {mode !== "disable" &&
                <div className="black-cover">
                    <Row className="justify-content-center align-items-center h-100">
                        <Col xs={'auto'} className="text-center">
                            <i className="bi bi-slash-circle fs-1"></i>
                            <p>請先停用自訂代理規則</p>
                        </Col>
                    </Row>
                </div>
            }
            <Row className="justify-content-center align-content-center">
                <Col xs={'auto'}>
                    <h5>ChatGPT Only Mode</h5>
                </Col>
                <div className="w-100"></div>
                <Col xs={'auto'}>
                    <small className="text-muted text-center"><p>開啟後只代理chatgpt.com和openai.com的網站</p></small>
                </Col>
                <Col xs={'auto'}>
                    <FormCheck type="switch" id="chatGPTOnly">
                        <FormCheckInput type="checkbox" checked={chatGPTOnly && mode === "disable"} onChange={onChatGPTOnlyChange} style={{width: "4rem", height: "2rem"}}/>
                    </FormCheck>
                </Col>
            </Row>
        </div>
    )
}

export default App;
