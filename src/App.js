import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles";
import {ReactComponent as Meter} from './assets/parking_meter_final_clean.svg';
import {ReactComponent as MeterWindowBackground} from './assets/meter_window_background_clean.svg';
import {ReactComponent as Coin} from './assets/coin_final_clean.svg';
import duck from'./assets/duck.png';
import feedbackClose from'./assets/export_plus_symbol.png';


const mintActive = false;

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

function AccessabilityContainer(props){
    return(
        <main>
            <h1 id="mint_status_html">Mint is </h1>
            <p id="mint_cost_html">This mint costs ETH.</p>
            <p id="remaining_supply_html">{data.totalSupply} out of {CONFIG.MAX_SUPPLY} NFT's remain from this mint.</p>
            <p id="mint_amount">Mint NFT's</p>
            <button 
                id="connect_button_html" 
                onClick={(e) => {
                    e.preventDefault();
                    dispatch(connect());
                    getData();
                    }}
            >
                Connect your wallet
            </button>

            <button 
                id="less_button_html"
                disabled={claimingNft ? 1 : 0}
                onClick={(e) => {
                    e.preventDefault();
                    decrementMintAmount();
                }}
            >
                one less
            </button>

            <button 
                disabled={claimingNft ? 1 : 0}
                id="more_button_html" onClick={(e) => {
                    e.preventDefault();
                    incrementMintAmount();
                }}
            >
                one more
            </button>
            <button 
                id="mint_button_html"
                disabled={claimingNft ? 1 : 0}
                onClick={(e) => {
                    claimNFTs();
                    getData();
                }}
            >
                Mint
            </button>
        </main>
    )
}

function NumbersContainer(props){
    let {meterNumbers} = props;
    return(
        <div id="numbers_container">
            <span className={meterNumbers[0].classes} data-position={meterNumbers[0].position}>{meterNumbers[0].value}</span>
            <span className={meterNumbers[1].classes} data-position={meterNumbers[1].position}>{meterNumbers[1].value}</span>
            <span className={meterNumbers[2].classes} data-position={meterNumbers[2].position}>{meterNumbers[2].value}</span>
        </div>
    )
}

class MeterContainer extends React.Component{
    componentDidMount(){

        let {
            toggleStickers,
            costSvgText,
            mintRemainingText,
            smartContractAddress,
            smartContractLink,
        } = this.props;

        const svg = document.querySelector('#meter_svg');
        const numbersContainer = document.querySelector('#numbers_container')
        const windowBackground = document.querySelector('#meter_window_background')

        function numberContainerResize(e){
            const svgBounding = svg.getBoundingClientRect()

            numbersContainer.style.height = svgBounding.height + 'px'
            windowBackground.style.height = svgBounding.height + 'px'
        }

        numberContainerResize()

        window.addEventListener('resize', numberContainerResize)

        const meterStickers = Array.from(
                svg.querySelectorAll('.sticker')
            );

        mintRemainingText.current =  svg.querySelector('#quantity_left_svg')


        toggleStickers.current = mintAmount =>{

            const to = mintAmount
    
            const visible = meterStickers.slice(0, to)
            const hidden = meterStickers.slice(to)
    
            visible.forEach(sticker => sticker.style.visibility = 'visible');
            hidden.forEach(sticker => sticker.style.visibility = 'hidden');
        }

        toggleStickers.current(0);


        costSvgText.current = svg.querySelector('#total_cost_svg_text')
        
        const plusButtonHTML = document.querySelector('#more_button_html')
        const mintButtonHTML = document.querySelector('#mint_button_html')
        const lessButtonHTML = document.querySelector('#less_button_html')
        const connectButtonHTML = document.querySelector('#connect_button_html')

        svg.querySelector('#plus_button').addEventListener('click', () => plusButtonHTML.click());
        svg.querySelector('#minus_button').addEventListener('click', () => lessButtonHTML.click());
        svg.querySelector('#press_to_mint').addEventListener('click', () => mintButtonHTML.click());
        document.querySelector('#coin_svg>.base').addEventListener('click', () => connectButtonHTML.click())

        document.querySelector('#loading_container').dataset.rendered = "true"
    }

    componentDidUpdate(prevProps){
        if(this.props.mintRemainingTextValue != prevProps.mintRemainingTextValue)
            this.props.mintRemainingText.current.textContent = this.props.mintRemainingTextValue;
    }

    render(){
        return(
            <section id="meter_container">
                <MeterWindowBackground></MeterWindowBackground>
                <NumbersContainer meterNumbers={this.props.meterNumbers}></NumbersContainer>
                <Meter mint-open={this.props.mintOpen} wallet-connected={this.props.walletConnected}></Meter>
                <Coin data-coin-shake={this.props.coinShake} onAnimationEnd={this.props.resetCoin}></Coin>
            </section>
        )
    }
}

class FeedbackOverlay extends React.Component{

