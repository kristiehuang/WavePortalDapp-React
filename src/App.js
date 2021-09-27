import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';

// json is copy-pasted from artifacts/contracts/WavePortal.sol/WavePortal.json
import contractABI from './utils/WavePortal.json';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [messageInput, setMessageInput] = useState("");

  // I want to call getTotalWaves even prior to connecting wallet - is that possible?
  const [waveCount, setWaveCount] = useState("?");
  const [allWaves, setAllWaves] = useState([]);
  // address of my WavePortal deployed on Rinkeby
  const contractAddress = "0xB4bc34F136dC2cE99bd48Ef0d54132D26e218fB4";

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
      } else {
        console.log("No authorized account found")
      }

      await getWaveCount();
      await getAllWaves();

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


    } catch (error) {
      console.log(error)
    }
  }


  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // create provider object from ethers library, using ethereum object injected by metamask
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI.abi, signer);
        wavePortalContract.on("PrizeMoneySent", (receiver, amount) => {
          console.log("%s received money", receiver, amount);
        });

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(messageInput, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);


        let count = (await wavePortalContract.totalWaveCount()).toNumber();
        setWaveCount(count);
        setMessageInput("");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getWaveCount = async () => {
    try {
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
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    try {
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
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);


        wavePortalContract.on("NewWave", (from, message, timestamp) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });

      } else {
        console.log("Ethereum object doesn't exist!")
      }
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
          I’m a crypto geek, lifelong student (currently at UC Berkeley), and human being. Welcome to my Ethereum-powered web3 guestbook.
        </div>

        <div className="bio">
          I have been left {waveCount} notes! Connect your Ethereum wallet [on Rinkeby only for now] to up that number:
        </div>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        <div className="dataContainer">
          <input type="text" value={messageInput} onChange={((event) => setMessageInput(event.target.value))} />
          <button className="waveButton" onClick={wave}>
            Leave This Note
          </button>
        </div>


        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
