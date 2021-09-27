import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import moment from "moment";

// json is copy-pasted from artifacts/contracts/WavePortal.sol/WavePortal.json
import contractABI from './utils/WavePortal.json';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);

  // I want to call getTotalWaves even prior to connecting wallet - is that possible?
  const [waveCount, setWaveCount] = useState("?");
  const [allWaves, setAllWaves] = useState([]);
  // address of my WavePortal deployed on Rinkeby
  const contractAddress = "0xEd62c7320DE5C147b3e04EEDDD28cFf9b12AB1D8";

  const checkIfWeb3Connected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object: ", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        await getWaveCount();
        await getAllWaves();
      } else {
        console.log("No authorized account found")
      }

      

    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Must connect to MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
      await getWaveCount();
      await getAllWaves();

    } catch (error) {
      console.log(error)
    }
  }


  const wave = async () => {
    try {
      setLoading(true);
      const { ethereum } = window;
      if (ethereum) {
        // create provider object from ethers library, using ethereum object injected by metamask
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI.abi, signer);
        wavePortalContract.on("PrizeMoneySent", (receiver, amount) => {
          console.log("prize won! %s received ", receiver, amount.toNumber());
        });

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(messageInput);
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);


        let count = (await wavePortalContract.totalWaveCount()).toNumber();
        setWaveCount(count);
        setMessageInput("");
        setLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getWaveCount = async () => {
    try {
      setLoading(true);
      const { ethereum } = window;
      if (ethereum) {
        // create provider object from ethers library, using ethereum object injected by metamask
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        // Q: do we have to call 'const waveportalContract = new ethers.Contract(contractAddress, contractABI.abi, signer);' every time we wave? Or can we just get the contract once when we first connect our wallet?
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI.abi, signer);
        let count = (await wavePortalContract.totalWaveCount()).toNumber();
        console.log("Retrieved total wave count...", count);
        setWaveCount(count);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
      setLoading(false);
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    try {
      setLoading(true);
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI.abi, signer);

        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          let waveTime = new Date(wave.timestamp * 1000);
          let waveTimeFormatted = moment(waveTime).format('llll');

          wavesCleaned.push({
            address: wave.waver,
            timestamp: waveTimeFormatted,
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);


        wavePortalContract.on("NewWave", (from, message, timestamp) => {
          console.log("NewWave", from, timestamp, message);
          let waveTime = new Date(timestamp * 1000);
          let waveTimeFormatted = moment(waveTime).format('llll');
          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: waveTimeFormatted,
            message: message
          }]);
        });

      } else {
        console.log("Ethereum object doesn't exist!")
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWeb3Connected();
  }, [])

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          👋 Hey, I'm Kristie!
        </div>

        <div className="bio">
          I’m a crypto geek, lifelong student (currently at UC Berkeley), and human being. Welcome to my Ethereum-powered online guestbook.
        </div>

        <div className="bio">
          I have been left {waveCount} notes! Connect your Ethereum wallet [on Rinkeby] to up that number, and for a chance to win 0.0001 ether:
        </div>

        {loading && (
          <div className="bio">Loading...</div>
        )}

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <div className="dataContainer">
            <button className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        )}

        {currentAccount && (<div className="dataContainer">
          <input type="text" placeholder=" your message here..." value={messageInput} onChange={((event) => setMessageInput(event.target.value))} />
          <button className="waveButton" onClick={wave}>
            leave me a note!
          </button>
        </div>)}


        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "Lavender", marginTop: "16px", padding: "8px"}}>
              <div>From: {wave.address}</div>
              <div>At: {wave.timestamp.toString()}</div>
              <div style={{marginTop: "8px"}}>"{wave.message}"</div>
            </div>)
        })}

        <div className="bio">
          Deployed on Rinkeby at {contractAddress}.
        </div>
      </div>
    </div>
  );
}