    componentDidUpdate(prevProps){
        if(prevProps.feedback != this.props.feedback)
            this.processMessage(this.props.feedback)

        if(prevProps.err != this.props.err)
            this.processMessage(this.props.err)
        
    }

    processMessage (messageObj){
        if(!messageObj.visible)
            return

        this.setState({
            ...this.state,
            visible: messageObj.visible,
            closable: messageObj.closable,
            message: messageObj.message,
        })

        console.log('hi')
    }

    state = {
        visible: false,
        closable: true,
        message: ''
    }

    getMessage = () => this.state.message
    getVisible = () => this.state.visible
    getClosable = () => this.state.closable

    render(){
        return(
            <div id="feedback_overlay" data-visible={this.getVisible()}>
                <div id="feedback_container">
                    <img src={duck} id="duck" />
                    <p id="feedback_text">{this.getMessage()}</p>
                    <img src={feedbackClose} id="feedback_close"  data-closable={this.getClosable()} onClick={(e) => {
                        e.preventDefault();
                        this.setState({...this.state, visible: false})
                    }}/>
                </div>     
            </div>
        )
    }
}

function App(){

    const dispatch = useDispatch();
    const blockchain = useSelector((state) => state.blockchain);
    const data = useSelector((state) => state.data);
    const [claimingNft, setClaimingNft] = useState(false);
    const [feedback, setFeedback] = useState({
        visible: false,
        message: `Click buy to mint your NFT.`
    });
    const [mintAmount, setMintAmount] = useState(0);
    const mintAmountRef = useRef(mintAmount);
    const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
        NAME: "",
        SYMBOL: "",
        ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 3500,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
    });

    const claimNFTs = () => {
        if(!mintActive)
            return setFeedback({
                visible: false,
                message: 'mint is closed'
            })

        if(blockchain.account === "" || blockchain.smartContract === null)
            return shakeCoin();

        let cost = CONFIG.WEI_COST;
        let gasLimit = CONFIG.GAS_LIMIT;
        let totalCostWei = String(cost * mintAmount);
        let totalGasLimit = String(gasLimit * mintAmount);
        setFeedback({
            visible: 'minting',
            closable: false,
            message: `Now minting your Heist World NFT!`
        });
        setClaimingNft(true);
        blockchain.smartContract.methods
            .mint(mintAmount)
            .send({
            gasLimit: String(totalGasLimit),
            to: CONFIG.CONTRACT_ADDRESS,
            from: blockchain.account,
            value: totalCostWei,
            })
            .once("error", (err) => {
            console.log(err);
            setFeedback({
                visible: true,
                closable: true,
                message:"Yikes! We couldn't load the smart contract data!"
            });
            setClaimingNft(false);
            })
            .then((receipt) => {
            console.log(receipt);
            setFeedback({
                visible: true,
                closable: true,
                message: `Congratulations on your new Heist World NFT, head over to OpenSea to view it now!`
            });
            setClaimingNft(false);
            dispatch(fetchData(blockchain.account));
        });
    };

    // const decrementMintAmount = () => {
    // let newMintAmount = mintAmount - 1;
    // if (newMintAmount < 1) {
    //     newMintAmount = 1;
    // }
    // setMintAmount(newMintAmount);
    // };

    // const incrementMintAmount = () => {
    // let newMintAmount = mintAmount + 1;
    // if (newMintAmount > 10) {
    //     newMintAmount = 10;
    // }
    // setMintAmount(newMintAmount);
    // };

    const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
        dispatch(fetchData(blockchain.account));
    }
    };

    const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
        headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
    };

    useEffect(() => {
    getConfig();
    }, []);

    useEffect(() => {
    getData();
    }, [blockchain.account]);

    const [meterNumbers, setMeterNumbers] = useState([
        {
            position: 'left',
            classes: 'number',
            value: 0
        },
        {
            position: 'center',
            classes: 'number',
            value: 0
        },
        {
            position: 'right',
            classes: 'number',
            value: 0
        }
    ]);

    const toggleStickers = useRef(undefined);
    const costSvgText = useRef(undefined);
    const mintRemainingText = useRef(undefined);

    // const incrementMintAmount = () => {

    //     if(mintAmountRef.current === 10)
    //         return false;
        
    //     mintAmountRef.current += 1;

    //     setMintAmount(mintAmountRef.current);

    //     return true
    // };

    const incrementMintAmount = () => {

        if(mintAmount === 10)
            return false;

        setMintAmount(mintAmount + 1);

        return true
    };

    // const decrementMintAmount = () => {
    
    //     if(mintAmountRef.current === 0)
    //         return false;
        
    //     mintAmountRef.current -= 1;

    //     setMintAmount(mintAmountRef.current);

    //     return true
    // };

    const decrementMintAmount = () => {
    
        if(mintAmount === 0)
            return false;

        setMintAmount(mintAmount -1);

        return true
    };

    function meterNumberUp(){

        setMeterNumbers(
            meterNumbers.map(numberEleData => {
                const assignments = {
                    left: {
                        position: 'right',
                        classes: 'number',
                    },
                    center: {
                        position: 'left',
                        classes: 'number transition',
                    },
                    right: {
                        position: 'center',
                        classes: 'number transition',
                        value: mintAmount + 1
                    }
                }
    
                const newData = Object.assign(numberEleData, assignments[numberEleData.position])
    
                return newData
            })
        )

        toggleStickers.current(mintAmount + 1)

        costSvgText.current.textContent = (CONFIG.DISPLAY_COST * (mintAmount + 1)).toFixed(2)
    }
    
    function meterNumberDown(){
    
        setMeterNumbers(
            meterNumbers.map(numberEleData => {
                const assignments = {
                    left: {
                        position: 'center',
                        classes: 'number transition',
                        value: mintAmount - 1
                    },
                    center: {
                        position: 'right',
                        classes: 'number transition',
                    },
                    right: {
                        position: 'left',
                        classes: 'number',
                    }
                }
    
                const newData = Object.assign(numberEleData, assignments[numberEleData.position])
                return newData
            })
        )

        toggleStickers.current(mintAmount - 1)

        costSvgText.current.textContent = (CONFIG.DISPLAY_COST * (mintAmount - 1)).toFixed(2)
    }

    function meterUpFunction(){
        if(incrementMintAmount()){
            meterNumberUp();
        }         
    }
    
    function meterDownFunction(){
        if(decrementMintAmount()){
            meterNumberDown();
        }  
    }

    const [coinShake, setCoinShake] = useState(false)

    function shakeCoin(){
        setCoinShake(true)
    }

    function resetCoin(){
        setCoinShake(false)
    }

    useEffect(() => {
        const contractLink = document.querySelector('#contract_link')
        const contractLinkText = contractLink.querySelector('text')

        contractLinkText.textContent = truncate(CONFIG.CONTRACT_ADDRESS, 15)
        contractLink.setAttribute('href', CONFIG.SCAN_LINK)
    })

    return (
        <>
            {/* <img src={background} id="background"/> */}
            <main id="accessibility_container" data-production="true">
                <h1 id="mint_status_html">Mint is {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? 'Closed' : 'Open'}</h1>
                <p id="mint_cost_html">This mint costs {CONFIG.DISPLAY_COST * mintAmount} ETH.</p>
                <p id="remaining_supply_html">{data.totalSupply} out of {CONFIG.MAX_SUPPLY} NFT's have been minted.</p>
                <p id="mint_amount">Mint {mintAmount} NFT's</p>
                <button 
                    id="connect_button_html" 
                    onClick={(e)=>{
                        e.preventDefault();
                        dispatch(connect());
                        getData();

                        // mintRemainingText.current.textContent = `${data.totalSupply} / ${CONFIG.MAX_SUPPLY}`
                    }}
                >
                    Connect your wallet
                </button>

                <button 
                    id="less_button_html"
                    disabled={claimingNft ? 1 : 0}
                    onClick={(e) => {
                        e.preventDefault();
                        meterDownFunction();
                    }}
                >
                    one less
                </button>

                <button 
                    disabled={claimingNft ? 1 : 0}
                    id="more_button_html" onClick={(e) => {
                        e.preventDefault();
                        meterUpFunction();
                    }}
                >
                    one more
                </button>
                <button 
                    id="mint_button_html"
                    disabled={claimingNft ? 1 : 0}
                    onClick={(e) => {
                        e.preventDefault();
                        claimNFTs();
                        getData();
                    }}
                >
                    Mint
                </button>
                <br/>
                <span>feedback: {feedback.message}</span><br/>
                <span>errmsg: {blockchain.errorMsg.message}</span>
            </main>
            <div id="offset_container">
                <MeterContainer
                    coinShake = {coinShake}
                    resetCoin = {resetCoin}

                    toggleStickers = {toggleStickers}

                    costSvgText = {costSvgText}

                    mintRemainingText = {mintRemainingText}

                    mintOpen = {(!(Number(data.totalSupply) >= CONFIG.MAX_SUPPLY) && mintActive).toString()}

                    mintRemainingTextValue = {`${Number(data.totalSupply).toLocaleString('en', {useGrouping:true})} / ${CONFIG.MAX_SUPPLY}`}

                    walletConnected = {(!(blockchain.account === "" || blockchain.smartContract === null)).toString()}

                    smartContractAddress = {truncate(CONFIG.CONTRACT_ADDRESS, 15)}

                    smartContractLink = {CONFIG.SCAN_LINK}

                    meterNumbers = {meterNumbers}
                ></MeterContainer>
            </div>
            <FeedbackOverlay 
                feedback={feedback} 
                err={blockchain.errorMsg}
                message
                visible
            ></FeedbackOverlay>
        </>
    );
}

export default App;